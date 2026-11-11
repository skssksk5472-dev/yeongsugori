# 05. 영수증 OCR 파이프라인과 프롬프트

목표: 영수증 사진 1장 → **구조화된 JSON**(상호, 날짜, 품목, 금액, 카테고리) → 사용자가 수정 → 저장.
이 부분이 3주차 "프롬프트 엔지니어링" 수업의 핵심 소재이므로, **프롬프트를 코드와 분리된 파일(`prompt.py`)로 두고 버전 주석을 남긴다.**

## 1. 흐름

```
POST /receipt/upload_receipt (image)
 1. 검증: 크기 ≤ MAX_UPLOAD_MB, 매직바이트가 jpeg/png/webp/heic 인지 확인
 2. 전처리: EXIF 방향 보정 후 EXIF 제거, 긴 변 1600px로 축소, JPEG(품질 85)로 변환
 3. 저장: storage.save("receipts/{user}/{uuid}.jpg")
 4. 분석: OCR_MODE=openai → 모델 호출(구조화 출력), mock → 고정 결과
 5. 후처리: 검증·정규화·할인 품목 생성·합계 비교 (4절)
 6. receipts 문서 저장, 응답 반환
실패(not_a_receipt / ocr_failed / ocr_timeout): 저장한 이미지를 지우고 오류 응답
```
- 호출 횟수 제한: 사용자별 `SCAN_LIMIT_PER_HOUR`(기본 20). `receipts` 의 최근 1시간 생성 수로 판단한다.
- 모델 호출은 `OCR_TIMEOUT_SEC` 안에 끝나야 한다. 초과하면 `OCR_TIMEOUT`.
- JSON이 깨지거나 스키마에 맞지 않으면 **한 번만 재시도**하고, 그래도 실패하면 `ocr_failed`.
- API 키와 모델 이름은 환경 변수(`OPENAI_API_KEY`, `OPENAI_MODEL`). 모델 기본값은 `gpt-6-luna`(2026-11 기준 이미지 입력을 받는 가장 저렴한 모델)이다.
- 호출은 OpenAI **Responses API**(`POST /v1/responses`) 한 번이다. 이미지는 base64 data URL(`input_image`), 스키마는 `text.format`(`json_schema`, `strict: true`)에 넣는다. SDK 없이 `httpx` 로 보낸다(요청 모양을 수업에서 그대로 보여 주기 위함).
- 시간 제한 `OCR_TIMEOUT_SEC` 는 재시도까지 합친 전체 시간이다.

## 2. 모델 출력 스키마 (JSON Schema, strict)

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["is_receipt", "merchant", "purchased_on", "total_amount", "discount_total", "items", "confidence"],
  "properties": {
    "is_receipt": { "type": "boolean" },
    "merchant": { "type": ["string", "null"] },
    "purchased_on": { "type": ["string", "null"], "description": "YYYY-MM-DD" },
    "total_amount": { "type": ["integer", "null"], "description": "최종 결제 금액(원)" },
    "discount_total": { "type": "integer", "description": "할인 합계(원), 양수, 없으면 0" },
    "confidence": { "type": "string", "enum": ["high", "medium", "low"] },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "quantity", "amount", "category"],
        "properties": {
          "name": { "type": "string" },
          "quantity": { "type": "integer" },
          "amount": { "type": "integer", "description": "수량 x 단가, 원" },
          "category": { "type": "string", "enum": ["식비","카페·간식","교통","쇼핑","생활","의료·건강","문화·여가","교육","기타"] }
        }
      }
    }
  }
}
```
카테고리 enum은 서버 상수(04 문서)에서 만들어 넣는다(문자열을 복사해 두지 않는다).

## 3. 프롬프트 (v3, `prompt.py` 에 둘 내용)

**시스템 프롬프트**
```
You extract data from photos of Korean purchase receipts for a household ledger app.
Return only JSON that follows the given schema. Do not add explanations.

Rules
1. If the image is not a purchase receipt, set is_receipt=false, items=[], and other fields null/0.
2. merchant: the store name as printed (not the branch address). null if unreadable.
3. purchased_on: the purchase date as YYYY-MM-DD. Two-digit years mean 20xx. null if unreadable.
4. items: one entry per purchased product line, in printed order.
   - name: product name as printed, whitespace normalized, max 40 characters.
   - quantity: integer >= 1 (1 if not printed).
   - amount: that line's total price in KRW as an integer (quantity x unit price). No commas, no currency symbol.
   - Do NOT include: totals, subtotals, VAT/tax lines, tax-exempt/taxable summaries, payment method, card or approval numbers,
     points, change, or bag/receipt headers.
5. Discounts, coupons and promotions are NOT items. Add their absolute sum to discount_total (0 if none).
6. total_amount: the final amount actually paid (after discounts), as an integer. null if unreadable.
7. category: choose exactly one from the enum using the product name and store type. Use "기타" when unsure.
   (식비: groceries and meals, 카페·간식: coffee, snacks, desserts, 교통: transport and fuel, 쇼핑: clothes and goods,
    생활: household and daily necessities, 의료·건강: pharmacy and health, 문화·여가: entertainment, subscriptions,
    교육: books and classes)
8. Never output card numbers, phone numbers, addresses or any personal data.
9. If text is hard to read, prefer null over guessing. Set confidence to "low" when many lines are uncertain.
```
**사용자 메시지**: 이미지(전처리된 JPEG) + `"Parse this receipt."`

**few-shot**: 처음에는 사용하지 않는다. 정확도가 부족하면 텍스트 예시 1~2개(이미지 없이 "입력 요약 → 기대 JSON")를 추가해 본다.

### 프롬프트 개선 3단계 (수업용 기록)
| 버전 | 내용 | 관찰되는 문제 |
|---|---|---|
| v1 | `"영수증 내용을 알려줘"` | 자유 문장, 파싱 불가, 형식이 매번 다름 |
| v2 | JSON으로만 답하라 + 스키마 지정 | 형식은 맞지만 합계·부가세를 품목으로 넣음, 카테고리 이름이 제각각 |
| v3 | 위 규칙 + 카테고리 enum + strict 스키마 | 형식·카테고리 안정. 남은 오류는 사용자 수정 화면에서 보완 |

이 표는 `docs/` 가 아니라 수업 자료용으로도 쓴다. 실제 개선 시 결과 JSON과 함께 기록을 남긴다.

## 4. 서버 후처리 (`postprocess.py`)

모델 출력을 그대로 믿지 않는다.

1. `is_receipt=false` → `not_a_receipt`.
2. 카테고리가 enum 밖이면 `기타`. 이름은 공백 정리, 40자 절단. 품목은 최대 60개. `amount` 가 정수가 아니면 해당 품목 제거.
3. `quantity < 1` 이면 1. `purchased_on` 형식이 틀리거나 미래 날짜면 `null`.
4. 품목이 0개 → `not_a_receipt` (읽을 품목이 없음).
5. `discount_total > 0` 이면 **할인 품목을 끝에 추가**: `{ name: "행사 할인", quantity: 1, amount: -discount_total, category: (금액이 가장 큰 품목의 카테고리), is_discount: true }`.
6. `items_sum = Σ amount` (할인 포함). `total_amount` 가 있고 `items_sum != total_amount` 이면 `mismatch = true`.
7. 응답 `items[].is_discount` 를 채운다. `parsed_json` 에는 모델 원문을 그대로 저장한다.

## 5. mock 모드 (`mock.py`)

`OCR_MODE=mock` 이면 이미지를 읽지 않고 시나리오 고정 결과를 반환한다(약 1.5초 지연, 진행 화면 확인용).

| `OCR_MOCK_SCENARIO` | 동작 |
|---|---|
| ok | 한빛마트 경산점 5개 품목(할인 포함), 합계 일치 — 02 문서·시안과 동일 데이터 |
| mismatch | 샴푸를 8,100원으로 읽은 결과(합계 불일치, 차액 1,200원) |
| not_receipt | `not_a_receipt` |
| timeout | `ocr_timeout` (지연 후) |

테스트와 오프라인 시연은 mock으로 한다. 실제 모델 호출 테스트는 키가 있을 때만 도는 별도 마크(`@pytest.mark.live`)로 분리한다.

## 6. 개인정보와 비용

- 영수증에는 카드 번호 일부, 전화번호, 매장 주소가 있을 수 있다. 프롬프트가 이를 출력하지 않게 하고, 이미지는 본인에게만 제공한다. 탈퇴 시 이미지 파일까지 삭제한다.
- 외부 API로 이미지가 전송된다는 사실을 설정 화면의 안내(앱 버전 아래)나 README에 명시하는 것을 권장한다(시안에는 없음).
- 호출당 비용이 들므로 `SCAN_LIMIT_PER_HOUR` 와 이미지 축소(1600px)를 유지한다. 로그에 이미지·키를 남기지 않는다.

## 7. 정확도 점검 방법 (3주차 실습용)

- 서로 다른 영수증 사진 10장(마트, 카페, 식당, 약국, 구겨진 것, 기울어진 것, 영수증 아님 2장)을 준비한다. **실제 개인정보가 있는 사진은 쓰지 않는다.**
- 항목별로 `상호/날짜/합계` 일치 여부와 품목 개수 일치 여부를 표로 기록하고, 프롬프트 버전마다 비교한다.
- 코드: `back/app/scripts/eval_ocr.py` (선택) — 폴더의 이미지를 순서대로 분석해 결과 JSON과 불일치 여부를 출력.

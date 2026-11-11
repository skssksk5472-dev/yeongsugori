# 04. 데이터 스키마 (MongoDB)

DB 이름 `zalssm`. 컬렉션은 3개. 로그인 상태는 JWT 쿠키에 있으므로 세션 컬렉션은 없다. **문서 안에 객체·배열을 중첩하지 않는다** (슈퍼노바 방식). 품목 목록 같은 1:N은 별도 문서로 푼다.
ID는 슈퍼노바처럼 컬렉션마다 **문자열 필드**로 둔다(`uid`, `transaction_id`, `receipt_id`). 값은 서버가 만드는 `uuid4().hex` 이다. MongoDB의 `_id` 는 쓰지 않고 조회할 때 뺀다. 코드에서는 `data_domains/zalssm_data_domain.py` 의 클래스가 문서 하나를 나타낸다. 시각은 UTC `datetime`, 날짜는 `"YYYY-MM-DD"` 문자열, 금액은 정수(원).

## 1. users

| 필드 | 타입 | 설명 |
|---|---|---|
| uid | string | 사용자 ID, **unique** |
| email | string | 소문자 정규화, **unique** |
| password_hash | string | bcrypt |
| nickname | string | 2~12자 |
| created_at | datetime | |

인덱스: `uid` unique, `email` unique.

## 2. transactions (내역)

| 필드 | 타입 | 설명 |
|---|---|---|
| transaction_id | string | 내역 ID, **unique** |
| uid | string | 소유자 |
| type | string | `expense` \| `income` |
| amount | int | 지출·수입 모두 양수. **영수증 할인 품목만 음수** |
| category | string | 상수 목록 중 하나 |
| title | string | 0~40자 (비우면 카테고리명) |
| merchant | string \| null | 영수증 내역만 |
| memo | string | 0~100자, 기본 `""` |
| occurred_on | string | `YYYY-MM-DD` |
| receipt_id | string \| null | 영수증 연결 내역만 |
| created_at | datetime | |
| updated_at | datetime | |

인덱스: `transaction_id` unique, `(uid, occurred_on desc)`, `(uid, type, category, occurred_on)`, `receipt_id`.
`occurred_on` 이 문자열이라 월 조회는 `{ $gte: "2026-11-01", $lt: "2026-12-01" }` 범위 검색을 쓴다.

## 3. receipts (영수증)

| 필드 | 타입 | 설명 |
|---|---|---|
| receipt_id | string | 영수증 ID, **unique** |
| uid | string | |
| image_key | string | 저장소 키 (예: `receipts/{uid}/{uuid}.jpg`) |
| status | string | `analyzed` \| `confirmed` |
| merchant | string \| null | 분석 결과 |
| purchased_on | string \| null | 분석 결과 `YYYY-MM-DD` |
| total_amount | int \| null | 영수증에 적힌 최종 결제액 |
| parsed_json | string | 모델이 돌려준 JSON 원문(디버깅·프롬프트 개선용). 객체가 아니라 **문자열** |
| confidence | string | `high` \| `medium` \| `low` |
| created_at | datetime | |

인덱스: `receipt_id` unique, `(uid, created_at desc)`.
- 분석 실패 시에는 문서를 만들지 않는다(또는 만든 뒤 삭제).
- `analyzed` 이고 24시간이 지난 문서는 이미지와 함께 정리한다. 새 스캔 요청이 들어올 때 해당 사용자의 오래된 문서를 함께 지우는 방식이면 충분하다.
- `GET /receipt/get_receipt` 의 `items` 는 `parsed_json` 을 후처리(05 문서)해서 만든다. 저장하지 않는다.

## 4. 카테고리 상수

```
EXPENSE_CATEGORIES = ["식비","카페·간식","교통","쇼핑","생활","의료·건강","문화·여가","교육","기타"]
INCOME_CATEGORIES  = ["급여","용돈","기타수입"]
```
`others/constants.py` 에 한 곳만 정의하고 OCR 프롬프트·검증이 이를 참조한다.

## 5. 핵심 쿼리

월별 요약:
```
db.transactions.aggregate([
  { $match: { uid, occurred_on: { $gte: start, $lt: next } } },
  { $group: { _id: "$type", total: { $sum: "$amount" } } }
])
```
카테고리 통계(지출만):
```
db.transactions.aggregate([
  { $match: { uid, type: "expense", occurred_on: { $gte: start, $lt: next } } },
  { $group: { _id: "$category", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $match: { amount: { $gt: 0 } } },
  { $sort: { amount: -1 } }
])
```
전월 대비는 같은 집계를 이전 달에 한 번 더 실행해 `total_expense` 만 비교한다. 비율은 서버가 `amount / total_expense * 100` 을 소수 첫째 자리로 반올림한다.

## 6. 삭제 규칙

| 동작 | 처리 |
|---|---|
| 내역 삭제 | 해당 문서만 삭제 (영수증 이미지는 유지) |
| 회원 탈퇴 | `transactions`, `receipts`(이미지 파일 포함), `users` 순서로 모두 삭제 |
| 로그아웃 | DB 변경 없음 (쿠키만 지운다) |

## 7. 예시 문서

```json
// transactions
{ "transaction_id": "3f2a...", "uid": "9c1e...", "type": "expense", "amount": 6900,
  "category": "생활", "title": "샴푸 400ml", "merchant": "한빛마트 경산점", "memo": "",
  "occurred_on": "2026-11-02", "receipt_id": "7b4d...", "created_at": "...", "updated_at": "..." }
```

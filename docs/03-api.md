# 03. API 명세

기본 경로 `/api`. 요청·응답은 JSON(UTF-8), 업로드만 `multipart/form-data`.
메서드는 슈퍼노바처럼 **GET(조회)과 POST(변경)만** 쓰고, 경로는 `/{모듈}/{동작}` 이름으로 짓는다(예: `/transaction/create_transaction`).
인증은 쿠키 `zalssm_token`(JWT) (auth 계열 일부 제외 전부 필요). 금액은 원 단위 정수, 날짜는 `YYYY-MM-DD`, 월은 `YYYY-MM`, 시각은 ISO 8601 UTC.
ID는 문자열이고 이름은 대상마다 다르다: `uid`, `transaction_id`, `receipt_id` (04 문서). **다른 사용자의 리소스 접근은 `not_found`** 로 응답한다(존재 여부 비노출).

## 1. 요청·응답 모양

요청과 응답은 슈퍼노바와 같은 모양이다.

- POST 요청 본문은 `{ "header": {}, "body": {...} }` 이다. 아래 절의 "요청"은 `body` 안의 값이다. GET은 쿼리 문자열만 쓴다.
- 응답은 언제나 `{ "header": {}, "body": {...} }` 이다. `body` 에는 `result`(성공 여부), `detail`(설명 문구), `error_code`(실패일 때)와 데이터가 함께 들어간다. 아래 절의 "응답"은 `body` 안의 데이터이다.

```json
// 성공
{ "header": {}, "body": { "result": true, "detail": "", "user": { "uid": "...", "email": "a@b.com", "nickname": "잘쓰는사람" } } }
// 실패
{ "header": {}, "body": { "result": false, "detail": "입력값이 올바르지 않습니다", "error_code": "validation",
                          "fields": { "email": "올바른 이메일 형식이 아닙니다" } } }
```

- 실패도 **HTTP 200** + `result: false` 로 보낸다. 예외는 로그인이 필요한 경우 하나뿐이다: **HTTP 401** + `error_code: "unauthorized"`.
- 입력 검증은 model이 한다. 실패하면 `validation` 과 함께 `fields` 에 필드별 문구를 담는다(`fields` 는 검증 오류일 때만).
- 업로드가 nginx 한도(12MB)를 넘으면 nginx가 HTTP 413을 바로 돌려준다. 프론트는 이것을 `file_too_large` 로 다룬다. 그 밖의 HTTP 오류(500 등)는 `server` 로 다룬다.
- 영수증 이미지(`GET /receipt/get_receipt_image`)만 예외로 이미지 바이너리를 그대로 돌려준다.

| error_code | 의미 |
|---|---|
| `bad_request` | 형식은 맞지만 처리할 수 없는 요청 |
| `unauthorized` | 로그인 토큰 없음/만료/무효. **HTTP 401, 전역 로그아웃 처리 대상** |
| `invalid_credentials` | 로그인 실패 (로그인 API에서만) |
| `wrong_password` | 현재 비밀번호 불일치 (변경·탈퇴) |
| `not_found` | 없거나 내 것이 아님 |
| `email_taken` | 이메일 중복 |
| `file_too_large` | 업로드 용량 초과 |
| `unsupported_media` | 이미지 형식 아님 |
| `validation` | 입력 검증 실패 |
| `not_a_receipt` | 영수증이 아닌 이미지 |
| `rate_limited` | 호출 제한 |
| `ocr_failed` | 외부 분석 호출/응답 오류 |
| `ocr_timeout` | 분석 시간 초과 |
| `server` | 서버 내부 오류 (DB 연결 실패 등) |

> 프론트 규칙: `unauthorized` 일 때만 로그인 화면으로 보낸다. `invalid_credentials`, `wrong_password` 는 해당 폼에 오류로 표시한다.

## 2. 인증 (auth)

### POST /auth/signup
요청 `{ "email": "a@b.com", "nickname": "잘쓰는사람", "password": "password1" }`
응답 `{ "user": { "uid": "...", "email": "a@b.com", "nickname": "잘쓰는사람" } }` + `Set-Cookie` (가입 즉시 로그인). 중복 `email_taken`.

### POST /auth/login
요청 `{ "email": "...", "password": "..." }` → 응답은 signup과 동일 + `Set-Cookie`. 실패 `invalid_credentials`.

### POST /auth/logout
요청 `{}`. 쿠키를 만료시킨다. 로그인하지 않은 상태여도 성공으로 응답한다.

### GET /auth/get_me
`{ "user": { "uid", "email", "nickname" } }` 또는 HTTP 401 `unauthorized`.

## 3. 사용자 (user)

### POST /user/change_nickname
요청 `{ "nickname": "새닉네임" }` → `{ "user": {...} }`

### POST /user/change_password
요청 `{ "current_password": "...", "new_password": "..." }`. 현재 비밀번호 불일치 `wrong_password`.

### POST /user/withdraw
요청 `{ "password": "..." }`. 사용자, 내역, 영수증, 이미지 파일을 모두 삭제하고 쿠키를 만료시킨다. 불일치 `wrong_password`.

## 4. 내역 (transaction)

### GET /transaction/get_month_list?month=2026-11&type=expense|income&category=식비
`month` 필수. `type`, `category` 선택. 정렬: `occurred_on` 내림차순, `created_at` 내림차순.
```json
{
  "month": "2026-11",
  "summary": { "total_expense": 354600, "total_income": 2000000, "balance": 1645400 },
  "items": [
    { "transaction_id": "...", "type": "expense", "amount": 9000, "category": "식비", "title": "김치찌개",
      "merchant": null, "memo": "", "occurred_on": "2026-11-03", "receipt_id": null }
  ]
}
```
- `summary` 는 `type`·`category` 필터와 **무관한 월 전체** 합계 (`total_expense` 는 음수 지출 포함 합).
- 필터는 `items` 에만 적용된다.

### GET /transaction/get_transaction?transaction_id=...
`{ "item": {...} }`

### POST /transaction/create_transaction
요청 `{ "type": "expense", "amount": 9000, "category": "식비", "title": "김치찌개", "memo": "", "occurred_on": "2026-11-03" }`
(`title` 비우면 서버가 카테고리명으로 채움, `merchant`·`receipt_id` 는 받지 않는다) → 응답은 `{ "item": {...} }`.

### POST /transaction/edit_transaction
요청은 `transaction_id` 와 `type`, `amount`, `category`, `title`, `memo`, `occurred_on` 전체. 응답 `{ "item": {...} }`. 영수증 연결 내역은 `type` 변경을 거부한다(`bad_request`).

### POST /transaction/delete_transaction
요청 `{ "transaction_id": "..." }`.

## 5. 통계 (stats)

### GET /stats/get_category_stats?month=2026-10
지출만 집계.
```json
{
  "month": "2026-10",
  "total_expense": 1119000,
  "prev_month_expense": 1036000,
  "categories": [
    { "category": "식비", "amount": 412300, "count": 32, "ratio": 36.8 },
    { "category": "생활", "amount": 338500, "count": 11, "ratio": 30.3 }
  ]
}
```
`categories` 는 금액 내림차순, 0원 카테고리 제외, `ratio` 는 소수 첫째 자리. 지출이 없으면 `categories: []`, `total_expense: 0`.

## 6. 영수증 (receipt)

### POST /receipt/upload_receipt (multipart, 필드명 `image`)
이미지를 저장하고 동기 분석한다. 최대 대기 `OCR_TIMEOUT_SEC`. 성공 응답은 분석 결과 전체:
```json
{
  "receipt": {
    "receipt_id": "...", "status": "analyzed",
    "merchant": "한빛마트 경산점", "purchased_on": "2026-11-02", "total_amount": 14200,
    "items": [
      { "name": "우유 1L", "quantity": 1, "amount": 2800, "category": "식비", "is_discount": false },
      { "name": "삼각김밥 참치마요", "quantity": 2, "amount": 3000, "category": "식비", "is_discount": false },
      { "name": "물티슈 80매", "quantity": 1, "amount": 2500, "category": "생활", "is_discount": false },
      { "name": "샴푸 400ml", "quantity": 1, "amount": 6900, "category": "생활", "is_discount": false },
      { "name": "행사 할인", "quantity": 1, "amount": -1000, "category": "생활", "is_discount": true }
    ],
    "items_sum": 14200, "mismatch": false, "confidence": "high"
  }
}
```
- `purchased_on`, `merchant`, `total_amount` 는 읽지 못하면 `null` (클라이언트는 오늘 날짜·빈 상호로 채워 보여 준다).
- 오류: `file_too_large`, `unsupported_media`, `not_a_receipt`, `rate_limited`, `ocr_failed`, `ocr_timeout`.
- 실패하면 이미지·레코드를 남기지 않는다(`status: failed` 로 남기지 않고 삭제).

### GET /receipt/get_receipt?receipt_id=...
위의 `{ "receipt": {...} }` 와 같은 모양. `status` 가 `confirmed` 이면 `items` 는 빈 배열(이미 내역으로 저장됨)이다.

### GET /receipt/get_receipt_image?receipt_id=...
이미지 바이너리(`Content-Type: image/jpeg`), `Cache-Control: private, max-age=3600`.

### POST /receipt/confirm_receipt
사용자가 수정한 최종 결과를 받아 내역을 일괄 생성한다. `status` 가 이미 `confirmed` 이면 `bad_request`.
```json
// 요청
{ "receipt_id": "...", "merchant": "한빛마트 경산점", "occurred_on": "2026-11-02",
  "items": [ { "name": "우유 1L", "amount": 2800, "category": "식비" },
             { "name": "행사 할인", "amount": -1000, "category": "생활" } ] }
// 응답
{ "created": 2, "month": "2026-11" }
```
- 항목 1~60개, 이름 1~40자, 금액 ≠ 0 (음수는 허용하되 합계가 0 미만이면 `validation`), 카테고리는 지출 9종.
- 한 번의 요청은 **전부 저장 또는 전부 실패**한다.

## 7. 메타 (meta)

### GET /meta/get_categories
```json
{ "expense": ["식비", "카페·간식", "교통", "쇼핑", "생활", "의료·건강", "문화·여가", "교육", "기타"],
  "income": ["급여", "용돈", "기타수입"] }
```
프론트는 같은 상수를 `_lib/categories.ts` 에도 두되, 서버 값이 기준이다.

### GET /health
`{ "status": "ok" }`. DB까지 확인한다. DB에 연결하지 못하면 `server` + `status: "db_error"` (인증 불필요).

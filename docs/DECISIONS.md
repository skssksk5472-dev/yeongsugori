# DECISIONS — 결정 기록과 열린 질문

구현 중 새로 정한 내용, 바꾼 내용, 사용자에게 확인할 점을 여기에 날짜와 함께 적는다.

## 사용자 확인이 필요한 것 (M9 기준)

### 해야 할 일 (사용자)
1. **`.env` 의 `JWT_SECRET_KEY`**: 비어 있어 백엔드 컨테이너가 시작하지 않는다. 길고 임의의 문자열로 채운다. 예전 예시에서 남은 `SESSION_TTL_DAYS` 줄은 지우고, `MONGODB_URI`·`UPLOAD_DIR` 는 비워 두는 것이 기본이다.
2. **OpenAI 실제 호출 확인**: `.env` 에 `OPENAI_API_KEY` 를 넣고 `pytest -m live` 를 한 번 돌린다. 기본 모델 `gpt-6-luna` 가 구조화 출력을 지원하는지 문서에서 직접 확인하지 못했다. 실패하면 `OPENAI_MODEL` 을 `gpt-6.1-terra` 등으로 바꾼다.
3. **휴대폰 QA**: `docs/08-qa-results.md` 3절 (카메라, 화면 키보드, 같은 Wi-Fi 접속).

### 정해 주면 맞출 것
4. ~~DB~~: MongoDB Atlas를 기본으로 정했다 (2026-11-05 기록). Atlas 접속 주소는 사용자가 `.env` 에 직접 넣는다.
5. **영수증 이미지 저장**: 로컬 디스크 기본. NCP Object Storage 예시 코드를 `storage/` 에 따로 둘지(수업용).
6. **닉네임 변경 화면**: 시안이 없어 S2 패턴으로 만들었다. 이대로 괜찮은지.
7. **회원 탈퇴 즉시 삭제**: 소프트 삭제가 필요한지.
8. **슈퍼노바 보조 코드**: 샘플에 없던 `RequestManager`, `Master_View`, `RequestHeader`, `Head_Parser`, `BaseModel`, `Mongo_Database` 는 단순한 버전으로 직접 만들었다. 원본을 주면 맞춘다. 응답 `header` 에 무엇을 넣을지도.
9. **`/dev/components`**: 시안 비교용 개발 전용 화면(배포에서는 404). 남길지 지울지.

### 정해진 것 (아래 기록 참고)
- 백엔드 구조: 슈퍼노바 샘플 (2026-11-04) · 프론트: TypeScript + CSS Modules (2026-11-03) · API 응답: 슈퍼노바 `{header, body: {result, ...}}` (2026-11-03) · 인증: JWT + HttpOnly 쿠키 (2026-11-04)

## 기록

| 날짜 | 내용 | 결정자 |
|---|---|---|
| 2026-11-03 | 초기 가정 13개 (00 문서 3절) | Claude (사용자 부재 중) |
| 2026-11-03 | 폴더 이름 `frontend/` → `front/`, `backend/` → `back/`. compose 서비스 이름도 `front`, `back` | 사용자 |
| 2026-11-03 | 프론트는 슈퍼노바 구성을 따른다: `src/` 없음, CSS Modules(Tailwind 안 씀), `_lib/`·`_components/`, `page.tsx` + `XxxView.tsx` | Claude (슈퍼노바 코드 확인) |
| 2026-11-03 | 글꼴은 npm 패키지 `pretendard` 를 `layout.tsx` 에서 불러온다 | Claude |
| 2026-11-03 | 프론트 Dockerfile은 한 단계(`npm ci` → `next build` → `next start`)로 단순하게 둔다 | Claude |
| 2026-11-03 | M0 완료: `docker compose up --build` 로 `localhost:8080` 첫 화면, `/api/health` = ok | Claude |
| 2026-11-03 | API는 슈퍼노바 모양: 요청 `{header, body}`, 응답 `{header, body: {result, detail, error_code, ...}}`. 실패도 HTTP 200, 로그인 필요만 HTTP 401. `error_code` 는 소문자(`not_found` 등). HTTP 메서드·경로는 03 문서 그대로. `header` 는 지금은 빈 객체 | 사용자 |
| 2026-11-03 | mongo를 `127.0.0.1:27017` 에만 연다. 호스트에서 돌리는 개발 서버·pytest가 쓰기 위함이며 LAN에서는 접속할 수 없다 | Claude |
| 2026-11-03 | M1 1차: `core/`·`views/response.py`·Pydantic 검증 처리기 (2026-11-04 슈퍼노바 구조로 다시 만들며 없앰) | Claude |
| 2026-11-04 | 백엔드를 슈퍼노바 구조로 다시 만들었다: view = API 경로 + 요청 클래스, controller = 기능별 흐름(`try_xxx`), model = 규칙·DB·응답 데이터(`BaseModel.get_response_form_data`), data_domains = DB 문서 모양. 폴더 `utils/`, `others/` 추가 | 사용자 + Claude |
| 2026-11-04 | API 메서드는 GET·POST만, 경로는 `/{모듈}/{동작}` (예: `/transaction/create_transaction`). 03 문서 전체를 이 이름으로 바꿨다 | Claude (슈퍼노바 샘플) |
| 2026-11-04 | ID는 `_id`(ObjectId) 대신 문자열 필드 `uid`, `transaction_id`, `receipt_id` (`uuid4().hex`). 04 문서 반영 | Claude (슈퍼노바 샘플) |
| 2026-11-04 | 입력 검증은 Pydantic이 아니라 model이 한다. 요청 클래스는 슈퍼노바처럼 `body.get(키, 기본값)` 으로 읽는다 | Claude (슈퍼노바 샘플) |
| 2026-11-04 | 샘플 `main.py` 의 CORS 설정과 코드에 적힌 JWT 키는 넣지 않았다. nginx로 같은 출처이고, 비밀값은 코드에 두지 않는다 | Claude |
| 2026-11-04 | `/health` 는 DB 연결까지 확인한다. 실패면 `server` + `status: db_error` | Claude |
| 2026-11-04 | 인증을 서버 세션에서 **JWT + HttpOnly 쿠키**(`zalssm_token`, HS256, `JWT_SECRET_KEY`, 7일)로 바꿨다. `sessions` 컬렉션과 `Session` 도메인 삭제. 로그아웃은 쿠키 삭제, 탈퇴한 사용자의 토큰은 사용자 조회에서 401 | 사용자 |
| 2026-11-04 | M2 완료: `sign_view.py`·`sign_controller.py`·`sign_model.py`, `utils/request_manager.py`(JWT 쿠키 확인, `try_view_management_need_authorized`), `utils/jwt_manager.py`, `utils/password.py`(bcrypt). 라이브러리 PyJWT, bcrypt 추가 | Claude |
| 2026-11-04 | 로그인 필요 응답은 두 곳에서 HTTP 401이 된다: 토큰이 없거나 틀리면 `CredentialsException`(main.py 처리기), 토큰은 맞지만 사용자가 없으면(탈퇴) 모델의 `unauthorized` 를 `make_json_response` 가 401로 보낸다 | Claude |
| 2026-11-04 | `JWT_SECRET_KEY` 가 비어 있으면 서버가 시작하지 않는다. 개발 서버는 `--env-file ../.env` 로 같은 `.env` 를 쓴다. `MONGODB_URI` 는 비워 두는 것이 기본(compose가 mongo 컨테이너 주소를 넣음) | Claude |
| 2026-11-04 | bcrypt는 72바이트까지만 다루므로 비밀번호 규칙(8~64자)에 "UTF-8 72바이트 이하"를 더했다. 한글 등을 많이 쓰면 64자 미만이어도 거부된다 | Claude |
| 2026-11-04 | 사용자 API(`/user/change_nickname`, `change_password`, `withdraw`)는 07 문서 마일스톤에 백엔드 단계가 따로 없어 M3에서 내역 API와 함께 만들었다 | Claude |
| 2026-11-04 | M3 완료: 내역(`transaction_*`), 분석(`stats_*`), 설정(`user_*`) 모듈. 공통 검증은 `utils/validator.py`(이메일·닉네임·비밀번호), 날짜는 `utils/date_util.py` | Claude |
| 2026-11-04 | "오늘"은 한국 시간(UTC+9 고정) 기준. 날짜 검사는 2000-01-01 ~ 오늘 | Claude |
| 2026-11-04 | 02 문서에 문구가 없는 검증은 이렇게 정했다: 월 `월을 확인하세요`, 지출/수입 `지출 또는 수입을 선택하세요`, 카테고리 `카테고리를 선택하세요`, 영수증 내역 지출/수입 변경 `영수증으로 등록된 내역은 지출·수입을 바꿀 수 없습니다` | Claude |
| 2026-11-04 | 금액은 JSON 숫자(정수)만 받는다. 문자열 "9000"·true 는 `validation`. 영수증 연결 내역만 수정 시 음수 금액(≠0)을 허용한다 | Claude |
| 2026-11-04 | 비율은 소수 첫째 자리 사사오입(파이썬 round()의 짝수 반올림을 쓰지 않음). 지출 합계가 0 이하이면 `categories: []` | Claude |
| 2026-11-04 | 탈퇴는 비밀번호가 맞을 때만 쿠키를 지운다. 영수증 이미지 파일 삭제는 저장소를 만드는 M7에서 더한다 | Claude |
| 2026-11-04 | M4 완료: 토큰(globals.css), `_lib/categories.ts`·`format.ts`(+단위 테스트)·`api.ts`·`session.ts`, 컴포넌트 20개, `(main)/layout.tsx`(로그인 확인 + 하단 탭), 토스트 | Claude |
| 2026-11-04 | 컴포넌트 치수·색은 시안 원본(`design/_src/lib.js`, `screens.js`)의 값을 그대로 썼다. 아이콘은 lucide-react (시안은 같은 Lucide 아이콘을 react-icons로 그림) | Claude |
| 2026-11-04 | 전역 401: API가 401이면 `/login?expired=1` 로 보낸다(로그인 화면이 M5에서 토스트 `로그인이 만료되었습니다` 를 띄운다). 처음 들어올 때의 로그인 확인(`getMe`)은 토스트 없이 `/login` 으로 보낸다 | Claude |
| 2026-11-04 | 토스트 위치는 화면과 상관없이 아래에서 88(탭 72 + 16). 탭이 없는 화면에서도 같은 자리 | Claude |
| 2026-11-04 | 시안 비교용으로 개발 전용 화면 `/dev/components` 를 두었다(문서에 없는 화면이지만 배포에서는 404). 필요 없으면 지운다 | Claude |
| 2026-11-04 | 프론트 단위 테스트는 Node 내장 `node --test` 로 돌린다(추가 라이브러리 없음, Node 24의 TypeScript 실행 사용) | Claude |
| 2026-11-04 | M5 완료: A1 로그인, A2 회원가입, S1 설정, S2 비밀번호 변경, 닉네임 변경, S3a·S3b 다이얼로그. `_lib/validators.ts`(+단위 테스트), `(auth)/layout.tsx`(로그인 상태면 `/` 로) | Claude |
| 2026-11-04 | 하단 탭은 `/`, `/stats`, `/settings` 에서만 보인다 (02 문서 2절). M4의 `(main)/layout.tsx` 를 고쳤다 | Claude |
| 2026-11-04 | 폼은 브라우저 기본 검증 말풍선을 끄고(`noValidate`) 02 문서의 문구만 보여 준다 | Claude |
| 2026-11-04 | 비밀번호 변경·닉네임 변경 버튼은 비활성 조건 없이 제출 때 검증한다. 현재 비밀번호를 비우면 서버의 `wrong_password` 문구가 나온다(새 문구를 만들지 않음) | Claude |
| 2026-11-04 | 앱 버전은 `NEXT_PUBLIC_APP_VERSION`, 없으면 1.0.0 | Claude |
| 2026-11-04 | `/` 는 M6까지 임시 화면(로고 줄 + 하단 탭)이다. M0의 서버 상태 화면은 지웠다 | Claude |
| 2026-11-04 | nginx가 컨테이너 IP를 시작할 때 한 번만 찾아서, front·back만 다시 만들면 502가 났다. docker DNS(`resolver 127.0.0.11`)와 변수로 매번 다시 찾게 고쳤다 | Claude |
| 2026-11-05 | M6 완료: H1 내역(+H1e 빈 상태, H2 추가 시트), H3 직접 입력, H4 수정(삭제 확인, 영수증 안내 줄, 이미지 뷰어), N1 분석(SVG 도넛, 전월 대비 칩), N2 카테고리 상세. `_lib/group.ts`(날짜별 묶기)와 금액 입력·비율 함수에 단위 테스트 | Claude |
| 2026-11-05 | 홈·분석의 선택한 달은 주소(`?month=`)에 둔다. 저장 후 그 달로 돌아오고, 뒤로가기에도 유지된다 | Claude |
| 2026-11-05 | H3·H4에서 지출↔수입을 바꾸면 카테고리 선택을 비운다(목록이 달라지므로) | Claude |
| 2026-11-05 | 영수증 내역(H4)은 금액 칸에서 앞의 `-` 를 받아 할인처럼 음수로 둘 수 있다(서버 규칙과 같음) | Claude |
| 2026-11-05 | 전월 대비 칩: 늘면 경고색(+), 줄면 연한 초록(-), 같으면 연한 초록 "0원", 전월 0원이면 숨김. 줄어든 경우의 아이콘은 TrendingDown | Claude |
| 2026-11-05 | 시트는 손잡이 쪽에서 아래로 80px 이상 끌면 닫힌다(H2 "아래로 끌면 닫힘") | Claude |
| 2026-11-05 | 영수증 이미지 뷰어는 `/receipt/get_receipt_image` 를 쓴다. API는 M7에서 만든다 | Claude |
| 2026-11-05 | M7 완료: 영수증 업로드·분석(mock)·결과 조회·이미지·일괄 저장 API(`receipt_*`), `storage/`, `services/ocr/`(mock·후처리), `utils/image_util.py`. 화면 O1·O2·O5(`/scan`), O3·O4(`/scan/[id]`). 탈퇴 시 이미지 폴더 삭제. 라이브러리 Pillow, python-multipart 추가 | Claude |
| 2026-11-05 | HEIC: 형식 확인은 통과시키지만 Pillow가 HEIC를 읽지 못하므로 `unsupported_media` 가 된다(추가 라이브러리 없이). 휴대폰 브라우저는 업로드할 때 보통 JPEG로 바꿔 보낸다 | Claude |
| 2026-11-05 | 이미지 저장소는 `app/storage/__init__.py` 의 `storage` 하나를 서버 전체가 같이 쓴다(view→controller로 넘기지 않음). 오브젝트 스토리지로 바꾸려면 이 파일만 바꾼다 | Claude |
| 2026-11-05 | 일괄 저장은 모든 품목을 먼저 검사한 뒤 `insert_many` 한 번으로 넣는다. 단일 mongo라 DB 트랜잭션은 쓰지 않는다 | Claude |
| 2026-11-05 | 02 문서에 문구가 없는 일괄 저장 검증: 품목 수 `품목을 확인하세요`, 합계 0 미만 `금액을 확인하세요`, 이미 저장 `이미 저장된 영수증입니다` | Claude |
| 2026-11-05 | 이미 저장(confirmed)한 영수증의 결과 주소로 오면 "페이지를 찾을 수 없습니다"를 보여 준다 | Claude |
| 2026-11-05 | 분석 중 취소하면 요청만 끊는다. 서버가 이미 분석을 끝냈다면 영수증 문서가 남지만 24시간 뒤 새 스캔 때 지워진다(04 문서 3절) | Claude |
| 2026-11-05 | `UPLOAD_DIR` 도 `MONGODB_URI` 처럼 `.env` 에서 비워 두는 것이 기본(docker는 /data/uploads, 개발 서버는 back/uploads) | Claude |
| 2026-11-05 | M8 완료(키 없이 확인한 범위): `services/ocr/prompt.py`(v3, 버전 기록), `schema.py`(카테고리 enum은 상수에서), `client.py` 의 OpenAI 호출. 가짜 응답으로 요청 모양·재시도 1회·시간 초과·거절·서버 오류를 테스트 | Claude |
| 2026-11-05 | OpenAI 호출은 SDK 대신 `httpx` 로 Responses API(`/v1/responses`)를 직접 부른다. 라이브러리를 늘리지 않고, 수업에서 HTTP 요청 모양을 그대로 보여 줄 수 있다 | Claude |
| 2026-11-05 | `OCR_TIMEOUT_SEC` 는 재시도를 합친 전체 제한 시간이다. 두 번째 시도는 남은 시간만큼만 기다린다(nginx 60초 안에 끝나도록) | Claude |
| 2026-11-05 | 실제 호출 테스트는 `@pytest.mark.live` 로 분리해 기본 실행(`pytest`)에서 뺐다. 개인정보 없는 영문 가짜 영수증을 그려서 보낸다 | Claude |
| 2026-11-05 | M9 완료: `back/scripts/seed.py`(데모 계정 + 시안과 같은 10·11월 내역, 영수증 이미지 포함, 있으면 건너뜀, 테스트 포함), README 시연 절차(방화벽·IP·AP 격리), QA 결과 `docs/08-qa-results.md` | Claude |
| 2026-11-05 | 데모 데이터는 2026년 10·11월 고정 날짜다(시안과 같게). 다른 달에 시연하면 월 선택에서 그 달로 이동해 보여 준다 | Claude |
| 2026-11-05 | 백엔드 이미지에 `scripts/` 를 넣어 `docker compose exec back python -m scripts.seed` 로 실행한다 | Claude |
| 2026-11-05 | 백엔드 import를 슈퍼노바 방식으로 바꿨다: `back/app` 이 기준 폴더이고 `from models import ...` 처럼 `app.` 없이 쓴다. 개발은 `back/app` 에서 `python main.py`(reload, 0.0.0.0:8000), docker는 `uvicorn main:app`. 시드 스크립트는 `back/app/scripts/` 로 옮겼다 | 사용자 요청 |
| 2026-11-05 | `others/config.py` 가 저장소 맨 위의 `.env` 를 python-dotenv로 읽는다(이미 있는 환경 변수는 덮어쓰지 않음). 그래서 `--env-file` 이 필요 없다. 테스트는 `conftest.py` 에서 DB·분석 모드 등을 직접 정해 `.env` 의 영향을 받지 않는다 | Claude |
| 2026-11-05 | DB 기본을 **MongoDB Atlas** 로 바꿨다. compose의 mongo 서비스는 `profiles: [local-db]` 로 옮겨 기본으로 켜지지 않는다. `dnspython` 을 requirements에 고정했다(Atlas `mongodb+srv://` 용) | 사용자 |
| 2026-11-05 | DB 연결 대기를 3초 → 5초로 늘렸다(Atlas 첫 연결의 DNS·TLS 시간) | Claude |
| 2026-11-05 | 테스트도 `.env` 의 Atlas 주소를 쓰고 DB 이름만 `zalssm_test` 로 바꾼다. 주소가 없거나 docker 전용 주소면 로컬 mongo로 | Claude |
| 2026-11-05 | 서버가 시작하다 멈출 때(키 없음, DB 연결 실패) traceback 대신 원인과 확인할 곳을 두 줄로 출력한다. 주소의 아이디·비밀번호는 가린다. DB 실패는 로컬 컨테이너 주소 / 아이디·비밀번호 / 주소 형식 / IP 허용·인터넷 으로 나눠 안내한다 | 사용자 요청 |

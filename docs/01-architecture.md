# 01. 아키텍처와 개발 환경

## 1. 구성도

```
[휴대폰 브라우저]  http://<PC-IP>:8080
        │
     [nginx :8080]  ── 단일 진입점 (같은 출처, CORS 불필요)
        ├─ /        → [front  Next.js :3000]   화면 생성
        └─ /api/    → [back   FastAPI :8000]   로직·데이터
                              ├─ [MongoDB Atlas]    (또는 이 PC의 mongo :27017)
                              ├─ uploads 볼륨       영수증 이미지
                              └─ OpenAI API         영수증 분석 (서버에서만 호출)
```

- 브라우저의 API 요청은 항상 `/api/...` 로 같은 출처에 보낸다. **프론트 코드에 호스트·포트를 쓰지 않는다.**
- 운영(슈퍼노바)은 앞단에 Cloudflare와 NCP VPC가 더해진 같은 형태이다. 교육에서는 "여기에 이 두 겹이 더 있다"고만 설명한다.

## 2. 폴더 구조

```
zalssm/
├─ CLAUDE.md
├─ docs/  design/
├─ docker-compose.yml
├─ .env.example                 (.env 는 깃에 올리지 않는다)
├─ nginx/default.conf
├─ front/                       Next.js (App Router, TypeScript, CSS Modules) — 슈퍼노바 프론트와 같은 구성
│  ├─ app/
│  │  ├─ layout.tsx                         전체 틀(폰 폭 컨테이너)
│  │  ├─ globals.css                        토큰 (06 문서)
│  │  ├─ (auth)/login/page.tsx            A1
│  │  ├─ (auth)/signup/page.tsx           A2
│  │  ├─ (main)/layout.tsx                로그인 확인 + 하단 탭
│  │  ├─ (main)/page.tsx                  H1 내역
│  │  ├─ (main)/add/page.tsx              H3
│  │  ├─ (main)/transactions/[id]/page.tsx H4
│  │  ├─ (main)/scan/page.tsx             O1, O2, O5
│  │  ├─ (main)/scan/[id]/page.tsx        O3, O4
│  │  ├─ (main)/stats/page.tsx            N1
│  │  ├─ (main)/stats/[category]/page.tsx N2
│  │  ├─ (main)/settings/{page,password,nickname}/ S1, S2
│  │  ├─ _components/   Button, IconButton, Field, Segmented, CategoryIcon, CategoryChip, CategoryGrid, TxRow, DayGroup,
│  │  │                 SummaryCard, Header, MonthSelector, LogoMark, TabBar, Fab, Sheet, Dialog, Banner, ActionBar, Toast
│  │  ├─ dev/components/ 컴포넌트 모음 (개발 전용, 배포 빌드에서는 404)
│  │  └─ _lib/          api.ts, format.ts, categories.ts, session.ts
│  └─ (글꼴은 npm 패키지 pretendard 를 layout.tsx 에서 불러온다. CDN 사용 안 함)
├─ back/
│  ├─ app/
│  │  ├─ main.py                 ZALSSM_Server: DB 연결, view 조립, FastAPI 앱 생성. 개발은 이 폴더에서 python main.py
│  │  ├─ scripts/seed.py         시연용 데모 계정·내역 (python -m scripts.seed)
│  │  ├─ views/                  API 경로 + 요청 클래스. master_view.py, core_view.py, sign_view.py, user_view.py,
│  │  │                          transaction_view.py, stats_view.py, receipt_view.py
│  │  ├─ controllers/            기능별 흐름. core_controller.py, sign_controller.py, ... (view와 1:1)
│  │  ├─ models/                 규칙·DB 접근·응답 데이터. base_model.py, core_model.py, sign_model.py, ...
│  │  │  └─ database/            database_model.py (Mongo_Database)
│  │  ├─ data_domains/           DB 문서 모양. base_domain.py, zalssm_data_domain.py (User, Transaction, Receipt)
│  │  ├─ utils/                  head_parser.py, request_manager.py(요청 도우미, 로그인 확인), jwt_manager.py, password.py,
│  │  │                          validator.py, date_util.py, image_util.py(이미지 형식 확인·전처리)
│  │  ├─ others/                 config.py (환경 변수), constants.py (카테고리)
│  │  ├─ services/ocr/           client.py(mock/OpenAI 호출), prompt.py(v3), schema.py, mock.py, postprocess.py, errors.py
│  │  └─ storage/                base.py(저장소 약속), local.py(로컬 디스크), __init__.py(서버가 같이 쓰는 storage 하나)
│  ├─ tests/
│  ├─ requirements.txt
│  └─ Dockerfile
```

## 3. 요청이 흐르는 길 (교육용 핵심)

`POST /api/transaction/create_transaction` 한 번을 따라가면:

1. 브라우저 `fetch('/api/transaction/create_transaction')` 가 `{header, body}` 를 보내고, 쿠키가 자동으로 함께 간다
2. nginx가 `/api/` 를 back으로 전달
3. **view** `transaction_view.py` 가 요청을 받아 요청 클래스(`CreateTransactionRequest`)로 `body` 값을 꺼낸다. `RequestManager` 가 쿠키의 JWT를 확인한다(없거나 만료면 HTTP 401)
4. **controller** `Transaction_Controller.try_create_transaction()` 이 모델을 만들고, 로그인한 사용자를 넣고, 모델에 일을 시킨다
5. **model** `TransactionModel` 이 규칙(금액·카테고리 검증)을 적용하고 `Transaction` 도메인을 `Mongo_Database` 로 저장한다. 실패면 `set_fail("validation", ...)`
6. view가 `model.get_response_form_data()` 로 `{header, body: {result, ...}}` 를 만들고 `RequestManager.make_json_response()` 로 돌려준다

## 4. 백엔드 계층 규칙 (슈퍼노바 방식)

| 계층 | 역할 | 하지 말 것 |
|---|---|---|
| view | API 경로(GET·POST)와 요청 클래스(`XxxRequest`). 요청을 받아 controller를 부르고 응답을 돌려준다 | 비즈니스 규칙, DB 접근 |
| controller | 기능 하나의 흐름: 모델 만들기 → 로그인한 사용자 넣기 → 모델 동작 부르기 → 모델 돌려주기 | DB 직접 접근, HTTP 개념 |
| model | 규칙(검증·집계)과 DB 접근, 처리 결과(`result`·`detail`·`error_code`)와 응답 데이터 보관 | 요청·응답 객체 사용 |
| data_domains | DB 문서 한 개의 모양(평평한 필드)과 dict ↔ 객체 변환(`make_with_dict`, `get_dict_form_data`) | 로직 |

- 이름: 클래스는 `Core_Service_View`, `Core_Controller`, `HealthModel` 처럼 쓰고, 동작 함수는 `try_` 로 시작한다(`try_create_transaction`). 숨길 값은 `self.__x`.
- route 함수는 늘 같은 순서다: `RequestManager` 만들기 → 요청 객체 만들기 → (로그인 확인) → controller 호출 → `get_response_form_data` → `make_json_response`.
- 서비스가 둘 이상의 model을 엮을 때만 `services/` 를 쓴다 (예: OCR).
- DB 문서는 **중첩 객체 없이 평평하게** 둔다 (슈퍼노바 방식). API 응답은 필요하면 중첩(`items: [...]`)해도 된다.
- 한 파일 한 책임. 함수는 짧게, 이름은 영어, 주석은 "왜"를 한국어로.

## 5. 인증 구조

- 로그인 성공 시 서버가 JWT(`{"uid": ..., "exp": ...}`, HS256, 키는 `.env` 의 `JWT_SECRET_KEY`)를 만들어 쿠키 `zalssm_token` 으로 내려준다. 서버는 로그인 상태를 DB에 저장하지 않는다.
- 요청이 오면 `RequestManager` 가 쿠키의 JWT 서명과 만료를 확인하고 `uid` 로 사용자를 찾는다. 서명이 틀리거나, 만료되었거나, 사용자가 없으면(탈퇴) HTTP 401.
- 로그아웃은 쿠키를 지운다. 토큰은 서버에 없으므로 따로 지울 것이 없다.
- 쿠키 속성: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=7일`. `Secure` 는 `COOKIE_SECURE=true` 일 때만 (LAN HTTP 시연에서는 false).
- 비밀번호는 bcrypt 해시. 로그인 실패 메시지는 이메일 존재 여부를 알려주지 않는다.
- 프론트: `(main)/layout.tsx` 가 마운트 시 `GET /api/auth/get_me` 를 호출한다. 401이면 `/login` 으로 보낸다. 쿠키 값은 JS에서 읽을 수 없다.
- 전역 규칙: **HTTP 401 = 로그인 토큰 없음/만료/무효만** 의미한다. 다른 실패는 HTTP 200 + `result: false` 이다(03 문서 1절). 비밀번호가 틀린 경우(비밀번호 변경, 탈퇴)는 `wrong_password` 를 쓴다.

## 6. 실행 방법

### 개발 (핫 리로드)
```
docker compose up -d mongo     # 127.0.0.1:27017 에만 열린다
cd back && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt     # 처음 한 번
cd back/app && ../.venv/Scripts/python main.py                                       # .env 를 스스로 읽는다, :8000
cd front && npm install && npm run dev        # :3000, next.config rewrites: /api/* → http://localhost:8000/api/*
```

### 시연 (학생 PC, 휴대폰 접속)
```
cp .env.example .env   # 값 채우기
docker compose up --build
```
- 휴대폰은 **같은 Wi-Fi**에서 `http://<PC의 IP>:8080` 으로 접속한다.
- Windows 방화벽에서 **TCP 8080 인바운드를 허용**한다.
- 공용·학교 Wi-Fi는 기기 간 통신을 막는 경우(AP 격리)가 있다. 안 되면 휴대폰 핫스팟이나 개인 공유기를 쓴다.
- HTTP 접속이므로 카메라 API(`getUserMedia`)는 쓸 수 없다. **파일 입력**(`<input type="file" accept="image/*" capture="environment">`)을 사용한다. 앨범 선택은 `capture` 없이 같은 입력을 쓴다.

## 7. 환경 변수 (`.env.example`)

```
MONGODB_URI=                  # Atlas 주소 (mongodb+srv://...). 비우면 이 PC의 mongo
MONGODB_DB=zalssm
JWT_SECRET_KEY=              # 길고 임의의 문자열. 비워 두면 서버가 시작하지 않는다
JWT_EXPIRE_DAYS=7
COOKIE_SECURE=false
UPLOAD_DIR=                   # 비우면 docker는 /data/uploads(볼륨), 개발 서버는 back/uploads
MAX_UPLOAD_MB=10
OCR_MODE=mock                 # mock | openai
OCR_MOCK_SCENARIO=ok          # ok | mismatch | not_receipt | timeout  (mock일 때만)
OPENAI_API_KEY=
OPENAI_MODEL=                 # 비우면 gpt-6-luna (이미지 입력 + JSON 스키마 출력, 2026-11 기준 가장 저렴)
OCR_TIMEOUT_SEC=30
SCAN_LIMIT_PER_HOUR=20
NEXT_PUBLIC_APP_VERSION=1.0.0
```

- `.env`, 키, 업로드 폴더는 `.gitignore` 에 넣는다. 코드·로그에 키를 남기지 않는다.

## 8. nginx (`nginx/default.conf`)

```nginx
server {
  listen 80;
  client_max_body_size 12m;

  # 컨테이너를 다시 만들면 IP가 바뀐다. 주소를 변수로 두어 docker DNS(127.0.0.11)에 매번 다시 묻게 한다.
  resolver 127.0.0.11 valid=10s;
  set $back_upstream http://back:8000;
  set $front_upstream http://front:3000;

  location /api/ {
    proxy_pass $back_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # 영수증 분석(OCR) 대기 시간 여유
    proxy_read_timeout 60s;
  }

  location / {
    proxy_pass $front_upstream;
    proxy_set_header Host $host;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
compose에서 nginx는 `8080:80` 으로 연다. back/front 포트는 호스트에 열지 않는다. mongo는 개발·테스트용으로 `127.0.0.1:27017` 에만 연다(밖에서는 nginx만 보인다).

## 9. docker-compose 구성

| 서비스 | 이미지/빌드 | 포트 | 볼륨 |
|---|---|---|---|
| nginx | nginx:alpine | 8080:80 | `./nginx/default.conf` |
| front | `./front` (`next build` + `next start`) | 내부 3000 | - |
| back | `./back` (python slim + uvicorn) | 내부 8000 | `uploads:/data/uploads` |
| mongo | mongo:7, `profiles: [local-db]` (Atlas를 안 쓸 때만) | 127.0.0.1:27017 (이 PC만) | `mongo_data` |

기본은 Atlas다. `.env` 의 `MONGODB_URI` 에 Atlas 주소를 넣으면 개발 서버·docker·테스트(DB 이름 `zalssm_test`)가 모두 그 주소를 쓴다. Atlas 없이 하려면 `MONGODB_URI` 를 비우고 `docker compose --profile local-db up --build` 로 mongo 컨테이너를 함께 켠다(compose가 `mongodb://mongo:27017` 을 넣는다).

## 10. 보안 체크리스트 (4주차 수업 연계)

- [ ] 비밀번호 bcrypt 해시, 평문 로그 금지
- [ ] JWT 비밀 키는 `.env` 에만 두고 코드에 쓰지 않는다, 쿠키는 HttpOnly
- [ ] 모든 `/api` (auth 제외)는 인증 필수, **내 데이터만** 접근 (다른 사용자 id는 `not_found`)
- [ ] 입력 검증은 서버가 최종 책임 (Pydantic)
- [ ] 업로드: 크기·형식(매직바이트) 검사, 파일명은 서버가 생성(UUID), EXIF 제거
- [ ] 영수증 이미지는 인증된 본인에게만 제공 (`GET /api/receipt/get_receipt_image`)
- [ ] API 키는 서버 `.env` 에만, 프론트에 노출 금지
- [ ] 스캔 호출 횟수 제한 (시간당), 로그인 시도 제한(권장)
- [ ] 외부에 노출하는 포트는 nginx 하나

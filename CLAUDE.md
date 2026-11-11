# ZALSSM (잘씀) — 코드 작업 지침

영수증 OCR 가계부(모바일 웹). 학부 현장실습생 4명을 위한 **교육용 레퍼런스 시스템**이다.
스택: nginx → Next.js(TypeScript) → FastAPI(Python) → MongoDB. 슈퍼노바와 같은 계층 구조를 쓴다.

## 시작하기 전에

1. `docs/00-overview.md` → `02-features-and-screens.md` → `06-design-system.md` → `03-api.md` → `04-data-schema.md` → `01-architecture.md` → `05-ocr-prompt.md` → `07-build-plan.md` 순으로 읽는다.
2. `docs/DECISIONS.md` 의 "사용자 확인이 필요한 것"을 읽는다. 사용자에게 물을 수 없으면 문서의 가정대로 진행하고, 바꾼 것은 `DECISIONS.md` 에 기록한다.
3. 화면 시안은 `design/png/` (화면 ID별 PNG)와 `design/index.html` 이다.
4. 작업은 `docs/07-build-plan.md` 의 마일스톤 M0 → M9 순서로 한다. 마일스톤마다 TaskCreate로 작업을 만들고, 끝나면 실행해서 확인한다.

## 규칙

- **UI는 시안을 먼저 본다.** 화면을 구현하기 전에 해당 PNG를 열고, 컴포넌트(06 문서 3절)를 먼저 만든 뒤 화면을 조립한다. 구현 후 390x844 스크린샷(Playwright)을 시안과 비교해 맞춘다. 화면을 한꺼번에 대량 생성하지 않는다.
- **비밀값을 읽지 않는다.** `.env`, 키 파일, 토큰을 열거나 출력하지 않는다. 필요한 값은 `.env.example` 에 이름만 적는다. 키·`.env`·업로드 폴더는 `.gitignore`.
- **문서에 없는 기능을 추가하지 않는다.** 범위는 `00-overview.md` 2절이다. 시안에 없는 화면은 `06-design-system.md` 5절 규칙으로 만든다.
- **한국어 문구는 정석적인 표현**으로, 짧게. 친근체(`~해요`), 이모지, 번역투를 쓰지 않는다. 사용자가 정하지 않은 조건·설명을 임의로 덧붙이지 않는다.
- **DB 문서는 중첩 객체 없이 평평하게** (04 문서). 백엔드는 슈퍼노바의 `views / controllers / models / data_domains` 구조 (01 문서 4절).
- **프론트에 호스트·포트·키를 쓰지 않는다.** 모든 API 호출은 `/api/...` 상대 경로. OpenAI 호출은 백엔드에서만.
- 인증 코드는 `auth` 모듈에 모으고 다른 곳이 내부 구현에 의존하지 않게 한다 (학생 과제용, 07 문서 2절).
- 교육용이다. 코드는 **읽기 쉽게**: 짧은 함수, 일관된 이름, 모듈 위 한 줄 역할 주석. 불필요한 라이브러리·추상화를 추가하지 않는다.
- 커밋·푸시는 사용자가 요청할 때만 한다.

## 실행 명령 (M0 확정)

- 시연: `cp .env.example .env` 후 `docker compose up --build` → `http://localhost:8080`
- 데모 데이터: `docker compose exec back python -m scripts.seed` (demo@zalssm.test / demo1234a, 있으면 건너뜀)
- 백엔드 개발: 처음 한 번 `cd back && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt`, 켤 때는 `cd back/app && ../.venv/Scripts/python main.py` (`.env` 를 스스로 읽는다. `JWT_SECRET_KEY` 필요, `MONGODB_URI`·`UPLOAD_DIR` 는 비워 두면 localhost·back/uploads)
- 백엔드 import: `back/app` 이 기준 폴더다. 슈퍼노바처럼 `from models import ...`, `from utils import ...` 로 쓰고 `app.` 을 붙이지 않는다
- 백엔드 테스트: `cd back && .venv/Scripts/pytest` (`.env` 의 Atlas 주소에 DB `zalssm_test` 로 붙는다. Atlas가 없으면 `docker compose up -d mongo` 로 로컬 mongo를 켠다). 실제 OpenAI 호출 테스트는 기본에서 빠지고 `pytest -m live` 로만 돈다(`OPENAI_API_KEY` 필요, 비용 발생)
- 프론트 개발: `cd front && npm install && npm run dev` (`/api` 는 `localhost:8000` 으로 넘어간다)
- 프론트 검사: `cd front && npm run lint && npm test && npm run build` (`npm test` 는 `_lib/*.test.ts` 단위 테스트)
- 컴포넌트 모음(개발 전용): `npm run dev` 후 `/dev/components`. 배포 빌드에서는 404

## 폴더

- 프론트는 `front/`, 백엔드는 `back/` 이다 (문서의 `frontend/`, `backend/` 를 이 이름으로 바꿨다).
- 백엔드는 슈퍼노바와 같은 구성이다: `main.py` 의 `ZALSSM_Server` 가 view를 조립하고, route 함수는 `RequestManager` → 요청 객체 → controller(`try_xxx`) → `model.get_response_form_data()` → `make_json_response()` 순서로 쓴다. API는 GET·POST만, 경로는 `/{모듈}/{동작}`.
- 프론트는 슈퍼노바(`NEXT_SUPERNOVA`)와 같은 구성이다: `src/` 없이 `app/` 이 최상위, `@/*` → `./*`, CSS Modules + `globals.css` 토큰, 화면은 `page.tsx`(얇게) + `XxxView.tsx` + `xxx.module.css`, API 호출은 `_lib/api.ts` 한 곳.

## 완료 보고

작업이 끝나면: 만든 것 한두 문장, 실행 방법, 남은 질문(`DECISIONS.md`)만 적는다. 과정을 늘어놓지 않는다.

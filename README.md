# 2026_H2_Internship
2026 영남대학교 기업 연계형 인턴쉽 과제 자료

## ZALSSM (잘씀)

영수증 사진 한 장으로 지출을 기록하는 모바일 웹 가계부. 현장실습 교육용 레퍼런스 시스템이다.

```
휴대폰 브라우저 → nginx(:8080) ─┬─ /      → front  (Next.js)
                               └─ /api/  → back   (FastAPI) → MongoDB, 영수증 이미지, OpenAI
```

- 문서: `docs/` (읽는 순서는 `docs/00-overview.md`), 화면 시안: `design/png/`, 결정 기록: `docs/DECISIONS.md`
- 프론트 `front/`, 백엔드 `back/`. 백엔드는 슈퍼노바와 같은 `views / controllers / models / data_domains` 구조다.

## 시연 절차 (학생 PC + 휴대폰)

### 1. 준비

- Docker Desktop을 설치하고 실행해 둔다.
- 설정 파일을 만든다.

```bash
cp .env.example .env
```

- `.env` 를 열어 `JWT_SECRET_KEY` 를 길고 임의의 문자열로 채운다. 비어 있으면 백엔드가 시작하지 않는다.
- `.env` 의 `MONGODB_URI` 에 MongoDB Atlas 연결 주소를 넣는다 (아래 "MongoDB Atlas 준비").
- 영수증 분석은 기본이 `OCR_MODE=mock`(고정 결과, 키 불필요)이다. 실제 분석을 쓰려면 `OCR_MODE=openai` 로 바꾸고 `OPENAI_API_KEY` 를 채운다.

### 2. 실행

```bash
docker compose up --build
```

처음 한 번, 시연용 데모 계정과 내역(2026년 10월·11월)을 넣는다. 이미 있으면 건너뛴다.

```bash
docker compose exec back python -m scripts.seed
```

데모 계정: `demo@zalssm.test` / `demo1234a`

이 PC에서는 `http://localhost:8080` 으로 접속한다.

### 3. 휴대폰으로 접속

1. 휴대폰과 PC를 **같은 Wi-Fi**에 연결한다.
2. PC의 IP를 확인한다. PowerShell에서 `ipconfig` 를 실행해 Wi-Fi 어댑터의 `IPv4 주소`(예: `192.168.0.12`)를 찾는다.
3. Windows 방화벽에서 TCP 8080 인바운드를 허용한다. **관리자 권한** PowerShell에서 한 번만 실행한다.

```powershell
New-NetFirewallRule -DisplayName "ZALSSM 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

4. 휴대폰 브라우저에서 `http://<PC의 IP>:8080` 으로 접속한다.

접속이 안 되면:
- 학교·공용 Wi-Fi는 기기끼리의 통신을 막는 경우가 있다(AP 격리). 휴대폰 핫스팟에 PC를 연결하거나 개인 공유기를 쓴다.
- PC의 네트워크가 "공용"으로 되어 있으면 방화벽 규칙이 적용되지 않을 수 있다. Windows 설정에서 "개인 네트워크"로 바꾼다.
- HTTP 접속이라 카메라 API 대신 파일 입력으로 촬영한다. "촬영하기"를 누르면 휴대폰 카메라가 열린다.

### 4. 끝내기

```bash
docker compose down
```

데이터(DB, 영수증 이미지)는 Docker 볼륨에 남는다. 모두 지우려면 `docker compose down -v`.

## MongoDB Atlas 준비 (처음 한 번)

1. [cloud.mongodb.com](https://cloud.mongodb.com) 에서 클러스터를 만든다. 무료(M0)로 충분하다. 지역은 가까운 곳(예: Seoul, Tokyo)을 고른다.
2. **Database Access** 에서 DB 사용자를 만든다. 권한은 "Read and write to any database".
3. **Network Access** 에서 접속을 허용할 IP를 넣는다. 시연하는 PC의 공인 IP를 넣거나("Add Current IP Address"), 수업 중에만 `0.0.0.0/0`(어디서나)을 쓰고 끝나면 지운다. docker 안의 백엔드도 같은 PC의 IP로 나간다.
4. 클러스터의 **Connect > Drivers** 에서 연결 주소(`mongodb+srv://...`)를 복사해 `.env` 의 `MONGODB_URI=` 뒤에 붙인다. `<password>` 를 2번의 비밀번호로 바꾼다. 비밀번호에 `@ : / ? #` 같은 문자가 있으면 URL 인코딩해야 하므로 영문·숫자만 쓰는 것이 편하다.
5. DB 이름은 주소가 아니라 `.env` 의 `MONGODB_DB`(기본 `zalssm`)로 정한다. 테스트는 같은 클러스터의 `zalssm_test` 를 쓴다.

연결 확인: 서버를 켜고 `http://localhost:8080/api/health`(docker) 또는 `http://localhost:8000/api/health`(개발)에서 `"status":"ok"` 가 보이면 된다. `db_error` 면 IP 허용, 사용자·비밀번호, 주소를 다시 확인한다.

Atlas 없이 하려면 `MONGODB_URI` 를 비우고 `docker compose --profile local-db up --build` 로 이 PC의 mongo 를 함께 켠다.

## 개인정보 안내

- `OCR_MODE=openai` 이면 촬영한 영수증 이미지(축소·메타데이터 제거 후)가 OpenAI API로 전송된다.
- 영수증 이미지는 로그인한 본인에게만 제공되고, 회원 탈퇴 시 내역·이미지가 모두 삭제된다.
- 실습에는 개인정보(카드 번호, 전화번호 등)가 없는 영수증을 쓴다.

## 개발

DB는 `.env` 의 Atlas 주소를 그대로 쓴다. Atlas 없이 할 때만 이 PC의 mongo 를 먼저 켠다(27017, 이 PC에서만 열린다): `docker compose up -d mongo`

백엔드 — 처음 한 번 가상환경을 만든다:

```bash
cd back
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
```

켤 때는 `back/app` 폴더에서 `main.py` 를 실행한다. 저장소 맨 위의 `.env` 를 스스로 읽고, 코드를 고치면 자동으로 다시 켜진다.
`.env` 의 `MONGODB_URI` 는 Atlas 주소(비우면 `localhost:27017`), `UPLOAD_DIR` 는 비워 두면 `back/uploads` 다. `mongodb://mongo:27017` 은 docker 안에서만 통하는 주소라 개발 서버에서는 쓰지 않는다.

```bash
cd back/app
```

```bash
../.venv/Scripts/python main.py
```

데모 데이터도 같은 폴더에서 넣는다:

```bash
../.venv/Scripts/python -m scripts.seed
```

프론트 (`/api` 요청은 `localhost:8000` 으로 넘어간다):

```bash
cd front
npm install
npm run dev
```

## 테스트

```bash
cd back && .venv/Scripts/pytest
```

```bash
cd front && npm run lint && npm test && npm run build
```

- 백엔드 테스트는 `.env` 의 Atlas 주소에 별도 DB `zalssm_test` 로 붙는다(Atlas가 없으면 로컬 mongo). 실제 OpenAI 호출 테스트는 비용이 들어 기본에서 빠지며, 키를 넣은 뒤 `pytest -m live` 로 돌린다.
- 프론트 컴포넌트 모음(개발 전용): `npm run dev` 후 `/dev/components`

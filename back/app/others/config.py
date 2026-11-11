# 환경 변수 읽기 — 설정값은 이 파일에서만 가져온다.

import os
from pathlib import Path

from dotenv import load_dotenv

# back 폴더
BACK_DIR = Path(__file__).resolve().parents[2]

# 저장소 맨 위의 .env 를 읽는다 (python main.py 로 켤 때). 이미 있는 환경 변수는 덮어쓰지 않는다.
# docker 에서는 compose 가 .env 를 환경 변수로 넣어 주고, 이 파일은 이미지 안에 없다.
load_dotenv(BACK_DIR.parent / ".env")

# 비어 있으면 개발용 기본값(이 PC의 mongo)을 쓴다. docker에서는 compose가 mongo 컨테이너 주소를 넣는다.
MONGODB_URI = os.getenv("MONGODB_URI") or ""
MONGODB_DB = os.getenv("MONGODB_DB", "zalssm")

# 로그인 토큰(JWT) 서명 키. 코드에 기본값을 두지 않는다 (main.py에서 비어 있으면 멈춘다).
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "qwer1234")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

# HTTPS로 서비스할 때만 true. LAN HTTP 시연에서는 false
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false") == "true"

# 영수증 이미지 저장 폴더. 비어 있으면 개발용 back/uploads (docker에서는 compose가 /data/uploads 를 넣는다)
UPLOAD_DIR = os.getenv("UPLOAD_DIR") or str(BACK_DIR / "uploads")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))

# 영수증 분석: mock(고정 결과, 키 불필요) | openai
OCR_MODE = os.getenv("OCR_MODE", "mock")
# mock 일 때 결과: ok | mismatch | not_receipt | timeout
OCR_MOCK_SCENARIO = os.getenv("OCR_MOCK_SCENARIO", "ok")
OCR_TIMEOUT_SEC = int(os.getenv("OCR_TIMEOUT_SEC", "30"))
SCAN_LIMIT_PER_HOUR = int(os.getenv("SCAN_LIMIT_PER_HOUR", "20"))

# 실제 분석(OCR_MODE=openai)에만 쓴다. 키는 .env 에만 두고 코드·로그에 남기지 않는다.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
# 이미지 입력과 JSON 스키마 출력을 지원하는 모델. 기본은 가장 저렴한 모델 (2026-11 기준)
OPENAI_MODEL = os.getenv("OPENAI_MODEL") or "gpt-6-luna"

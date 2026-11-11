# 테스트 설정 — app을 불러오기 전에 환경 변수를 정해야 한다. 먼저 docker compose up -d mongo 로 DB를 띄운다.

import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv

# DB 주소는 .env 의 MONGODB_URI(Atlas)를 쓰되, DB 이름은 별도(zalssm_test)로 한다. 실제 데이터와 섞이지 않는다.
# 주소가 비어 있거나 docker 안에서만 통하는 주소(mongo:27017)면 이 PC의 mongo 를 쓴다.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
if not os.getenv("MONGODB_URI") or "//mongo:" in os.getenv("MONGODB_URI"):
    os.environ["MONGODB_URI"] = "mongodb://localhost:27017"

# 나머지는 .env 와 상관없이 정한다: 테스트 DB, 임시 폴더(영수증 이미지), mock 분석
# (config.py 는 .env 를 읽지만 이미 있는 환경 변수는 덮어쓰지 않는다)
os.environ["MONGODB_DB"] = "zalssm_test"
os.environ["OCR_MODE"] = "mock"
os.environ["MAX_UPLOAD_MB"] = "10"
os.environ["SCAN_LIMIT_PER_HOUR"] = "20"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="zalssm_uploads_")
# 테스트에서만 쓰는 서명 키
os.environ["JWT_SECRET_KEY"] = "test-only-secret-key-for-pytest-0123456789"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402

from main import app  # noqa: E402
from others import config  # noqa: E402

PASSWORD = "demo1234a"


def get_test_db():
    return MongoClient(config.MONGODB_URI)[config.MONGODB_DB]


def post(client, path, body):
    return client.post("/api" + path, json={"header": {}, "body": body})


def signup(client, email="demo@zalssm.test", nickname="잘쓰는사람", password=PASSWORD):
    return post(client, "/auth/signup", {"email": email, "nickname": nickname, "password": password})


# 테스트마다 데이터를 비우고, 쿠키가 없는 새 클라이언트로 시작한다.
@pytest.fixture
def client():
    db = get_test_db()
    for name in ["users", "transactions", "receipts"]:
        db[name].delete_many({})
    return TestClient(app)


# 가입(=로그인)까지 마친 클라이언트
@pytest.fixture
def user_client(client):
    signup(client)
    return client


# 다른 사용자로 로그인한 클라이언트 (내 데이터가 보이지 않는지 확인용)
@pytest.fixture
def other_client(client):
    other = TestClient(app)
    signup(other, email="other@zalssm.test", nickname="다른사람")
    return other

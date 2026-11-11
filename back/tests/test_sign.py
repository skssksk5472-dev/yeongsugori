# 회원가입·로그인·로그아웃·내 정보 API (auth 모듈)

from fastapi.testclient import TestClient

from main import app
from others import config
from utils.jwt_manager import make_token
from tests.conftest import PASSWORD, get_test_db, post, signup

EMAIL = "demo@zalssm.test"


def test_signup_logs_in(client):
    res = signup(client, email="Demo@ZALSSM.test")
    body = res.json()["body"]
    assert res.status_code == 200
    assert body["result"] is True
    assert body["user"]["email"] == EMAIL  # 소문자로 저장
    assert "password_hash" not in body["user"]
    assert "zalssm_token" in res.cookies

    me = client.get("/api/auth/get_me").json()["body"]
    assert me["user"]["uid"] == body["user"]["uid"]


def test_signup_cookie_is_httponly(client):
    cookie = signup(client).headers["set-cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie


def test_signup_email_taken(client):
    signup(client)
    body = signup(TestClient(app)).json()["body"]
    assert body["result"] is False
    assert body["error_code"] == "email_taken"


def test_signup_validation(client):
    res = signup(client, email="abc", nickname="a", password="password")
    body = res.json()["body"]
    assert res.status_code == 200
    assert body["error_code"] == "validation"
    assert body["fields"] == {
        "email": "올바른 이메일 형식이 아닙니다",
        "nickname": "닉네임은 2~12자로 입력하세요",
        "password": "8자 이상, 영문과 숫자를 포함해야 합니다",
    }
    assert "zalssm_token" not in res.cookies


def test_login_success(client):
    signup(client)
    other = TestClient(app)
    res = post(other, "/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert res.json()["body"]["result"] is True
    assert other.get("/api/auth/get_me").status_code == 200


def test_login_fail_has_same_message(client):
    signup(client)
    wrong_password = post(TestClient(app), "/auth/login", {"email": EMAIL, "password": "wrong1234a"}).json()["body"]
    no_user = post(TestClient(app), "/auth/login", {"email": "nobody@zalssm.test", "password": PASSWORD}).json()["body"]
    assert wrong_password["error_code"] == "invalid_credentials"
    assert wrong_password == no_user


def test_get_me_without_token_is_401(client):
    res = client.get("/api/auth/get_me")
    assert res.status_code == 401
    assert res.json()["body"] == {"result": False, "detail": "로그인이 필요합니다", "error_code": "unauthorized"}


def test_logout_then_get_me_is_401(user_client):
    assert post(user_client, "/auth/logout", {}).json()["body"]["result"] is True
    assert user_client.get("/api/auth/get_me").status_code == 401


def test_expired_token_is_401(client):
    uid = signup(client).json()["body"]["user"]["uid"]
    other = TestClient(app)
    other.cookies.set("zalssm_token", make_token(uid=uid, secret_key=config.JWT_SECRET_KEY, expire_days=-1))
    assert other.get("/api/auth/get_me").status_code == 401


def test_wrong_signature_token_is_401(client):
    uid = signup(client).json()["body"]["user"]["uid"]
    other = TestClient(app)
    other.cookies.set("zalssm_token", make_token(uid=uid, secret_key="another-key-0123456789-abcdefghij", expire_days=7))
    assert other.get("/api/auth/get_me").status_code == 401


def test_deleted_user_token_is_401(user_client):
    # 사용자 문서만 지운다. 쿠키의 토큰은 아직 만료 전이다.
    get_test_db()["users"].delete_many({})
    res = user_client.get("/api/auth/get_me")
    assert res.status_code == 401
    assert res.json()["body"]["error_code"] == "unauthorized"

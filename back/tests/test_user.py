# 설정 API — 닉네임 변경, 비밀번호 변경, 회원 탈퇴

from fastapi.testclient import TestClient

from main import app
from tests.conftest import PASSWORD, get_test_db, post, signup

EMAIL = "demo@zalssm.test"


def test_change_nickname(user_client):
    body = post(user_client, "/user/change_nickname", {"nickname": " 새닉네임 "}).json()["body"]
    assert body["result"] is True
    assert body["user"]["nickname"] == "새닉네임"
    assert user_client.get("/api/auth/get_me").json()["body"]["user"]["nickname"] == "새닉네임"


def test_change_nickname_validation(user_client):
    body = post(user_client, "/user/change_nickname", {"nickname": "가"}).json()["body"]
    assert body["fields"] == {"nickname": "닉네임은 2~12자로 입력하세요"}


def test_change_password(user_client):
    wrong = post(user_client, "/user/change_password",
                 {"current_password": "wrong1234a", "new_password": "newpass123"}).json()["body"]
    assert wrong["error_code"] == "wrong_password"

    weak = post(user_client, "/user/change_password",
                {"current_password": PASSWORD, "new_password": "short"}).json()["body"]
    assert weak["fields"] == {"new_password": "8자 이상, 영문과 숫자를 포함해야 합니다"}

    ok = post(user_client, "/user/change_password",
              {"current_password": PASSWORD, "new_password": "newpass123"}).json()["body"]
    assert ok["result"] is True

    old_login = post(TestClient(app), "/auth/login", {"email": EMAIL, "password": PASSWORD}).json()["body"]
    new_login = post(TestClient(app), "/auth/login", {"email": EMAIL, "password": "newpass123"}).json()["body"]
    assert old_login["error_code"] == "invalid_credentials"
    assert new_login["result"] is True


def test_withdraw_wrong_password_keeps_login(user_client):
    res = post(user_client, "/user/withdraw", {"password": "wrong1234a"})
    assert res.json()["body"]["error_code"] == "wrong_password"
    assert "set-cookie" not in res.headers
    assert user_client.get("/api/auth/get_me").status_code == 200


def test_withdraw_deletes_everything(user_client, other_client):
    post(user_client, "/transaction/create_transaction", {
        "type": "expense", "amount": 9000, "category": "식비", "title": "", "memo": "", "occurred_on": "2026-10-03"})
    post(other_client, "/transaction/create_transaction", {
        "type": "expense", "amount": 5000, "category": "식비", "title": "", "memo": "", "occurred_on": "2026-10-03"})
    uid = user_client.get("/api/auth/get_me").json()["body"]["user"]["uid"]
    get_test_db()["receipts"].insert_one({"receipt_id": "receipt-1", "uid": uid})

    body = post(user_client, "/user/withdraw", {"password": PASSWORD}).json()["body"]
    assert body["result"] is True
    assert user_client.get("/api/auth/get_me").status_code == 401

    db = get_test_db()
    assert db["users"].count_documents({"uid": uid}) == 0
    assert db["transactions"].count_documents({"uid": uid}) == 0
    assert db["receipts"].count_documents({"uid": uid}) == 0
    assert db["transactions"].count_documents({}) == 1  # 다른 사용자 내역은 남는다

    # 같은 이메일로 다시 가입할 수 있다
    assert signup(TestClient(app)).json()["body"]["result"] is True


def test_login_required(client):
    assert post(client, "/user/change_nickname", {"nickname": "새닉네임"}).status_code == 401

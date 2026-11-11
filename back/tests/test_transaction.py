# 가계부 내역 API — 생성·조회·수정·삭제, 월 경계, 요약, 다른 사용자 데이터

from utils.date_util import today_kst
from tests.conftest import get_test_db, post


def create(client, **fields):
    body = {"type": "expense", "amount": 9000, "category": "식비", "title": "김치찌개", "memo": "",
            "occurred_on": "2026-10-03"}
    body.update(fields)
    return post(client, "/transaction/create_transaction", body).json()["body"]


def month_list(client, month, **filters):
    params = {"month": month, **filters}
    return client.get("/api/transaction/get_month_list", params=params).json()["body"]


def test_create_and_get(user_client):
    created = create(user_client)
    assert created["result"] is True
    item = created["item"]
    assert item["amount"] == 9000
    assert item["receipt_id"] is None
    assert "uid" not in item

    found = user_client.get("/api/transaction/get_transaction",
                            params={"transaction_id": item["transaction_id"]}).json()["body"]
    assert found["item"] == item


def test_empty_title_uses_category(user_client):
    assert create(user_client, title="  ")["item"]["title"] == "식비"


def test_create_validation(user_client):
    body = create(user_client, type="expense", amount=0, category="급여", title="가" * 41, memo="나" * 101,
                  occurred_on="1999-12-31")
    assert body["error_code"] == "validation"
    assert set(body["fields"]) == {"amount", "category", "title", "memo", "occurred_on"}


def test_amount_must_be_number(user_client):
    assert create(user_client, amount="9000")["fields"] == {"amount": "금액을 입력하세요"}
    assert create(user_client, amount=True)["fields"] == {"amount": "금액을 입력하세요"}
    assert create(user_client, amount=-1000)["fields"] == {"amount": "금액을 입력하세요"}


def test_today_is_allowed_but_not_tomorrow(user_client):
    assert create(user_client, occurred_on=today_kst())["result"] is True
    assert create(user_client, occurred_on="2999-01-01")["fields"] == {"occurred_on": "날짜를 확인하세요"}


def test_month_boundary(user_client):
    create(user_client, occurred_on="2026-09-30", title="9월 마지막 날")
    create(user_client, occurred_on="2026-10-01", title="10월 첫날")
    september = month_list(user_client, "2026-09")
    october = month_list(user_client, "2026-10")
    assert [item["title"] for item in september["items"]] == ["9월 마지막 날"]
    assert [item["title"] for item in october["items"]] == ["10월 첫날"]


def test_month_list_order_and_summary(user_client):
    create(user_client, occurred_on="2026-10-01", amount=1000, title="첫째")
    create(user_client, occurred_on="2026-10-05", amount=2000, title="둘째")
    create(user_client, occurred_on="2026-10-05", amount=3000, title="셋째")
    create(user_client, type="income", category="급여", amount=50000, occurred_on="2026-10-10", title="월급")

    body = month_list(user_client, "2026-10")
    # 날짜 내림차순, 같은 날이면 나중에 만든 것이 먼저
    assert [item["title"] for item in body["items"]] == ["월급", "셋째", "둘째", "첫째"]
    assert body["summary"] == {"total_expense": 6000, "total_income": 50000, "balance": 44000}


def test_filter_applies_to_items_only(user_client):
    create(user_client, amount=1000)
    create(user_client, type="income", category="급여", amount=50000)

    body = month_list(user_client, "2026-10", type="income")
    assert [item["type"] for item in body["items"]] == ["income"]
    assert body["summary"]["total_expense"] == 1000

    body = month_list(user_client, "2026-10", category="식비")
    assert [item["category"] for item in body["items"]] == ["식비"]


def test_month_list_validation(user_client):
    assert month_list(user_client, "2026-13")["fields"] == {"month": "월을 확인하세요"}
    assert month_list(user_client, "2026-10", type="all")["fields"] == {"type": "지출 또는 수입을 선택하세요"}


def test_edit(user_client):
    item = create(user_client)["item"]
    body = post(user_client, "/transaction/edit_transaction", {
        **item, "type": "income", "amount": 100000, "category": "용돈", "title": "", "memo": "메모",
    }).json()["body"]
    assert body["result"] is True
    assert body["item"]["type"] == "income"
    assert body["item"]["title"] == "용돈"

    saved = get_test_db()["transactions"].find_one({"transaction_id": item["transaction_id"]})
    assert saved["amount"] == 100000
    assert saved["updated_at"] >= saved["created_at"]


def test_edit_receipt_transaction(user_client):
    item = create(user_client)["item"]
    # 영수증 내역은 M7에서 만든다. 여기서는 DB에 영수증 ID만 붙인다.
    get_test_db()["transactions"].update_one({"transaction_id": item["transaction_id"]},
                                             {"$set": {"receipt_id": "receipt-1"}})

    body = post(user_client, "/transaction/edit_transaction", {**item, "type": "income", "category": "급여"}).json()["body"]
    assert body["error_code"] == "bad_request"

    # 할인 품목처럼 음수 금액으로는 바꿀 수 있다
    body = post(user_client, "/transaction/edit_transaction", {**item, "amount": -1000}).json()["body"]
    assert body["result"] is True
    assert body["item"]["amount"] == -1000


def test_delete(user_client):
    item = create(user_client)["item"]
    body = post(user_client, "/transaction/delete_transaction", {"transaction_id": item["transaction_id"]}).json()["body"]
    assert body["result"] is True
    assert month_list(user_client, "2026-10")["items"] == []

    again = post(user_client, "/transaction/delete_transaction", {"transaction_id": item["transaction_id"]}).json()["body"]
    assert again["error_code"] == "not_found"


def test_other_user_gets_not_found(user_client, other_client):
    item = create(user_client)["item"]
    transaction_id = item["transaction_id"]

    found = other_client.get("/api/transaction/get_transaction", params={"transaction_id": transaction_id}).json()["body"]
    edited = post(other_client, "/transaction/edit_transaction", {**item, "amount": 1}).json()["body"]
    deleted = post(other_client, "/transaction/delete_transaction", {"transaction_id": transaction_id}).json()["body"]
    assert found["error_code"] == edited["error_code"] == deleted["error_code"] == "not_found"

    assert month_list(other_client, "2026-10")["items"] == []
    assert month_list(user_client, "2026-10")["items"][0]["amount"] == 9000


def test_login_required(client):
    res = client.get("/api/transaction/get_month_list", params={"month": "2026-10"})
    assert res.status_code == 401
    assert post(client, "/transaction/create_transaction", {}).status_code == 401

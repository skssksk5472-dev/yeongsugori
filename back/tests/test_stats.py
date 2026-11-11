# 분석 API — 카테고리 합계·비율·정렬, 0원 카테고리 제외, 전월 대비, 음수 지출(할인)

from tests.conftest import get_test_db, post


def create(client, category, amount, occurred_on="2026-10-03", type="expense"):
    body = {"type": type, "amount": amount, "category": category, "title": "", "memo": "", "occurred_on": occurred_on}
    return post(client, "/transaction/create_transaction", body).json()["body"]


def stats(client, month="2026-10"):
    return client.get("/api/stats/get_category_stats", params={"month": month}).json()["body"]


def test_category_ratio_and_order(user_client):
    create(user_client, "식비", 412300)
    create(user_client, "생활", 338500)
    create(user_client, "교통", 368200)
    create(user_client, "급여", 2000000, type="income")  # 수입은 분석에서 뺀다

    body = stats(user_client)
    assert body["total_expense"] == 1119000
    assert [row["category"] for row in body["categories"]] == ["식비", "교통", "생활"]
    assert body["categories"][0] == {"category": "식비", "amount": 412300, "count": 1, "ratio": 36.8}
    assert body["categories"][2]["ratio"] == 30.3


def test_ratio_rounds_half_up(user_client):
    # 1/16 = 6.25% → 6.3, 15/16 = 93.75% → 93.8 (둘 다 0.05에서 올림)
    create(user_client, "식비", 1)
    create(user_client, "교통", 15)
    ratios = {row["category"]: row["ratio"] for row in stats(user_client)["categories"]}
    assert ratios == {"교통": 93.8, "식비": 6.3}


def test_discount_and_zero_category(user_client):
    create(user_client, "식비", 10000)
    item = create(user_client, "생활", 3000)["item"]
    # 생활 카테고리에 할인(음수) 내역을 직접 넣어 합계를 0원으로 만든다.
    get_test_db()["transactions"].insert_one({**item, "transaction_id": "discount-1", "amount": -3000,
                                             "uid": get_test_db()["users"].find_one()["uid"],
                                             "created_at": None, "updated_at": None})

    body = stats(user_client)
    assert body["total_expense"] == 10000
    assert [row["category"] for row in body["categories"]] == ["식비"]


def test_previous_month(user_client):
    create(user_client, "식비", 5000, occurred_on="2026-09-15")
    create(user_client, "식비", 7000, occurred_on="2026-10-15")
    body = stats(user_client)
    assert body["total_expense"] == 7000
    assert body["prev_month_expense"] == 5000


def test_january_compares_with_december(user_client):
    create(user_client, "식비", 4000, occurred_on="2025-12-31")
    assert stats(user_client, "2026-01")["prev_month_expense"] == 4000


def test_empty_month(user_client):
    body = stats(user_client, "2026-01")
    assert body["result"] is True
    assert body["total_expense"] == 0
    assert body["categories"] == []


def test_other_user_data_is_not_counted(user_client, other_client):
    create(user_client, "식비", 10000)
    assert stats(other_client)["total_expense"] == 0


def test_month_validation(user_client):
    assert stats(user_client, "2026/10")["fields"] == {"month": "월을 확인하세요"}

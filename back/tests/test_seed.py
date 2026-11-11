# 시연용 데이터 넣기 — 데모 계정으로 로그인하면 시안과 같은 합계가 보이고, 두 번 돌려도 한 번만 들어간다

from models import Mongo_Database
from others import config
from scripts.seed import DEMO_EMAIL, DEMO_PASSWORD, seed
from tests.conftest import post


def test_seed_once_and_matches_design(client):
    database = Mongo_Database(uri=config.MONGODB_URI, db_name=config.MONGODB_DB)
    assert seed(database) is True
    assert seed(database) is False  # 이미 있으면 건너뛴다

    assert post(client, "/auth/login", {"email": DEMO_EMAIL, "password": DEMO_PASSWORD}).json()["body"]["result"] is True
    november = client.get("/api/transaction/get_month_list", params={"month": "2026-11"}).json()["body"]
    assert november["summary"] == {"total_expense": 354600, "total_income": 2000000, "balance": 1645400}
    assert [item["title"] for item in november["items"][:4]] == ["김치찌개", "아메리카노", "버스 요금", "영상 구독"]

    october = client.get("/api/stats/get_category_stats", params={"month": "2026-10"}).json()["body"]
    assert october["total_expense"] == 1119000
    assert october["prev_month_expense"] == 1036000
    assert october["categories"][0] == {"category": "식비", "amount": 412300, "count": 32, "ratio": 36.8}

    receipt_id = november["items"][4]["receipt_id"]
    image = client.get("/api/receipt/get_receipt_image", params={"receipt_id": receipt_id})
    assert image.headers["content-type"] == "image/jpeg"

# 시연용 데이터 넣기 — 데모 계정과 시안과 비슷한 2026년 11월·10월 내역 (07 문서 2절). 이미 있으면 건너뛴다.
#
# 실행: docker compose exec back python -m scripts.seed
#       (개발) cd back && .venv/Scripts/python -m scripts.seed   ← .env 의 값이 환경 변수로 들어와 있어야 한다

import io
import json
import uuid
from datetime import datetime, timedelta, timezone

from PIL import Image, ImageDraw

from data_domains.zalssm_data_domain import Receipt, Transaction, User
from models import Mongo_Database
from others import config
from services.ocr.mock import receipt_result
from storage import storage
from utils.password import hash_password

DEMO_EMAIL = "demo@zalssm.test"
DEMO_PASSWORD = "demo1234a"
DEMO_NICKNAME = "잘쓰는사람"
MERCHANT = "한빛마트 경산점"

# 11월 (H1 시안), 화면 위에서 아래 순서. 마지막 값이 True 면 11월 2일 영수증 품목이다 (할인은 음수)
NOVEMBER = [
    ("2026-11-03", "expense", 9000, "식비", "김치찌개", False),
    ("2026-11-03", "expense", 4500, "카페·간식", "아메리카노", False),
    ("2026-11-03", "expense", 1500, "교통", "버스 요금", False),
    ("2026-11-02", "expense", 17000, "문화·여가", "영상 구독", False),
    ("2026-11-02", "expense", 2800, "식비", "우유 1L", True),
    ("2026-11-02", "expense", 3000, "식비", "삼각김밥 참치마요", True),
    ("2026-11-02", "expense", 2500, "생활", "물티슈 80매", True),
    ("2026-11-02", "expense", 6900, "생활", "샴푸 400ml", True),
    ("2026-11-02", "expense", -1000, "생활", "행사 할인", True),
    ("2026-11-01", "income", 2000000, "급여", "10월 급여", False),
    ("2026-11-01", "expense", 300000, "생활", "월세", False),
    ("2026-11-01", "expense", 8400, "교통", "택시", False),
]

# 10월 (N1 시안): 카테고리별 합계·건수, 내역 이름
OCTOBER = [
    ("식비", 412300, 32, ["점심 비빔밥", "저녁 치킨", "마트 장보기", "점심 순두부", "샌드위치"]),
    ("생활", 338500, 11, ["월세", "세제", "관리비"]),
    ("교통", 96400, 24, ["버스 요금", "지하철", "택시"]),
    ("카페·간식", 87900, 15, ["아메리카노", "케이크", "라떼"]),
    ("쇼핑", 76200, 5, ["티셔츠", "운동화"]),
    ("문화·여가", 58000, 4, ["영화", "영상 구독"]),
    ("의료·건강", 31000, 2, ["약국", "병원"]),
    ("기타", 18700, 3, ["선물", "기부"]),
]
SEPTEMBER_TOTAL = 1036000  # 10월과 비교할 전월 지출 (전월 대비 +83,000원)


class Seeder:
    def __init__(self, database: Mongo_Database, uid: str) -> None:
        self.__database = database
        self.__uid = uid
        # 같은 날짜 안의 순서를 정하려고 저장 시각을 1초씩 늘린다.
        self.__time = datetime(2026, 9, 1, tzinfo=timezone.utc)

    def add(self, day, type_, amount, category, title, merchant=None, receipt_id=None) -> None:
        self.__time += timedelta(seconds=1)
        transaction = Transaction(transaction_id=uuid.uuid4().hex, uid=self.__uid, type=type_, amount=amount,
                                  category=category, title=title, merchant=merchant, memo="", occurred_on=day,
                                  receipt_id=receipt_id, created_at=self.__time, updated_at=self.__time)
        self.__database.add_new_data(target="transactions", new_data=transaction.get_dict_form_data())


def receipt_image() -> bytes:
    # 영수증 보기(H4)에 쓸 그림. 기본 글꼴에 한글이 없어 영문으로 그린다.
    image = Image.new("RGB", (600, 820), "white")
    draw = ImageDraw.Draw(image)
    lines = ["HANBIT MART", "2026-11-02 14:21", "", "MILK 1L            2,800", "KIMBAP x2          3,000",
             "WET TISSUE         2,500", "SHAMPOO 400ML      6,900", "DISCOUNT          -1,000", "",
             "TOTAL             14,200"]
    for index, line in enumerate(lines):
        draw.text((60, 60 + index * 60), line, fill="black", font_size=30)
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=85)
    return output.getvalue()


def seed(database: Mongo_Database) -> bool:
    if database.get_data_with_key(target="users", key="email", key_data=DEMO_EMAIL):
        return False

    uid = uuid.uuid4().hex
    user = User(uid=uid, email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), nickname=DEMO_NICKNAME,
                created_at=datetime.now(timezone.utc))
    database.add_new_data(target="users", new_data=user.get_dict_form_data())
    seeder = Seeder(database=database, uid=uid)

    # 9월·10월: 오래된 것부터 넣는다
    seeder.add("2026-09-15", "expense", SEPTEMBER_TOTAL, "생활", "9월 지출")
    for category, total, count, titles in OCTOBER:
        each = total // count
        for index in range(count):
            amount = each if index < count - 1 else total - each * (count - 1)
            seeder.add(f"2026-10-{(index % 31) + 1:02d}", "expense", amount, category, titles[index % len(titles)])

    # 11월 2일 영수증: 이미지와 영수증 문서, 품목 내역
    receipt_id = uuid.uuid4().hex
    image_key = f"receipts/{uid}/{receipt_id}.jpg"
    storage.save(key=image_key, data=receipt_image())
    receipt = Receipt(receipt_id=receipt_id, uid=uid, image_key=image_key, status="confirmed", merchant=MERCHANT,
                      purchased_on="2026-11-02", total_amount=14200,
                      parsed_json=json.dumps(receipt_result(shampoo_amount=6900), ensure_ascii=False),
                      confidence="high", created_at=datetime.now(timezone.utc))
    database.add_new_data(target="receipts", new_data=receipt.get_dict_form_data())

    # 11월: 화면 아래쪽부터 넣어야 같은 날짜 안에서 위에 있는 것이 더 최근이 된다
    for day, type_, amount, category, title, from_receipt in reversed(NOVEMBER):
        seeder.add(day, type_, amount, category, title,
                   merchant=MERCHANT if from_receipt else None, receipt_id=receipt_id if from_receipt else None)
    return True


if __name__ == "__main__":
    database = Mongo_Database(uri=config.MONGODB_URI, db_name=config.MONGODB_DB)
    database.make_indexes()
    if seed(database):
        print(f"데모 데이터를 넣었습니다: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    else:
        print("데모 계정이 이미 있어 건너뜁니다.")

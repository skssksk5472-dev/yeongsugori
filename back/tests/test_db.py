# MongoDB 연결 확인 — 먼저 docker compose up -d mongo 로 DB를 띄운다.

from models import Mongo_Database
from others import config


def test_db_ping():
    database = Mongo_Database(uri=config.MONGODB_URI, db_name=config.MONGODB_DB)
    assert database.ping()

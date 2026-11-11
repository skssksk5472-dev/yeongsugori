# 서버 상태 확인, 카테고리 목록 — 모델을 만들고 필요한 동작을 시킨 뒤 돌려준다.

from models import Mongo_Database, HealthModel, CategoryModel


class Core_Controller:
    # 서버와 DB 상태 확인
    def get_health(self, database: Mongo_Database) -> HealthModel:
        model = HealthModel(database=database)
        model.check_health()
        return model

    # 지출·수입 카테고리 목록
    def get_categories(self, database: Mongo_Database) -> CategoryModel:
        model = CategoryModel(database=database)
        model.set_categories()
        return model

# 분석 — 로그인한 사용자를 넣은 모델을 만들고 월별 카테고리 통계를 계산시킨다.

from models import Mongo_Database, StatsModel
from utils import RequestManager


class Stats_Controller:
    def get_category_stats(self, database: Mongo_Database, request: RequestManager) -> StatsModel:
        model = StatsModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.get_category_stats(month=request.data_payload.month)
        return model

# 서버 상태 확인, 카테고리 목록 모델 (로그인 불필요)

from pymongo.errors import PyMongoError

from models.base_model import BaseModel
from others.constants import EXPENSE_CATEGORIES, INCOME_CATEGORIES


class HealthModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__status = ""

    # 서버가 DB까지 연결되어 있는지 확인한다.
    def check_health(self) -> None:
        try:
            self._database.ping()
        except PyMongoError:
            self.__status = "db_error"
            self.set_fail(error_code="server", detail="DB에 연결하지 못했습니다")
            return
        self.__status = "ok"
        self.set_success()

    def get_body_data(self) -> dict:
        return {"status": self.__status}


class CategoryModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__expense = []
        self.__income = []

    def set_categories(self) -> None:
        self.__expense = EXPENSE_CATEGORIES
        self.__income = INCOME_CATEGORIES
        self.set_success()

    def get_body_data(self) -> dict:
        return {"expense": self.__expense, "income": self.__income}

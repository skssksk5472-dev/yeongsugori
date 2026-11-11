# 설정 — 로그인한 사용자를 넣은 모델을 만들고 닉네임·비밀번호 변경, 탈퇴를 시킨다.

from models import Mongo_Database, UserModel
from utils import RequestManager


class User_Controller:
    def try_change_nickname(self, database: Mongo_Database, request: RequestManager) -> UserModel:
        model = UserModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.change_nickname(nickname=request.data_payload.nickname)
        return model

    def try_change_password(self, database: Mongo_Database, request: RequestManager) -> UserModel:
        model = UserModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.change_password(current_password=request.data_payload.current_password,
                              new_password=request.data_payload.new_password)
        return model

    def try_withdraw(self, database: Mongo_Database, request: RequestManager) -> UserModel:
        model = UserModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.withdraw(password=request.data_payload.password)
        return model

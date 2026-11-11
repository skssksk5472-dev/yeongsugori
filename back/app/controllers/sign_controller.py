# 회원가입·로그인·로그아웃·내 정보 (auth 모듈) — 모델을 만들고 필요한 동작을 시킨 뒤 돌려준다.

from models import Mongo_Database, SignModel
from utils import RequestManager


class Sign_Controller:
    def try_signup(self, database: Mongo_Database, request: RequestManager) -> SignModel:
        model = SignModel(database=database)
        model.try_signup(email=request.data_payload.email,
                         nickname=request.data_payload.nickname,
                         password=request.data_payload.password)
        return model

    def try_login(self, database: Mongo_Database, request: RequestManager) -> SignModel:
        model = SignModel(database=database)
        model.try_login(email=request.data_payload.email,
                        password=request.data_payload.password)
        return model

    def try_logout(self, database: Mongo_Database) -> SignModel:
        model = SignModel(database=database)
        model.try_logout()
        return model

    # 토큰의 uid로 내 정보를 찾는다. 탈퇴한 사용자면 모델이 unauthorized 로 실패한다.
    def get_me(self, database: Mongo_Database, request: RequestManager) -> SignModel:
        model = SignModel(database=database)
        model.try_get_me(uid=request.jwt_payload)
        return model

# 가계부 내역 — 로그인한 사용자를 넣은 모델을 만들고 필요한 동작을 시킨 뒤 돌려준다.

from models import Mongo_Database, TransactionModel
from utils import RequestManager


class Transaction_Controller:
    def get_month_list(self, database: Mongo_Database, request: RequestManager) -> TransactionModel:
        model = TransactionModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.get_month_list(month=request.data_payload.month,
                             type=request.data_payload.type,
                             category=request.data_payload.category)
        return model

    def get_transaction(self, database: Mongo_Database, request: RequestManager) -> TransactionModel:
        model = TransactionModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.get_transaction(transaction_id=request.data_payload.transaction_id)
        return model

    def try_create_transaction(self, database: Mongo_Database, request: RequestManager) -> TransactionModel:
        model = TransactionModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        data = request.data_payload
        model.create_transaction(type=data.type, amount=data.amount, category=data.category,
                                 title=data.title, memo=data.memo, occurred_on=data.occurred_on)
        return model

    def try_edit_transaction(self, database: Mongo_Database, request: RequestManager) -> TransactionModel:
        model = TransactionModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        data = request.data_payload
        model.edit_transaction(transaction_id=data.transaction_id, type=data.type, amount=data.amount,
                               category=data.category, title=data.title, memo=data.memo,
                               occurred_on=data.occurred_on)
        return model

    def try_delete_transaction(self, database: Mongo_Database, request: RequestManager) -> TransactionModel:
        model = TransactionModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.delete_transaction(transaction_id=request.data_payload.transaction_id)
        return model

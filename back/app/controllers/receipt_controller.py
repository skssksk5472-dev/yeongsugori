# 영수증 — 로그인한 사용자를 넣은 모델을 만들고 업로드·분석, 결과 조회, 이미지, 일괄 저장을 시킨다.

from models import Mongo_Database, ReceiptModel
from utils import RequestManager


class Receipt_Controller:
    def try_upload_receipt(self, database: Mongo_Database, request: RequestManager) -> ReceiptModel:
        model = ReceiptModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.upload_receipt(image=request.data_payload.image)
        return model

    def get_receipt(self, database: Mongo_Database, request: RequestManager) -> ReceiptModel:
        model = ReceiptModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.get_receipt(receipt_id=request.data_payload.receipt_id)
        return model

    def get_receipt_image(self, database: Mongo_Database, request: RequestManager) -> ReceiptModel:
        model = ReceiptModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        model.load_receipt_image(receipt_id=request.data_payload.receipt_id)
        return model

    def try_confirm_receipt(self, database: Mongo_Database, request: RequestManager) -> ReceiptModel:
        model = ReceiptModel(database=database)
        if not model.set_user_with_uid(uid=request.jwt_payload):
            return model

        data = request.data_payload
        model.confirm_receipt(receipt_id=data.receipt_id, merchant=data.merchant,
                              occurred_on=data.occurred_on, items=data.items)
        return model

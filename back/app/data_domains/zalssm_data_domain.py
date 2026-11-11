# 잘씀 데이터 도메인 — users, transactions, receipts 컬렉션의 문서 모양 (04 문서).

from datetime import datetime

from data_domains.base_domain import BaseDomain


class User(BaseDomain):
    def __init__(self, uid="", email="", password_hash="", nickname="", created_at=None):
        self.uid = uid
        self.email = email                  # 소문자로 저장한다
        self.password_hash = password_hash  # bcrypt 해시
        self.nickname = nickname
        self.created_at: datetime = created_at

    def get_id(self):
        return self.uid

    def make_with_dict(self, dict_data: dict):
        self.uid = dict_data.get("uid", "")
        self.email = dict_data.get("email", "")
        self.password_hash = dict_data.get("password_hash", "")
        self.nickname = dict_data.get("nickname", "")
        self.created_at = dict_data.get("created_at", None)
        return self

    def get_dict_form_data(self):
        return {
            "uid": self.uid,
            "email": self.email,
            "password_hash": self.password_hash,
            "nickname": self.nickname,
            "created_at": self.created_at,
        }

    # 응답에 쓰는 사용자 정보 (비밀번호 해시는 내보내지 않는다)
    def get_dict_form_data_without_password(self):
        return {
            "uid": self.uid,
            "email": self.email,
            "nickname": self.nickname,
        }


class Transaction(BaseDomain):
    def __init__(self, transaction_id="", uid="", type="expense", amount=0, category="", title="",
                 merchant=None, memo="", occurred_on="", receipt_id=None, created_at=None, updated_at=None):
        self.transaction_id = transaction_id
        self.uid = uid
        self.type = type                # expense | income
        self.amount = amount            # 원 단위. 영수증 할인 품목만 음수
        self.category = category
        self.title = title
        self.merchant = merchant        # 영수증 내역만
        self.memo = memo
        self.occurred_on = occurred_on  # "YYYY-MM-DD"
        self.receipt_id = receipt_id    # 영수증 연결 내역만
        self.created_at: datetime = created_at
        self.updated_at: datetime = updated_at

    def get_id(self):
        return self.transaction_id

    def make_with_dict(self, dict_data: dict):
        self.transaction_id = dict_data.get("transaction_id", "")
        self.uid = dict_data.get("uid", "")
        self.type = dict_data.get("type", "expense")
        self.amount = dict_data.get("amount", 0)
        self.category = dict_data.get("category", "")
        self.title = dict_data.get("title", "")
        self.merchant = dict_data.get("merchant", None)
        self.memo = dict_data.get("memo", "")
        self.occurred_on = dict_data.get("occurred_on", "")
        self.receipt_id = dict_data.get("receipt_id", None)
        self.created_at = dict_data.get("created_at", None)
        self.updated_at = dict_data.get("updated_at", None)
        return self

    def get_dict_form_data(self):
        return {
            "transaction_id": self.transaction_id,
            "uid": self.uid,
            "type": self.type,
            "amount": self.amount,
            "category": self.category,
            "title": self.title,
            "merchant": self.merchant,
            "memo": self.memo,
            "occurred_on": self.occurred_on,
            "receipt_id": self.receipt_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    # 응답에 쓰는 내역 (소유자 uid와 저장 시각은 내보내지 않는다)
    def get_dict_form_data_for_response(self):
        return {
            "transaction_id": self.transaction_id,
            "type": self.type,
            "amount": self.amount,
            "category": self.category,
            "title": self.title,
            "merchant": self.merchant,
            "memo": self.memo,
            "occurred_on": self.occurred_on,
            "receipt_id": self.receipt_id,
        }


class Receipt(BaseDomain):
    def __init__(self, receipt_id="", uid="", image_key="", status="analyzed", merchant=None,
                 purchased_on=None, total_amount=None, parsed_json="", confidence="", created_at=None):
        self.receipt_id = receipt_id
        self.uid = uid
        self.image_key = image_key        # 저장소 키 (예: receipts/{uid}/{uuid}.jpg)
        self.status = status              # analyzed | confirmed
        self.merchant = merchant
        self.purchased_on = purchased_on  # "YYYY-MM-DD"
        self.total_amount = total_amount  # 영수증에 적힌 최종 결제액
        self.parsed_json = parsed_json    # 모델이 돌려준 JSON 원문. 객체가 아니라 문자열로 둔다
        self.confidence = confidence      # high | medium | low
        self.created_at: datetime = created_at

    def get_id(self):
        return self.receipt_id

    def make_with_dict(self, dict_data: dict):
        self.receipt_id = dict_data.get("receipt_id", "")
        self.uid = dict_data.get("uid", "")
        self.image_key = dict_data.get("image_key", "")
        self.status = dict_data.get("status", "analyzed")
        self.merchant = dict_data.get("merchant", None)
        self.purchased_on = dict_data.get("purchased_on", None)
        self.total_amount = dict_data.get("total_amount", None)
        self.parsed_json = dict_data.get("parsed_json", "")
        self.confidence = dict_data.get("confidence", "")
        self.created_at = dict_data.get("created_at", None)
        return self

    def get_dict_form_data(self):
        return {
            "receipt_id": self.receipt_id,
            "uid": self.uid,
            "image_key": self.image_key,
            "status": self.status,
            "merchant": self.merchant,
            "purchased_on": self.purchased_on,
            "total_amount": self.total_amount,
            "parsed_json": self.parsed_json,
            "confidence": self.confidence,
            "created_at": self.created_at,
        }

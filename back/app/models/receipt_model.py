# 영수증 모델 — 업로드 이미지를 확인·저장하고 분석한 뒤, 사용자가 고친 품목을 내역으로 한 번에 저장한다 (05 문서).

import json
import uuid
from datetime import datetime, timedelta, timezone

from data_domains.zalssm_data_domain import Receipt, Transaction
from models.base_model import BaseModel
from others import config
from others.constants import EXPENSE_CATEGORIES
from services.ocr.client import analyze_receipt
from services.ocr.errors import OcrError
from services.ocr.postprocess import MAX_ITEMS, MAX_NAME, postprocess
from storage import storage
from utils.date_util import is_valid_day
from utils.image_util import detect_image_type, preprocess_image

MAX_AMOUNT = 999_999_999
# 저장하지 않고 둔 분석 결과는 이 시간이 지나면 이미지와 함께 지운다.
KEEP_ANALYZED_HOURS = 24


class ReceiptModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__body = {}
        self.__image = b""

    # 촬영한 사진 → 확인 → 전처리 → 저장 → 분석 → 후처리 → 영수증 문서 (05 문서 1절)
    def upload_receipt(self, image: bytes) -> None:
        if not self.__check_upload(image):
            return
        jpeg = preprocess_image(image)
        if jpeg is None:
            self.set_fail(error_code="unsupported_media", detail="지원하지 않는 이미지 형식입니다")
            return

        self.__delete_old_receipts()
        receipt_id = uuid.uuid4().hex
        image_key = f"receipts/{self._user.uid}/{receipt_id}.jpg"
        storage.save(key=image_key, data=jpeg)

        try:
            raw = analyze_receipt(jpeg)
            result = postprocess(raw)
        except OcrError as error:
            # 실패하면 이미지도 레코드도 남기지 않는다.
            storage.delete(key=image_key)
            self.set_fail(error_code=error.code, detail=error.detail)
            return

        receipt = Receipt(receipt_id=receipt_id, uid=self._user.uid, image_key=image_key, status="analyzed",
                          merchant=result["merchant"], purchased_on=result["purchased_on"],
                          total_amount=result["total_amount"], parsed_json=json.dumps(raw, ensure_ascii=False),
                          confidence=result["confidence"], created_at=datetime.now(timezone.utc))
        self._database.add_new_data(target="receipts", new_data=receipt.get_dict_form_data())
        self.__body = {"receipt": {"receipt_id": receipt_id, "status": "analyzed", **result}}
        self.set_success()

    # 분석 결과 다시 보기. 품목은 저장해 둔 모델 원문을 다시 후처리해서 만든다.
    def get_receipt(self, receipt_id: str) -> None:
        receipt = self.__find_my_receipt(receipt_id=receipt_id)
        if receipt is None:
            return
        if receipt.status == "confirmed":
            result = {"merchant": receipt.merchant, "purchased_on": receipt.purchased_on, "total_amount": receipt.total_amount,
                      "items": [], "items_sum": 0, "mismatch": False, "confidence": receipt.confidence}
        else:
            result = postprocess(json.loads(receipt.parsed_json))
        self.__body = {"receipt": {"receipt_id": receipt.receipt_id, "status": receipt.status, **result}}
        self.set_success()

    def load_receipt_image(self, receipt_id: str) -> None:
        receipt = self.__find_my_receipt(receipt_id=receipt_id)
        if receipt is None:
            return
        try:
            self.__image = storage.read(key=receipt.image_key)
        except FileNotFoundError:
            self.set_fail(error_code="not_found", detail="영수증을 찾을 수 없습니다")
            return
        self.set_success()

    def get_image(self) -> bytes:
        return self.__image

    # 사용자가 고친 품목을 내역으로 한 번에 저장한다. 검사를 모두 통과해야 저장을 시작한다.
    def confirm_receipt(self, receipt_id: str, merchant: str, occurred_on: str, items: list) -> None:
        receipt = self.__find_my_receipt(receipt_id=receipt_id)
        if receipt is None:
            return
        if receipt.status == "confirmed":
            self.set_fail(error_code="bad_request", detail="이미 저장된 영수증입니다")
            return

        fields = self.__check_confirm_input(occurred_on=occurred_on, items=items)
        if fields:
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields=fields)
            return

        now = datetime.now(timezone.utc)
        merchant = merchant.strip() or None
        transactions = [
            Transaction(transaction_id=uuid.uuid4().hex, uid=self._user.uid, type="expense", amount=item["amount"],
                        category=item["category"], title=str(item["name"]).strip(), merchant=merchant, memo="",
                        occurred_on=occurred_on, receipt_id=receipt_id, created_at=now, updated_at=now).get_dict_form_data()
            for item in items
        ]
        self._database.add_many_data(target="transactions", new_data_list=transactions)
        self._database.modify_data_with_query(target="receipts", query={"receipt_id": receipt_id},
                                              new_data={"status": "confirmed", "merchant": merchant, "purchased_on": occurred_on})
        self.__body = {"created": len(transactions), "month": occurred_on[:7]}
        self.set_success()

    def get_body_data(self) -> dict:
        return self.__body

    # 크기 → 형식(매직 바이트) → 시간당 횟수 순서로 확인한다.
    def __check_upload(self, image: bytes) -> bool:
        if len(image) > config.MAX_UPLOAD_MB * 1024 * 1024:
            self.set_fail(error_code="file_too_large", detail=f"이미지 용량이 너무 큽니다 ({config.MAX_UPLOAD_MB}MB 이하)")
            return False
        if detect_image_type(image) is None:
            self.set_fail(error_code="unsupported_media", detail="지원하지 않는 이미지 형식입니다")
            return False
        an_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent = self._database.count_with_query(target="receipts",
                                                 query={"uid": self._user.uid, "created_at": {"$gte": an_hour_ago}})
        if recent >= config.SCAN_LIMIT_PER_HOUR:
            self.set_fail(error_code="rate_limited", detail="요청이 많습니다. 잠시 후 다시 시도하세요")
            return False
        return True

    # 저장하지 않고 24시간이 지난 분석 결과를 이미지와 함께 지운다 (04 문서 3절)
    def __delete_old_receipts(self) -> None:
        old_time = datetime.now(timezone.utc) - timedelta(hours=KEEP_ANALYZED_HOURS)
        query = {"uid": self._user.uid, "status": "analyzed", "created_at": {"$lt": old_time}}
        for row in self._database.get_list_with_query(target="receipts", query=query, sort=[("created_at", 1)]):
            storage.delete(key=row["image_key"])
            self._database.delete_data_with_query(target="receipts", query={"receipt_id": row["receipt_id"]})

    # 내 영수증 하나. 없거나 다른 사람 것이면 not_found 로 실패하고 None
    def __find_my_receipt(self, receipt_id: str):
        row = self._database.get_data_with_query(target="receipts", query={"receipt_id": receipt_id, "uid": self._user.uid})
        if row is None:
            self.set_fail(error_code="not_found", detail="영수증을 찾을 수 없습니다")
            return None
        return Receipt().make_with_dict(row)

    # 품목 1~60개, 이름 1~40자, 금액은 0이 아닌 정수(할인은 음수), 지출 카테고리, 합계는 0 이상 (03 문서 6절)
    def __check_confirm_input(self, occurred_on: str, items: list) -> dict:
        fields = {}
        if not is_valid_day(occurred_on):
            fields["occurred_on"] = "날짜를 확인하세요"
        if not isinstance(items, list) or not 1 <= len(items) <= MAX_ITEMS:
            fields["items"] = "품목을 확인하세요"
            return fields
        for item in items:
            if not isinstance(item, dict):
                fields["items"] = "품목을 확인하세요"
                return fields
            name = str(item.get("name", "")).strip()
            amount = item.get("amount")
            if not 1 <= len(name) <= MAX_NAME:
                fields["name"] = "품목명을 입력하세요"
            if not isinstance(amount, int) or isinstance(amount, bool) or amount == 0 or abs(amount) > MAX_AMOUNT:
                fields["amount"] = "금액을 입력하세요"
            if item.get("category") not in EXPENSE_CATEGORIES:
                fields["category"] = "카테고리를 선택하세요"
        if "amount" not in fields and sum(item["amount"] for item in items) < 0:
            fields["amount"] = "금액을 확인하세요"
        return fields

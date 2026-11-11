# 가계부 내역 모델 — 월별 목록·요약, 한 건 조회·생성·수정·삭제. 내 내역만 다룬다(다른 사람 것은 not_found).

import uuid
from datetime import datetime, timezone

from data_domains.zalssm_data_domain import Transaction
from models.base_model import BaseModel
from others.constants import EXPENSE_CATEGORIES, INCOME_CATEGORIES
from utils.date_util import is_valid_day, is_valid_month, month_range

MAX_AMOUNT = 999_999_999
TYPES = ["expense", "income"]


class TransactionModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__body = {}

    # 월별 목록. summary 는 필터와 상관없는 월 전체 합계, 필터(type, category)는 items 에만 적용한다.
    def get_month_list(self, month: str, type: str, category: str) -> None:
        if not is_valid_month(month):
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields={"month": "월을 확인하세요"})
            return
        if type and type not in TYPES:
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields={"type": "지출 또는 수입을 선택하세요"})
            return

        start, end = month_range(month)
        query = {"uid": self._user.uid, "occurred_on": {"$gte": start, "$lt": end}}
        if type:
            query["type"] = type
        if category:
            query["category"] = category

        rows = self._database.get_list_with_query(target="transactions", query=query,
                                                  sort=[("occurred_on", -1), ("created_at", -1)])
        items = [Transaction().make_with_dict(row).get_dict_form_data_for_response() for row in rows]
        self.__body = {"month": month, "summary": self.__get_month_summary(start=start, end=end), "items": items}
        self.set_success()

    def get_transaction(self, transaction_id: str) -> None:
        transaction = self.__find_my_transaction(transaction_id=transaction_id)
        if transaction is None:
            return
        self.__body = {"item": transaction.get_dict_form_data_for_response()}
        self.set_success()

    # 직접 입력. 영수증 내역(merchant, receipt_id)은 여기서 만들지 않는다.
    def create_transaction(self, type: str, amount, category: str, title: str, memo: str, occurred_on: str) -> None:
        title, memo = title.strip(), memo.strip()
        fields = self.__check_input(type=type, amount=amount, category=category, title=title, memo=memo,
                                    occurred_on=occurred_on, allow_negative=False)
        if fields:
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields=fields)
            return

        now = datetime.now(timezone.utc)
        transaction = Transaction(transaction_id=uuid.uuid4().hex, uid=self._user.uid, type=type, amount=amount,
                                  category=category, title=title or category, memo=memo,
                                  occurred_on=occurred_on, created_at=now, updated_at=now)
        self._database.add_new_data(target="transactions", new_data=transaction.get_dict_form_data())
        self.__body = {"item": transaction.get_dict_form_data_for_response()}
        self.set_success(detail="저장되었습니다")

    def edit_transaction(self, transaction_id: str, type: str, amount, category: str, title: str, memo: str,
                         occurred_on: str) -> None:
        transaction = self.__find_my_transaction(transaction_id=transaction_id)
        if transaction is None:
            return

        # 영수증으로 만든 내역은 지출로만 남는다. 할인 품목처럼 음수 금액도 그대로 둘 수 있다.
        is_receipt = transaction.receipt_id is not None
        if is_receipt and type != transaction.type:
            self.set_fail(error_code="bad_request", detail="영수증으로 등록된 내역은 지출·수입을 바꿀 수 없습니다")
            return

        title, memo = title.strip(), memo.strip()
        fields = self.__check_input(type=type, amount=amount, category=category, title=title, memo=memo,
                                    occurred_on=occurred_on, allow_negative=is_receipt)
        if fields:
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields=fields)
            return

        transaction.type = type
        transaction.amount = amount
        transaction.category = category
        transaction.title = title or category
        transaction.memo = memo
        transaction.occurred_on = occurred_on
        transaction.updated_at = datetime.now(timezone.utc)
        self._database.modify_data_with_query(target="transactions",
                                              query={"transaction_id": transaction_id, "uid": self._user.uid},
                                              new_data=transaction.get_dict_form_data())
        self.__body = {"item": transaction.get_dict_form_data_for_response()}
        self.set_success(detail="저장되었습니다")

    def delete_transaction(self, transaction_id: str) -> None:
        deleted = self._database.delete_data_with_query(target="transactions",
                                                        query={"transaction_id": transaction_id, "uid": self._user.uid})
        if not deleted:
            self.set_fail(error_code="not_found", detail="내역을 찾을 수 없습니다")
            return
        self.set_success(detail="삭제되었습니다")

    def get_body_data(self) -> dict:
        return self.__body

    # 내 내역 한 건. 없거나 다른 사람 것이면 not_found 로 실패하고 None
    def __find_my_transaction(self, transaction_id: str):
        row = self._database.get_data_with_query(target="transactions",
                                                 query={"transaction_id": transaction_id, "uid": self._user.uid})
        if row is None:
            self.set_fail(error_code="not_found", detail="내역을 찾을 수 없습니다")
            return None
        return Transaction().make_with_dict(row)

    # 월 전체 지출·수입 합계 (지출 합계에는 할인 같은 음수 금액도 들어간다)
    def __get_month_summary(self, start: str, end: str) -> dict:
        pipeline = [
            {"$match": {"uid": self._user.uid, "occurred_on": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}},
        ]
        totals = {row["_id"]: row["total"] for row in self._database.aggregate(target="transactions", pipeline=pipeline)}
        total_expense = totals.get("expense", 0)
        total_income = totals.get("income", 0)
        return {"total_expense": total_expense, "total_income": total_income, "balance": total_income - total_expense}

    # 02 문서 4절 입력 검증. 틀린 필드만 {필드: 문구} 로 돌려준다.
    def __check_input(self, type, amount, category, title, memo, occurred_on, allow_negative: bool) -> dict:
        fields = {}
        if type not in TYPES:
            fields["type"] = "지출 또는 수입을 선택하세요"
        categories = EXPENSE_CATEGORIES if type == "expense" else INCOME_CATEGORIES
        if category not in categories:
            fields["category"] = "카테고리를 선택하세요"
        if not self.__is_valid_amount(amount=amount, allow_negative=allow_negative):
            fields["amount"] = "금액을 입력하세요"
        if not is_valid_day(occurred_on):
            fields["occurred_on"] = "날짜를 확인하세요"
        if len(title) > 40:
            fields["title"] = "내용은 40자 이내로 입력하세요"
        if len(memo) > 100:
            fields["memo"] = "메모는 100자 이내로 입력하세요"
        return fields

    def __is_valid_amount(self, amount, allow_negative: bool) -> bool:
        # True/False 도 파이썬에서는 int 라서 따로 막는다.
        if not isinstance(amount, int) or isinstance(amount, bool):
            return False
        if allow_negative:
            return amount != 0 and abs(amount) <= MAX_AMOUNT
        return 1 <= amount <= MAX_AMOUNT

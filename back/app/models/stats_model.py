# 분석 모델 — 월별 지출을 카테고리별로 묶고 비율, 전월 대비를 계산한다. 수입은 분석하지 않는다.

import math

from models.base_model import BaseModel
from utils.date_util import is_valid_month, month_range, previous_month


class StatsModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__body = {}

    def get_category_stats(self, month: str) -> None:
        if not is_valid_month(month):
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields={"month": "월을 확인하세요"})
            return

        total_expense = self.__get_total_expense(month=month)
        categories = []
        # 지출 합계가 0 이하이면 비율을 계산할 수 없으므로 빈 목록으로 둔다.
        if total_expense > 0:
            for row in self.__get_category_rows(month=month):
                categories.append({
                    "category": row["_id"],
                    "amount": row["amount"],
                    "count": row["count"],
                    "ratio": self.__round_ratio(amount=row["amount"], total=total_expense),
                })

        self.__body = {
            "month": month,
            "total_expense": total_expense,
            "prev_month_expense": self.__get_total_expense(month=previous_month(month)),
            "categories": categories,
        }
        self.set_success()

    def get_body_data(self) -> dict:
        return self.__body

    def __expense_match(self, month: str) -> dict:
        start, end = month_range(month)
        return {"$match": {"uid": self._user.uid, "type": "expense", "occurred_on": {"$gte": start, "$lt": end}}}

    # 한 달 지출 합계 (할인 같은 음수 금액 포함)
    def __get_total_expense(self, month: str) -> int:
        pipeline = [self.__expense_match(month), {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        rows = self._database.aggregate(target="transactions", pipeline=pipeline)
        return rows[0]["total"] if rows else 0

    # 카테고리별 합계·건수. 0원 이하인 카테고리는 빼고, 금액이 큰 순서로 (04 문서 5절)
    def __get_category_rows(self, month: str) -> list:
        pipeline = [
            self.__expense_match(month),
            {"$group": {"_id": "$category", "amount": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            {"$match": {"amount": {"$gt": 0}}},
            {"$sort": {"amount": -1, "_id": 1}},
        ]
        return self._database.aggregate(target="transactions", pipeline=pipeline)

    # 소수 첫째 자리 반올림. round()는 0.5를 짝수 쪽으로 보내므로 직접 계산한다.
    def __round_ratio(self, amount: int, total: int) -> float:
        return math.floor(amount * 1000 / total + 0.5) / 10

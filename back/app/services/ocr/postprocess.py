# 분석 결과 후처리 — 모델 출력을 그대로 믿지 않고 정리한다. 할인 품목 추가, 합계 비교 (05 문서 4절).

from others.constants import EXPENSE_CATEGORIES
from services.ocr.errors import not_a_receipt, ocr_failed
from utils.date_util import is_valid_day

MAX_ITEMS = 60
MAX_NAME = 40


def _is_int(value) -> bool:
    # True/False 도 파이썬에서는 int 라서 따로 막는다.
    return isinstance(value, int) and not isinstance(value, bool)


def _clean_name(name) -> str:
    return " ".join(str(name).split())[:MAX_NAME]


def _clean_items(raw_items) -> list:
    items = []
    for raw in raw_items[:MAX_ITEMS]:
        if not isinstance(raw, dict) or not _is_int(raw.get("amount")):
            continue  # 금액을 읽지 못한 줄은 버린다
        quantity = raw.get("quantity")
        category = raw.get("category")
        items.append({
            "name": _clean_name(raw.get("name", "")),
            "quantity": quantity if _is_int(quantity) and quantity >= 1 else 1,
            "amount": raw["amount"],
            "category": category if category in EXPENSE_CATEGORIES else "기타",
            "is_discount": False,
        })
    return items


def _discount_item(items: list, discount_total: int) -> dict:
    # 할인은 금액이 가장 큰 품목의 카테고리에서 빠진 것으로 본다.
    biggest = max(items, key=lambda item: item["amount"])
    return {"name": "행사 할인", "quantity": 1, "amount": -discount_total, "category": biggest["category"], "is_discount": True}


# 모델 출력(dict) → 화면에 보낼 분석 결과. 영수증이 아니거나 품목이 없으면 not_a_receipt
def postprocess(raw) -> dict:
    if not isinstance(raw, dict) or not isinstance(raw.get("items"), list):
        raise ocr_failed()
    if raw.get("is_receipt") is not True:
        raise not_a_receipt()

    items = _clean_items(raw["items"])
    if not items:
        raise not_a_receipt()

    discount_total = raw.get("discount_total")
    if _is_int(discount_total) and discount_total > 0:
        items.append(_discount_item(items, discount_total))

    merchant = raw.get("merchant")
    merchant = " ".join(merchant.split()) if isinstance(merchant, str) else ""
    purchased_on = raw.get("purchased_on")
    total_amount = raw.get("total_amount")
    total_amount = total_amount if _is_int(total_amount) else None
    items_sum = sum(item["amount"] for item in items)

    return {
        "merchant": merchant or None,
        "purchased_on": purchased_on if isinstance(purchased_on, str) and is_valid_day(purchased_on) else None,
        "total_amount": total_amount,
        "items": items,
        "items_sum": items_sum,
        "mismatch": total_amount is not None and items_sum != total_amount,
        "confidence": raw.get("confidence") if raw.get("confidence") in ("high", "medium", "low") else "low",
    }

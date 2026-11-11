# 모델 출력 스키마(JSON Schema, strict) — 모델이 반드시 이 모양으로만 답하게 한다 (05 문서 2절).
# 카테고리 목록은 서버 상수에서 가져온다. 문자열을 따로 복사해 두지 않는다.

from others.constants import EXPENSE_CATEGORIES

RECEIPT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["is_receipt", "merchant", "purchased_on", "total_amount", "discount_total", "items", "confidence"],
    "properties": {
        "is_receipt": {"type": "boolean"},
        "merchant": {"type": ["string", "null"]},
        "purchased_on": {"type": ["string", "null"], "description": "YYYY-MM-DD"},
        "total_amount": {"type": ["integer", "null"], "description": "최종 결제 금액(원)"},
        "discount_total": {"type": "integer", "description": "할인 합계(원), 양수, 없으면 0"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["name", "quantity", "amount", "category"],
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "integer"},
                    "amount": {"type": "integer", "description": "수량 x 단가, 원"},
                    "category": {"type": "string", "enum": EXPENSE_CATEGORIES},
                },
            },
        },
    },
}

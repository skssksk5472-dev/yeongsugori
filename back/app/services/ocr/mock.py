# mock 분석 — 이미지를 읽지 않고 시나리오별 고정 결과를 돌려준다. 키 없이 시연·테스트할 때 쓴다 (05 문서 5절).
# 결과 모양은 실제 모델 출력(schema.py)과 같다. 할인 품목은 후처리가 만든다.

import time

from services.ocr.errors import ocr_timeout

# 진행 화면을 볼 수 있도록 잠깐 기다린다. 테스트에서는 0으로 바꾼다.
DELAY_SEC = 1.5
TIMEOUT_DELAY_SEC = 3


def receipt_result(shampoo_amount: int) -> dict:
    return {
        "is_receipt": True,
        "merchant": "한빛마트 경산점",
        "purchased_on": "2026-11-02",
        "total_amount": 14200,
        "discount_total": 1000,
        "confidence": "high",
        "items": [
            {"name": "우유 1L", "quantity": 1, "amount": 2800, "category": "식비"},
            {"name": "삼각김밥 참치마요", "quantity": 2, "amount": 3000, "category": "식비"},
            {"name": "물티슈 80매", "quantity": 1, "amount": 2500, "category": "생활"},
            {"name": "샴푸 400ml", "quantity": 1, "amount": shampoo_amount, "category": "생활"},
        ],
    }


NOT_RECEIPT = {
    "is_receipt": False, "merchant": None, "purchased_on": None, "total_amount": None,
    "discount_total": 0, "confidence": "low", "items": [],
}


def analyze(scenario: str) -> dict:
    if scenario == "timeout":
        time.sleep(TIMEOUT_DELAY_SEC)
        raise ocr_timeout()

    time.sleep(DELAY_SEC)
    if scenario == "not_receipt":
        return NOT_RECEIPT
    if scenario == "mismatch":
        return receipt_result(shampoo_amount=8100)  # 샴푸를 8,100원으로 잘못 읽은 경우 (차액 1,200원)
    return receipt_result(shampoo_amount=6900)

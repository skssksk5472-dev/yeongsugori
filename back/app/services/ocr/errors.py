# 영수증 분석 실패 — code 는 API의 error_code 와 같다 (not_a_receipt, ocr_failed, ocr_timeout).


class OcrError(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


def not_a_receipt() -> OcrError:
    return OcrError("not_a_receipt", "영수증을 인식하지 못했습니다")


def ocr_failed() -> OcrError:
    return OcrError("ocr_failed", "영수증을 인식하지 못했습니다")


def ocr_timeout() -> OcrError:
    return OcrError("ocr_timeout", "분석 시간이 초과되었습니다")

# 영수증 API — mock 시나리오 4종, 업로드 확인(크기·형식·횟수), 후처리, 일괄 저장, 이미지, 탈퇴 시 삭제

import io
from pathlib import Path

import pytest
from PIL import Image

from others import config
from services.ocr import mock
from services.ocr.errors import OcrError
from services.ocr.postprocess import postprocess
from tests.conftest import PASSWORD, get_test_db, post


@pytest.fixture(autouse=True)
def fast_mock(monkeypatch):
    # 진행 화면용 지연을 없애고, 시나리오는 테스트마다 정한다.
    monkeypatch.setattr(mock, "DELAY_SEC", 0)
    monkeypatch.setattr(mock, "TIMEOUT_DELAY_SEC", 0)
    monkeypatch.setattr(config, "OCR_MODE", "mock")
    monkeypatch.setattr(config, "OCR_MOCK_SCENARIO", "ok")


def make_jpeg(width=2400, height=1200, with_exif=True) -> bytes:
    image = Image.new("RGB", (width, height), "white")
    output = io.BytesIO()
    exif = Image.Exif()
    if with_exif:
        exif[0x0110] = "Test Camera"  # 카메라 모델 (지워져야 하는 정보)
    image.save(output, format="JPEG", exif=exif)
    return output.getvalue()


def upload(client, data=None, filename="receipt.jpg"):
    files = {"image": (filename, data if data is not None else make_jpeg(), "image/jpeg")}
    return client.post("/api/receipt/upload_receipt", files=files).json()["body"]


def get_receipt(client, receipt_id):
    return client.get("/api/receipt/get_receipt", params={"receipt_id": receipt_id}).json()["body"]


def confirm_body(receipt, **changes):
    body = {
        "receipt_id": receipt["receipt_id"], "merchant": receipt["merchant"], "occurred_on": receipt["purchased_on"],
        "items": [{"name": item["name"], "amount": item["amount"], "category": item["category"]} for item in receipt["items"]],
    }
    body.update(changes)
    return body


def test_upload_ok(user_client):
    body = upload(user_client)
    assert body["result"] is True
    receipt = body["receipt"]
    assert receipt["merchant"] == "한빛마트 경산점"
    assert receipt["purchased_on"] == "2026-11-02"
    assert [item["amount"] for item in receipt["items"]] == [2800, 3000, 2500, 6900, -1000]
    # 할인 품목은 끝에, 금액이 가장 큰 품목(샴푸, 생활)의 카테고리로 붙는다
    assert receipt["items"][-1] == {"name": "행사 할인", "quantity": 1, "amount": -1000, "category": "생활", "is_discount": True}
    assert receipt["items"][1]["quantity"] == 2
    assert receipt["items_sum"] == 14200
    assert receipt["mismatch"] is False


def test_saved_image_is_small_jpeg_without_exif(user_client):
    receipt = upload(user_client)["receipt"]
    saved = get_test_db()["receipts"].find_one({"receipt_id": receipt["receipt_id"]})
    path = Path(config.UPLOAD_DIR) / saved["image_key"]
    image = Image.open(path)
    assert image.format == "JPEG"
    assert max(image.size) == 1600  # 긴 변 1600px로 축소
    assert len(image.getexif()) == 0  # EXIF 제거


def test_upload_mismatch(user_client, monkeypatch):
    monkeypatch.setattr(config, "OCR_MOCK_SCENARIO", "mismatch")
    receipt = upload(user_client)["receipt"]
    assert receipt["items_sum"] == 15400
    assert receipt["total_amount"] == 14200
    assert receipt["mismatch"] is True


@pytest.mark.parametrize("scenario, code", [("not_receipt", "not_a_receipt"), ("timeout", "ocr_timeout")])
def test_upload_failure_leaves_nothing(user_client, monkeypatch, scenario, code):
    before = set(Path(config.UPLOAD_DIR).rglob("*.jpg"))
    monkeypatch.setattr(config, "OCR_MOCK_SCENARIO", scenario)
    body = upload(user_client)
    assert body["error_code"] == code
    assert get_test_db()["receipts"].count_documents({}) == 0
    assert set(Path(config.UPLOAD_DIR).rglob("*.jpg")) == before  # 저장했던 이미지도 지운다


def test_upload_checks(user_client, monkeypatch):
    assert upload(user_client, data=b"%PDF-1.4 not an image", filename="a.pdf")["error_code"] == "unsupported_media"
    assert upload(user_client, data=b"")["error_code"] == "unsupported_media"

    monkeypatch.setattr(config, "MAX_UPLOAD_MB", 0)
    assert upload(user_client)["error_code"] == "file_too_large"


def test_rate_limit(user_client, monkeypatch):
    monkeypatch.setattr(config, "SCAN_LIMIT_PER_HOUR", 2)
    assert upload(user_client)["result"] is True
    assert upload(user_client)["result"] is True
    assert upload(user_client)["error_code"] == "rate_limited"


def test_get_receipt_again(user_client):
    receipt = upload(user_client)["receipt"]
    again = get_receipt(user_client, receipt["receipt_id"])["receipt"]
    assert again == receipt


def test_confirm_creates_transactions(user_client):
    receipt = upload(user_client)["receipt"]
    body = post(user_client, "/receipt/confirm_receipt", confirm_body(receipt)).json()["body"]
    assert body == {"result": True, "detail": "", "created": 5, "month": "2026-11"}

    saved = list(get_test_db()["transactions"].find({}, {"_id": 0}).sort("amount", 1))
    assert len(saved) == 5
    assert saved[0]["amount"] == -1000
    assert all(row["receipt_id"] == receipt["receipt_id"] and row["merchant"] == "한빛마트 경산점" for row in saved)

    # 저장한 뒤에는 결과 화면의 품목이 비고, 다시 저장할 수 없다
    assert get_receipt(user_client, receipt["receipt_id"])["receipt"]["items"] == []
    again = post(user_client, "/receipt/confirm_receipt", confirm_body(receipt)).json()["body"]
    assert again["error_code"] == "bad_request"
    assert get_test_db()["transactions"].count_documents({}) == 5


def test_confirm_with_edits(user_client):
    receipt = upload(user_client)["receipt"]
    items = [{"name": "우유 1L", "amount": 2800, "category": "식비"}, {"name": "새 품목", "amount": 1500, "category": "기타"}]
    body = post(user_client, "/receipt/confirm_receipt", confirm_body(receipt, merchant="", occurred_on="2026-10-31", items=items)).json()["body"]
    assert body["created"] == 2
    assert body["month"] == "2026-10"
    saved = get_test_db()["transactions"].find_one({"title": "새 품목"})
    assert saved["merchant"] is None
    assert saved["occurred_on"] == "2026-10-31"


def test_confirm_validation_saves_nothing(user_client):
    receipt = upload(user_client)["receipt"]
    cases = [
        ([], "items"),
        ([{"name": "", "amount": 1000, "category": "식비"}], "name"),
        ([{"name": "우유", "amount": 0, "category": "식비"}], "amount"),
        ([{"name": "우유", "amount": 1000, "category": "급여"}], "category"),
        ([{"name": "우유", "amount": 1000, "category": "식비"}, {"name": "할인", "amount": -2000, "category": "식비"}], "amount"),
    ]
    for items, field in cases:
        body = post(user_client, "/receipt/confirm_receipt", confirm_body(receipt, items=items)).json()["body"]
        assert body["error_code"] == "validation"
        assert field in body["fields"]
    assert get_test_db()["transactions"].count_documents({}) == 0


def test_image_only_for_owner(user_client, other_client):
    receipt = upload(user_client)["receipt"]
    mine = user_client.get("/api/receipt/get_receipt_image", params={"receipt_id": receipt["receipt_id"]})
    assert mine.headers["content-type"] == "image/jpeg"
    assert mine.content.startswith(b"\xff\xd8\xff")

    theirs = other_client.get("/api/receipt/get_receipt_image", params={"receipt_id": receipt["receipt_id"]})
    assert theirs.json()["body"]["error_code"] == "not_found"
    assert get_receipt(other_client, receipt["receipt_id"])["error_code"] == "not_found"


def test_withdraw_deletes_images(user_client):
    receipt = upload(user_client)["receipt"]
    saved = get_test_db()["receipts"].find_one({"receipt_id": receipt["receipt_id"]})
    path = Path(config.UPLOAD_DIR) / saved["image_key"]
    assert path.exists()
    post(user_client, "/user/withdraw", {"password": PASSWORD})
    assert not path.exists()


def test_login_required(client):
    assert client.post("/api/receipt/upload_receipt", files={"image": ("a.jpg", make_jpeg(), "image/jpeg")}).status_code == 401


# ── 후처리 단위 테스트 (05 문서 4절) ──

def raw_receipt(**changes):
    raw = {"is_receipt": True, "merchant": "  한빛마트   경산점 ", "purchased_on": "2026-11-02", "total_amount": 3000,
           "discount_total": 0, "confidence": "high",
           "items": [{"name": "우유", "quantity": 1, "amount": 3000, "category": "식비"}]}
    raw.update(changes)
    return raw


def test_postprocess_cleans_values():
    result = postprocess(raw_receipt(items=[
        {"name": "  긴   이름 " + "가" * 50, "quantity": 0, "amount": 1000, "category": "없는카테고리"},
        {"name": "금액 없음", "quantity": 1, "amount": "1,000", "category": "식비"},
        {"name": "참 거짓", "quantity": 1, "amount": True, "category": "식비"},
    ]))
    assert result["merchant"] == "한빛마트 경산점"
    assert len(result["items"]) == 1  # 금액이 정수가 아닌 줄은 버린다
    item = result["items"][0]
    assert item["name"].startswith("긴 이름 ") and len(item["name"]) == 40
    assert item["quantity"] == 1
    assert item["category"] == "기타"


def test_postprocess_dates_and_mismatch():
    assert postprocess(raw_receipt(purchased_on="2999-01-01"))["purchased_on"] is None
    assert postprocess(raw_receipt(purchased_on="26.11.02"))["purchased_on"] is None
    assert postprocess(raw_receipt(total_amount=None))["mismatch"] is False
    assert postprocess(raw_receipt(total_amount=5000))["mismatch"] is True


@pytest.mark.parametrize("raw", [raw_receipt(is_receipt=False), raw_receipt(items=[])])
def test_postprocess_not_a_receipt(raw):
    with pytest.raises(OcrError) as error:
        postprocess(raw)
    assert error.value.code == "not_a_receipt"


def test_postprocess_broken_output():
    with pytest.raises(OcrError) as error:
        postprocess("not json object")
    assert error.value.code == "ocr_failed"

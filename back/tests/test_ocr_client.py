# OpenAI 호출(client.py) — 실제 네트워크 대신 가짜 응답으로 확인한다. 실제 호출은 맨 아래 live 테스트 (키가 있을 때만)

import io
import json
import os

import httpx
import pytest
from PIL import Image, ImageDraw

from others import config
from services.ocr import client
from services.ocr.errors import OcrError
from services.ocr.postprocess import postprocess

GOOD = {
    "is_receipt": True, "merchant": "한빛마트", "purchased_on": "2026-11-02", "total_amount": 2800,
    "discount_total": 0, "confidence": "high",
    "items": [{"name": "우유 1L", "quantity": 1, "amount": 2800, "category": "식비"}],
}


def openai_response(text: str, status: int = 200) -> httpx.Response:
    body = {"output": [{"type": "message", "content": [{"type": "output_text", "text": text}]}]}
    return httpx.Response(status, json=body)


@pytest.fixture
def openai_mode(monkeypatch):
    monkeypatch.setattr(config, "OCR_MODE", "openai")
    monkeypatch.setattr(config, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(config, "OPENAI_MODEL", "test-model")
    monkeypatch.setattr(config, "OCR_TIMEOUT_SEC", 30)


def fake_post(monkeypatch, *responses):
    # 부를 때마다 responses 를 하나씩 돌려준다. 예외면 그 예외를 던진다.
    calls = []

    def post(url, json, timeout, headers):
        calls.append({"url": url, "json": json, "timeout": timeout, "headers": headers})
        result = responses[len(calls) - 1]
        if isinstance(result, Exception):
            raise result
        return result

    monkeypatch.setattr(client.httpx, "post", post)
    return calls


def test_request_shape(openai_mode, monkeypatch):
    calls = fake_post(monkeypatch, openai_response(json.dumps(GOOD)))
    assert client.analyze_receipt(b"\xff\xd8\xffjpeg") == GOOD

    request = calls[0]
    assert request["url"] == "https://api.openai.com/v1/responses"
    assert request["headers"]["Authorization"] == "Bearer test-key"
    body = request["json"]
    assert body["model"] == "test-model"
    assert body["text"]["format"]["strict"] is True
    assert body["text"]["format"]["schema"]["properties"]["items"]["items"]["properties"]["category"]["enum"][0] == "식비"
    image_part = body["input"][1]["content"][1]
    assert image_part["type"] == "input_image"
    assert image_part["image_url"].startswith("data:image/jpeg;base64,")


def test_retries_once_on_broken_json(openai_mode, monkeypatch):
    calls = fake_post(monkeypatch, openai_response("not json {"), openai_response(json.dumps(GOOD)))
    assert client.analyze_receipt(b"img") == GOOD
    assert len(calls) == 2


def test_broken_twice_is_ocr_failed(openai_mode, monkeypatch):
    calls = fake_post(monkeypatch, openai_response("[]"), openai_response("not json"))
    with pytest.raises(OcrError) as error:
        client.analyze_receipt(b"img")
    assert error.value.code == "ocr_failed"
    assert len(calls) == 2  # 재시도는 한 번만


@pytest.mark.parametrize("response, code", [
    (httpx.ReadTimeout("slow"), "ocr_timeout"),
    (httpx.ConnectError("no network"), "ocr_failed"),
    (openai_response("", status=500), "ocr_failed"),
    (httpx.Response(200, json={"output": [{"type": "message", "content": [{"type": "refusal", "refusal": "no"}]}]}), "ocr_failed"),
])
def test_call_failures(openai_mode, monkeypatch, response, code):
    fake_post(monkeypatch, response)
    with pytest.raises(OcrError) as error:
        client.analyze_receipt(b"img")
    assert error.value.code == code


def test_no_key_is_ocr_failed(openai_mode, monkeypatch):
    monkeypatch.setattr(config, "OPENAI_API_KEY", "")
    calls = fake_post(monkeypatch)
    with pytest.raises(OcrError) as error:
        client.analyze_receipt(b"img")
    assert error.value.code == "ocr_failed"
    assert calls == []


def test_time_limit_covers_retry(openai_mode, monkeypatch):
    # 남은 시간만큼만 기다리게 한다. 첫 시도가 시간을 다 쓰면 재시도하지 않고 시간 초과
    monkeypatch.setattr(config, "OCR_TIMEOUT_SEC", 0)
    calls = fake_post(monkeypatch)
    with pytest.raises(OcrError) as error:
        client.analyze_receipt(b"img")
    assert error.value.code == "ocr_timeout"
    assert calls == []


# ── 실제 OpenAI 호출 (비용 발생). OPENAI_API_KEY 가 있을 때 pytest -m live 로만 돈다 ──

def receipt_image() -> bytes:
    # 개인정보가 없는 가짜 영수증을 그린다. 기본 글꼴은 한글이 없어 영문으로 쓴다.
    image = Image.new("RGB", (600, 900), "white")
    draw = ImageDraw.Draw(image)
    lines = ["HANBIT MART", "2026-11-02 14:21", "", "MILK 1L            2,800", "KIMBAP x2          3,000",
             "WET TISSUE         2,500", "SHAMPOO 400ML      6,900", "DISCOUNT          -1,000", "",
             "TOTAL             14,200", "CARD              14,200"]
    for index, line in enumerate(lines):
        draw.text((60, 60 + index * 50), line, fill="black", font_size=28)
    output = io.BytesIO()
    image.save(output, format="JPEG")
    return output.getvalue()


@pytest.mark.live
@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OPENAI_API_KEY 가 없다")
def test_live_openai(monkeypatch):
    monkeypatch.setattr(config, "OCR_MODE", "openai")
    result = postprocess(client.analyze_receipt(receipt_image()))
    assert result["total_amount"] == 14200
    assert len(result["items"]) >= 4

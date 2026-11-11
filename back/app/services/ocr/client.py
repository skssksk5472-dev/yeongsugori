# 영수증 분석 입구 — OCR_MODE 에 따라 mock 또는 OpenAI 모델을 부른다. 돌려주는 값은 모델 출력 모양(schema.py)의 dict 다.
#
# OpenAI 호출은 HTTP 요청 한 번이다 (Responses API). 이미지는 base64 로 바꿔 data URL 로 보내고,
# text.format 에 JSON 스키마를 넣어 그 모양으로만 답하게 한다 (05 문서 1절).

import base64
import json
import time

import httpx

from others import config
from services.ocr import mock
from services.ocr.errors import ocr_failed, ocr_timeout
from services.ocr.prompt import SYSTEM_PROMPT, USER_PROMPT
from services.ocr.schema import RECEIPT_SCHEMA

OPENAI_URL = "https://api.openai.com/v1/responses"
# 답이 깨졌을 때 다시 묻는 횟수까지 합친 최대 시도 횟수 (처음 1번 + 재시도 1번)
MAX_TRIES = 2


def analyze_receipt(image: bytes) -> dict:
    if config.OCR_MODE == "mock":
        return mock.analyze(config.OCR_MOCK_SCENARIO)
    return _analyze_with_openai(image)


# 전체 시도가 OCR_TIMEOUT_SEC 안에 끝나야 한다. 답이 JSON 이 아니거나 모양이 틀리면 한 번만 다시 묻는다.
def _analyze_with_openai(image: bytes) -> dict:
    if not config.OPENAI_API_KEY:
        raise ocr_failed()

    deadline = time.monotonic() + config.OCR_TIMEOUT_SEC
    for _ in range(MAX_TRIES):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise ocr_timeout()
        result = _parse_json(_call_openai(image=image, timeout=remaining))
        if result is not None:
            return result
    raise ocr_failed()


def _request_body(image: bytes) -> dict:
    image_url = "data:image/jpeg;base64," + base64.b64encode(image).decode("ascii")
    return {
        "model": config.OPENAI_MODEL,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "input_text", "text": USER_PROMPT},
                {"type": "input_image", "image_url": image_url},
            ]},
        ],
        "text": {"format": {"type": "json_schema", "name": "receipt", "schema": RECEIPT_SCHEMA, "strict": True}},
    }


# 모델의 답(문자열)을 돌려준다. 시간 초과는 ocr_timeout, 그 밖의 실패는 ocr_failed
def _call_openai(image: bytes, timeout: float) -> str:
    try:
        res = httpx.post(OPENAI_URL, json=_request_body(image), timeout=timeout,
                         headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"})
    except httpx.TimeoutException:
        raise ocr_timeout()
    except httpx.HTTPError:
        raise ocr_failed()
    if res.status_code != 200:
        raise ocr_failed()
    return _output_text(res.json())


# 응답의 output 중 message 의 output_text 를 찾는다. 모델이 거절(refusal)했으면 ocr_failed
def _output_text(data: dict) -> str:
    for output in data.get("output", []):
        if output.get("type") != "message":
            continue
        for part in output.get("content", []):
            if part.get("type") == "output_text":
                return part.get("text", "")
    raise ocr_failed()


# JSON 이고 모양이 맞으면 dict, 아니면 None (다시 묻는다)
def _parse_json(text: str):
    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(result, dict) or not isinstance(result.get("items"), list):
        return None
    return result

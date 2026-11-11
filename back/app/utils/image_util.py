# 업로드 이미지 확인·전처리 — 형식은 파일 앞부분(매직 바이트)으로 판단하고, 분석·저장 전에 크기와 메타데이터를 정리한다 (05 문서 1절).

import io

from PIL import Image, ImageOps

LONG_SIDE = 1600
JPEG_QUALITY = 85


# 파일 앞 몇 바이트로 형식을 알아낸다. 확장자나 브라우저가 보낸 형식은 믿지 않는다.
def detect_image_type(data: bytes):
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[4:8] == b"ftyp" and data[8:12] in (b"heic", b"heix", b"mif1", b"msf1"):
        return "heic"
    return None


# 사진 방향을 바로잡고, 긴 변을 1600px로 줄이고, JPEG(품질 85)로 다시 저장한다.
# 다시 저장하면서 촬영 위치 같은 EXIF 정보는 모두 빠진다. 열 수 없는 이미지면 None
def preprocess_image(data: bytes):
    try:
        image = Image.open(io.BytesIO(data))
        image = ImageOps.exif_transpose(image)
    except Exception:
        return None
    image = image.convert("RGB")
    image.thumbnail((LONG_SIDE, LONG_SIDE))
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=JPEG_QUALITY)
    return output.getvalue()

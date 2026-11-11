# 로컬 디스크 저장소 — key("receipts/{uid}/{uuid}.jpg")를 UPLOAD_DIR 아래 파일 경로로 바꿔 저장한다.

import shutil
from pathlib import Path

from storage.base import Storage


class LocalStorage(Storage):
    def __init__(self, root: str) -> None:
        self.__root = Path(root)

    def __path(self, key: str) -> Path:
        return self.__root / key

    def save(self, key: str, data: bytes) -> None:
        path = self.__path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read(self, key: str) -> bytes:
        return self.__path(key).read_bytes()

    def delete(self, key: str) -> None:
        self.__path(key).unlink(missing_ok=True)

    def delete_prefix(self, prefix: str) -> None:
        shutil.rmtree(self.__path(prefix), ignore_errors=True)

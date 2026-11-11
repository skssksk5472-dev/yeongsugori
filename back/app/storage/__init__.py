# 서버 전체가 같이 쓰는 이미지 저장소 하나. 오브젝트 스토리지로 바꾸려면 여기만 바꾼다.

from others import config
from storage.local import LocalStorage

storage = LocalStorage(root=config.UPLOAD_DIR)

# 이미지 저장소의 약속 — 모델은 이 모양만 알면 된다. 로컬 디스크(local.py) 대신 오브젝트 스토리지로 바꿀 수 있다.


class Storage:
    def save(self, key: str, data: bytes) -> None:
        raise NotImplementedError

    def read(self, key: str) -> bytes:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    # key 가 prefix 로 시작하는 파일을 모두 지운다 (회원 탈퇴)
    def delete_prefix(self, prefix: str) -> None:
        raise NotImplementedError

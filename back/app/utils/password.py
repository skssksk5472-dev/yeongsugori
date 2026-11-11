# 비밀번호 해시(bcrypt) — 평문 비밀번호는 저장하지도, 로그에 남기지도 않는다.

import bcrypt

# bcrypt는 72바이트까지만 다룬다. 그보다 긴 비밀번호는 가입 단계에서 막는다.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, password_hash: str) -> bool:
    data = password.encode("utf-8")
    if len(data) > MAX_PASSWORD_BYTES:
        return False
    return bcrypt.checkpw(data, password_hash.encode("utf-8"))

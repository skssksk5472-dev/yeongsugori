# 로그인 토큰(JWT) 만들기·읽기 — 토큰에는 uid와 만료 시각(exp)만 담는다.

from datetime import datetime, timedelta, timezone

import jwt

ALGORITHM = "HS256"


def make_token(uid: str, secret_key: str, expire_days: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=expire_days)
    return jwt.encode({"uid": uid, "exp": expires_at}, secret_key, algorithm=ALGORITHM)


# 토큰이 없거나, 서명이 틀리거나, 만료되었으면 "" 를 돌려준다.
def read_token(token: str, secret_key: str) -> str:
    if not token:
        return ""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        return ""
    return str(payload.get("uid", ""))

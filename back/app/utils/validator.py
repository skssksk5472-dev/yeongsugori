# 사용자 입력 검증 — 이메일, 닉네임, 비밀번호 규칙 (02 문서 4절). 가입·설정 모델이 같이 쓴다.

import re

from utils.password import MAX_PASSWORD_BYTES

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(email: str) -> bool:
    return len(email) <= 100 and EMAIL_PATTERN.match(email) is not None


def is_valid_nickname(nickname: str) -> bool:
    return 2 <= len(nickname) <= 12


# 8~64자, 영문과 숫자를 각각 1자 이상. bcrypt 한도(72바이트)도 넘지 않아야 한다.
def is_strong_password(password: str) -> bool:
    if not 8 <= len(password) <= 64 or len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return False
    has_letter = any(char.isascii() and char.isalpha() for char in password)
    has_digit = any(char.isdigit() for char in password)
    return has_letter and has_digit

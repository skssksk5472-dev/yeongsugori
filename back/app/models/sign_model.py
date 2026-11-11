# 회원가입·로그인·내 정보 모델 (auth 모듈) — 입력 검증, 비밀번호 확인, 사용자 저장을 맡는다.

import uuid
from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError

from data_domains.zalssm_data_domain import User
from models.base_model import BaseModel
from utils.password import check_password, hash_password
from utils.validator import is_strong_password, is_valid_email, is_valid_nickname


class SignModel(BaseModel):
    def try_signup(self, email: str, nickname: str, password: str) -> None:
        email = email.strip().lower()
        nickname = nickname.strip()

        fields = self.__check_signup_input(email=email, nickname=nickname, password=password)
        if fields:
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다", fields=fields)
            return

        if self._database.get_data_with_key(target="users", key="email", key_data=email):
            self.set_fail(error_code="email_taken", detail="이미 가입된 이메일입니다")
            return

        user = User(uid=uuid.uuid4().hex, email=email, password_hash=hash_password(password),
                    nickname=nickname, created_at=datetime.now(timezone.utc))
        try:
            self._database.add_new_data(target="users", new_data=user.get_dict_form_data())
        except DuplicateKeyError:
            # 같은 이메일로 거의 동시에 가입한 경우
            self.set_fail(error_code="email_taken", detail="이미 가입된 이메일입니다")
            return

        self._user = user
        self.set_success()

    def try_login(self, email: str, password: str) -> None:
        user_data = self._database.get_data_with_key(target="users", key="email", key_data=email.strip().lower())

        # 이메일이 없을 때와 비밀번호가 틀릴 때 같은 문구를 쓴다. 가입 여부를 알려주지 않기 위해서다.
        if user_data is None or not check_password(password, user_data["password_hash"]):
            self.set_fail(error_code="invalid_credentials", detail="이메일 또는 비밀번호가 올바르지 않습니다")
            return

        self._user.make_with_dict(user_data)
        self.set_success()

    def try_logout(self) -> None:
        self.set_success()

    def try_get_me(self, uid: str) -> None:
        if self.set_user_with_uid(uid=uid):
            self.set_success()

    def get_uid(self) -> str:
        return self._user.uid

    def get_body_data(self) -> dict:
        if not self.check_logged_in():
            return {}
        return {"user": self._user.get_dict_form_data_without_password()}

    # 02 문서 4절 입력 검증. 틀린 필드만 {필드: 문구} 로 돌려준다.
    def __check_signup_input(self, email: str, nickname: str, password: str) -> dict:
        fields = {}
        if not is_valid_email(email):
            fields["email"] = "올바른 이메일 형식이 아닙니다"
        if not is_valid_nickname(nickname):
            fields["nickname"] = "닉네임은 2~12자로 입력하세요"
        if not is_strong_password(password):
            fields["password"] = "8자 이상, 영문과 숫자를 포함해야 합니다"
        return fields

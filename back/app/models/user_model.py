# 설정 모델 — 닉네임 변경, 비밀번호 변경, 회원 탈퇴. 로그인한 사용자 자신만 바꾼다.

from models.base_model import BaseModel
from storage import storage
from utils.password import check_password, hash_password
from utils.validator import is_strong_password, is_valid_nickname


class UserModel(BaseModel):
    def __init__(self, database) -> None:
        super().__init__(database=database)
        self.__body = {}

    def change_nickname(self, nickname: str) -> None:
        nickname = nickname.strip()
        if not is_valid_nickname(nickname):
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다",
                          fields={"nickname": "닉네임은 2~12자로 입력하세요"})
            return

        self._user.nickname = nickname
        self._database.modify_data_with_query(target="users", query={"uid": self._user.uid},
                                              new_data={"nickname": nickname})
        self.__body = {"user": self._user.get_dict_form_data_without_password()}
        self.set_success(detail="변경되었습니다")

    # 다른 기기의 로그인은 그대로 둔다 (02 문서 S2, 단순화)
    def change_password(self, current_password: str, new_password: str) -> None:
        if not check_password(current_password, self._user.password_hash):
            self.set_fail(error_code="wrong_password", detail="현재 비밀번호가 올바르지 않습니다")
            return
        if not is_strong_password(new_password):
            self.set_fail(error_code="validation", detail="입력값이 올바르지 않습니다",
                          fields={"new_password": "8자 이상, 영문과 숫자를 포함해야 합니다"})
            return

        self._database.modify_data_with_query(target="users", query={"uid": self._user.uid},
                                              new_data={"password_hash": hash_password(new_password)})
        self.set_success(detail="변경되었습니다")

    # 내역, 영수증(이미지 파일 포함), 사용자 순서로 모두 지운다 (04 문서 6절).
    def withdraw(self, password: str) -> None:
        if not check_password(password, self._user.password_hash):
            self.set_fail(error_code="wrong_password", detail="현재 비밀번호가 올바르지 않습니다")
            return

        uid = self._user.uid
        self._database.delete_all_data_with_key(target="transactions", key="uid", key_data=uid)
        self._database.delete_all_data_with_key(target="receipts", key="uid", key_data=uid)
        storage.delete_prefix(prefix=f"receipts/{uid}")
        self._database.delete_all_data_with_key(target="users", key="uid", key_data=uid)
        self.set_success()

    def get_body_data(self) -> dict:
        return self.__body

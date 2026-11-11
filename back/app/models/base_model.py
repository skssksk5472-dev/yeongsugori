# 모든 모델의 부모 — 로그인한 사용자와 처리 결과(result, detail, error_code)를 들고 있다가 응답 모양으로 만든다.

from data_domains.zalssm_data_domain import User
from models.database.database_model import Mongo_Database


class BaseModel:
    def __init__(self, database: Mongo_Database) -> None:
        self._database = database
        self._user = User()
        self._result = False
        self._detail = ""
        self._error_code = ""
        self._fields = {}

    def set_success(self, detail: str = "") -> None:
        self._result = True
        self._detail = detail

    # fields 는 입력 검증 실패일 때 필드별 문구 (예: {"email": "올바른 이메일 형식이 아닙니다"})
    def set_fail(self, error_code: str, detail: str, fields: dict = None) -> None:
        self._result = False
        self._error_code = error_code
        self._detail = detail
        self._fields = fields or {}

    # 토큰의 uid로 사용자를 찾아 넣는다. 사용자가 없으면(탈퇴 등) 로그인 필요로 실패 처리한다.
    def set_user_with_uid(self, uid: str) -> bool:
        user_data = self._database.get_data_with_key(target="users", key="uid", key_data=uid) if uid else None
        if user_data is None:
            self.set_fail(error_code="unauthorized", detail="로그인이 필요합니다")
            return False
        self._user.make_with_dict(user_data)
        return True

    def check_logged_in(self) -> bool:
        return self._user.uid != ""

    # 응답 body에 같이 담을 데이터. 자식 모델이 다시 정의한다.
    def get_body_data(self) -> dict:
        return {}

    # 응답 모양: {header, body: {result, detail, error_code, ...}} (03 문서 1절)
    def get_response_form_data(self, head_parser) -> dict:
        body = {"result": self._result, "detail": self._detail}
        if not self._result:
            body["error_code"] = self._error_code
        if self._fields:
            body["fields"] = self._fields
        body.update(self.get_body_data())
        return {"header": head_parser.get_header(), "body": body}

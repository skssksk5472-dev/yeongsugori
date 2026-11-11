# 요청 하나를 다루는 도우미 — 쿠키의 로그인 토큰(JWT)을 확인하고, JSON 응답과 로그인 쿠키를 만든다.

from fastapi import Request
from fastapi.responses import JSONResponse

from others import config
from utils.jwt_manager import make_token, read_token

COOKIE_NAME = "zalssm_token"


# 로그인이 필요한 API에 토큰 없이(또는 만료·위조된 토큰으로) 왔을 때. main.py가 HTTP 401 응답으로 바꾼다.
class CredentialsException(Exception):
    pass


class RequestManager:
    def __init__(self, request: Request, secret_key: str) -> None:
        self.__request = request
        self.__secret_key = secret_key
        self.data_payload = None
        self.jwt_payload = ""  # 로그인한 사용자의 uid. 로그인하지 않았으면 ""

    # 로그인하지 않아도 되는 API. 토큰이 있으면 uid를 읽어 둔다.
    def try_view_management(self, data_payload=None) -> None:
        self.data_payload = data_payload
        token = self.__request.cookies.get(COOKIE_NAME, "")
        self.jwt_payload = read_token(token=token, secret_key=self.__secret_key)

    # 로그인이 필요한 API. 토큰이 없거나 틀리면 여기서 끝난다(HTTP 401).
    def try_view_management_need_authorized(self, data_payload=None) -> None:
        self.try_view_management(data_payload=data_payload)
        if self.jwt_payload == "":
            raise CredentialsException()

    # 실패도 HTTP 200으로 보낸다. 로그인 필요(unauthorized)만 HTTP 401 (03 문서 1절)
    def make_json_response(self, body_data: dict) -> JSONResponse:
        status_code = 401 if body_data["body"].get("error_code") == "unauthorized" else 200
        return JSONResponse(content=body_data, status_code=status_code)

    # 가입·로그인 응답. uid가 있으면(성공) 로그인 토큰 쿠키를 붙인다.
    def make_json_response_with_login(self, body_data: dict, uid: str) -> JSONResponse:
        response = self.make_json_response(body_data=body_data)
        if uid:
            token = make_token(uid=uid, secret_key=self.__secret_key, expire_days=config.JWT_EXPIRE_DAYS)
            response.set_cookie(key=COOKIE_NAME, value=token,
                                max_age=config.JWT_EXPIRE_DAYS * 24 * 60 * 60,
                                httponly=True, samesite="lax", secure=config.COOKIE_SECURE, path="/")
        return response

    # 로그아웃·탈퇴 응답. 성공했을 때만 로그인 토큰 쿠키를 지운다 (탈퇴 비밀번호가 틀리면 로그인 유지).
    def make_json_response_with_logout(self, body_data: dict) -> JSONResponse:
        response = self.make_json_response(body_data=body_data)
        if body_data["body"]["result"]:
            response.delete_cookie(key=COOKIE_NAME, path="/")
        return response

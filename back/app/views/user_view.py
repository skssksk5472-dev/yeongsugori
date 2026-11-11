# 설정 API 경로 — 닉네임 변경, 비밀번호 변경, 회원 탈퇴 (로그인 필요)

from fastapi import FastAPI, Request

from controllers import User_Controller
from utils import Head_Parser, RequestManager
from views.master_view import Master_View, RequestHeader


class User_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.user_route()

    def user_route(self):
        # 닉네임 변경
        @self.__app.post(self._endpoint + '/user/change_nickname', tags=['User'])
        def change_nickname(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = ChangeNicknameRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            user_controller = User_Controller()
            model = user_controller.try_change_nickname(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 비밀번호 변경
        @self.__app.post(self._endpoint + '/user/change_password', tags=['User'])
        def change_password(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = ChangePasswordRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            user_controller = User_Controller()
            model = user_controller.try_change_password(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 회원 탈퇴. 성공하면 로그인 쿠키도 지운다.
        @self.__app.post(self._endpoint + '/user/withdraw', tags=['User'])
        def withdraw(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = WithdrawRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            user_controller = User_Controller()
            model = user_controller.try_withdraw(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response_with_logout(body_data=body_data)
            return response


class ChangeNicknameRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.nickname = str(body.get("nickname", ""))


class ChangePasswordRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.current_password = str(body.get("current_password", ""))
        self.new_password = str(body.get("new_password", ""))


class WithdrawRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.password = str(body.get("password", ""))

# 회원가입·로그인·로그아웃·내 정보 API 경로 (auth 모듈)

from fastapi import FastAPI, Request

from controllers import Sign_Controller
from utils import Head_Parser, RequestManager
from views.master_view import Master_View, RequestHeader


class Sign_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.sign_route()

    def sign_route(self):
        # 회원가입. 성공하면 바로 로그인 쿠키를 준다.
        @self.__app.post(self._endpoint + '/auth/signup', tags=['Sign'])
        def signup(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = SignupRequest(request=raw_request)
            request_manager.try_view_management(data_payload=data_payload)
            sign_controller = Sign_Controller()
            model = sign_controller.try_signup(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response_with_login(body_data=body_data, uid=model.get_uid())
            return response

        # 로그인
        @self.__app.post(self._endpoint + '/auth/login', tags=['Sign'])
        def login(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = LoginRequest(request=raw_request)
            request_manager.try_view_management(data_payload=data_payload)
            sign_controller = Sign_Controller()
            model = sign_controller.try_login(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response_with_login(body_data=body_data, uid=model.get_uid())
            return response

        # 로그아웃. 로그인하지 않은 상태여도 성공으로 응답한다.
        @self.__app.post(self._endpoint + '/auth/logout', tags=['Sign'])
        def logout(request: Request):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            sign_controller = Sign_Controller()
            model = sign_controller.try_logout(database=self.__database)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response_with_logout(body_data=body_data)
            return response

        # 내 정보. 프론트가 로그인 상태를 확인할 때 부른다.
        @self.__app.get(self._endpoint + '/auth/get_me', tags=['Sign'])
        def get_me(request: Request):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            request_manager.try_view_management_need_authorized()
            sign_controller = Sign_Controller()
            model = sign_controller.get_me(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response


class SignupRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.email = str(body.get("email", ""))
        self.nickname = str(body.get("nickname", ""))
        self.password = str(body.get("password", ""))


class LoginRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.email = str(body.get("email", ""))
        self.password = str(body.get("password", ""))

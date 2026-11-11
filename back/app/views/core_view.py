# 서버 상태 확인, 카테고리 목록 API 경로 (로그인 불필요)

from fastapi import FastAPI, Request

from controllers import Core_Controller
from utils import Head_Parser, RequestManager
from views.master_view import Master_View


class Core_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.home_route()
        self.meta_route()

    def home_route(self):
        # 서버와 DB가 살아 있는지 확인
        @self.__app.get(self._endpoint + '/health', tags=['Core'])
        def get_health(request: Request):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            core_controller = Core_Controller()
            model = core_controller.get_health(database=self.__database)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

    def meta_route(self):
        # 지출·수입 카테고리 목록
        @self.__app.get(self._endpoint + '/meta/get_categories', tags=['Core'])
        def get_categories(request: Request):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            core_controller = Core_Controller()
            model = core_controller.get_categories(database=self.__database)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

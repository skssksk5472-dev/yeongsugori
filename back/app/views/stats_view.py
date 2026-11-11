# 분석 API 경로 (로그인 필요)

from typing import Optional

from fastapi import FastAPI, Request

from controllers import Stats_Controller
from utils import Head_Parser, RequestManager
from views.master_view import Master_View


class Stats_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.stats_route()

    def stats_route(self):
        # 월별 지출 카테고리 비율과 전월 지출
        @self.__app.get(self._endpoint + '/stats/get_category_stats', tags=['Stats'])
        def get_category_stats(request: Request, month: Optional[str] = ""):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = GetCategoryStatsRequest(month=month)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            stats_controller = Stats_Controller()
            model = stats_controller.get_category_stats(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response


class GetCategoryStatsRequest:
    def __init__(self, month: str) -> None:
        self.month = month

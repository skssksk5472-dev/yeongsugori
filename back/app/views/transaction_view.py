# 가계부 내역 API 경로 (로그인 필요)

from typing import Optional

from fastapi import FastAPI, Request

from controllers import Transaction_Controller
from utils import Head_Parser, RequestManager
from views.master_view import Master_View, RequestHeader


class Transaction_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.transaction_route()

    def transaction_route(self):
        # 월별 목록과 요약. type, category 는 목록에만 적용되는 필터
        @self.__app.get(self._endpoint + '/transaction/get_month_list', tags=['Transaction'])
        def get_month_list(request: Request, month: Optional[str] = "", type: Optional[str] = "",
                           category: Optional[str] = ""):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = GetMonthListRequest(month=month, type=type, category=category)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            transaction_controller = Transaction_Controller()
            model = transaction_controller.get_month_list(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 내역 한 건
        @self.__app.get(self._endpoint + '/transaction/get_transaction', tags=['Transaction'])
        def get_transaction(request: Request, transaction_id: Optional[str] = ""):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = GetTransactionRequest(transaction_id=transaction_id)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            transaction_controller = Transaction_Controller()
            model = transaction_controller.get_transaction(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 직접 입력
        @self.__app.post(self._endpoint + '/transaction/create_transaction', tags=['Transaction'])
        def create_transaction(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = TransactionRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            transaction_controller = Transaction_Controller()
            model = transaction_controller.try_create_transaction(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 수정
        @self.__app.post(self._endpoint + '/transaction/edit_transaction', tags=['Transaction'])
        def edit_transaction(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = TransactionRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            transaction_controller = Transaction_Controller()
            model = transaction_controller.try_edit_transaction(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 삭제
        @self.__app.post(self._endpoint + '/transaction/delete_transaction', tags=['Transaction'])
        def delete_transaction(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = DeleteTransactionRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            transaction_controller = Transaction_Controller()
            model = transaction_controller.try_delete_transaction(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response


class GetMonthListRequest:
    def __init__(self, month: str, type: str, category: str) -> None:
        self.month = month
        self.type = type
        self.category = category


class GetTransactionRequest:
    def __init__(self, transaction_id: str) -> None:
        self.transaction_id = transaction_id


# 생성·수정에 같이 쓴다. 생성할 때는 transaction_id 가 비어 있다.
class TransactionRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.transaction_id = str(body.get("transaction_id", ""))
        self.type = str(body.get("type", ""))
        self.amount = body.get("amount", 0)  # 숫자인지는 모델이 확인한다
        self.category = str(body.get("category", ""))
        self.title = str(body.get("title", ""))
        self.memo = str(body.get("memo", ""))
        self.occurred_on = str(body.get("occurred_on", ""))


class DeleteTransactionRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.transaction_id = str(body.get("transaction_id", ""))

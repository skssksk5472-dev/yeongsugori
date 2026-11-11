# 영수증 API 경로 — 업로드·분석, 결과 조회, 이미지, 일괄 저장 (로그인 필요)

from typing import Optional, Union

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import Response

from controllers import Receipt_Controller
from others import config
from utils import Head_Parser, RequestManager
from views.master_view import Master_View, RequestHeader


class Receipt_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        super().__init__(head_parser=head_parser)
        self.__app = app
        self._endpoint = endpoint
        self.__database = database
        self.__jwt_secret_key = jwt_secret_key
        self.receipt_route()

    def receipt_route(self):
        # 영수증 사진 업로드 후 바로 분석한다 (multipart, 필드명 image). 분석이 끝날 때까지 기다린다.
        @self.__app.post(self._endpoint + '/receipt/upload_receipt', tags=['Receipt'])
        def upload_receipt(request: Request, image: Union[UploadFile, None] = File(None)):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = UploadReceiptRequest(image=image)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            receipt_controller = Receipt_Controller()
            model = receipt_controller.try_upload_receipt(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 분석 결과 (새로고침해도 다시 볼 수 있다)
        @self.__app.get(self._endpoint + '/receipt/get_receipt', tags=['Receipt'])
        def get_receipt(request: Request, receipt_id: Optional[str] = ""):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = ReceiptIdRequest(receipt_id=receipt_id)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            receipt_controller = Receipt_Controller()
            model = receipt_controller.get_receipt(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response

        # 영수증 이미지. 성공하면 JSON 대신 이미지 자체를 돌려준다 (03 문서 1절의 예외)
        @self.__app.get(self._endpoint + '/receipt/get_receipt_image', tags=['Receipt'])
        def get_receipt_image(request: Request, receipt_id: Optional[str] = ""):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = ReceiptIdRequest(receipt_id=receipt_id)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            receipt_controller = Receipt_Controller()
            model = receipt_controller.get_receipt_image(database=self.__database, request=request_manager)
            if not model.get_image():
                body_data = model.get_response_form_data(self._head_parser)
                return request_manager.make_json_response(body_data=body_data)
            return Response(content=model.get_image(), media_type="image/jpeg",
                            headers={"Cache-Control": "private, max-age=3600"})

        # 사용자가 고친 품목을 내역으로 한 번에 저장
        @self.__app.post(self._endpoint + '/receipt/confirm_receipt', tags=['Receipt'])
        def confirm_receipt(request: Request, raw_request: dict):
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            data_payload = ConfirmReceiptRequest(request=raw_request)
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            receipt_controller = Receipt_Controller()
            model = receipt_controller.try_confirm_receipt(database=self.__database, request=request_manager)
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response(body_data=body_data)
            return response


# 업로드 파일을 읽는다. 한도보다 1바이트만 더 읽어서, 아주 큰 파일도 메모리에 다 올리지 않는다.
class UploadReceiptRequest:
    def __init__(self, image: Union[UploadFile, None]) -> None:
        limit = config.MAX_UPLOAD_MB * 1024 * 1024
        self.image = image.file.read(limit + 1) if image is not None else b""


class ReceiptIdRequest:
    def __init__(self, receipt_id: str) -> None:
        self.receipt_id = receipt_id


class ConfirmReceiptRequest(RequestHeader):
    def __init__(self, request: dict) -> None:
        super().__init__(request)
        body = request.get("body", {})
        self.receipt_id = str(body.get("receipt_id", ""))
        self.merchant = str(body.get("merchant") or "")
        self.occurred_on = str(body.get("occurred_on", ""))
        self.items = body.get("items", [])  # 품목 하나하나의 모양은 모델이 확인한다

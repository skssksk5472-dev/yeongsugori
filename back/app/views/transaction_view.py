# 가계부 내역 API 경로 (로그인 필요)

from typing import Optional

from fastapi import FastAPI, Request
# 실제 내역 조회·등록·수정·삭제 처리를 맡길 도구를 가져온다.
from controllers import Transaction_Controller
from utils import Head_Parser, RequestManager
# 다른 View와 함께 사용하는 부모 클래스들을 가져온다.
from views.master_view import Master_View, RequestHeader

# 수입·지출 내역 관련 요청을 받는 클래스를 만든다.
# (Master_View): Master_View가 가진 공통 기능을 물려받는다.
class Transaction_Service_View(Master_View):
     # 이 클래스의 객체를 만들 때 실행되는 초기 설정이다.
    # app: 요청받을 주소를 등록할 서버 앱.
    # endpoint: 주소 앞부분. 예: "/api"/
    # database: 데이터베이스 관련 객체.
    # head_parser: 응답 데이터를 구성하는 데 사용할 도구.
    # jwt_secret_key: 로그인 토큰 인증 처리에 사용할 비밀키.
    # self: 현재 객체 자신을 가리킨다.
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        # 부모 클래스의 초기 설정을 실행한다.
        super().__init__(head_parser=head_parser)
        # 서버 앱을 저장한다.
        # 아래에서 이 앱에 내역 조회·등록 등의 요청 주소를 연결한다.
        self.__app = app
         # 요청 주소의 앞부분을 저장한다.
        self._endpoint = endpoint
        # 나중에 내역 처리 담당자에게 전달할 DB 객체를 저장한다.
        self.__database = database
        # 인증 처리에 전달할 비밀키를 저장한다.
        self.__jwt_secret_key = jwt_secret_key
        # 아래 메서드를 실행해서 요청받을 주소들을 등록한다
        self.transaction_route()

    # 내역 조회·등록·수정·삭제 요청을 받을 주소들을 등록한다.
    def transaction_route(self):

        # 1. 월별 내역 목록과 요약 조회
        # 예: 사용자가 "11월 내역 보기"를 누른다.
        # 기존 주석에 따르면 type과 category 필터는 목록에만 적용한다.

        # GET 요청을 받을 주소와 바로 아래 함수를 연결한다.
        # endpoint가 "/api"라면 "/api/transaction/get_month_list"가 된다.
        # tags=['Transaction']: API 문서에서 Transaction 그룹으로 묶는다.
        @self.__app.get(self._endpoint + '/transaction/get_month_list', tags=['Transaction'])

        # 해당 주소로 요청이 들어왔을 때 실행한다.
        # request: 현재 HTTP 요청 정보.
        # month: 조회할 월.
        # type: 조회할 내역 종류.
        # category: 조회할 카테고리.
        # 조건들은 URL의 ?month=...&type=...&category=... 형태로 받는다.
        # = ""는 해당 조건을 보내지 않으면 빈 문자열을 사용한다는 뜻이다.
        def get_month_list(request: Request, month: Optional[str] = "", type: Optional[str] = "",
                           category: Optional[str] = ""):

            # 현재 요청과 비밀키를 요청 관리 도구에 전달한다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)

            # 월, 종류, 카테고리 조건을 하나의 객체에 담는다.
            data_payload = GetMonthListRequest(month=month, type=type, category=category)

            # 인증이 필요한 요청의 공통 처리를 실행한다.
            # 구체적인 인증 검사와 실패 처리는 이 메서드 내부에서 확인해야 한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)

            # 실제 내역 처리를 담당할 객체를 만든다.
            transaction_controller = Transaction_Controller()

            # DB 객체와 요청 관리 객체를 전달하며 월별 조회를 맡긴다.
            # 처리 결과를 model에 저장한다.
            model = transaction_controller.get_month_list(database=self.__database, request=request_manager)

            # 처리 결과를 응답 본문에 넣을 데이터로 바꾼다.
            body_data = model.get_response_form_data(self._head_parser)

            # 응답 본문 데이터를 담아 JSON 응답을 만든다.
            response = request_manager.make_json_response(body_data=body_data)

            # 응답을 반환하면 FastAPI가 요청한 쪽으로 보낸다.
            return response

        # 2. 내역 한 건 조회
        # 예: 목록에서 "점심값"을 눌러 자세한 내용을 본다.

        # 내역 한 건을 조회할 GET 주소를 등록한다.
        @self.__app.get(self._endpoint + '/transaction/get_transaction', tags=['Transaction'])

        # transaction_id: 어떤 내역인지 구분하는 식별번호.
        # URL의 ?transaction_id=... 형태로 전달받는다.
        def get_transaction(request: Request, transaction_id: Optional[str] = ""):

            # 현재 요청을 관리할 객체를 만든다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)

            # 조회할 내역의 식별번호를 객체에 담는다.
            data_payload = GetTransactionRequest(transaction_id=transaction_id)

            # 인증이 필요한 요청의 공통 처리를 실행한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)

            # 실제 내역 처리를 담당할 객체를 만든다.
            transaction_controller = Transaction_Controller()

            # 컨트롤러에 해당 내역 한 건의 조회를 맡긴다.
            model = transaction_controller.get_transaction(database=self.__database, request=request_manager)

            # 조회 결과를 응답 본문 데이터로 바꾼다.
            body_data = model.get_response_form_data(self._head_parser)

            # JSON 응답을 만든다.
            response = request_manager.make_json_response(body_data=body_data)

            # 응답을 반환한다.
            return response

        # 3. 내역 직접 등록
        # 예: "점심값 9,000원"을 직접 입력하고 저장한다.

        # 새 내역을 등록할 POST 주소를 등록한다.
        @self.__app.post(self._endpoint + '/transaction/create_transaction', tags=['Transaction'])

        # request: 현재 HTTP 요청 정보.
        # raw_request: 요청 본문으로 받은 JSON 데이터를 딕셔너리로 담은 값.
        # dict는 이름과 값을 짝지어 보관하는 자료형이다.
        def create_transaction(request: Request, raw_request: dict):

            # 현재 요청을 관리할 객체를 만든다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)

            # 받은 데이터에서 금액, 제목 등을 꺼내 객체에 담는다.
            data_payload = TransactionRequest(request=raw_request)

            # 인증이 필요한 요청의 공통 처리를 실행한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)

            # 실제 내역 처리를 담당할 객체를 만든다.
            transaction_controller = Transaction_Controller()

            # 컨트롤러에 새 내역 등록을 맡긴다.
            model = transaction_controller.try_create_transaction(database=self.__database, request=request_manager)

            # 등록 처리 결과를 응답 본문 데이터로 바꾼다.
            body_data = model.get_response_form_data(self._head_parser)

            # JSON 응답을 만든다.
            response = request_manager.make_json_response(body_data=body_data)

            # 응답을 반환한다.
            return response

        # 4. 내역 수정
        # 예: 점심값을 9,000원에서 8,000원으로 바꾼다.

        # 기존 내역을 수정할 POST 주소를 등록한다.
        @self.__app.post(self._endpoint + '/transaction/edit_transaction', tags=['Transaction'])

        # 요청 본문에서 수정할 내역의 번호와 변경할 내용을 받는다.
        def edit_transaction(request: Request, raw_request: dict):

            # 현재 요청을 관리할 객체를 만든다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)

            # 수정할 내역의 번호와 금액, 제목 등을 객체에 담는다.
            data_payload = TransactionRequest(request=raw_request)

            # 인증이 필요한 요청의 공통 처리를 실행한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)

            # 실제 내역 처리를 담당할 객체를 만든다.
            transaction_controller = Transaction_Controller()

            # 컨트롤러에 기존 내역 수정을 맡긴다.
            model = transaction_controller.try_edit_transaction(database=self.__database, request=request_manager)

            # 수정 처리 결과를 응답 본문 데이터로 바꾼다.
            body_data = model.get_response_form_data(self._head_parser)

            # JSON 응답을 만든다.
            response = request_manager.make_json_response(body_data=body_data)

            # 응답을 반환한다.
            return response

        # 5. 내역 삭제
        # 예: 잘못 등록한 내역의 삭제 버튼을 누른다.

        # 삭제 요청을 받을 주소를 등록한다.
        # 이 코드에서는 삭제에도 POST 방식을 사용한다.
        @self.__app.post(self._endpoint + '/transaction/delete_transaction', tags=['Transaction'])

        # 요청 본문에서 삭제할 내역의 식별번호를 받는다.
        def delete_transaction(request: Request, raw_request: dict):

            # 현재 요청을 관리할 객체를 만든다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)

            # 삭제할 내역의 식별번호를 객체에 담는다.
            data_payload = DeleteTransactionRequest(request=raw_request)

            # 인증이 필요한 요청의 공통 처리를 실행한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)

            # 실제 내역 처리를 담당할 객체를 만든다.
            transaction_controller = Transaction_Controller()

            # 컨트롤러에 해당 내역 삭제를 맡긴다.
            model = transaction_controller.try_delete_transaction(database=self.__database, request=request_manager)

            # 삭제 처리 결과를 응답 본문 데이터로 바꾼다.
            body_data = model.get_response_form_data(self._head_parser)

            # JSON 응답을 만든다.
            response = request_manager.make_json_response(body_data=body_data)

            # 응답을 반환한다.
            return response


# 월별 조회 조건을 묶어 보관하는 클래스.
class GetMonthListRequest:

    # 객체를 만들 때 월, 내역 종류, 카테고리를 전달받는다.
    def __init__(self, month: str, type: str, category: str) -> None:

        # 조회할 월을 저장한다.
        self.month = month

        # 조회할 내역 종류를 저장한다.
        self.type = type

        # 조회할 카테고리를 저장한다.
        self.category = category


# 내역 한 건을 조회할 때 사용할 식별번호를 보관하는 클래스.
class GetTransactionRequest:

    # 조회할 내역의 식별번호를 전달받는다.
    def __init__(self, transaction_id: str) -> None:

        # 식별번호를 저장한다.
        self.transaction_id = transaction_id


# 등록과 수정에서 함께 사용하는 요청 데이터 클래스.
# RequestHeader의 공통 기능을 물려받는다.
# 등록할 때는 transaction_id를 비워 둔다.
class TransactionRequest(RequestHeader):

    # 사용자가 보낸 데이터를 딕셔너리로 전달받는다.
    def __init__(self, request: dict) -> None:

        # 부모 클래스의 초기 설정에 요청 데이터를 전달한다.
        super().__init__(request)

        # 받은 데이터에서 "body" 항목을 꺼낸다.
        # .get("이름", 기본값)은 해당 항목이 없으면 기본값을 사용한다.
        # 여기서는 "body"가 없으면 빈 딕셔너리 {}를 사용한다.
        # 이 프로젝트는 요청 JSON 안에 "body" 항목을 두는 구조다.
        body = request.get("body", {})

        # 내역 식별번호를 꺼내 문자열로 바꿔 저장한다.
        # str(): 값을 문자열로 변환한다.
        # 항목이 없으면 빈 문자열("")을 사용한다.
        self.transaction_id = str(body.get("transaction_id", ""))

        # 내역 종류를 꺼내 문자열로 저장한다.
        self.type = str(body.get("type", ""))

        # 금액을 꺼내 저장한다. 항목이 없으면 0을 사용한다.
        # 이 줄에서는 숫자 여부를 검사하거나 숫자로 변환하지 않는다.
        # 기존 주석에 따르면 숫자인지는 모델에서 확인한다.
        self.amount = body.get("amount", 0)

        # 카테고리를 꺼내 문자열로 저장한다.
        self.category = str(body.get("category", ""))

        # 제목을 꺼내 문자열로 저장한다. 예: "점심값"
        self.title = str(body.get("title", ""))

        # 메모를 꺼내 문자열로 저장한다.
        self.memo = str(body.get("memo", ""))

        # 발생 날짜를 꺼내 문자열로 저장한다.
        # 여기서는 날짜 형식이 올바른지 검사하지 않는다.
        self.occurred_on = str(body.get("occurred_on", ""))


# 삭제할 내역의 식별번호를 보관하는 클래스.
# RequestHeader의 공통 기능을 물려받는다.
class DeleteTransactionRequest(RequestHeader):

    # 사용자가 보낸 데이터를 딕셔너리로 전달받는다.
    def __init__(self, request: dict) -> None:

        # 부모 클래스의 초기 설정에 요청 데이터를 전달한다.
        super().__init__(request)

        # 받은 데이터에서 "body"를 꺼낸다.
        # 항목이 없으면 빈 딕셔너리를 사용한다.
        body = request.get("body", {})

        # 삭제할 내역의 식별번호를 문자열로 저장한다.
        # 항목이 없으면 빈 문자열을 사용한다.
        self.transaction_id = str(body.get("transaction_id", ""))

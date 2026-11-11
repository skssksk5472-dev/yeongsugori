# 설정 API 경로
# 닉네임 변경, 비밀번호 변경, 회원 탈퇴 기능을 제공한다.
# 세 가지 기능 모두 로그인한 사용자만 이용할 수 있다.

# FastAPI 서버와 HTTP 요청 정보를 처리하기 위한 클래스 가져오기
from fastapi import FastAPI, Request
# 회원 정보 변경 및 탈퇴 기능을 담당하는 컨트롤러 가져오기
from controllers import User_Controller
# 요청 데이터 분석과 요청 및 응답 관리를 위한 도구 가져오기
from utils import Head_Parser, RequestManager
# 공통 View 기능과 요청 데이터의 기본 구조를 담당하는 클래스 가져오기
from views.master_view import Master_View, RequestHeader

# 사용자 설정 관련 API를 관리하는 클래스
# Master_View를 상속받아 공통 View 기능을 사용할 수 있다.
class User_Service_View(Master_View):
    # 클래스가 생성될 때 필요한 객체와 설정값을 전달받는다.
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        # 부모 클래스인 Master_View의 초기화 함수를 실행한다.
        # 공통 응답 데이터 처리에 사용할 Head_Parser를 전달한다.
        super().__init__(head_parser=head_parser)
        # API를 등록할 FastAPI 서버 객체를 저장한다.
        self.__app = app
        # API 주소 앞에 공통으로 붙는 기본 경로를 저장한다.
        self._endpoint = endpoint
        # 회원 정보를 저장하고 조회할 데이터베이스 객체를 저장한다.
        self.__database = database
        # 로그인 인증에 사용하는 JWT 비밀키를 저장한다.
        self.__jwt_secret_key = jwt_secret_key
        # 사용자 관련 API 경로를 등록하는 함수를 실행한다.
        self.user_route()
    # 닉네임 변경, 비밀번호 변경, 회원 탈퇴 API를 등록하는 함수
    def user_route(self):
        # 닉네임 변경
         # POST 방식으로 닉네임 변경 요청을 처리하는 API 주소를 등록한다.
        @self.__app.post(self._endpoint + '/user/change_nickname', tags=['User'])
        def change_nickname(request: Request, raw_request: dict):
            # 클라이언트의 요청과 JWT 비밀키를 이용해 요청 관리 객체를 생성한다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 전달받은 요청 데이터에서 닉네임 정보를 추출하고
            # ChangeNicknameRequest 객체로 변환한다.
            data_payload = ChangeNicknameRequest(request=raw_request)
            # 사용자가 로그인했는지 확인하고 요청 데이터를 검증한다.
            # 로그인이 필요한 기능이므로 인증되지 않은 사용자는 이용할 수 없다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            # 사용자가 로그인했는지 확인하고 요청 데이터를 검증한다.
            # 로그인이 필요한 기능이므로 인증되지 않은 사용자는 이용할 수 없다.
            request_manager.try_view_management_need_authorized(data_patload=data_patload)
            # 실제 회원 정보 변경을 담당하는 User_Controller 객체를 생성한다.
            user_controller = User_Controller()
            # 데이터베이스와 요청 정보를 전달하여 닉네임 변경을 실행한다.
            model = user_controller.try_change_nickname(database=self.__database, request=request_manager)
            # 처리 결과를 클라이언트에 전달할 응답 데이터 형식으로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 변환된 데이터를 JSON 응답으로 생성한다.
            response = request_manager.make_json_response(body_data=body_data)
            # 최종 응답을 클라이언트에 반환한다.
            return response

        # 비밀번호 변경
        # POST 방식으로 비밀번호 변경 요청을 처리하는 API 주소를 등록한다.
        @self.__app.post(self._endpoint + '/user/change_password', tags=['User'])
        def change_password(request: Request, raw_request: dict):
            # 클라이언트의 요청과 JWT 비밀키를 이용해 요청 관리 객체를 생성한다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 전달받은 요청 데이터에서 비밀번호 정보를 추출하고
            # ChangePasswordRequest 객체로 변환한다.
            data_payload = ChangePasswordRequest(request=raw_request)
            # 로그인 여부를 확인하고 요청 데이터를 검증한다.
            # 로그인한 사용자만 비밀번호를 변경할 수 있도록 제한한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            # 비밀번호 변경을 담당하는 User_Controller 객체를 생성한다.
            user_controller = User_Controller()
            # 데이터베이스와 요청 정보를 전달하여 비밀번호 변경을 실행한다.
            model = user_controller.try_change_password(database=self.__database, request=request_manager)
            # 비밀번호 변경 처리 결과를 응답 데이터 형식으로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 처리 결과를 JSON 응답으로 생성한다.
            response = request_manager.make_json_response(body_data=body_data)
            # 최종 응답을 클라이언트에 반환한다.
            return response

        # 회원 탈퇴. 성공하면 로그인 쿠키도 지운다.
        # POST 방식으로 회원 탈퇴 요청을 처리하는 API 주소를 등록한다.
        @self.__app.post(self._endpoint + '/user/withdraw', tags=['User'])
        def withdraw(request: Request, raw_request: dict):
            # 클라이언트의 요청과 JWT 비밀키를 이용해 요청 관리 객체를 생성한다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 요청 데이터에서 회원 탈퇴에 필요한 비밀번호를 추출한다.
            data_payload = WithdrawRequest(request=raw_request)
            # 로그인 여부를 확인하고 요청 데이터를 검증한다.
            # 인증된 사용자만 회원 탈퇴를 진행할 수 있다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
            # 회원 탈퇴 처리를 담당하는 User_Controller 객체를 생성한다.
            user_controller = User_Controller()
            # 데이터베이스와 요청 정보를 전달하여 회원 탈퇴를 실행한다.
            model = user_controller.try_withdraw(database=self.__database, request=request_manager)
            # 회원 탈퇴 처리 결과를 응답 데이터 형식으로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 회원 탈퇴가 완료되면 로그인 쿠키도ody_data = model.get_response_form_data(self._head_parser) 삭제하는 응답을 생성한다.
            # 탈퇴한 사용자가 기존 로그인 상태를 유지하지 못하도록 처리한다.
            response = request_manager.make_json_response_with_logout(body_data=body_data)
            # 최종 응답을 클라이언트에 반환한다.
            return response

# --------------------------------------------------
# 4. 닉네임 변경 요청 데이터 클래스
# --------------------------------------------------

# 공통 요청 데이터 구조인 RequestHeader를 상속받는다.
class ChangeNicknameRequest(RequestHeader):
    # 클라이언트가 전달한 요청 데이터를 초기화한다.
    def __init__(self, request: dict) -> None:
         # 부모 클래스의 초기화 함수를 실행하여 공통 요청 정보를 설정한다.
        super().__init__(request)
        # 요청 데이터에서 body 항목을 가져온다.
        # body가 없으면 빈 딕셔너리를 사용한다.
        body = request.get("body", {})
        # body 안에 있는 nickname 값을 문자열로 변환하여 저장한다.
        # nickname 값이 없으면 빈 문자열을 기본값으로 사용한다.
        self.nickname = str(body.get("nickname", ""))

# --------------------------------------------------
# 5. 비밀번호 변경 요청 데이터 클래스
# --------------------------------------------------

# 공통 요청 데이터 구조인 RequestHeader를 상속받는다.
class ChangePasswordRequest(RequestHeader):
    # 클라이언트가 전달한 요청 데이터를 초기화한다.
    def __init__(self, request: dict) -> None:
        # 부모 클래스의 초기화 함수를 실행하여 공통 요청 정보를 설정한다.
        super().__init__(request)
        # 요청 데이터에서 body 항목을 가져온다.
        # body가 없으면 빈 딕셔너리를 사용한다.
        body = request.get("body", {})
        # 현재 사용 중인 비밀번호를 문자열로 변환하여 저장한다.
        self.current_password = str(body.get("current_password", ""))
        # 변경하려는 새 비밀번호를 문자열로 변환하여 저장한다.
        self.new_password = str(body.get("new_password", ""))

# --------------------------------------------------
# 6. 회원 탈퇴 요청 데이터 클래스
# --------------------------------------------------

# 공통 요청 데이터 구조인 RequestHeader를 상속받는다.
class WithdrawRequest(RequestHeader):
    # 클라이언트가 전달한 요청 데이터를 초기화한다.
    def __init__(self, request: dict) -> None:
        # 부모 클래스의 초기화 함수를 실행하여 공통 요청 정보를 설정한다.
        super().__init__(request)
        # 요청 데이터에서 body 항목을 가져온다.
        # body가 없으면 빈 딕셔너리를 사용한다.
        body = request.get("body", {})
        # 회원 탈퇴 시 본인 확인에 사용할 비밀번호를 추출한다.
        # 문자열로 변환하여 password 변수에 저장한다.
        self.password = str(body.get("password", ""))

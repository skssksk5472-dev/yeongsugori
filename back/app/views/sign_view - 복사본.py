# 회원가입·로그인·로그아웃·내 정보 API 경로 (auth 모듈)

# FastAPI 서버 기능을 사용하기 위해 FastAPI와 Request를 가져온다.
from fastapi import FastAPI, Request
# 회원가입, 로그인, 로그아웃 등의 실제 처리를 담당하는 컨트롤러를 가져온다.
from controllers import Sign_Controller
# 요청 데이터를 분석하는 Head_Parser와
# 요청 및 응답을 관리하는 RequestManager를 가져온다.
from utils import Head_Parser, RequestManager
# 공통 View 클래스인 Master_View와
# 요청 데이터의 기본 구조를 담당하는 RequestHeader를 가져온다.
from views.master_view import Master_View, RequestHeader


c# 회원가입, 로그인, 로그아웃, 내 정보 조회 API 경로를 관리하는 클래스
# Master_View를 상속받아 공통 View 기능을 사용할 수 있다.
class Sign_Service_View(Master_View):
    # 클래스가 생성될 때 실행되는 초기화 함수
    def __init__(self, app: FastAPI,# API를 등록할 FastAPI 서버 객체
     endpoint: str,# API 앞에 공통으로 붙는 기본 경로 database,# 데이터베이스 연결 객체
      head_parser: Head_Parser,# 요청 및 응답 데이터를 분석하는 객체
       jwt_secret_key: str# JWT 토큰을 만들고 검증할 때 사용하는 비밀키
       ) -> None:
       # 부모 클래스인 Master_View의 초기화 함수 실행
        # Head_Parser를 부모 클래스에 전달하여 공통 기능을 사용할 수 있게 한다.
        super().__init__(head_parser=head_parser)
        # 전달받은 FastAPI 서버 객체를 저장한다.
        self.__app = app
        # API의 공통 기본 경로를 저장한다.
        self._endpoint = endpoint
        # 데이터베이스 연결 객체를 저장한다.
        self.__database = database
        # JWT 인증에 사용할 비밀키를 저장한다.
        self.__jwt_secret_key = jwt_secret_key
        # 회원가입, 로그인, 로그아웃, 내 정보 API 경로를 등록한다.
        self.sign_route()
# 회원 관련 API 주소들을 등록하는 함수
    def sign_route(self):
        # -------------------------------
        # 1. 회원가입 API
        # -------------------------------

        # POST 방식으로 회원가입 API를 등록한다.
        # 회원가입. 성공하면 바로 로그인 쿠키를 준다.
        @self.__app.post(self._endpoint + '/auth/signup', tags=['Sign'])
        def signup(request: Request, raw_request: dict):
            # 클라이언트의 요청과 JWT 인증 관련 처리를 관리하는 객체 생성
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 전달받은 회원가입 데이터를 SignupRequest 객체로 변환한다.
            # 이메일, 닉네임, 비밀번호 등의 데이터를 추출한다.
            data_payload = SignupRequest(request=raw_request)
            # 회원가입 요청 데이터가 올바른지 검사하고
            # 필요한 공통 요청 처리를 수행한다.
            request_manager.try_view_management(data_payload=data_payload)
            # 회원가입 로직을 담당하는 컨트롤러 객체 생성
            sign_controller = Sign_Controller()
            # 실제 회원가입 처리
            # 데이터베이스에 회원 정보를 저장한다.
            model = sign_controller.try_signup(database=self.__database, request=request_manager)
            # 회원가입 성공 후 로그인 상태를 유지할 수 있도록
            # 로그인 쿠키와 함께 JSON 응답을 생성한다.
            body_data = model.get_response_form_data(self._head_parser)
            response = request_manager.make_json_response_with_login(body_data=body_data, uid=model.get_uid())
            # 생성한 응답을 클라이언트에게 반환한다.
            return response

        # -------------------------------
        # 2. 로그인 API
        # -------------------------------
        # 로그인
        # POST 방식으로 로그인 API를 등록한다.
        @self.__app.post(self._endpoint + '/auth/login', tags=['Sign'])
        def login(request: Request, raw_request: dict):
            # 클라이언트 요청과 JWT 인증 처리를 관리하는 객체 생성
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 로그인 요청 데이터에서 이메일과 비밀번호를 추출한다.
            data_payload = LoginRequest(request=raw_request)
            # 로그인 요청 데이터의 공통 검증 및 처리를 수행한다.
            request_manager.try_view_management(data_payload=data_payload)
            # 회원 관련 기능을 담당하는 컨트롤러 객체 생성
            sign_controller = Sign_Controller()
            # 실제 로그인 처리
            # 데이터베이스에서 회원을 확인하고 로그인 가능 여부를 검사한다.
            model = sign_controller.try_login(database=self.__database, request=request_manager)
            # 로그인 처리 결과를 응답에 사용할 데이터 형태로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 로그인 성공 시 JWT 로그인 쿠키를 생성하고
            # JSON 응답을 만든다.
            response = request_manager.make_json_response_with_login(body_data=body_data, uid=model.get_uid())
            # 로그인 결과를 클라이언트에게 반환한다.
            return response
        # -------------------------------
        # 3. 로그아웃 API
        # -------------------------------

        # POST 방식으로 로그아웃 API를 등록한다.
        # 로그아웃. 로그인하지 않은 상태여도 성공으로 응답한다.
        @self.__app.post(self._endpoint + '/auth/logout', tags=['Sign'])
        def logout(request: Request):
            # 클라이언트 요청 및 JWT 인증 처리를 관리하는 객체 생성
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
             # 회원 관련 기능을 담당하는 컨트롤러 객체 생성
            sign_controller = Sign_Controller()
            # 실제 로그아웃 처리
            # 로그인하지 않은 상태에서도 성공 응답을 반환하도록 설계되어 있다.
            model = sign_controller.try_logout(database=self.__database)
            # 로그아웃 처리 결과를 응답 데이터 형태로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 로그인 쿠키를 삭제하는 응답을 생성한다.
            response = request_manager.make_json_response_with_logout(body_data=body_data)
            # 로그아웃 결과를 클라이언트에게 반환한다.
            return response
        # -------------------------------
        # 4. 내 정보 조회 API
        # -------------------------------

        # GET 방식으로 내 정보 조회 API를 등록한다.
        # 내 정보. 프론트가 로그인 상태를 확인할 때 부른다.
        @self.__app.get(self._endpoint + '/auth/get_me', tags=['Sign'])
        def get_me(request: Request):
            # 클라이언트 요청 및 JWT 인증 처리를 관리하는 객체 생성
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            # 로그인한 사용자만 접근할 수 있도록 인증 여부를 확인한다.
            # 로그인되어 있지 않으면 요청을 거부한다.
            request_manager.try_view_management_need_authorized()
            # 회원 관련 기능을 담당하는 컨트롤러 객체 생성
            sign_controller = Sign_Controller()
            # 현재 로그인한 사용자의 정보를 조회한다.
            model = sign_controller.get_me(database=self.__database, request=request_manager)
            # 조회한 사용자 정보를 프론트엔드에 전달할 형태로 변환한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 사용자 정보를 JSON 응답으로 생성한다.
            response = request_manager.make_json_response(body_data=body_data)
            # 조회한 내 정보를 클라이언트에게 반환한다.
            return response

# 회원가입 요청 데이터를 관리하는 클래스
# RequestHeader를 상속받아 공통 요청 데이터 처리 기능을 사용한다.
class SignupRequest(RequestHeader):
    # 회원가입 요청 데이터가 들어오면 실행되는 초기화 함수
    def __init__(self, request: dict) -> None:
        # 부모 클래스의 초기화 함수 실행
        # 공통 요청 데이터들을 먼저 처리한다.
        super().__init__(request)
        # 요청 데이터 안에서 body 부분을 가져온다.
        # body가 없으면 빈 딕셔너리({})를 사용한다.
        body = request.get("body", {})
        # body 안에서 email 값을 가져온다.
        # 값이 없으면 빈 문자열("")을 넣고 문자열로 변환한다.
        self.email = str(body.get("email", ""))
        # body 안에서 nickname 값을 가져온다.
        # 값이 없으면 빈 문자열("")을 넣고 문자열로 변환한다.
        self.nickname = str(body.get("nickname", ""))
        # body 안에서 password 값을 가져온다.
        # 값이 없으면 빈 문자열("")을 넣고 문자열로 변환한다.
        self.password = str(body.get("password", ""))

# 로그인 요청 데이터를 관리하는 클래스
# RequestHeader를 상속받아 공통 요청 데이터 처리 기능을 사용한다.
class LoginRequest(RequestHeader):
    # 로그인 요청 데이터가 들어오면 실행되는 초기화 함수
    def __init__(self, request: dict) -> None:
        # 부모 클래스의 초기화 함수 실행
        # 공통 요청 데이터들을 먼저 처리한다.
        super().__init__(request)
        # 요청 데이터 안에서 body 부분을 가져온다.
        # body가 없으면 빈 딕셔너리({})를 사용한다.
        body = request.get("body", {})
        # body 안에서 email 값을 가져온다.
        # 값이 없으면 빈 문자열("")을 넣고 문자열로 변환한다.
        self.email = str(body.get("email", ""))
        # body 안에서 password 값을 가져온다.
        # 값이 없으면 빈 문자열("")을 넣고 문자열로 변환한다.
        self.password = str(body.get("password", ""))
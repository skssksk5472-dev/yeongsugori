#/health는 서버 상태 확인을 하는 기능임 (서버와 DB가 정상 동작하는지 확인)
#/meta/get_categories는 카테고리 목록 조회 기능임 (DB에 저장된 지출 및 수입 카테고리 조회)

# 1. 서버 상태 확인, 카테고리 목록 API 경로 (로그인 불필요)
from fastapi import FastAPI, Request #FastAPI 라이브러리에서 FastAPI와 Request 클래스를 가져옴

from controllers import Core_Controller #controllers에서 Core_COntroller 클래스를 가져옴 (실제 기능을 실행하도록 처리하는 역할)
from utils import Head_Parser, RequestManager #utils에서 Head_Parser와 RequestManager 클래스를 가져옴
from views.master_view import Master_View #views.master_view에서 Master_View 클래스를 가져옴 (상속 개념, Core_Service_View가 Master_View의 기능을 물려받을 수 있게 함)

# 2. Core_Service_View 클래스 정의
class Core_Service_View(Master_View): #Master_View를 상속받은 Core_Service_View를 정의 (서버 상태와 카테고리 조회 API의 경로를 등록하는 역할을 함)
# 3. 초기 설정 (생성자) 
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None: #객체를 생성할 떄 자동으로 실행되는 생성자
        super().__init__(head_parser=head_parser) #super()는 부모 클래스를 가리킴, Master_View의 생성자를 호출하면서 head_parser를 전달
        self.__app = app #전달받은 Fast API앱을 현재 객체에 저장
        self._endpoint = endpoint #API 주소의 공통 앞부분을 저장함
        self.__database = database #DB 객체를 저장, 나중에 Controller에서 DB에 접근할 때 사용할 것
        self.__jwt_secret_key = jwt_secret_key #JWT 관련 비밀키를 저장함 (JWT는 로그인한 사용자의 인증 정보를확인하는 데 자주 사용되는 토큰 방식)
        #API 등록 함수 호출 (객체가 생성되면 두 함수를 호출해서 API 경로를 등록함)
        self.home_route() #/health 경로를 등록하는 함수 호출 (서버 상태 확인 기능)
        self.meta_route() #/meta/get_categories 경로를 등록하는 함수 호출 (카테고리 목록 조회 기능)
# 4. 서버 상태 확인 API (첫 번째 핵심 기능)
    def home_route(self): #이 함수 안에서 서버 상태 확인 API를 등록함
        # 서버와 DB가 살아 있는지 확인
        @self.__app.get(self._endpoint + '/health', tags=['Core']) #데코레이터(Deorator)라고 부름, FastAPI에게 특정 주소로 GET 요청이 들어오면 바로 아래 함수를 실행하라고 알려줌
        def get_health(request: Request): #실제로 /health 요청이 들어왔을 때 실행되는 함수
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key) #RequestManager 객체를 생성, 요청과 비밀키를 전달 (요청을 처리하고 응답을 만드는 역할)
            core_controller = Core_Controller() #Core_Controller 객체를 생성, 서버 상태 확인 기능을 수행하는 컨트롤러 역할
            model = core_controller.get_health(database=self.__database) #실제로 서버와 DB 상태를 확인하도록 요청하는 핵심 코드임, get_health()에 데이터베이스 객체를 전달
            body_data = model.get_response_form_data(self._head_parser) #Controller가 변환한 model 객체를 API 응답에 사용할 데이터 형식으로 변환
            response = request_manager.make_json_response(body_data=body_data) #앞에서 만든 body_data를 이용해 HTTP JSON 응답 객체를 생성
            return response #완성된 응답을 사용자에게 반환
# 5. 카테고리 목록 조회 API (두 번째 핵심 기능)
    def meta_route(self): #카테고리 조회 API를 등록하는 함수
        # 지출·수입 카테고리 목록
        @self.__app.get(self._endpoint + '/meta/get_categories', tags=['Core']) #카테고리 목록을 가져오는 GET API를 등록
        def get_categories(request: Request): #카테고리 조회 요청이 들어오면 실행되는 함수
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key) #사용자 요청을 처리하고 응답을 만들기 위한 객체를 생성함
            core_controller = Core_Controller() #카테고리 조회 기능을 호출하기 위해 Controller 객체를 생성함
            model = core_controller.get_categories(database=self.__database) #카테고리 목록을 가져오는 핵심 코드, Controller에 DB 객체를 전달하고 카테고리 목록을 조회하도록 요청
            body_data = model.get_response_form_data(self._head_parser) #카테고리 정보를 JSON HTTP 응답으로 만든다
            response = request_manager.make_json_response(body_data=body_data) #최종 결과를 웹 브라우저나 프론트엔드에 전달함
            return response

#두 API의 차이점: 어떤 Controller 함수를 호출하느냐가 가장 큰 차이점이다
#핵심 개념: 
# View(Core_Service_View)는 사용자가 요청할 API 주소를 등록하고, Controller 호출과 응답 반환을 연결함
# Controller (Core_Controller)는 요청받은 기능의 처리 로직을 실행함
# Model (model)는 처리 결과를 담고 응답 데이터로 변환하는데 사용된다
# RequestManager는 요청을 객체를 관리하고 JSON 응답을 생성함
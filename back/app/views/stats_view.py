# 분석 API 경로 (로그인 필요)

# typing: 변수나 함수에 어떤 종류의 값이 들어가는지 표시하는 데 사용하는 도구
from typing import Optional

# fasetAPI: 웹 API를 만드는 데 사용하는 클래스 
# request: 사용자가 서버에 보낸 HTTP 요청 정보 담는 객체(요청 주소, 헤더, 쿠키 같은 정보 들어있음)
from fastapi import FastAPI, Request

# 통계 요청을 처리하는 담당클래스
from controllers import Stats_Controller
# 응답 데이터를 만드는 과정에서 사용되는 공통 도구
from utils import Head_Parser, RequestManager
# Master view는 여러 view가 함께 사용하는 기능을 모아 둔 부모클래스
from views.master_view import Master_View

# class: 관련 데이터와 기능을 묶는 클래스
# Stats_Service_View: 통계 API를 담당하는 클래스 이름
# Master_View: Master_View를 상속하여 부모의 기능을 사용할 수 있게 해줌
class Stats_Service_View(Master_View):
    def __init__(self, app: FastAPI, endpoint: str, database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        # super: 부모 클래스 기능에 접근
        # 왼쪽: 받는 매개변수 이름=오른쪽: 전달할 실제 값
        super().__init__(head_parser=head_parser)
        # 전달 받은 fastAPI 앱을 현재 객체에 저장
        self.__app = app
        # API 주소 앞부분 저장
        self._endpoint = endpoint
        # 통계 처리 시 전달할 데이터베이스 객체를 저장
        self.__database = database
        # 요청의 인증 처리에 전달할 JWT 비밀키를 저장
        self.__jwt_secret_key = jwt_secret_key
        # 통계를 계산하는 것이 아니라 API 주소를 등록
        self.stats_route()

    # 통계 API 주소와 해당 주소에서 실행할 함수를 등록하는 메서드
    def stats_route(self):
        # 월별 지출 카테고리 비율과 전월 지출
        # 실제 반환 항목과 계산 방식은 컨트롤러에서 확인해야 한다.
        # @는 바로 아래 함수에 기능을 적용하는 데코레이터 표시다.
        # self.__app.get(...): 아래 함수를 GET 요청 처리 함수로 등록한다.
        # GET: 주로 데이터를 조회할 때 사용하는 HTTP 요청 방식.
        # +: 여기서는 두 문자열을 이어 붙인다.
        # endpoint가 "/api"라면 최종 주소는
        # "/api/stats/get_category_stats"가 된다.
        # tags=['Stats']: 자동 API 문서에서 Stats 그룹으로 분류한다.
        # ['Stats']는 문자열 'Stats' 하나가 들어 있는 리스트다.
        @self.__app.get(self._endpoint + '/stats/get_category_stats', tags=['Stats'])
        # 위 주소로 GET 요청이 들어오면 실행되는 함수.
        # request: FastAPI가 현재 HTTP 요청 객체를 넣어 준다.
        # month: URL의 쿼리 매개변수로 받는 조회 대상 월.
        def get_category_stats(request: Request, month: Optional[str] = ""):

            # # RequestManager 객체를 생성하여 request_manager에 저장한다.
            # request=request: 현재 HTTP 요청을 전달한다.
            # secret_key=...: 저장해 둔 JWT 비밀키를 전달한다.
            request_manager = RequestManager(request=request, secret_key=self.__jwt_secret_key)
            #  # 아래에서 정의한 GetCategoryStatsRequest 객체를 만든다.
            # 사용자가 전달한 월을 이 객체의 month 속성에 저장한다.
            # 예: data_payload.month == "2026-11"
            data_payload = GetCategoryStatsRequest(month=month)
             # 인증이 필요한 요청을 처리하는 공통 메서드를 호출한다.
            # 조회할 월이 담긴 data_payload도 함께 전달한다.
            # 인증 검사, 데이터 저장, 실패 시 중단 방식 등
            # 구체적인 동작은 이 메서드 내부를 확인해야 한다.
            request_manager.try_view_management_need_authorized(data_payload=data_payload)
             # 통계 처리를 담당하는 Stats_Controller 객체를 만든다
            stats_controller = Stats_Controller()
            # 컨트롤러의 get_category_stats 메서드를 실행한다.
            # database: 데이터베이스 객체를 전달한다.
            # request: 원래의 Request가 아니라 RequestManager를 전달한다.
            # 반환된 결과 객체를 model이라는 변수에 저장한다.
            # 여기서 model은 통계 결과를 다루는 객체이며,
            # 이 코드에서 머신러닝 모델을 의미하는 것은 아니다.
            model = stats_controller.get_category_stats(database=self.__database, request=request_manager)
             # 결과 객체를 응답 본문에 넣을 데이터로 변환한다.
            # self._head_parser는 부모 클래스에서 제공하는 것으로 보인다.
            # 정확한 설정 방식과 반환 구조는 관련 구현을 확인해야 한다.
            body_data = model.get_response_form_data(self._head_parser)
            # 준비한 본문 데이터를 이용하여 JSON 응답을 만든다.
            # JSON은 프론트엔드와 서버가 데이터를 주고받는 데 쓰는 형식이다.
            response = request_manager.make_json_response(body_data=body_data)
            # return: 함수 실행을 끝내고 결과를 반환한다.
            # FastAPI가 이 응답을 요청한 클라이언트에게 전달한다.
            return response

# 통계 조회 조건을 담기 위한 클래스.
# 현재는 조회할 월(month) 하나만 보관한다.
# 일반 파이썬 클래스이므로 자동 데이터 검증 기능은 없다.
class GetCategoryStatsRequest:
     # 객체를 생성할 때 month를 전달받는다.
    # month: str은 문자열을 기대한다는 타입 표시이며,
    # 이 표시 자체가 잘못된 값을 자동으로 차단하지는 않는다.
    def __init__(self, month: str) -> None:
        # 전달받은 월을 현재 객체의 month 속성에 저장한다.
        # 이후 객체이름.month로 값을 꺼낼 수 있다.
        self.month = month

# 모든 view의 부모 — 응답 header를 만드는 head_parser를 들고 있다. 요청 클래스의 부모(RequestHeader)도 여기 둔다.
# 응답 데이터를 만들 때 필요한 head_parser를 저장하는 역할

class Master_View: #Core_Service_View가 Master_View를 상속받기 때문에 부모 클래스가 저장한 head_parser를 사용할 수 있게 됨
    def __init__(self, head_parser) -> None: #객체가 생성될 때 자동으로 실행되는 생성자, head_parser를 전달받음
        self._head_parser = head_parser #외부에서 전달받은 head_parser를 객체 내부에 저장한다


# POST 요청 {header, body} 의 header를 받아 둔다. 자식 클래스가 body에서 필요한 값을 꺼낸다.
class RequestHeader: #요청 데이터에서 header 정보를 저장하는 클래스, 다른 요청 클래스의 부모로 사용됨
    def __init__(self, request: dict) -> None: #객체가 생성될 때 실행되는 생성자, 요청이라는 딕셔너리를 전달받음
        self.header = request.get("header", {}) #request에서 header 값을 가져와 저장하고 header가 없으면 빈 딕셔너리 {}를 저장함
#핵심 정리
#Master_View = 여러 View 클래스가 공통으로 사용하는 head_parser를 저장하는 부모 클래스
#RequestHeader = POST 요청 데이터에서 header 부분을 꺼내 저장하는 부모 클래스, 다른 요청 클래스가 상속받아 사용
#이 파일은 API 주소를 직저 등록하거나 DB를 조회하지 않음, 다른 클래스에서 고통으로 사용할 기본 기능을 정의한 파일이다
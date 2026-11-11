# 모든 view의 부모 — 응답 header를 만드는 head_parser를 들고 있다. 요청 클래스의 부모(RequestHeader)도 여기 둔다.


class Master_View:
    def __init__(self, head_parser) -> None:
        self._head_parser = head_parser


# POST 요청 {header, body} 의 header를 받아 둔다. 자식 클래스가 body에서 필요한 값을 꺼낸다.
class RequestHeader:
    def __init__(self, request: dict) -> None:
        self.header = request.get("header", {})

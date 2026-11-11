# 데이터 도메인의 부모 — DB 문서 한 개를 파이썬 객체 하나로 다룬다. 필드는 평평하게 둔다 (04 문서).


class BaseDomain:
    # 객체의 ID값 반환. 자식 클래스에서 다시 정의한다.
    def get_id(self) -> str:
        return ""

    # DB에서 받아온 dict로 내용을 채운다. 자식 클래스에서 다시 정의한다.
    def make_with_dict(self, dict_data: dict):
        return self

    # DB에 저장할 dict. 자식 클래스에서 다시 정의한다.
    def get_dict_form_data(self) -> dict:
        return {}

    def __eq__(self, other):
        return self.get_id() == other.get_id()

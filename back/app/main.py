# 서버 시작점 — DB를 연결하고 view들을 조립해 FastAPI 앱을 만든다.
# 개발: back/app 폴더에서 python main.py  (docker: uvicorn main:app)

import re

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pymongo.errors import ConfigurationError, OperationFailure, PyMongoError

from models import Mongo_Database
from others import config
from utils import CredentialsException, Head_Parser
from views import (Core_Service_View, Receipt_Service_View, Sign_Service_View, Stats_Service_View,
                       Transaction_Service_View, User_Service_View)

YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"

VERSION = "v0.1.0"


class ZALSSM_Server:
    def __init__(self, database: Mongo_Database, head_parser: Head_Parser, jwt_secret_key: str) -> None:
        self.__app = FastAPI(title="ZALSSM API")
        self.__head_parser = head_parser

        # 로그인이 필요한 API에 토큰 없이 오면 HTTP 401 + unauthorized 로 응답한다.
        self.__app.add_exception_handler(CredentialsException, self.__handle_credentials_exception)

        # 모든 API는 /api 아래에 둔다. nginx가 /api 를 이 서버로 보낸다.
        self.__core_system_view = Core_Service_View(app=self.__app,
                                                    endpoint='/api',
                                                    database=database,
                                                    head_parser=head_parser,
                                                    jwt_secret_key=jwt_secret_key,
                                                    )

        self.__sign_system_view = Sign_Service_View(app=self.__app,
                                                    endpoint='/api',
                                                    database=database,
                                                    head_parser=head_parser,
                                                    jwt_secret_key=jwt_secret_key,
                                                    )

        self.__user_system_view = User_Service_View(app=self.__app,
                                                    endpoint='/api',
                                                    database=database,
                                                    head_parser=head_parser,
                                                    jwt_secret_key=jwt_secret_key,
                                                    )

        self.__transaction_system_view = Transaction_Service_View(app=self.__app,
                                                                  endpoint='/api',
                                                                  database=database,
                                                                  head_parser=head_parser,
                                                                  jwt_secret_key=jwt_secret_key,
                                                                  )

        self.__stats_system_view = Stats_Service_View(app=self.__app,
                                                      endpoint='/api',
                                                      database=database,
                                                      head_parser=head_parser,
                                                      jwt_secret_key=jwt_secret_key,
                                                      )

        self.__receipt_system_view = Receipt_Service_View(app=self.__app,
                                                          endpoint='/api',
                                                          database=database,
                                                          head_parser=head_parser,
                                                          jwt_secret_key=jwt_secret_key,
                                                          )

    def __handle_credentials_exception(self, request: Request, exc: CredentialsException) -> JSONResponse:
        body_data = {
            "header": self.__head_parser.get_header(),
            "body": {"result": False, "detail": "로그인이 필요합니다", "error_code": "unauthorized"},
        }
        return JSONResponse(content=body_data, status_code=401)

    def get_app(self) -> FastAPI:
        return self.__app


# 시작하다 멈출 때는 긴 traceback 대신 원인과 고칠 곳을 한 줄씩 보여 준다.
def stop_server(*lines: str) -> None:
    for line in lines:
        print(f'{RED}ERROR{RESET}<-[     Application | {line}')
    raise SystemExit(1)


# 로그에 비밀번호가 남지 않도록 주소의 "아이디:비밀번호@" 부분을 가린다.
def hide_password(uri: str) -> str:
    return re.sub(r"//[^@/]+@", "//***@", uri)


# DB 연결 실패의 종류에 따라 확인할 곳을 알려 준다.
def db_error_hint(error: PyMongoError) -> str:
    if "//mongo:" in config.MONGODB_URI:
        return ("mongo:27017 은 로컬 mongo 컨테이너 주소입니다. Atlas를 쓰면 .env 의 MONGODB_URI 를 Atlas 주소로 바꾸고 "
                "docker compose up -d --force-recreate back 으로 다시 만드세요.")
    if isinstance(error, OperationFailure):
        return "DB 아이디 또는 비밀번호가 틀렸습니다. Atlas Database Access 와 주소의 <password> 를 확인하세요."
    if isinstance(error, ConfigurationError):
        return "주소 형식이 올바르지 않거나 클러스터 이름을 찾을 수 없습니다. Atlas 에서 주소를 다시 복사하세요."
    return "DB에 닿지 못했습니다. Atlas Network Access 에 이 PC의 IP가 있는지, 인터넷 연결을 확인하세요."


print(f'{YELLOW}INFO{RESET}<-[      Application | Welcome to ZALSSM Server')
print(f'{YELLOW}INFO{RESET}<-[      Application | Version : {VERSION}')

# 0. 비밀 키가 없으면 시작하지 않는다 (.env 의 JWT_SECRET_KEY)
if not config.JWT_SECRET_KEY:
    stop_server("JWT_SECRET_KEY 가 비어 있습니다.", ".env 에 길고 임의의 문자열로 채우세요.")

# 1. DB 연결, 인덱스 만들기 (여기서 처음으로 DB에 닿는다)
try:
    database = Mongo_Database(uri=config.MONGODB_URI, db_name=config.MONGODB_DB)
    database.make_indexes()
except PyMongoError as error:
    stop_server(f"DB에 연결하지 못했습니다: {hide_password(config.MONGODB_URI)}", db_error_hint(error))

# 2. 서버 조립
zalssm_server = ZALSSM_Server(database=database, head_parser=Head_Parser(), jwt_secret_key=config.JWT_SECRET_KEY)

# 3. uvicorn이 바라볼 최종 FastAPI 앱 객체
app = zalssm_server.get_app()

# python main.py 로 직접 켤 때. 코드를 고치면 자동으로 다시 켜진다(reload). 같은 Wi-Fi의 휴대폰에서도 접속할 수 있게 0.0.0.0
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

FROM python:3.12-slim
WORKDIR /app
# print 출력(시작 안내)이 docker 로그에 바로 보이게 한다
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# app 폴더 안의 내용(main.py, models/, views/ ...)을 /app 에 그대로 둔다. 개발에서 back/app 에서 켜는 것과 같다
COPY app/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

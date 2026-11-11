# pip install fastapi uvicorn

from typing import Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

import uvicorn

app = FastAPI(
    title="FastAPI Practice API",
    description="FastAPI 연습을 위한 기본 예제 코드입니다.",
    version="1.0.0"
)

# --- Sample In-Memory Database ---
items_db = {
    1: {"name": "노트북", "price": 1200000, "is_offer": True},
    2: {"name": "마우스", "price": 35000, "is_offer": False},
}


# --- Request Body Schema ---
class Item(BaseModel):
    name: str
    price: int
    is_offer: Optional[bool] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    is_offer: Optional[bool] = None


# --- API Routes ---

@app.get("/")
def read_root():
    """기본 헬스체크 루트 엔드포인트"""
    return {"message": "어서오세요."}


@app.get("/items")
def get_items(skip: int = 0, limit: int = 10):
    """목록 조회 (쿼리 파라미터 연습: /items?skip=0&limit=5)"""
    item_list = list(items_db.values())
    return item_list[skip : skip + limit]


@app.get("/items/{item_id}")
def get_item(item_id: int):
    """단일 아이템 조회 (경로 파라미터 연습)"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found"
        )
    return {"item_id": item_id, "data": items_db[item_id]}


@app.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(item: Item):
    """새 아이템 생성 (JSON 바디 검증 연습)"""
    new_id = max(items_db.keys(), default=0) + 1
    items_db[new_id] = item.model_dump()
    return {"item_id": new_id, "data": items_db[new_id]}


@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemUpdate):
    """아이템 수정"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found"
        )
    
    # 전달된 데이터만 업데이트
    stored_item = items_db[item_id]
    update_data = item.model_dump(exclude_unset=True)
    stored_item.update(update_data)
    
    return {"item_id": item_id, "data": stored_item}


@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    """아이템 삭제"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found"
        )
    del items_db[item_id]
    return None


if __name__ == "__main__":
    # app 객체를 직접 전달하거나 "파일명:app" 문자열로 전달
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
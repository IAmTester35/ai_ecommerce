from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import time

# Load biến môi trường trước khi import các module khác
load_dotenv()

from models.schemas import QueryRequest, SearchResponse, CarResponse # Need to move schemas.py to models
from agent import extract_constraints, generate_ai_response
from retrieval import hybrid_search

# Import routers
from routers import users, cars, cart_orders, wishlist, interactions, notifications, admin

app = FastAPI(title="AutoMatch AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router)
app.include_router(cars.router)
app.include_router(cart_orders.router)
app.include_router(wishlist.router)
app.include_router(interactions.router)
app.include_router(notifications.router)
app.include_router(admin.router)

@app.post("/api/search", response_model=SearchResponse)
async def search_cars(request: QueryRequest):
    try:
        t0 = time.time()
        
        # 1. Phân tích câu truy vấn
        constraints = extract_constraints(request.query)
        t1 = time.time()
        
        # 2. Truy xuất dữ liệu & Kiểm tra mâu thuẫn
        cars_data, conflict = hybrid_search(
            soft_intent=constraints.soft_intent,
            max_price=constraints.max_price,
            manufacturer=constraints.manufacturer,
            top_k=3
        )
        t2 = time.time()
        
        # 3. Tạo câu trả lời tự nhiên
        ai_message = generate_ai_response(request.query, constraints, cars_data, conflict)
        t3 = time.time()
        
        # 4. Trả về kết quả JSON cho Frontend
        results = [CarResponse(**car) for car in cars_data]
        
        return SearchResponse(
            original_query=request.query,
            constraints=constraints,
            results=results,
            conflict_detected=conflict,
            ai_message=ai_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


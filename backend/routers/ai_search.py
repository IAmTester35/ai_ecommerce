from fastapi import APIRouter, HTTPException
import time

from models.schemas import QueryRequest, SearchResponse, CarResponse
from services.agent import extract_constraints, generate_ai_response
from services.retrieval import hybrid_search

router = APIRouter(
    prefix="/api/search",
    tags=["AI Search"]
)

@router.post("", response_model=SearchResponse)
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

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
def search_cars(request: QueryRequest):
    try:
        t0 = time.time()
        
        # 1. Phân tích câu truy vấn
        constraints = extract_constraints(request.query)
        t1 = time.time()
        print(f"  -> [Timer] extract_constraints took {t1 - t0:.2f}s")
        
        # 2. Truy xuất dữ liệu & Kiểm tra mâu thuẫn
        if constraints.is_out_of_scope:
            cars_data, conflict, relaxed_terms = [], False, []
        else:
            cars_data, conflict, relaxed_terms = hybrid_search(
                soft_intent=constraints.soft_intent,
                max_price=constraints.max_price,
                make=constraints.make,
                target_year=constraints.target_year,
                min_hp=constraints.min_hp,
                fuel_type=constraints.fuel_type,
                top_k=3
            )
        t2 = time.time()
        print(f"  -> [Timer] hybrid_search took {t2 - t1:.2f}s")
        
        # 3. Tạo câu trả lời tự nhiên
        ai_message = generate_ai_response(request.query, constraints, cars_data, conflict)
        t3 = time.time()
        print(f"  -> [Timer] generate_ai_response took {t3 - t2:.2f}s")
        print(f"  -> [Timer] TOTAL REQUEST TOOK {t3 - t0:.2f}s")
        
        # 4. Trả về kết quả JSON cho Frontend
        results = [CarResponse(**car) for car in cars_data]
        
        return SearchResponse(
            original_query=request.query,
            constraints=constraints,
            results=results,
            conflict_detected=conflict,
            relaxed_terms=relaxed_terms,
            ai_message=ai_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

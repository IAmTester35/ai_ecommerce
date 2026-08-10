from fastapi import APIRouter, HTTPException
import time

from models.schemas import QueryRequest, SearchResponse, CarResponse
from services.agent import extract_constraints, generate_ai_response
from services.retrieval import hybrid_search
from services.image import fetch_images_for_cars
import asyncio

router = APIRouter(
    prefix="/api/search",
    tags=["AI Search"]
)

@router.post("", response_model=SearchResponse)
async def search_cars(request: QueryRequest):
    try:
        t0 = time.time()
        
        # 1. Phân tích câu truy vấn
        constraints = await asyncio.to_thread(extract_constraints, request.query)
        t1 = time.time()
        print(f"  -> [Timer] extract_constraints took {t1 - t0:.2f}s")
        
        # 2. Truy xuất dữ liệu & Kiểm tra mâu thuẫn
        if constraints.is_out_of_scope:
            cars_data, conflict, relaxed_terms = [], False, []
        else:
            cars_data, conflict, relaxed_terms = await asyncio.to_thread(
                hybrid_search,
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
        
        # 3. Tạo câu trả lời tự nhiên và Tải ảnh (Chạy song song)
        async def measure_time(name, coro):
            ts = time.time()
            res = await coro
            print(f"  -> [Timer] {name} took {time.time() - ts:.2f}s")
            return res

        ai_task = measure_time("generate_ai_response", asyncio.to_thread(
            generate_ai_response, request.query, constraints, cars_data, conflict, relaxed_terms
        ))
        image_task = measure_time("fetch_images_for_cars", fetch_images_for_cars(cars_data))
        
        ai_message, cars_with_images = await asyncio.gather(ai_task, image_task)
        
        t3 = time.time()
        print(f"  -> [Timer] TOTAL REQUEST TOOK {t3 - t0:.2f}s")
        
        # 4. Trả về kết quả JSON cho Frontend
        results = [CarResponse(**car) for car in cars_with_images]
        
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

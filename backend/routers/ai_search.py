from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import time
import json
import asyncio

from models.schemas import QueryRequest, CarResponse
from services.agent import extract_constraints, generate_ai_response
from services.retrieval import hybrid_search
from services.image import fetch_images_for_cars
from core.dependencies import get_supabase, get_optional_user_id

router = APIRouter(
    prefix="/api/search",
    tags=["AI Search"]
)

@router.post("")
async def search_cars(
    request: QueryRequest,
    user_id: str | None = Depends(get_optional_user_id),
    supabase=Depends(get_supabase)
):
    try:
        # Lấy lịch sử chat của session
        history_response = await asyncio.to_thread(
            supabase.table("chat_sessions").select("role, content").eq("session_id", request.session_id).order("created_at").execute
        )
        chat_history = history_response.data or []
        
        # Lưu tin nhắn mới của user
        await asyncio.to_thread(
            supabase.table("chat_sessions").insert({
                "session_id": request.session_id,
                "user_id": user_id,
                "role": "user",
                "content": request.query
            }).execute
        )
        
        async def event_generator():
            t0 = time.time()
            
            # 1. Phân tích câu truy vấn
            constraints = await asyncio.to_thread(extract_constraints, request.query)
            t1 = time.time()
            print(f"  -> [Timer] extract_constraints took {t1 - t0:.2f}s")
            
            # 2. Truy xuất dữ liệu
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
            
            # Tải ảnh
            cars_with_images = await fetch_images_for_cars(cars_data)
            results = [CarResponse(**car).model_dump() for car in cars_with_images]
            
            # Gửi event search_data trước để FE hiện danh sách xe ngay
            search_data = {
                "original_query": request.query,
                "constraints": constraints.model_dump(),
                "results": results,
                "conflict_detected": conflict,
                "relaxed_terms": relaxed_terms
            }
            yield f"event: search_data\ndata: {json.dumps(search_data)}\n\n"
            
            # 3. Tạo câu trả lời tự nhiên (Streaming)
            ai_generator = await asyncio.to_thread(
                generate_ai_response, 
                request.query, 
                constraints, 
                cars_with_images, 
                conflict, 
                chat_history,
                relaxed_terms
            )
            
            full_ai_message = ""
            # Vì ai_generator là synchronous generator (google-genai synchronous client)
            # ta dùng asyncio.to_thread để tránh block event loop với mỗi yield (tuy nhiên next() trong generator sẽ block một chút)
            # Lý tưởng nhất là dùng async client, nhưng tạm thời chạy trong thread cho từng chunk:
            while True:
                try:
                    chunk = await asyncio.to_thread(next, ai_generator)
                    full_ai_message += chunk
                    yield f"event: message\ndata: {json.dumps({'text': chunk})}\n\n"
                except StopIteration:
                    break
            
            t3 = time.time()
            print(f"  -> [Timer] TOTAL STREAMING TOOK {t3 - t0:.2f}s")
            
            # Lưu tin nhắn của assistant vào DB
            await asyncio.to_thread(
                supabase.table("chat_sessions").insert({
                    "session_id": request.session_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": full_ai_message
                }).execute
            )
            
        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

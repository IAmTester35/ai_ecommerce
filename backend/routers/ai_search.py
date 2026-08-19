import time
import json
import logging
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from models.schemas import QueryRequest, CarResponse
from services.agent import extract_constraints, generate_ai_response
from services.retrieval import hybrid_search
from services.image import fetch_images_for_cars
from core.dependencies import get_supabase, get_optional_user_id

logger = logging.getLogger(__name__)

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
    """
    Endpoint AI Search kết hợp Hybrid Vector Search, Reranking, và Native Async SSE Streaming.
    """
    try:
        # Lấy lịch sử chat của session bất đồng bộ
        history_response = await asyncio.to_thread(
            supabase.table("chat_sessions")
            .select("role, content")
            .eq("session_id", request.session_id)
            .order("created_at")
            .execute
        )
        chat_history = history_response.data or []

        # Lưu tin nhắn mới của user bất đồng bộ
        await asyncio.to_thread(
            supabase.table("chat_sessions").insert({
                "session_id": request.session_id,
                "user_id": user_id,
                "role": "user",
                "content": request.query
            }).execute
        )

        async def event_generator():
            try:
                t0 = time.time()

                # 1. Bóc tách yêu cầu và Semantic Expansion
                constraints = await extract_constraints(request.query)
                t1 = time.time()
                logger.info(f"[Timer] extract_constraints took {t1 - t0:.2f}s")

                # 2. Truy xuất dữ liệu Hybrid Search
                if constraints.is_out_of_scope:
                    cars_data, conflict, relaxed_terms = [], False, []
                else:
                    cars_data, conflict, relaxed_terms = await hybrid_search(
                        soft_intent=constraints.soft_intent,
                        max_price=constraints.max_price,
                        make=constraints.make,
                        target_year=constraints.target_year,
                        min_hp=constraints.min_hp,
                        fuel_type=constraints.fuel_type,
                        top_k=3
                    )
                t2 = time.time()
                logger.info(f"[Timer] hybrid_search took {t2 - t1:.2f}s")

                # 3. Tải ảnh song song
                cars_with_images = await fetch_images_for_cars(cars_data)
                results = [CarResponse(**car).model_dump() for car in cars_with_images]

                # Gửi event search_data trước để FE render thẻ sản phẩm ngay lập tức
                search_data = {
                    "original_query": request.query,
                    "constraints": constraints.model_dump(),
                    "results": results,
                    "conflict_detected": conflict,
                    "relaxed_terms": relaxed_terms
                }
                yield f"event: search_data\ndata: {json.dumps(search_data)}\n\n"

                # 4. Tư vấn AI bằng Native Async Streaming
                full_ai_message = ""
                async for chunk in generate_ai_response(
                    query=request.query,
                    constraints=constraints,
                    cars=cars_with_images,
                    conflict_detected=conflict,
                    chat_history=chat_history,
                    relaxed_terms=relaxed_terms
                ):
                    full_ai_message += chunk
                    yield f"event: message\ndata: {json.dumps({'text': chunk})}\n\n"

                t3 = time.time()
                logger.info(f"[Timer] TOTAL SEARCH & STREAMING TOOK {t3 - t0:.2f}s")

                # 5. Lưu phản hồi của AI assistant vào Database
                if full_ai_message:
                    await asyncio.to_thread(
                        supabase.table("chat_sessions").insert({
                            "session_id": request.session_id,
                            "user_id": user_id,
                            "role": "assistant",
                            "content": full_ai_message
                        }).execute
                    )

            except Exception as stream_err:
                logger.error(f"Error during SSE streaming: {stream_err}")
                yield f"event: error\ndata: {json.dumps({'error': str(stream_err)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        logger.error(f"Failed to initiate search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

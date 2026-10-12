import time
import logging
import asyncio
from fastapi import APIRouter, HTTPException, Depends

from models.schemas import QueryRequest, CarResponse, SearchResponse
from services.agent import extract_constraints, generate_ai_response
from services.retrieval import hybrid_search
from services.image import fetch_images_for_cars
from core.dependencies import get_supabase, get_optional_user_id

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/search",
    tags=["AI Search"]
)

@router.post("", response_model=SearchResponse)
async def search_cars(
    request: QueryRequest,
    user_id: str | None = Depends(get_optional_user_id),
    supabase=Depends(get_supabase)
):
    """
    Endpoint AI Search kết hợp Hybrid Vector Search, Reranking, và Gemini LLM.
    Trả về SearchResponse dạng JSON trực tiếp cho client.
    """
    try:
        t0 = time.time()

        # 1. Lấy lịch sử chat của session bất đồng bộ (nếu có)
        try:
            history_response = await asyncio.to_thread(
                supabase.table("chat_sessions")
                .select("role, content")
                .eq("session_id", request.session_id)
                .order("created_at")
                .execute
            )
            chat_history = history_response.data or []
        except Exception as e:
            logger.warning(f"Could not load chat history for session {request.session_id}: {e}")
            chat_history = []

        # 2. Lưu tin nhắn mới của user bất đồng bộ
        try:
            await asyncio.to_thread(
                supabase.table("chat_sessions").insert({
                    "session_id": request.session_id,
                    "user_id": user_id,
                    "role": "user",
                    "content": request.query
                }).execute
            )
        except Exception as e:
            logger.warning(f"Could not save user message to chat_sessions: {e}")

        # 3. Giai đoạn 1: Bóc tách yêu cầu và Semantic Expansion
        constraints = await extract_constraints(request.query)
        t1 = time.time()
        logger.info(f"[Timer] extract_constraints took {t1 - t0:.2f}s")

        # 4. Giai đoạn 2: Truy xuất dữ liệu Hybrid Search
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

        # 5. Giai đoạn 3: Tải ảnh và thông số chi tiết song song
        cars_with_images = await fetch_images_for_cars(cars_data)
        results = [CarResponse(**car) for car in cars_with_images]

        # 6. Giai đoạn 4: Sinh câu trả lời tư vấn AI
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

        t3 = time.time()
        logger.info(f"[Timer] TOTAL SEARCH & GENERATION TOOK {t3 - t0:.2f}s")

        # 7. Lưu phản hồi của AI assistant vào Database
        if full_ai_message:
            try:
                await asyncio.to_thread(
                    supabase.table("chat_sessions").insert({
                        "session_id": request.session_id,
                        "user_id": user_id,
                        "role": "assistant",
                        "content": full_ai_message
                    }).execute
                )
            except Exception as db_err:
                logger.warning(f"Could not save assistant response to chat_sessions: {db_err}")

        return SearchResponse(
            original_query=request.query,
            constraints=constraints,
            results=results,
            conflict_detected=conflict,
            relaxed_terms=relaxed_terms or [],
            ai_message=full_ai_message
        )

    except Exception as e:
        logger.error(f"Failed to execute search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

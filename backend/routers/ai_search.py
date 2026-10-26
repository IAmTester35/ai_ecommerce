import time
import logging
import asyncio
from datetime import datetime
import zoneinfo
from fastapi import APIRouter, HTTPException, Depends

from models.schemas import QueryRequest, CarResponse, SearchResponse
from services.agent import extract_constraints, generate_ai_response
from services.test_drive_tool import current_user_id_ctx, current_user_profile_ctx
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
    Xử lý song song các tác vụ độc lập để giảm thiểu thời gian chờ (Latency).
    """
    t0 = time.time()
    logger.info(f"[AI Search] Request query: '{request.query}' | session={request.session_id} | user={user_id or 'guest'}")

    try:
        # Hàm phụ trợ truy vấn chat history bất đồng bộ
        async def _load_history():
            try:
                history_response = await asyncio.to_thread(
                    supabase.table("chat_sessions")
                    .select("role, content")
                    .eq("session_id", request.session_id)
                    .order("created_at")
                    .execute
                )
                return history_response.data or []
            except Exception as e:
                logger.warning(f"Could not load chat history for session {request.session_id}: {e}")
                return []

        # Hàm phụ trợ lưu tin nhắn người dùng bất đồng bộ
        async def _save_user_msg():
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

        # Hàm phụ trợ tải thông tin profile người dùng nếu đã đăng nhập
        async def _load_user_profile():
            if not user_id:
                return None
            try:
                prof_res = await asyncio.to_thread(
                    supabase.table("profiles")
                    .select("id, full_name, phone, email")
                    .eq("id", user_id)
                    .limit(1)
                    .execute
                )
                return prof_res.data[0] if prof_res.data else None
            except Exception as e:
                logger.warning(f"Could not load user profile for {user_id}: {e}")
                return None

        # Xác định thời gian thực tế tại Việt Nam để giải quyết các mốc tương đối ("ngày mai", "thứ 7", v.v.)
        tz_vn = zoneinfo.ZoneInfo("Asia/Ho_Chi_Minh")
        current_time_str = datetime.now(tz_vn).strftime("%A, %Y-%m-%d %H:%M:%S %Z")

        # Khởi chạy song song: Bóc tách yêu cầu (LLM) + Nạp Chat History + Profile + Ghi User Message vào DB
        t_extract_start = time.time()
        constraints_task = asyncio.create_task(extract_constraints(request.query))
        history_task = asyncio.create_task(_load_history())
        profile_task = asyncio.create_task(_load_user_profile())
        save_user_task = asyncio.create_task(_save_user_msg())

        # Chờ trích xuất tiêu chí
        constraints = await constraints_task
        t_extract = time.time() - t_extract_start
        logger.info(
            f"[Timer] extract_constraints took {t_extract:.2f}s | "
            f"make={constraints.make}, max_price={constraints.max_price}, min_hp={constraints.min_hp}, "
            f"fuel={constraints.fuel_type}, out_of_scope={constraints.is_out_of_scope}"
        )

        # Giai đoạn 2: Truy xuất dữ liệu Hybrid Search
        t_search_start = time.time()
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
        t_search = time.time() - t_search_start
        logger.info(f"[Timer] hybrid_search took {t_search:.2f}s (found {len(cars_data)} cars, conflict={conflict})")

        # Giai đoạn 3: Tải ảnh song song (song song nội bộ trong fetch_images_for_cars)
        cars_with_images = await fetch_images_for_cars(cars_data)
        results = [CarResponse(**car) for car in cars_with_images]

        # Đảm bảo chat_history, profile và lưu tin nhắn user đã xong trước khi generate
        chat_history = await history_task
        user_profile = await profile_task
        await save_user_task

        user_context = {
            "user_id": user_id,
            "user_name": user_profile.get("full_name") if user_profile else None,
            "user_phone": user_profile.get("phone") if user_profile else None,
        }

        # Giai đoạn 4: Sinh câu trả lời tư vấn AI
        t_gen_start = time.time()
        full_ai_message = ""
        token_uid = current_user_id_ctx.set(user_id)
        token_prof = current_user_profile_ctx.set(user_profile)
        try:
            async for chunk in generate_ai_response(
                query=request.query,
                constraints=constraints,
                cars=cars_with_images,
                conflict_detected=conflict,
                chat_history=chat_history,
                relaxed_terms=relaxed_terms,
                user_context=user_context,
                current_time_str=current_time_str
            ):
                full_ai_message += chunk
        finally:
            current_user_id_ctx.reset(token_uid)
            current_user_profile_ctx.reset(token_prof)

        t_gen = time.time() - t_gen_start
        logger.info(f"[Timer] generate_ai_response took {t_gen:.2f}s ({len(full_ai_message)} chars)")

        t_total = time.time() - t0
        logger.info(
            f"[Timer] TOTAL SEARCH PIPELINE TOOK {t_total:.2f}s "
            f"[extract={t_extract:.2f}s, search={t_search:.2f}s, gen={t_gen:.2f}s]"
        )

        # Lưu phản hồi của AI assistant vào DB dưới dạng Background Task (không chặn response trả về)
        if full_ai_message:
            async def _bg_save_assistant_msg(session_id: str, uid: str | None, content: str):
                try:
                    await asyncio.to_thread(
                        supabase.table("chat_sessions").insert({
                            "session_id": session_id,
                            "user_id": uid,
                            "role": "assistant",
                            "content": content
                        }).execute
                    )
                except Exception as db_err:
                    logger.warning(f"Could not save assistant response to chat_sessions: {db_err}")

            asyncio.create_task(_bg_save_assistant_msg(request.session_id, user_id, full_ai_message))

        return SearchResponse(
            original_query=request.query,
            constraints=constraints,
            results=results,
            conflict_detected=conflict,
            relaxed_terms=relaxed_terms or [],
            ai_message=full_ai_message
        )

    except Exception as e:
        logger.error(f"Failed to execute search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

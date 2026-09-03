import logging
import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client
from core.dependencies import get_supabase
from services.retrieval import get_embedding

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Vectorization"])

class ModerateReviewRequest(BaseModel):
    review_id: str
    is_approved: bool

@router.post("/batch-embed")
async def batch_embed_reviews(
    db: Client = Depends(get_supabase)
) -> Dict[str, Any]:
    """
    Quét các bài đánh giá chưa có vector embedding (NULL),
    sử dụng Gemini Text-Embedding sinh vector 768 chiều và lưu vào Supabase.
    Phục vụ cho tính năng RAG / Vector Match Cars.
    """
    try:
        # Lấy tối đa 20 reviews chưa được vector hóa
        res = await asyncio.to_thread(
            db.table("reviews")
            .select("id, comment")
            .is_("embedding", "null")
            .not_.is_("comment", "null")
            .limit(20)
            .execute
        )
        reviews_to_process = res.data or []

        if not reviews_to_process:
            return {
                "success": True,
                "processed_count": 0,
                "message": "Tất cả các bài đánh giá đều đã được vector hóa."
            }

        success_count = 0
        failed_count = 0

        for r in reviews_to_process:
            review_id = r["id"]
            comment = r["comment"]
            if not comment or not comment.strip():
                continue

            try:
                # Tạo vector 768 chiều từ Gemini
                embedding = await get_embedding(comment.strip())
                await asyncio.to_thread(
                    db.table("reviews")
                    .update({"embedding": embedding})
                    .eq("id", review_id)
                    .execute
                )
                success_count += 1
            except Exception as item_err:
                logger.warning(f"Failed to embed review {review_id}: {item_err}")
                failed_count += 1

        return {
            "success": True,
            "processed_count": success_count,
            "failed_count": failed_count,
            "message": f"Đã vector hóa thành công {success_count} bài đánh giá."
        }

    except Exception as e:
        logger.error(f"Error in batch_embed_reviews: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi vector hóa đánh giá: {str(e)}"
        )

@router.post("/moderate")
async def moderate_review(
    req: ModerateReviewRequest,
    db: Client = Depends(get_supabase)
) -> Dict[str, Any]:
    """
    Cập nhật trạng thái duyệt của bài đánh giá
    """
    try:
        await asyncio.to_thread(
            db.table("reviews")
            .update({"is_approved": req.is_approved})
            .eq("id", req.review_id)
            .execute
        )
        return {"success": True, "review_id": req.review_id, "is_approved": req.is_approved}
    except Exception as e:
        logger.error(f"Error moderating review: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật trạng thái đánh giá: {str(e)}"
        )

from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_supabase, get_current_user_id
from models.ecommerce import ReviewCreate, QACreate

router = APIRouter(prefix="/api/cars", tags=["Interactions (Reviews, Q&A)"])

@router.get("/{car_id}/reviews")
async def get_reviews(
    car_id: int,
    db=Depends(get_supabase)
):
    res = db.table("reviews").select("*, profiles(full_name, avatar_url)").eq("car_id", car_id).order("created_at", desc=True).execute()
    return res.data

@router.post("/{car_id}/reviews")
async def create_review(
    car_id: int,
    review_data: ReviewCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    # Optional: verify if user actually bought the car via orders table
    insert_data = {
        "user_id": user_id,
        "car_id": car_id,
        "rating": review_data.rating,
        "comment": review_data.comment
    }
    res = db.table("reviews").insert(insert_data).execute()
    return res.data[0]

@router.get("/{car_id}/qa")
async def get_qa(
    car_id: int,
    db=Depends(get_supabase)
):
    res = db.table("car_qa").select("*, profiles(full_name, avatar_url)").eq("car_id", car_id).order("created_at", desc=True).execute()
    return res.data

@router.post("/{car_id}/qa")
async def create_qa(
    car_id: int,
    qa_data: QACreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    insert_data = {
        "user_id": user_id,
        "car_id": car_id,
        "question": qa_data.question
    }
    res = db.table("car_qa").insert(insert_data).execute()
    return res.data[0]

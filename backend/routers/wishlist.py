from fastapi import APIRouter, Depends, HTTPException
from core.dependencies import get_supabase, get_current_user_id
from typing import List
from models.schemas import CarResponse

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.get("")
async def get_wishlist(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("saved_cars").select("*, cars(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

@router.post("/{car_id}")
async def add_to_wishlist(
    car_id: int,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("saved_cars").insert({"user_id": user_id, "car_id": car_id}).execute()
        return res.data[0]
    except Exception as e:
        # Supabase raises exception on unique constraint violation
        raise HTTPException(status_code=400, detail="Car already in wishlist or invalid car_id")

@router.delete("/{car_id}")
async def remove_from_wishlist(
    car_id: int,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("saved_cars").delete().eq("user_id", user_id).eq("car_id", car_id).execute()
    if not res.data:
         raise HTTPException(status_code=404, detail="Item not found in wishlist")
    return {"message": "Removed from wishlist"}

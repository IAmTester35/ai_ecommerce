from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_supabase, get_current_user_id
from models.ecommerce import ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("profiles").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
        
    res = db.table("profiles").update(update_data).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.get("/history/search")
async def get_search_history(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("search_history").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
    return res.data

@router.get("/history/viewed")
async def get_viewed_cars(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    # Join with cars table to get car details
    res = db.table("viewed_cars").select("*, cars(*)").eq("user_id", user_id).order("viewed_at", desc=True).limit(20).execute()
    return res.data

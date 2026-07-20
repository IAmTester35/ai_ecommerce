from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_supabase, get_current_user_id

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return res.data[0]

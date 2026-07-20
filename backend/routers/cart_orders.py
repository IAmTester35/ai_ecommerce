from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_supabase, get_current_user_id
from models.ecommerce import OrderCreate

router = APIRouter(prefix="/api", tags=["Cart & Orders"])

@router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    # In a real app, this would process cart_items.
    # Since we don't have a robust cart table yet, this is a basic stub to show the flow.
    raise HTTPException(status_code=501, detail="Not Implemented")

@router.get("/orders")
async def get_orders(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    res = db.table("orders").select("*, order_items(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

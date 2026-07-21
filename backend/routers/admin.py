from fastapi import APIRouter, Depends, HTTPException
from core.dependencies import get_supabase, get_admin_user_id
from models.ecommerce import OrderStatusUpdate, QAAnswerUpdate, CarCreate, CarUpdate, UserRoleUpdate

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

from typing import Optional

@router.get("/cars")
async def get_all_cars(
    limit: int = 20,
    offset: int = 0,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    # Fetch all cars (including inactive) with pagination
    res = db.table("cars").select("*", count="exact").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {
        "data": res.data,
        "count": res.count
    }

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    update_data: OrderStatusUpdate,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    if update_data.status not in ['pending', 'processing', 'completed', 'cancelled']:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        res = db.table("orders").update({"status": update_data.status}).eq("id", order_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cars")
async def create_car(
    car_data: CarCreate,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("cars").insert(car_data.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create car")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/cars/{car_id}")
async def update_car(
    car_id: int,
    car_data: CarUpdate,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    update_data = {k: v for k, v in car_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
        
    try:
        res = db.table("cars").update(update_data).eq("id", car_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Car not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cars/{car_id}")
async def delete_car(
    car_id: int,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    # Soft delete
    try:
        res = db.table("cars").update({"is_active": False}).eq("id", car_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Car not found")
        return {"message": "Car deactivated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users(
    limit: int = 20,
    offset: int = 0,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("profiles").select("*", count="exact").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return {
            "data": res.data,
            "count": res.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: UserRoleUpdate,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    if role_data.role not in ['admin', 'user']:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    try:
        res = db.table("profiles").update({"role": role_data.role}).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
async def get_all_orders(
    limit: int = 20,
    offset: int = 0,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("orders").select("*, profiles(full_name, email)", count="exact").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return {
            "data": res.data,
            "count": res.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.put("/qa/{qa_id}/answer")
async def answer_qa(
    qa_id: str,
    update_data: QAAnswerUpdate,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    db_update_data = {
        "answer": update_data.answer,
        "answered_by": admin_id
    }
    try:
        res = db.table("car_qa").update(db_update_data).eq("id", qa_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Q&A not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

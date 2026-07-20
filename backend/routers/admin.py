from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_supabase, get_admin_user_id

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

@router.get("/cars")
async def get_all_cars(
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    # Fetch all cars (including inactive)
    res = db.table("cars").select("*").execute()
    return res.data

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    if status not in ['pending', 'processing', 'completed', 'cancelled']:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    res = db.table("orders").update({"status": status}).eq("id", order_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return res.data[0]

@router.put("/qa/{qa_id}/answer")
async def answer_qa(
    qa_id: str,
    answer: str,
    admin_id: str = Depends(get_admin_user_id),
    db=Depends(get_supabase)
):
    update_data = {
        "answer": answer,
        "answered_by": admin_id
    }
    res = db.table("car_qa").update(update_data).eq("id", qa_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return res.data[0]

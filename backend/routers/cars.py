from fastapi import APIRouter, Depends, HTTPException, Query
from core.dependencies import get_supabase, get_optional_user_id
from typing import Optional

router = APIRouter(prefix="/api/cars", tags=["Cars"])

@router.get("")
async def list_cars(
    manufacturer: Optional[str] = None,
    type: Optional[str] = None,
    max_price: Optional[int] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    db=Depends(get_supabase)
):
    query = db.table("cars").select("*", count="exact")
    if manufacturer:
        query = query.eq("manufacturer", manufacturer)
    if type:
        query = query.eq("type", type)
    if max_price is not None:
        query = query.lte("price", max_price)
        
    res = query.range(offset, offset + limit - 1).execute()
    return {
        "data": res.data,
        "count": res.count
    }

@router.get("/{car_id}")
async def get_car_details(
    car_id: int,
    user_id: Optional[str] = Depends(get_optional_user_id),
    db=Depends(get_supabase)
):
    # Fetch car
    res = db.table("cars").select("*").eq("id", car_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Car not found")
        
    # If user_id is provided, log to viewed_cars
    if user_id:
        try:
            db.table("viewed_cars").insert({"user_id": user_id, "car_id": car_id}).execute()
        except Exception as e:
            import logging
            logging.warning(f"Failed to log viewed car: {e}")
            
    return res.data[0]

@router.get("/{car_id}/related")
async def get_related_cars(
    car_id: int,
    limit: int = 5,
    db=Depends(get_supabase)
):
    # Fetch target car embedding
    res = db.table("cars").select("embedding").eq("id", car_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Car not found")
        
    embedding = res.data[0].get("embedding")
    if not embedding:
         return []
         
    # Use RPC to find similar cars
    match_res = db.rpc(
        'match_cars',
        {
            'query_embedding': embedding,
            'match_threshold': 0.5,
            'match_count': limit + 1
        }
    ).execute()
    
    # Filter out the current car
    related = [c for c in match_res.data if c["id"] != car_id]
    return related[:limit]

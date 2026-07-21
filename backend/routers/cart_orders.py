from fastapi import APIRouter, Depends, HTTPException
from core.dependencies import get_supabase, get_current_user_id
from models.ecommerce import OrderCreate, CartItemCreate

router = APIRouter(prefix="/api", tags=["Cart & Orders"])

# ================= CART ENDPOINTS =================

@router.get("/cart")
async def get_cart(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("cart_items").select("*, cars(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cart")
async def add_to_cart(
    item: CartItemCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        # Check if already in cart
        existing = db.table("cart_items").select("*").eq("user_id", user_id).eq("car_id", item.car_id).execute()
        if existing.data:
            # Update quantity
            new_qty = existing.data[0]["quantity"] + item.quantity
            res = db.table("cart_items").update({"quantity": new_qty}).eq("id", existing.data[0]["id"]).execute()
            return res.data[0]
        else:
            # Insert new
            insert_data = {
                "user_id": user_id,
                "car_id": item.car_id,
                "quantity": item.quantity
            }
            res = db.table("cart_items").insert(insert_data).execute()
            return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cart/{car_id}")
async def remove_from_cart(
    car_id: int,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("cart_items").delete().eq("user_id", user_id).eq("car_id", car_id).execute()
        if not res.data:
             raise HTTPException(status_code=404, detail="Item not found in cart")
        return {"message": "Removed from cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= ORDERS ENDPOINTS =================

@router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        # 1. Call checkout RPC
        res = db.rpc('checkout_cart', {
            'p_user_id': user_id,
            'p_payment_method': order_data.payment_method
        }).execute()
        
        # In postgrest-py, RPC returns the value (which is v_order_id in this case)
        order_id = res.data
        
        # 2. Fetch the created order to return
        order_res = db.table("orders").select("*").eq("id", order_id).execute()
        if not order_res.data:
            raise HTTPException(status_code=500, detail="Order created but could not be fetched")
            
        return order_res.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
async def get_orders(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_supabase)
):
    try:
        res = db.table("orders").select("*, order_items(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


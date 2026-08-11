from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from core.dependencies import get_supabase
from models.payment import (
    CreatePaymentRequest,
    PaymentCallbackRequest,
    CheckOrderStatusRequest
)
from services.zalopay_service import ZaloPayService

router = APIRouter(prefix="/api/payment", tags=["Payment"])
zalopay_service = ZaloPayService()

@router.post("/create")
async def create_payment(req: CreatePaymentRequest):
    """
    Tạo đơn hàng thanh toán ZaloPay
    """
    try:
        res = await zalopay_service.create_payment(req)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating ZaloPay order: {str(e)}"
        )

@router.post("/callback")
async def payment_callback(
    req: PaymentCallbackRequest,
    db: Client = Depends(get_supabase)
):
    """
    Callback tự động từ ZaloPay sau khi thanh toán thành công
    """
    try:
        res = await zalopay_service.process_callback(req.data, req.mac, db)
        return res
    except Exception as e:
        return {
            "return_code": 0,
            "return_message": f"Error processing callback: {str(e)}"
        }

@router.post("/status")
async def check_order_status(req: CheckOrderStatusRequest):
    """
    Kiểm tra trạng thái đơn hàng ZaloPay
    """
    try:
        res = await zalopay_service.check_order_status(req.app_trans_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking order status: {str(e)}"
        )

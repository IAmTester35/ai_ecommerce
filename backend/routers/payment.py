import logging
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from core.dependencies import get_supabase
from models.payment import (
    CreatePaymentRequest,
    PaymentCallbackRequest,
    CheckOrderStatusRequest
)
from services.zalopay_service import ZaloPayService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["Payment"])
zalopay_service = ZaloPayService()

@router.post("/create")
async def create_payment(
    req: CreatePaymentRequest,
    db: Client = Depends(get_supabase)
):
    """
    Tạo đơn hàng thanh toán ZaloPay
    """
    try:
        logger.info(f"Creating payment order for order_id: {req.order_id}, amount: {req.amount}")
        res = await zalopay_service.create_payment(req, db=db)
        logger.info(f"Payment order created successfully: {res.get('order_url', '')}")
        return res
    except Exception as e:
        logger.error(f"Error creating ZaloPay order: {str(e)}", exc_info=True)
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
        logger.info("Received ZaloPay payment callback")
        res = await zalopay_service.process_callback(req.data, req.mac, db)
        logger.info(f"ZaloPay callback processed: return_code={res.get('return_code')}")
        return res
    except Exception as e:
        logger.error(f"Error processing ZaloPay callback: {str(e)}", exc_info=True)
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
        logger.info(f"Checking ZaloPay order status for app_trans_id: {req.app_trans_id}")
        res = await zalopay_service.check_order_status(req.app_trans_id)
        return res
    except Exception as e:
        logger.error(f"Error checking order status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking order status: {str(e)}"
        )

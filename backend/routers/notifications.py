import logging
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from core.dependencies import get_supabase
from models.notifications import SendNotificationRequest, SendUserNotificationRequest
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
notification_service = NotificationService()

@router.post("/send")
async def send_notification(
    req: SendNotificationRequest,
    db: Client = Depends(get_supabase)
):
    """
    Gửi thông báo tới tất cả người dùng
    """
    try:
        logger.info(f"Sending broadcast notification: '{req.title}'")
        res = await notification_service.send_broadcast_notification(req.title, req.body, db)
        logger.info(f"Broadcast notification result: {res}")
        return res
    except Exception as e:
        logger.error(f"Error sending broadcast notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

@router.post("/send-user")
async def send_notification_to_user(
    req: SendUserNotificationRequest,
    db: Client = Depends(get_supabase)
):
    """
    Gửi thông báo tới một người dùng cụ thể
    """
    try:
        logger.info(f"Sending user notification to user_id: {req.user_id}, title: '{req.title}'")
        res = await notification_service.send_user_notification(
            user_id=req.user_id,
            title=req.title,
            body=req.body,
            token=req.token,
            db=db
        )
        logger.info(f"User notification result: {res}")
        return res
    except Exception as e:
        logger.error(f"Error sending user notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification to user: {str(e)}"
        )

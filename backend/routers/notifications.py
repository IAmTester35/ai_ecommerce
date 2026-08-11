from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from core.dependencies import get_supabase
from models.payment import SendNotificationRequest, SendUserNotificationRequest
from services.notification_service import NotificationService

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
        res = await notification_service.send_broadcast_notification(req.title, req.body, db)
        return res
    except Exception as e:
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
        res = await notification_service.send_user_notification(
            user_id=req.user_id,
            title=req.title,
            body=req.body,
            token=req.token,
            db=db
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification to user: {str(e)}"
        )

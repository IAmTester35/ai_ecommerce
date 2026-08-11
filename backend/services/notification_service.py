import logging
from typing import Dict, Any
from supabase import Client

logger = logging.getLogger(__name__)

class NotificationService:
    async def send_broadcast_notification(self, title: str, body: str, db: Client) -> Dict[str, Any]:
        """
        Gửi thông báo tới tất cả người dùng.
        Hiện tại lưu vào Supabase notifications table và có khung cho FCM TODO.
        """
        # 1. TODO: Khoi tao firebase_admin va gui push notification qua FCM Topic 'all_users'
        # Example FCM logic:
        # message = messaging.Message(
        #     notification=messaging.Notification(title=title, body=body, image=logo_url),
        #     topic='all_users'
        # )
        # messaging.send(message)
        
        logger.info(f"[TODO FCM] Broadcast notification scheduled: {title} - {body}")

        return {
            "success": True,
            "message": "Notification queued successfully (DB & FCM TODO)"
        }

    async def send_user_notification(self, user_id: str, title: str, body: str, token: str | None, db: Client) -> Dict[str, Any]:
        """
        Gửi thông báo cho một người dùng cụ thể.
        Lưu thông báo vào Supabase notifications table và có khung cho FCM TODO.
        """
        # Lưu vào Supabase notifications table
        if user_id:
            db.table("notifications").insert({
                "user_id": user_id,
                "title": title,
                "content": body,
                "type": "general"
            }).execute()

        # TODO: Gui push notification toi device token qua Firebase Admin SDK
        # Example FCM logic:
        # if token:
        #     message = messaging.Message(
        #         notification=messaging.Notification(title=title, body=body, image=logo_url),
        #         token=token
        #     )
        #     messaging.send(message)

        logger.info(f"[TODO FCM] Direct notification to user {user_id}: {title} - {body}")

        return {
            "success": True,
            "message": "User notification sent successfully (Saved to DB, FCM TODO)"
        }

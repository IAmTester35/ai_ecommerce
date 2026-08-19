import logging
import asyncio
from typing import Dict, Any, Optional
from supabase import Client

logger = logging.getLogger(__name__)

class NotificationService:
    async def send_broadcast_notification(self, title: str, body: str, db: Client) -> Dict[str, Any]:
        """
        Gửi thông báo tới tất cả người dùng.
        Lưu thông báo hệ thống vào bảng notifications của Supabase và hỗ trợ khung FCM.
        """
        try:
            # Lấy danh sách profiles để tạo notification cho từng user hoặc lưu thông báo chung
            profiles_resp = await asyncio.to_thread(
                db.table("profiles").select("id").execute
            )
            user_ids = [p["id"] for p in (profiles_resp.data or []) if p.get("id")]

            if user_ids:
                records = [
                    {
                        "user_id": uid,
                        "title": title,
                        "content": body,
                        "type": "broadcast"
                    }
                    for uid in user_ids
                ]
                # Chèn theo batch
                await asyncio.to_thread(
                    db.table("notifications").insert(records).execute
                )

            # TODO: Gửi qua FCM Topic 'all_users' khi cấu hình Firebase Admin SDK
            logger.info(f"Broadcast notification sent to {len(user_ids)} users: {title} - {body}")

            return {
                "success": True,
                "recipients_count": len(user_ids),
                "message": "Broadcast notification queued and saved to DB successfully"
            }
        except Exception as e:
            logger.error(f"Failed to send broadcast notification: {e}")
            raise

    async def send_user_notification(
        self,
        user_id: Optional[str],
        title: str,
        body: str,
        token: Optional[str],
        db: Client
    ) -> Dict[str, Any]:
        """
        Gửi thông báo cho một người dùng cụ thể.
        Lưu thông báo vào Supabase notifications table bất đồng bộ.
        """
        try:
            if user_id:
                await asyncio.to_thread(
                    db.table("notifications").insert({
                        "user_id": user_id,
                        "title": title,
                        "content": body,
                        "type": "personal"
                    }).execute
                )

            # TODO: Gửi push notification tới device token qua Firebase Admin SDK
            logger.info(f"Direct notification sent to user {user_id}: {title} - {body}")

            return {
                "success": True,
                "message": "User notification sent and saved to DB successfully"
            }
        except Exception as e:
            logger.error(f"Failed to send user notification to {user_id}: {e}")
            raise

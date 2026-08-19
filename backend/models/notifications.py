from pydantic import BaseModel, Field
from typing import Optional

class SendNotificationRequest(BaseModel):
    title: str = Field(..., description="Tiêu đề thông báo")
    body: str = Field(..., description="Nội dung thông báo")

class SendUserNotificationRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="User ID trong Supabase")
    token: Optional[str] = Field(None, description="FCM Device token của user")
    title: str = Field(..., description="Tiêu đề thông báo")
    body: str = Field(..., description="Nội dung thông báo")

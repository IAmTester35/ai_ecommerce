from pydantic import BaseModel, Field
from typing import Optional, List

class PaymentItem(BaseModel):
    id: str
    name: Optional[str] = None
    price: Optional[int] = None
    itemCount: int = 1

class CreatePaymentRequest(BaseModel):
    order_id: Optional[str] = Field(None, description="Supabase Order ID (UUID) nếu đã tạo qua checkout_cart")
    amount: int = Field(..., description="Tổng số tiền thanh toán (VND)")
    items: List[PaymentItem] = Field(default_factory=list, description="Danh sách sản phẩm")
    email: str = Field(..., description="Email người nhận")
    address: str = Field(..., description="Địa chỉ giao hàng")
    name: str = Field(..., description="Tên người nhận")
    phone: str = Field(..., description="Số điện thoại")
    note: Optional[str] = Field("", description="Ghi chú đơn hàng")
    userid: str = Field(..., description="User ID đặt hàng")

class PaymentCallbackRequest(BaseModel):
    data: str = Field(..., description="JSON string dữ liệu đơn hàng trả về từ ZaloPay")
    mac: str = Field(..., description="Mã chữ ký MAC để kiểm tra tính toàn vẹn")

class CheckOrderStatusRequest(BaseModel):
    app_trans_id: str = Field(..., description="Mã giao dịch ZaloPay (app_trans_id)")

class SendNotificationRequest(BaseModel):
    title: str = Field(..., description="Tiêu đề thông báo")
    body: str = Field(..., description="Nội dung thông báo")

class SendUserNotificationRequest(BaseModel):
    token: Optional[str] = Field(None, description="FCM Device token của user")
    user_id: Optional[str] = Field(None, description="User ID trong Supabase")
    title: str = Field(..., description="Tiêu đề thông báo")
    body: str = Field(..., description="Nội dung thông báo")

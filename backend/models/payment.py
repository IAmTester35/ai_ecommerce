from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from models.notifications import SendNotificationRequest, SendUserNotificationRequest  # Re-export for compatibility

class PaymentItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: Optional[str] = None
    price: Optional[int] = None
    item_count: int = Field(1, alias="itemCount")

class CreatePaymentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    order_id: Optional[str] = Field(None, description="Supabase Order ID (UUID) nếu đã tạo qua checkout_cart")
    amount: int = Field(..., description="Tổng số tiền thanh toán (VND)")
    items: List[PaymentItem] = Field(default_factory=list, description="Danh sách sản phẩm")
    email: str = Field(..., description="Email người nhận")
    address: str = Field(..., description="Địa chỉ giao hàng")
    name: str = Field(..., description="Tên người nhận")
    phone: str = Field(..., description="Số điện thoại")
    note: Optional[str] = Field("", description="Ghi chú đơn hàng")
    user_id: str = Field(..., alias="userid", description="User ID đặt hàng")

class PaymentCallbackRequest(BaseModel):
    data: str = Field(..., description="JSON string dữ liệu đơn hàng trả về từ ZaloPay")
    mac: str = Field(..., description="Mã chữ ký MAC để kiểm tra tính toàn vẹn")

class CheckOrderStatusRequest(BaseModel):
    app_trans_id: str = Field(..., description="Mã giao dịch ZaloPay (app_trans_id)")

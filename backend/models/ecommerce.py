from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime

class CartItemCreate(BaseModel):
    car_id: int
    quantity: int = 1

class OrderCreate(BaseModel):
    payment_method: str

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str

class QACreate(BaseModel):
    question: str

class OrderStatusUpdate(BaseModel):
    status: str

class QAAnswerUpdate(BaseModel):
    answer: str

class CarCreate(BaseModel):
    manufacturer: str
    model: str
    year: int
    price: int
    description: Optional[str] = None
    type: Optional[str] = None
    stock_quantity: int = 1
    is_active: bool = True

class CarUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[int] = None
    description: Optional[str] = None
    type: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None

class UserRoleUpdate(BaseModel):
    role: str

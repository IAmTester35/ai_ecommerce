from pydantic import BaseModel, Field
from typing import Optional, List

class QueryRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi tự nhiên của khách hàng")

class ExtractedConstraints(BaseModel):
    max_price: Optional[int] = Field(None, description="Ngân sách tối đa của khách hàng")
    manufacturer: Optional[str] = Field(None, description="Hãng xe khách hàng muốn (nếu có)")
    soft_intent: str = Field(..., description="Các yêu cầu mềm về cảm giác lái, phong cách, mục đích sử dụng, v.v.")
    
class CarResponse(BaseModel):
    id: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[int] = None
    description: Optional[str] = None
    similarity: Optional[float] = None

class SearchResponse(BaseModel):
    original_query: str
    constraints: ExtractedConstraints
    results: List[CarResponse]
    conflict_detected: bool
    ai_message: str

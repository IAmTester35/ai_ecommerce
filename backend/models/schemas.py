from pydantic import BaseModel, Field
from typing import Optional, List

class QueryRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi tự nhiên của khách hàng")

class ExtractedConstraints(BaseModel):
    max_price: Optional[int] = Field(None, description="Ngân sách tối đa của khách hàng")
    min_hp: Optional[int] = Field(None, description="Mã lực tối thiểu nếu yêu cầu động cơ mạnh (nếu có)")
    make: Optional[str] = Field(None, description="Hãng xe khách hàng muốn (nếu có)")
    target_year: Optional[int] = Field(None, description="Năm sản xuất mục tiêu")
    fuel_type: Optional[str] = Field(None, description="Loại nhiên liệu/động cơ bắt buộc: 'electric', 'hybrid', hoặc 'gasoline' (nếu có)")
    is_out_of_scope: bool = Field(False, description="True nếu truy vấn không liên quan tới lĩnh vực ô tô/xe hơi (ví dụ: máy bay, đồ ăn, thời tiết, điện thoại)")
    soft_intent: str = Field(..., description="Các yêu cầu mềm và ngữ cảnh được mở rộng (Semantic Expansion)")
    
class CarResponse(BaseModel):
    id: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    engine_hp: Optional[int] = None
    price: Optional[int] = None
    metadata: Optional[dict] = None
    review: Optional[str] = None
    similarity: Optional[float] = None

class SearchResponse(BaseModel):
    original_query: str
    constraints: ExtractedConstraints
    results: List[CarResponse]
    conflict_detected: bool
    ai_message: str

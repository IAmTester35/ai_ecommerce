import os
from google import genai
from schemas import ExtractedConstraints

# Khởi tạo Client theo chuẩn google-genai
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

def extract_constraints(query: str) -> ExtractedConstraints:
    """
    Sử dụng LLM để bóc tách yêu cầu cứng và yêu cầu mềm từ câu lệnh người dùng.
    """
    prompt = f"""
    Bạn là một trợ lý AI phân tích nhu cầu mua ô tô.
    Khách hàng yêu cầu: "{query}"
    Hãy trích xuất thông tin thành dạng JSON.
    - max_price: Số tiền tối đa (nếu có nhắc đến, ví dụ "dưới 20000" -> 20000). Không có thì để null.
    - manufacturer: Hãng xe (nếu có, viết thường, ví dụ: "toyota", "bmw"). Không có thì để null.
    - soft_intent: Tóm tắt tất cả các yêu cầu còn lại bằng 1 câu ngắn (ví dụ: "xe thể thao màu đỏ", "xe gia đình rộng rãi", "động cơ mạnh").
    """
    
    # Dùng tính năng response_schema của google-genai
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ExtractedConstraints,
            'temperature': 0,
        }
    )
    
    return response.parsed

def generate_ai_response(query: str, constraints: ExtractedConstraints, cars: list, conflict_detected: bool) -> str:
    """
    Sinh ra câu trả lời tư vấn mềm mỏng cho khách hàng.
    """
    cars_info = ""
    for idx, c in enumerate(cars):
        cars_info += f"{idx+1}. {c['year']} {c['manufacturer']} {c['model']} - Giá: ${c['price']}\n"
    
    prompt = f"""
    Bạn là nhân viên tư vấn bán ô tô cao cấp.
    Khách hàng yêu cầu: "{query}"
    Bạn đã tìm được các xe sau:
    {cars_info if cars_info else "Không tìm thấy xe nào."}
    
    Mâu thuẫn giá cả/yêu cầu: {"Có mâu thuẫn. Đã nới lỏng ngân sách để tìm xe thay thế." if conflict_detected else "Không có mâu thuẫn."}
    
    Hãy viết một câu tư vấn thân thiện, ngắn gọn (dưới 4 câu) giới thiệu các xe bạn đã tìm được. Nếu có mâu thuẫn, hãy khéo léo giải thích lý do đề xuất xe thay thế.
    """
    
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
    )
    
    return response.text

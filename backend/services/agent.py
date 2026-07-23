import os
from google import genai
from models.schemas import ExtractedConstraints

# Khởi tạo Client theo chuẩn google-genai
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

def extract_constraints(query: str) -> ExtractedConstraints:
    """
    Sử dụng LLM để bóc tách yêu cầu cứng và yêu cầu mềm từ câu lệnh người dùng.
    """
    prompt = f"""
    You are an expert AI automotive query analyzer specializing in multi-layered intent extraction and semantic expansion.
    Analyze the user query: "{query}"

    Extract constraints and perform Semantic Expansion according to these rules:
    - max_price: Maximum budget integer mentioned (e.g. "under 30000" -> 30000). Return null if not specified.
    - min_hp: Minimum engine horsepower constraint. If user demands a powerful engine (e.g. "động cơ mạnh", "xe khỏe", "high horsepower"), set a reasonable threshold (e.g. 200), otherwise null.
    - make: Car brand in lowercase (e.g. "toyota", "ford"). Return null if not specified.
    - target_year: Specific year integer mentioned (e.g. 2020). Return null if not specified.
    - soft_intent: Perform SEMANTIC EXPANSION in ENGLISH.
      1. Translate core desires into rich English automotive concepts.
      2. Infer implicit requirements: Expand contextual phrases like "đi đường núi" into implicit features like "mountain driving, high ground clearance, off-road capability, durable suspension, steep incline hill climb, 4WD/AWD traction control".
      3. Capture soft preferences (e.g. "tốt nhất là 4WD" -> "prefer 4WD/AWD four-wheel drive over RWD/FWD").
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
        review_snippet = c.get('review', '')
        engine_hp = c.get('engine_hp')
        meta = c.get('metadata') or {}
        
        hp_str = f", Engine: {engine_hp} HP" if engine_hp else ""
        meta_str = ", ".join([f"{k}: {v}" for k, v in meta.items() if v]) if isinstance(meta, dict) else ""
        
        cars_info += f"- Option {idx+1}: {c['year']} {c['make']} {c['model']} (Price: ${c['price']}{hp_str})\n"
        if meta_str:
            cars_info += f"  Technical Specs/Metadata: {meta_str}\n"
        if review_snippet:
            cars_info += f"  Highlight/User Review: \"{review_snippet}\"\n"
    
    prompt = f"""
    You are a premium automotive sales consultant. 
    The user is looking for a car with the following query: "{query}"
    
    Based on their query, you have retrieved the following options from the database:
    {cars_info if cars_info else "No exact matches found."}
    
    Context about the search:
    Conflict detected (e.g., unrealistic budget): {"Yes. The budget was relaxed to find alternative options." if conflict_detected else "No."}
    
    Instructions:
    1. Write a friendly, professional, and persuasive response (maximum 3-4 sentences).
    2. Introduce the top recommended cars and SPECIFICALLY explain WHY they fit the user's needs based on the provided highlights/reviews (e.g., mention key features like Hill Descent Control, torque, off-road durability, or smooth ride).
    3. If a conflict was detected, politely explain that the original budget was adjusted slightly to find the best possible matches.
    4. Do not list all cars extensively; just highlight the best options seamlessly in your conversational response.
    """
    
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
    )
    
    return response.text

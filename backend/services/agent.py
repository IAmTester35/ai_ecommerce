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
    - fuel_type: Mandatory fuel/engine type string if explicitly requested by user (e.g. "xe điện", "electric", "EV" -> "electric"; "hybrid" -> "hybrid"; "xe xăng", "gasoline" -> "gasoline"). Return null if not specified.
    - is_out_of_scope: Set to true if the user query is completely UNRELATED to cars/automobiles (e.g. asking for airplanes, boats, food, real estate, weather, general QA, or non-car items). Otherwise false.
    - soft_intent: Perform SEMANTIC EXPANSION in ENGLISH.
      1. IGNORE greetings, user names, or personal introductory phrases (e.g. "tôi tên Nam") - do NOT include user name in soft_intent.
      2. Translate core desires into rich English automotive concepts.
      3. Infer implicit requirements: Expand contextual phrases like "đi đường núi" into implicit features like "mountain driving, high ground clearance, off-road capability, durable suspension, steep incline hill climb, 4WD/AWD traction control".
      4. Capture soft preferences (e.g. "tốt nhất là 4WD" -> "prefer 4WD/AWD four-wheel drive over RWD/FWD").
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
    Sinh ra câu trả lời tư vấn cho khách hàng.
    """
    if constraints.is_out_of_scope:
        prompt = f"""
        You are an AI assistant for an automotive e-commerce platform specializing in cars.
        The user submitted an out-of-scope query: "{query}"

        Instructions:
        1. Write a polite, concise response in Vietnamese (2-3 sentences).
        2. Inform the user that your system specialized exclusively in searching and recommending cars/automobiles.
        3. Politely invite them to rephrase their query with car preferences (e.g., budget, body style, or car requirements).
        """
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text

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
    You are an expert, objective, and premium automotive sales consultant. 
    The user submitted the query: "{query}"
    
    Database search results:
    {cars_info if cars_info else "NO MATCHING CARS FOUND IN DATABASE INVENTORY."}
    
    Context about the search:
    Conflict detected: {"Yes. The budget/constraints were relaxed to find alternative options." if conflict_detected else "No."}
    Extracted Constraints: {constraints.model_dump_json()}

    Instructions:
    1. GROUNDING DISCIPLINE & TRANSPARENCY:
       - If NO MATCHING CARS WERE FOUND in the database (`cars` is empty):
         * Explicitly state in Vietnamese that the requested vehicle or brand is currently NOT available in our database inventory.
         * Do NOT pretend the car is available or in stock.
         * If the user asked for consultation on a specific model not in stock (e.g. Rolls-Royce Phantom), you may provide a brief, objective evaluation based on general automotive knowledge, but MUST clearly declare that it is not currently in our database inventory.

    2. OBJECTIVE ADVISORY & NO CONFIRMATION BIAS:
       - Avoid blind validation (e.g., NEVER say "You absolutely right" or blindly agree).
       - Provide a balanced, objective consultation: highlight key advantages (e.g., luxury, executive rear comfort, status) alongside important trade-offs or considerations (e.g., suited for chauffeur-driven vs self-driven, size/maneuverability, operating cost).

    3. STRICT HARD CONSTRAINT ADHERENCE:
       - Never recommend a vehicle that violates the user's hard constraints (e.g., if fuel_type is electric, NEVER suggest hybrid or gasoline cars).

    4. PERSUASIVE & CONCISE STYLE:
       - Explain WHY retrieved cars fit the user's needs based on provided metadata and highlights.
       - If budget/constraints were relaxed due to conflict, explain politely.
    """
    
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
    )
    
    return response.text

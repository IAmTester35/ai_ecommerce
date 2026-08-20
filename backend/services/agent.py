from typing import AsyncGenerator, List, Dict, Any, Optional
from google import genai
from core.config import settings
from models.schemas import ExtractedConstraints
from services.pricing import calculate_car_price_vnd, format_vnd_str

# Khởi tạo Client theo chuẩn google-genai
client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
)

async def extract_constraints(query: str) -> ExtractedConstraints:
    """
    Sử dụng LLM bất đồng bộ để bóc tách yêu cầu cứng và yêu cầu mềm từ câu lệnh người dùng.
    """
    prompt = f"""
    You are an expert AI automotive query analyzer specializing in multi-layered intent extraction and semantic expansion.
    Analyze the user query: "{query}"

    Extract constraints and perform Semantic Expansion according to these rules:
    - max_price: Maximum budget integer normalized to USD (MSRP integer).
      * If user specifies USD (e.g. "under 30000", "$40k", "35000 USD"), extract the integer (e.g. 30000, 40000).
      * If user specifies Vietnamese Dong (VNĐ/tỷ/triệu/tr) (e.g. "dưới 1 tỷ", "tầm 800 triệu", "dưới 2 tỷ"), CONVERT to raw USD MSRP using realistic Vietnam automotive tax multiplier (~64,500 VND per 1 USD MSRP, taking into account import duty, excise tax, VAT and dealer margin):
        - "1 tỷ" / "1 tỉ" (1,000,000,000 / 64500) -> 15500
        - "1.5 tỷ" (1,500,000,000 / 64500) -> 23250
        - "2 tỷ" (2,000,000,000 / 64500) -> 31000
        - "3 tỷ" (3,000,000,000 / 64500) -> 46500
        - "5 tỷ" (5,000,000,000 / 64500) -> 77500
        - "800 triệu" / "800tr" (800,000,000 / 64500) -> 12400
        - "500 triệu" / "500tr" (500,000,000 / 64500) -> 7750
      * Return null if not specified.
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

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL_EXTRACT,
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ExtractedConstraints,
            'temperature': 0,
        }
    )

    return response.parsed

async def generate_ai_response(
    query: str,
    constraints: ExtractedConstraints,
    cars: List[Dict[str, Any]],
    conflict_detected: bool,
    chat_history: List[Dict[str, Any]],
    relaxed_terms: Optional[List[str]] = None
) -> AsyncGenerator[str, None]:
    """
    Sinh ra câu trả lời tư vấn cho khách hàng bằng Native Async Streaming.
    """
    # Xây dựng lịch sử trò chuyện để đưa vào model
    history_text = "Previous conversation:\n"
    for msg in chat_history:
        history_text += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"

    if constraints.is_out_of_scope:
        prompt = f"""
        You are an AI assistant for an automotive e-commerce platform specializing in cars.
        The user submitted an out-of-scope query: "{query}"

        {history_text}

        Instructions:
        1. Write a polite, concise response.
        2. Inform the user that your system specializes exclusively in searching and recommending cars/automobiles.
        3. Politely invite them to rephrase their query with car preferences (e.g., budget, body style, or car requirements).
        """
        response_stream = await client.aio.models.generate_content_stream(
            model=settings.GEMINI_MODEL_GEN,
            contents=prompt,
            config={
                'thinking_config': {'thinking_budget': 128}
            }
        )
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
        return

    cars_info = ""
    for idx, c in enumerate(cars):
        review_snippet = c.get('review', '')
        engine_hp = c.get('engine_hp')
        meta = c.get('metadata') or {}
        price_usd = c.get('price')

        hp_str = f", Engine: {engine_hp} HP" if engine_hp else ""
        meta_str = ", ".join([f"{k}: {v}" for k, v in meta.items() if v]) if isinstance(meta, dict) else ""

        if price_usd and price_usd > 0:
            fuel_type = meta.get('engine_fuel_type') or meta.get('fuel_type')
            price_vnd = calculate_car_price_vnd(price_usd, engine_hp, fuel_type)
            vnd_fmt = format_vnd_str(price_vnd)
            price_display = f"${price_usd:,} USD (~{vnd_fmt})"
        else:
            price_display = "Liên hệ giá"

        cars_info += f"- Option {idx+1}: {c.get('year')} {c.get('make')} {c.get('model')} (Price: {price_display}{hp_str})\n"
        if meta_str:
            cars_info += f"  Technical Specs/Metadata: {meta_str}\n"
        if review_snippet:
            cars_info += f"  Highlight/User Review: \"{review_snippet}\"\n"

    relaxed_context = ""
    if conflict_detected and relaxed_terms:
        relaxed_context = f"Yes. We relaxed these specific constraints: {', '.join(relaxed_terms)}."
    elif conflict_detected:
        relaxed_context = "Yes. The budget/constraints were relaxed to find alternative options."
    else:
        relaxed_context = "No."

    prompt = f"""
    You are an expert, objective, and premium automotive sales consultant. 
    The user submitted the query: "{query}"
    
    {history_text}

    Database search results:
    {cars_info if cars_info else "NO MATCHING CARS FOUND IN DATABASE INVENTORY."}
    
    Context about the search:
    Conflict detected: {relaxed_context}
    Extracted Constraints: {constraints.model_dump_json()}

    Instructions:
    1. GROUNDING DISCIPLINE & TRANSPARENCY:
       - If NO MATCHING CARS WERE FOUND in the database (`cars` is empty):
         * Explicitly state that the requested vehicle or brand is currently NOT available in our database inventory.
         * Do NOT pretend the car is available or in stock.
         * If the user asked for consultation on a specific model not in stock (e.g. Rolls-Royce Phantom), you may provide a brief, objective evaluation based on general automotive knowledge, but MUST clearly declare that it is not currently in our database inventory.

    2. OBJECTIVE ADVISORY & NO CONFIRMATION BIAS:
       - Avoid blind validation (e.g., NEVER say "You absolutely right" or blindly agree).
       - Provide a balanced, objective consultation: highlight key advantages (e.g., luxury, executive rear comfort, status) alongside important trade-offs or considerations (e.g., suited for chauffeur-driven vs self-driven, size/maneuverability, operating cost).

    3. STRICT HARD CONSTRAINT ADHERENCE:
       - Never recommend a vehicle that violates the user's hard constraints (e.g., if fuel_type is electric, NEVER suggest hybrid or gasoline cars).

    4. CURRENCY & PRICING TRANSPARENCY:
       - Present prices in Vietnamese Dong (VNĐ) with USD MSRP context (e.g., "khoảng 533 triệu VNĐ (~$20,990 USD)").
       - Note that database inventory stores MSRP in USD and converts to VNĐ at current exchange rate (~25,400 VNĐ/USD).

    5. PERSUASIVE & CONCISE STYLE:
       - Explain WHY retrieved cars fit the user's needs based on provided metadata and highlights.
       - If budget/constraints were relaxed due to conflict (e.g. budget expanded, make dropped), transparently but politely explain to the user what exactly was compromised to find these alternative options.
    """

    response_stream = await client.aio.models.generate_content_stream(
        model=settings.GEMINI_MODEL_GEN,
        contents=prompt,
        config={
            'thinking_config': {'thinking_budget': 256}
        }
    )

    async for chunk in response_stream:
        if chunk.text:
            yield chunk.text

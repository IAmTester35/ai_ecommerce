from typing import AsyncGenerator, List, Dict, Any, Optional
from google import genai
from core.config import settings
from models.schemas import ExtractedConstraints
from services.pricing import calculate_car_price_vnd, format_vnd_str
from services.test_drive_tool import (
    book_test_drive,
    lookup_test_drives,
    cancel_test_drive,
    reschedule_test_drive
)

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
    - max_price: Maximum budget integer in Vietnamese Dong (VNĐ) matching cars.price in DB.
      * If user specifies Vietnamese Dong (e.g. "dưới 1 tỷ", "tầm 800 triệu", "dưới 2 tỷ", "1.5 tỉ", "3 tỷ"):
        - "1 tỷ" / "1 tỉ" -> 1000000000
        - "1.5 tỷ" -> 1500000000
        - "2 tỷ" -> 2000000000
        - "3 tỷ" -> 3000000000
        - "5 tỷ" -> 5000000000
        - "800 triệu" / "800tr" -> 800000000
        - "500 triệu" / "500tr" -> 500000000
      * If user specifies USD (e.g. "under 30000", "$40k", "35000 USD"): convert USD to estimated VND showroom price using exchange rate and taxes (~64,500 VND per 1 USD):
        - "$30,000" / "30000 USD" -> 1935000000
        - "$40,000" / "40k USD" -> 2580000000
      * Return null if not specified.
    - min_hp: Minimum engine horsepower constraint. If user demands a powerful engine (e.g. "động cơ mạnh", "xe khỏe", "high horsepower"), set a reasonable threshold (e.g. 200), otherwise null.
    - make: Car brand in lowercase (e.g. "toyota", "ford"). Return null if not specified.
    - target_year: Specific car manufacturing model year (e.g. 2020). Return null if not specified. IMPORTANT: Do NOT extract calendar/appointment dates or relative times (e.g. 'ngày mai', 'ngày 2026-11-05', '14:00 ngày 2026-11-02', 'hôm nay') as target_year!
    - fuel_type: Mandatory fuel/engine type string if explicitly requested by user (e.g. "xe điện", "electric", "EV" -> "electric"; "hybrid" -> "hybrid"; "xe xăng", "gasoline" -> "gasoline"). Return null if not specified.
    - is_out_of_scope: Set to true ONLY if the input is completely UNRELATED to cars, showrooms, or dealership services (e.g. recipes, weather, airplanes, medical QA, sports). Short conversational answers, phone numbers (e.g. '0944556677'), customer names, dates, follow-up replies, or appointment inquiries ('Tôi đang có lịch hẹn nào?', 'Dời lịch đó sang ngày mai', 'Hủy lịch', 'Xem lịch hẹn') are part of ongoing customer conversation and are strictly IN SCOPE (is_out_of_scope: false).
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
    relaxed_terms: Optional[List[str]] = None,
    user_context: Optional[Dict[str, Any]] = None,
    current_time_str: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Sinh ra câu trả lời tư vấn cho khách hàng bằng Native Async Streaming.
    """
    # Xây dựng lịch sử trò chuyện để đưa vào model
    history_text = "Previous conversation:\n"
    for msg in chat_history:
        history_text += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"

    user_ctx_info = ""
    if user_context:
        uid = user_context.get("user_id") or "Chưa đăng nhập (Khách vãng lai)"
        uname = user_context.get("user_name") or "Chưa rõ họ tên"
        uphone = user_context.get("user_phone") or "Chưa có SĐT"
        user_ctx_info = f"- Trạng thái tài khoản người dùng: ID={uid}, Họ tên={uname}, SĐT={uphone}"
    else:
        user_ctx_info = "- Trạng thái tài khoản: Khách vãng lai (Guest)"

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
                'max_output_tokens': 150,
                'thinking_config': {'thinking_budget': 1}
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
        price_raw = c.get('price')

        hp_str = f", Engine: {engine_hp} HP" if engine_hp else ""
        meta_str = ", ".join([f"{k}: {v}" for k, v in meta.items() if v]) if isinstance(meta, dict) else ""

        if price_raw and price_raw > 0:
            if price_raw < 1_000_000:
                fuel_type = meta.get('engine_fuel_type') or meta.get('fuel_type')
                price_vnd = calculate_car_price_vnd(price_raw, engine_hp, fuel_type)
            else:
                price_vnd = price_raw
            price_display = format_vnd_str(price_vnd)
        else:
            price_display = "Liên hệ giá"

        car_id = c.get('id', '')
        id_str = f" [Car ID: {car_id}]" if car_id else ""
        cars_info += f"- Option {idx+1}: {c.get('year')} {c.get('make')} {c.get('model')}{id_str} (Price: {price_display}{hp_str})\n"
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
    You are an expert, concise automotive sales & customer service assistant for AutoMatch.
    The user said: "{query}"

    SYSTEM & USER CONTEXT:
    - Thời gian hiện tại hệ thống (Current local time): {current_time_str or "Unknown"}
    {user_ctx_info}

    {history_text}

    Database search results:
    {cars_info if cars_info else "NO MATCHING CARS FOUND IN DATABASE INVENTORY."}

    Search context:
    Conflict detected: {relaxed_context}
    Constraints: {constraints.model_dump_json()}

    CRITICAL CONTEXT RESOLUTION & TOOL INSTRUCTIONS:
    Real users often speak with minimal context (e.g. "Tôi đang có lịch hẹn nào?", "Dời lịch đó sang ngày mai", "Hủy lịch giúp tôi"). You MUST resolve context intelligently using the rules below:

    1. RESOLVING IDENTITY (User ID / Phone):
       - When user is LOGGED IN (User ID present in account status):
         * The backend automatically identifies and links their appointments by `user_id` in database.
         * For lookup: simply call `lookup_test_drives()`.
         * For booking: call `book_test_drive(car_id_or_name=..., scheduled_date=...)` directly without re-asking phone/name if already in account status.
         * For reschedule/cancel: call `reschedule_test_drive(...)` or `cancel_test_drive(...)`.
       - When user is a GUEST (not logged in):
         * Inspect 'Previous conversation' history for any 10-digit phone number previously mentioned.
         * ONLY if user has NO account status, NO user_id, and NO phone number in chat history: DO NOT call the tool with empty phone! Politely ask: "Dạ để em kiểm tra/hỗ trợ lịch hẹn, anh/chị vui lòng cho em xin số điện thoại đã dùng để đăng ký ạ."

    2. RESOLVING DATES & RELATIVE TIME ("ngày mai", "ngày mốt", "chiều mai", "thứ 7", etc.):
       - Compute the exact calendar date (ISO format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS) based on 'Thời gian hiện tại hệ thống'.
       - For example, if current date is 2026-10-26 (Monday):
         * "ngày mai" -> 2026-10-27
         * "ngày mốt" / "ngày kia" -> 2026-10-28
         * "chiều mai" -> 2026-10-27T14:00:00
         * "sáng mai" -> 2026-10-27T09:00:00
       - If user does not specify an hour (only gives YYYY-MM-DD), pass the date; the tool will retain the original appointment's hour.

    3. RESOLVING PRONOUNS / TARGET APPOINTMENT ("lịch đó", "cái hẹn này", etc.):
       - Inspect 'Previous conversation' for any booking ID (UUID) or car mentioned in recent turns. Pass that booking_id or customer_phone to `reschedule_test_drive` or `cancel_test_drive`.
       - If only phone or user_id is known, pass it directly. The tool will automatically target their active pending booking.

    4. TEST DRIVE TOOL ACTIONS:
       - Tra cứu lịch ("Tôi đang có lịch hẹn nào?", "kiểm tra lịch hẹn"): Call `lookup_test_drives`.
       - Dời / đổi lịch ("Dời lịch đó sang ngày mai", "đổi lịch"): Call `reschedule_test_drive`.
       - Hủy lịch ("Hủy lịch đó", "hủy hẹn giúp tôi"): Call `cancel_test_drive`.
       - Đặt lịch mới: Call `book_test_drive`.
       - Once tool executes, confirm the result clearly in Vietnamese. DO NOT list car search recommendations when user is managing appointments.

    5. CAR CONSULTATION (when user is searching or asking for recommendations):
       - Introduce matching cars in 1 short sentence.
       - Each car MUST be formatted as exactly ONE single bullet point:
         * **[Năm] [Hãng] [Model] - [Giá VNĐ]** | Ưu điểm: [1 ý chính] | Lưu ý: [1 điểm hạn chế thực tế].
       - If NO MATCHING CARS FOUND: Declare clearly in 1-2 sentences that inventory lacks this model and suggest rephrasing.
    6. STRICT CONSTRAINT ADHERENCE:
       - Never suggest a vehicle violating user's mandatory criteria (e.g., fuel type).
    7. CALL TO ACTION:
       - When consulting cars, end with 1 short sentence asking if they want to view full specs or book a test drive.
    """

    chat = client.aio.chats.create(
        model=settings.GEMINI_MODEL_GEN,
        config={
            'tools': [book_test_drive, lookup_test_drives, cancel_test_drive, reschedule_test_drive],
            'max_output_tokens': 800,
            'thinking_config': {'thinking_budget': 1}
        }
    )
    response_stream = await chat.send_message_stream(prompt)

    async for chunk in response_stream:
        if chunk.text:
            yield chunk.text

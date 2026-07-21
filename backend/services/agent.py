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
    You are an AI assistant specialized in analyzing car purchase intents.
    Extract the constraints from the user's query: "{query}"

    Extract the information based on the following rules:
    - max_price: The maximum budget mentioned (e.g., "under 20000" -> 20000, "20k" -> 20000). If not mentioned, return null.
    - make: The car brand mentioned (e.g., "Toyota", "BMW"). Convert to lowercase. If not mentioned, return null.
    - target_year: The specific car year mentioned (e.g., "đời 2020" -> 2020, "2018 model" -> 2018). If not mentioned, return null.
    - soft_intent: Summarize all other preferences, requirements, and sentiments into a concise string (e.g., "red sports car", "spacious family SUV", "reliable and fuel-efficient"). This will be used for vector semantic search.
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
        cars_info += f"- {c['year']} {c['make']} {c['model']} (Price: ${c['price']})\n"
    
    prompt = f"""
    You are a premium automotive sales consultant. 
    The user is looking for a car with the following query: "{query}"
    
    Based on their query, you have retrieved the following options from the database:
    {cars_info if cars_info else "No exact matches found."}
    
    Context about the search:
    Conflict detected (e.g., unrealistic budget): {"Yes. The budget was relaxed to find alternative options." if conflict_detected else "No."}
    
    Instructions:
    1. Write a friendly, professional, and persuasive response (maximum 3-4 sentences).
    2. Introduce the top recommended cars from the list provided.
    3. If a conflict was detected, politely explain that the original budget was adjusted slightly to find the best possible matches.
    4. Do not list all cars extensively; just highlight the best options seamlessly in your conversational response.
    """
    
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
    )
    
    return response.text

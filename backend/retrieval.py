import os
from supabase import create_client, Client
from google import genai
import time

# Khởi tạo Client MỘT LẦN ở global scope để tái sử dụng Connection Pool (Giảm thời gian TCP/SSL handshake)
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL", ""),
    os.environ.get("SUPABASE_KEY", "")
)
ai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

def get_embedding(text: str) -> list[float]:
    response = ai_client.models.embed_content(
        model='gemini-embedding-2',
        contents=text,
    )
    return response.embeddings[0].values

def hybrid_search(soft_intent: str, max_price: int = None, manufacturer: str = None, top_k: int = 5):
    conflict_detected = False
    
    t_start = time.time()
    # Tạo vector từ soft intent
    query_vector = get_embedding(soft_intent)
    t_embed = time.time()
    print(f"  -> [Timer] get_embedding took {t_embed - t_start:.2f}s")
    
    # 1. Strict Search (Thử tìm với yêu cầu nghiêm ngặt)
    response = supabase.rpc(
        'match_cars',
        {
            'query_embedding': query_vector,
            'match_threshold': 0.0,
            'match_count': top_k,
            'filter_manufacturer': manufacturer,
            'filter_max_price': max_price
        }
    ).execute()
    
    t_rpc = time.time()
    print(f"  -> [Timer] Supabase RPC (Strict) took {t_rpc - t_embed:.2f}s")
    
    results = response.data
    
    # 2. Conflict Resolution (Nếu không tìm thấy, nới lỏng ngân sách)
    if not results and max_price is not None:
        conflict_detected = True
        relaxed_price = int(max_price * 1.5)  # Nới lỏng giá lên 50%
        
        response = supabase.rpc(
            'match_cars',
            {
                'query_embedding': query_vector,
                'match_threshold': 0.0,
                'match_count': top_k,
                'filter_manufacturer': manufacturer,
                'filter_max_price': relaxed_price
            }
        ).execute()
        results = response.data
        t_rpc2 = time.time()
        print(f"  -> [Timer] Supabase RPC (Relaxed) took {t_rpc2 - t_rpc:.2f}s")
        
    return results, conflict_detected

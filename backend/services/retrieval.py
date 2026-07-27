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
        config={'output_dimensionality': 768}
    )
    return response.embeddings[0].values

def hybrid_search(soft_intent: str, max_price: int = None, make: str = None, target_year: int = None, min_hp: int = None, fuel_type: str = None, top_k: int = 5):
    conflict_detected = False
    relaxed_terms = []
    
    t_start = time.time()
    # Tạo vector từ soft intent
    query_vector = get_embedding(soft_intent)
    t_embed = time.time()
    print(f"  -> [Timer] get_embedding took {t_embed - t_start:.2f}s")
    
    fetch_count = top_k * 3 if fuel_type else top_k

    rpc_params = {
        'query_embedding': query_vector,
        'match_threshold': 0.3,
        'match_count': fetch_count,
        'filter_make': make,
        'filter_max_price': max_price,
        'filter_target_year': target_year,
        'filter_min_hp': min_hp,
        'filter_fuel_type': fuel_type
    }
    
    # 1. Strict Search (Thử tìm với yêu cầu nghiêm ngặt)
    try:
        response = supabase.rpc('match_cars', rpc_params).execute()
        results = response.data or []
    except Exception as e:
        print("  -> [Error] Supabase RPC (Strict) failed:", e)
        results = []
    
    t_rpc = time.time()
    print(f"  -> [Timer] Supabase RPC (Strict) took {t_rpc - t_embed:.2f}s")

    if fuel_type and results:
        filtered = [
            c for c in results
            if c.get('metadata') and fuel_type.lower() in str(c['metadata'].get('engine_fuel_type', '')).lower()
        ]
        if filtered:
            results = filtered

    # 2. Conflict Resolution - Level 1 (Nới lỏng ngân sách / mã lực)
    if not results and (max_price is not None or min_hp is not None):
        conflict_detected = True
        relaxed_terms.append('price_or_hp')
        relaxed_price = int(max_price * 1.5) if max_price is not None else None
        relaxed_hp = int(min_hp * 0.8) if min_hp is not None else None
        
        rpc_params_relaxed = rpc_params.copy()
        rpc_params_relaxed['filter_max_price'] = relaxed_price
        rpc_params_relaxed['filter_min_hp'] = relaxed_hp

        try:
            response = supabase.rpc('match_cars', rpc_params_relaxed).execute()
            results = response.data or []
        except Exception as e:
            print("  -> [Error] Supabase RPC (Relaxed Level 1) failed:", e)
            results = []

        if fuel_type and results:
            filtered = [
                c for c in results
                if c.get('metadata') and fuel_type.lower() in str(c['metadata'].get('engine_fuel_type', '')).lower()
            ]
            if filtered:
                results = filtered

    # 3. Conflict Resolution - Level 2 (Nới lỏng luôn thương hiệu Make nếu vẫn bằng 0)
    if not results and make is not None:
        conflict_detected = True
        relaxed_terms.append('make')
        
        rpc_params_relaxed_make = rpc_params.copy()
        # Giữ lại giá trị giá đã nới lỏng ở trên (nếu có)
        relaxed_price = int(max_price * 1.5) if max_price is not None else None
        relaxed_hp = int(min_hp * 0.8) if min_hp is not None else None
        rpc_params_relaxed_make['filter_max_price'] = relaxed_price
        rpc_params_relaxed_make['filter_min_hp'] = relaxed_hp
        rpc_params_relaxed_make['filter_make'] = None # Hủy lọc thương hiệu

        try:
            response = supabase.rpc('match_cars', rpc_params_relaxed_make).execute()
            results = response.data or []
        except Exception as e:
            print("  -> [Error] Supabase RPC (Relaxed Level 2) failed:", e)
            results = []

        if fuel_type and results:
            filtered = [
                c for c in results
                if c.get('metadata') and fuel_type.lower() in str(c['metadata'].get('engine_fuel_type', '')).lower()
            ]
            if filtered:
                results = filtered
        
    return results[:top_k], conflict_detected, relaxed_terms

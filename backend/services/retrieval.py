import os
import requests
from supabase import create_client, Client
from google import genai
import time

def jina_rerank(query: str, documents: list[str], top_n: int = 3) -> list[dict]:
    if not documents:
        return []
    
    jina_api_key = os.environ.get("JINA_API_KEY")
    if not jina_api_key:
        print("  -> [Warning] JINA_API_KEY is missing. Skipping Reranker.")
        return [{"index": i, "relevance_score": 0.0} for i in range(len(documents))][:top_n]
    
    url = "https://api.jina.ai/v1/rerank"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jina_api_key}"
    }
    payload = {
        "model": "jina-reranker-v3.5",
        "query": query,
        "top_n": top_n,
        "documents": documents,
        "return_documents": False
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json().get("results", [])
    except Exception as e:
        print(f"  -> [Error] Jina Reranker failed: {e}")
        # Fallback: keep original order
        return [{"index": i, "relevance_score": 0.0} for i in range(len(documents))][:top_n]

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
    
    fetch_count = max(15, top_k * 5)

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
        
    # 4. Jina Reranker (Cross-Encoder)
    if results:
        t_rerank_start = time.time()
        # Build text documents for each candidate
        documents = []
        for c in results:
            metadata_str = str(c.get('metadata', ''))
            review_str = c.get('review', '')
            doc_text = f"Car: {c.get('year')} {c.get('make')} {c.get('model')} - Price: ${c.get('price')} - Engine: {c.get('engine_hp')}HP. Metadata: {metadata_str}. Review: {review_str}"
            documents.append(doc_text)
        
        # Call Reranker with soft_intent
        rerank_results = jina_rerank(query=soft_intent, documents=documents, top_n=top_k)
        
        # Reorder results based on Jina's indices
        reranked_cars = []
        for r in rerank_results:
            idx = r.get("index")
            if idx is not None and idx < len(results):
                # Optionally inject relevance score for debugging
                results[idx]['rerank_score'] = r.get("relevance_score")
                reranked_cars.append(results[idx])
        
        results = reranked_cars
        t_rerank_end = time.time()
        print(f"  -> [Timer] Jina Reranker took {t_rerank_end - t_rerank_start:.2f}s")
        
    return results, conflict_detected, relaxed_terms

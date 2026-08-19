import time
import logging
import asyncio
from typing import List, Dict, Tuple, Any, Optional
import httpx
from google import genai

from core.config import settings
from core.dependencies import supabase

logger = logging.getLogger(__name__)

ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def jina_rerank(query: str, documents: List[str], top_n: int = 3) -> List[Dict[str, Any]]:
    """
    Rerank kết quả bằng Jina AI Cross-Encoder bất đồng bộ.
    """
    if not documents:
        return []

    if not settings.JINA_API_KEY:
        logger.warning("JINA_API_KEY is missing. Skipping Reranker.")
        return [{"index": i, "relevance_score": 0.0} for i in range(len(documents))][:top_n]

    url = "https://api.jina.ai/v1/rerank"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.JINA_API_KEY}"
    }
    payload = {
        "model": "jina-reranker-v3.5",
        "query": query,
        "top_n": top_n,
        "documents": documents,
        "return_documents": False
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            return response.json().get("results", [])
    except Exception as e:
        logger.error(f"Jina Reranker failed: {e}")
        # Fallback: giữ nguyên thứ tự ban đầu
        return [{"index": i, "relevance_score": 0.0} for i in range(len(documents))][:top_n]

async def get_embedding(text: str) -> List[float]:
    """
    Tạo vector embedding 768 chiều từ Gemini Embedding.
    """
    response = await ai_client.aio.models.embed_content(
        model=settings.GEMINI_MODEL_EMBED,
        contents=text,
        config={'output_dimensionality': 768}
    )
    return response.embeddings[0].values

async def _execute_rpc_search(rpc_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Gọi Supabase RPC match_cars bất đồng bộ qua thread pool.
    """
    try:
        response = await asyncio.to_thread(
            supabase.rpc('match_cars', rpc_params).execute
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Supabase RPC match_cars failed: {e}")
        return []

async def hybrid_search(
    soft_intent: str,
    max_price: Optional[int] = None,
    make: Optional[str] = None,
    target_year: Optional[int] = None,
    min_hp: Optional[int] = None,
    fuel_type: Optional[str] = None,
    top_k: int = 5
) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
    """
    Thực hiện tìm kiếm kết hợp (Hybrid Search: Vector HNSW + SQL Filter + Jina Reranking).
    Tự động kích hoạt cơ chế giải quyết xung đột (Conflict Resolution) khi không có xe thỏa mãn.
    """
    conflict_detected = False
    relaxed_terms: List[str] = []

    # 1. Tạo vector từ soft_intent
    t_start = time.time()
    query_vector = await get_embedding(soft_intent)
    t_embed = time.time()
    logger.debug(f"[Timer] get_embedding took {t_embed - t_start:.2f}s")

    fetch_count = max(15, top_k * 5)
    base_params = {
        'query_embedding': query_vector,
        'match_threshold': 0.3,
        'match_count': fetch_count,
        'filter_make': make,
        'filter_max_price': max_price,
        'filter_target_year': target_year,
        'filter_min_hp': min_hp,
        'filter_fuel_type': fuel_type
    }

    # 2. Strict Search
    results = await _execute_rpc_search(base_params)

    # 3. Conflict Resolution - Level 1: Nới lỏng ngân sách / mã lực
    if not results and (max_price is not None or min_hp is not None):
        conflict_detected = True
        relaxed_terms.append('price_or_hp')
        relaxed_price = int(max_price * 1.5) if max_price is not None else None
        relaxed_hp = int(min_hp * 0.8) if min_hp is not None else None

        relaxed_params_1 = dict(base_params)
        relaxed_params_1['filter_max_price'] = relaxed_price
        relaxed_params_1['filter_min_hp'] = relaxed_hp
        results = await _execute_rpc_search(relaxed_params_1)

    # 4. Conflict Resolution - Level 2: Nới lỏng luôn thương hiệu Make nếu vẫn không có kết quả
    if not results and make is not None:
        conflict_detected = True
        if 'make' not in relaxed_terms:
            relaxed_terms.append('make')

        relaxed_price = int(max_price * 1.5) if max_price is not None else None
        relaxed_hp = int(min_hp * 0.8) if min_hp is not None else None

        relaxed_params_2 = dict(base_params)
        relaxed_params_2['filter_max_price'] = relaxed_price
        relaxed_params_2['filter_min_hp'] = relaxed_hp
        relaxed_params_2['filter_make'] = None  # Bỏ lọc thương hiệu
        results = await _execute_rpc_search(relaxed_params_2)

    # 5. Jina Reranker (Cross-Encoder)
    if results:
        t_rerank_start = time.time()
        documents = []
        for c in results:
            metadata_str = str(c.get('metadata') or '')
            review_str = c.get('review') or ''
            p_usd = c.get('price') or 0
            p_vnd = p_usd * 25400
            vnd_str = f"{(p_vnd / 1e9):.2f} tỷ VNĐ" if p_vnd >= 1e9 else f"{(p_vnd / 1e6):.0f} triệu VNĐ"
            price_info = f"${p_usd:,} USD ({vnd_str})" if p_usd > 0 else "Contact for price"
            doc_text = (
                f"Car: {c.get('year')} {c.get('make')} {c.get('model')} - "
                f"Price: {price_info} - Engine: {c.get('engine_hp')}HP. "
                f"Specs: {metadata_str}. Review: {review_str}"
            )
            documents.append(doc_text)

        rerank_results = await jina_rerank(query=soft_intent, documents=documents, top_n=top_k)

        reranked_cars = []
        for r in rerank_results:
            idx = r.get("index")
            if idx is not None and idx < len(results):
                car_item = results[idx]
                car_item['rerank_score'] = r.get("relevance_score")
                reranked_cars.append(car_item)

        results = reranked_cars if reranked_cars else results[:top_k]
        t_rerank_end = time.time()
        logger.debug(f"[Timer] Jina Reranker took {t_rerank_end - t_rerank_start:.2f}s")

    return results, conflict_detected, relaxed_terms

from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import time

# Load biến môi trường trước khi import các module khác
load_dotenv()

from schemas import QueryRequest, SearchResponse, CarResponse
from agent import extract_constraints, generate_ai_response
from retrieval import hybrid_search

app = FastAPI(title="AutoMatch AI Backend", version="1.0.0")

@app.post("/api/search", response_model=SearchResponse)
async def search_cars(request: QueryRequest):
    try:
        t0 = time.time()
        
        # 1. Phân tích câu truy vấn (Query Parsing)
        constraints = extract_constraints(request.query)
        t1 = time.time()
        print(f"\n[Timer] extract_constraints (LLM 1) took {t1 - t0:.2f}s")
        
        # 2. Truy xuất dữ liệu & Kiểm tra mâu thuẫn (Hybrid Retrieval)
        cars_data, conflict = hybrid_search(
            soft_intent=constraints.soft_intent,
            max_price=constraints.max_price,
            manufacturer=constraints.manufacturer,
            top_k=3
        )
        t2 = time.time()
        print(f"[Timer] hybrid_search (Embedding + DB) took {t2 - t1:.2f}s")
        
        # 3. Tạo câu trả lời tự nhiên (AI Generation)
        ai_message = generate_ai_response(request.query, constraints, cars_data, conflict)
        t3 = time.time()
        print(f"[Timer] generate_ai_response (LLM 2) took {t3 - t2:.2f}s")
        print(f"[Timer] TOTAL API TIME: {t3 - t0:.2f}s\n")
        
        # 4. Trả về kết quả JSON cho Frontend
        results = [CarResponse(**car) for car in cars_data]
        
        return SearchResponse(
            original_query=request.query,
            constraints=constraints,
            results=results,
            conflict_detected=conflict,
            ai_message=ai_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

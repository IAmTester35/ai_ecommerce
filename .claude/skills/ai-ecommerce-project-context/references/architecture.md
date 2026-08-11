# Kiến trúc Hệ thống — AutoMatch AI (ai_ecommerce)

## Mục lục
- Tổng quan luồng dữ liệu
- 5 Tầng xử lý chính (5 Layers Architecture)
- Chi tiết tích hợp AI & Backend Stream (FastAPI SSE)
- Tích hợp Database & pgvector (Supabase)

---

## Sơ đồ tổng quan luồng truy vấn (Query Flow)

```
[User / Mobile App / Web App]
         │
         ▼ (SSE Connection / POST /api/search)
[FastAPI Backend - Microservice]
         │
         ├─► Layer 2: Intent & Constraint Extraction (Gemini 3.1 Flash Lite)
         │       ├─► Out-of-scope Detection (is_out_of_scope)
         │       └─► Semantic Expansion (soft_intent in English)
         │
         ├─► Layer 3: Hybrid Retrieval & Multi-level Conflict Resolution
         │       ├─► RPC Supabase: match_cars(query_embedding, filters)
         │       │       └─► PostgreSQL pgvector (gemini-embedding-2: 768d) + HNSW Index
         │       └─► Fallback Levels: 
         │               • L1: Nới lỏng budget (+50%) & min HP (-20%)
         │               • L2: Bỏ lọc thương hiệu (make = None)
         │
         ├─► Layer 4: Re-ranking (Jina Reranker API: jina-reranker-v3.5)
         │       ├─► Tái xếp hạng candidates theo soft_intent
         │       └─► Parallel Image Enrichment (CarImagery API -> Google Search -> DB Cache)
         │
         └─► Layer 5: Advisory Generation (Gemini 3.6 Flash - Thinking Mode)
                 ├─► SSE Stream: `search_data` payload + `message` text stream
                 └─► Lưu lịch sử vào Supabase `chat_sessions` table
```

---

## 5 Tầng Xử Lý Chi Tiết

### Layer 1: Data Ingestion & Storage Layer
- **Structured Data (Metadata)**: Lưu trong cột `metadata` (JSONB) với GIN Index (`price`, `year`, `engine_hp`, `fuel_type`).
- **Unstructured Data & Vectors**: Đánh giá xe (`reviews.comment`) được tạo embedding 768 chiều bằng **`gemini-embedding-2`** và lưu vào cột `reviews.embedding VECTOR(768)` với **HNSW Index (`vector_cosine_ops`)**.
- **Chat Persistence**: Lưu lịch sử hội thoại dạng phiên (`session_id`, `role`, `content`, `user_id`) trong bảng `chat_sessions`.

### Layer 2: Query Parsing & Intent Extraction
- Model AI: **`gemini-3.1-flash-lite`** (Structured JSON output qua Pydantic schema `ExtractedConstraints`).
- **Hard Constraints**: Trích xuất `max_price`, `target_year`, `min_hp`, `make`, `fuel_type`.
- **Soft Intent & Expansion**: Mở rộng ngữ cảnh bằng tiếng Anh, chuẩn hóa và tự động bóc tách các đặc tính ngầm định (ví dụ: "đi đường núi" -> "mountain driving, high ground clearance, 4WD/AWD"). Loại bỏ lời chào/tên riêng người dùng.
- **Out-of-Scope Detection**: Đánh cờ `is_out_of_scope = true` nếu truy vấn không liên quan tới lĩnh vực ô tô.

### Layer 3: Hybrid Retrieval & Multi-level Conflict Resolution
- Tạo query embedding 768 dimensions từ `soft_intent` bằng `gemini-embedding-2`.
- Gọi RPC function `match_cars` trên Supabase:
  1. **Strict Phase**: Lọc chính xác theo toàn bộ hard constraints + HNSW vector similarity.
  2. **Conflict Resolution Level 1**: Nếu 0 kết quả & có bộ lọc giá/mã lực, nới lỏng `max_price` x 1.5 và `min_hp` x 0.8, ghi nhận `relaxed_terms = ['price_or_hp']`.
  3. **Conflict Resolution Level 2**: Nếu vẫn 0 kết quả & có lọc hãng, hủy điều kiện `make`, ghi nhận `relaxed_terms = ['make']`.

### Layer 4: Re-ranking & Media Enrichment
- **Re-ranking**: Đưa Top candidates qua **Jina Reranker API (`jina-reranker-v3.5`)** để tái xếp hạng theo `soft_intent`. Fallback giữ nguyên thứ tự nếu thiếu `JINA_API_KEY` hoặc API lỗi.
- **Image Enrichment**: Tải ảnh xe bất đồng bộ (`fetch_images_for_cars`):
  1. Đọc cache `image_url` từ Supabase DB.
  2. Fallback 1: CarImagery API (miễn phí, search term: `{year}+{make}+{model}`).
  3. Fallback 2: Google Custom Search API.
  4. Cache ảnh mới vào DB thông qua background task.

### Layer 5: Generation & Streaming (SSE & Generative UI)
- Model AI: **`gemini-3.6-flash`** với cấu hình `thinking_budget`.
- **Streaming SSE (`text/event-stream`)**:
  - Gửi event `search_data`: JSON payload chứa `constraints`, `results` (kèm `image_url`, `rerank_score`), `conflict_detected`, `relaxed_terms`.
  - Gửi event `message`: Stream từng chunk văn bản tư vấn trực quan, minh bạch (tuân thủ nguyên tắc không tư vấn sai khi không có xe trong DB).
- Tự động lưu tin nhắn `assistant` vào bảng `chat_sessions`.


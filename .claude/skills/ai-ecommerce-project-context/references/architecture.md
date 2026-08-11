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
         ├─► Layer 2: Entity Extraction (Gemini 2.5 Flash)
         │       └─► Sanity Check & Conflict Flag Detection
         │
         ├─► Layer 3: Hybrid Retrieval & Constraint Relaxation
         │       └─► RPC Supabase: match_cars(query_embedding, filters)
         │               └─► PostgreSQL pgvector + HNSW Index
         │
         ├─► Layer 4: Re-ranking (Cross-Encoder Model)
         │       └─► Filter Top 3-5 Xe tối ưu nhất
         │
         └─► Layer 5: Response Generation (Gemini 1.5 Pro / Flash)
                 └─► SSE Text Stream + SearchData Event Payload
```

---

## 5 Tầng Xử Lý Chi Tiết

### Layer 1: Data Ingestion & Storage Layer
- **Structured Data (Metadata)**: Lưu trong cột `metadata` (JSONB) với GIN Index (`price`, `year`, `engine_hp`, `fuel_type`).
- **Unstructured Data & Vectors**: Đánh giá xe (`reviews.comment`) được tạo embedding 768 chiều bởi model Google `gemini-embedding-2` và lưu vào cột `reviews.embedding VECTOR(768)` với **HNSW Index (`vector_cosine_ops`)**.

### Layer 2: Query Parsing & Sanity Check
- Trích xuất Hard Constraints (`max_price`, `target_year`, `min_hp`, `make`, `fuel_type`) và Soft Intent.
- Thực hiện Count Query kiểm tra xem có tồn tại xe thỏa mãn 100% hard constraints không. Nếu không, bật cờ `conflict_detected = true`.

### Layer 3: Hybrid Retrieval & Conflict Resolution
- Nếu có mâu thuẫn (`conflict_detected = true`), chuyển Hard Constraints quá mức thành yêu cầu mềm, nới lỏng ngân sách/thông số kỹ thuật.
- Gọi RPC function `match_cars` trên Supabase với chiến lược Post-Filter:
  1. Phase 1: Pure vector search dùng HNSW Index trên bảng `reviews`.
  2. Phase 2: JOIN + filter mềm trên bảng `cars`.
  3. Phase 3: Deduplicate (1 review / 1 xe có similarity cao nhất).
  4. Phase 4: Trả về Top kết quả.
- Áp dụng thuật toán phạt điểm (Soft Penalty Scoring) đối với các mẫu xe vượt giá ngân sách.

### Layer 4: Re-ranking Layer
- Đưa danh sách xe từ Layer 3 qua mô hình Cross-Encoder chạy cục bộ trên Python Microservice để tái xếp hạng dựa trên toàn bộ ngữ cảnh phức tạp của yêu cầu người dùng.

### Layer 5: Generation & Streaming (SSE & Generative UI)
- LLM tổng hợp lời khuyên dựa trên kết quả đã giải quyết mâu thuẫn.
- Phản hồi dạng Server-Sent Events (SSE) qua giao thức `text/event-stream`, gửi sự kiện `search_data` chứa JSON kết quả xe và stream nội dung text tư vấn.
- Mobile App / Web App render Generative UI (Car Cards, bảng so sánh, nút đặt lái thử).

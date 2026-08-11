# API Endpoints & RPC Functions — AutoMatch AI

## 1. FastAPI AI Backend Endpoints

Base URL: `http://localhost:8000` (hoặc `EXPO_PUBLIC_API_URL`)

| Method | Path | Mục đích | Payload / Headers | Format Response |
|---|---|---|---|---|
| `POST` | `/api/search` | Tìm kiếm tư vấn xe AI bằng ngôn ngữ tự nhiên | Body: `{"query": string, "session_id": string}`<br>Headers: `Authorization: Bearer <access_token>` | `text/event-stream` (SSE Events: `search_data`, `message`, `error`, `close`) |
| `GET` | `/health` | Kiểm tra trạng thái hoạt động backend | Không có | `{"status": "ok"}` |

---

## 2. Supabase SQL Stored Functions (RPC)

Các hàm lưu trữ được gọi qua `supabase.rpc(function_name, params)`:

| Function Name | Tham số truyền vào | Return Value | Mục đích |
|---|---|---|---|
| `checkout_cart` | `p_user_id: UUID`<br>`p_payment_method: TEXT` | `UUID` (order_id) | Thực hiện thanh toán giỏ hàng, khóa tồn kho, trừ stock và tạo đơn hàng atomic |
| `match_cars` | `query_embedding: VECTOR(768)`<br>`match_threshold: FLOAT (0.3)`<br>`match_count: INT (5)`<br>`filter_make: TEXT`<br>`filter_max_price: BIGINT`<br>`filter_target_year: INT`<br>`filter_min_hp: INT`<br>`filter_fuel_type: TEXT` | `TABLE (id, make, model, year, engine_hp, price, metadata, review, similarity, image_url)` | Hybrid Vector Search RAG 4 phase với HNSW Index |

# Database Schema & Security Policy — Supabase (PostgreSQL)

Master schema định nghĩa tại file: [master_schema.sql](file:///Users/nammaithanh/Desktop/Samset/githubbb/ai_ecommerce/sql/master_schema.sql).

## Danh sách Bảng (Tables)

| Bảng | Mô tả | Trọng tâm Security / Constraints |
|---|---|---|
| `profiles` | Hồ sơ người dùng | Linked `auth.users(id) ON DELETE CASCADE`, Trigger chống leo thang quyền `role` |
| `cars` | Kho dữ liệu xe ô tô | Unique constraint `(make, model, year)`, GIN Index trên `metadata` |
| `saved_cars` | Danh sách xe đã lưu (Wishlist) | Unique `(user_id, car_id)` |
| `test_drives` | Đăng ký lái thử | `status IN ('pending', 'confirmed', 'completed', 'cancelled')` |
| `orders` | Đơn đặt hàng | `total_amount`, status, payment_status |
| `order_items` | Chi tiết mặt hàng trong đơn | Linked `orders(id)` và `cars(id)` |
| `reviews` | Đánh giá xe ô tô | Cột `embedding VECTOR(768)` với Index HNSW (`vector_cosine_ops`) |
| `car_qa` | Hỏi đáp về xe | Cột `question`, `answer`, `answered_by` |
| `viewed_cars` | Lịch sử xem xe | Index `(user_id, viewed_at DESC)` |
| `search_history` | Lịch sử từ khóa tìm kiếm | Linked `profiles(id)` |
| `chat_sessions` | Lịch sử trò chuyện AI Chatbot | Cột `session_id UUID`, `role IN ('user', 'assistant', 'system')` |
| `notifications` | Thông báo hệ thống | Cột `is_read BOOLEAN DEFAULT FALSE` |
| `cart_items` | Giỏ hàng tạm thời | Unique `(user_id, car_id)` |

---

## SQL Stored Functions (RPC)

### 1. `checkout_cart(p_user_id UUID, p_payment_method TEXT) -> UUID`
- **Mục đích**: Thực hiện thanh toán giỏ hàng nguyên tử (Atomic Transaction).
- **Cơ chế**:
  - Kiểm tra giỏ hàng `cart_items` không rỗng.
  - Tạo record `orders` trạng thái `pending`.
  - Khóa hàng (`FOR UPDATE OF c`) chống race-condition tồn kho.
  - Trừ `cars.stock_quantity`, tạo `order_items`, tính tổng tiền `total_amount`.
  - Xóa giỏ hàng `cart_items` và trả về `v_order_id`.
  - Khai báo `SECURITY DEFINER SET search_path = public`.

### 2. `match_cars(...) -> TABLE (...)`
- **Mục đích**: Thực hiện Vector Search RAG kết hợp filter thông số kỹ thuật.
- **Cơ chế 4 Phase**:
  - Phase 1: Pure vector search ép Postgres dùng HNSW Index trên `reviews`.
  - Phase 2: JOIN + filter trên `cars` (make, price, year, hp, fuel_type).
  - Phase 3: Deduplicate 1 review / 1 xe.
  - Phase 4: Trả về danh sách xe phù hợp nhất xếp theo similarity.

---

## Row Level Security (RLS) & Roles

- Tất cả các bảng đều bật `ENABLE ROW LEVEL SECURITY`.
- Role helper function: `get_my_role()` lấy role từ JWT claims hoặc bảng `profiles` (default `'user'`).
- Bảng `orders` và `order_items`: Khách hàng **không được phép** INSERT/UPDATE trực tiếp qua REST API (bị chặn bởi RLS). Việc tạo đơn hàng chỉ thực hiện thông qua hàm `checkout_cart()` (`SECURITY DEFINER`).

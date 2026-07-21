# 🚀 Hướng dẫn Tích hợp (Dành cho Frontend Developers)

Chào các bạn Frontend Developers,

Tài liệu này được cập nhật theo **kiến trúc mới nhất** của dự án **AutoMatch AI**. Nhằm tối ưu hóa hiệu năng và bảo mật, chúng ta đã chuyển đổi sang mô hình **Supabase-first**.

**Tóm tắt kiến trúc mới:**
- Mọi thao tác CRUD (Thêm/Đọc/Sửa/Xóa) cơ bản sẽ gọi **TRỰC TIẾP** từ Frontend xuống Supabase thông qua thư viện `supabase-js`.
- **Backend FastAPI** giờ đây chỉ đảm nhận một nhiệm vụ duy nhất: Xử lý trí tuệ nhân tạo (AI Vector Search & RAG).

---

## 1. Cơ chế Xác thực & Bảo mật (RLS)

Frontend sẽ trực tiếp quản lý việc đăng nhập thông qua Supabase Auth:
1. Bạn sử dụng `supabase.auth.signInWithPassword()` hoặc các hàm tương tự để login.
2. Khi gọi các thao tác CRUD xuống Database (như thêm vào giỏ hàng), thư viện `supabase-js` sẽ tự động đính kèm Token của User.
3. **Database đã được bật RLS (Row Level Security):** Postgres sẽ tự động kiểm tra quyền của người dùng dựa trên Token. Bạn không thể vô tình sửa hay xóa giỏ hàng của người khác.

---

## 2. Cách thức gọi API (Dữ liệu CRUD)

*⚠️ LƯU Ý: Các endpoint `/api/cars`, `/api/users`, `/api/cart`, `/api/admin` trên FastAPI đã bị xóa.*

Thay vì gọi Backend, bạn sẽ gọi thẳng Database bằng `supabase-js`. Dưới đây là các ví dụ:

### 🚗 Lấy danh sách xe
```javascript
const { data, error } = await supabase
  .from('cars')
  .select('*')
  .eq('make', 'Toyota')
  .lte('price', 50000)
  .limit(20);
```

### 🛒 Giỏ hàng
```javascript
// Lấy giỏ hàng của user đang đăng nhập
const { data, error } = await supabase.from('cart_items').select('*, cars(*)');

// Thêm vào giỏ hàng
const { data, error } = await supabase
  .from('cart_items')
  .insert([{ car_id: 'UUID_CỦA_XE', quantity: 1 }]);
```

### 💳 Thanh toán (Gọi Stored Procedure)
Database đã được viết sẵn hàm RPC an toàn cho giao dịch.
```javascript
const { data, error } = await supabase
  .rpc('checkout_cart', { 
    p_user_id: user.id, 
    p_payment_method: 'credit_card' 
  });
// Trả về order_id nếu thành công
```

### 👑 Quản trị (Admin)
Chỉ những user có `role = 'admin'` mới có quyền Insert/Update vào bảng `cars`. Nếu user bình thường cố tình chạy lệnh này, Supabase sẽ tự động block (trả về lỗi 403 Forbidden).
```javascript
const { data, error } = await supabase
  .from('cars')
  .update({ is_active: false }) // Soft delete
  .eq('id', carId);
```

---

## 3. API AI Search (Gọi qua FastAPI)

Đây là **Endpoint duy nhất** bạn cần gọi qua Backend FastAPI (`http://localhost:8000`), vì nó chứa logic ẩn (Gemini API Key, Prompt, Vector Hybrid Search).

### 🤖 Tìm kiếm AI bằng ngôn ngữ tự nhiên
- **Endpoint:** `POST /api/search`
- **Body:** `{ "query": "Tôi muốn mua xe thể thao 2 cửa, tài chính 2 tỷ" }`
- **Response Format:**
  ```json
  {
    "original_query": "Tôi muốn mua xe thể thao...",
    "constraints": {
      "max_price": 2000000000,
      "make": null,
      "soft_intent": "Xe thể thao 2 cửa"
    },
    "results": [
      {
        "id": "uuid-...",
        "make": "Porsche",
        "model": "911",
        "year": 2023,
        "price": 2000000000,
        "review": "Cảm giác lái tuyệt vời...",
        "similarity": 0.89
      }
    ],
    "conflict_detected": false,
    "ai_message": "Chào bạn, với ngân sách 2 tỷ và yêu cầu xe thể thao 2 cửa, tôi đã tìm được chiếc Porsche 911 rất phù hợp..."
  }
  ```
- **Ứng dụng UI:** Bạn có thể dùng `ai_message` để làm giao diện Chatbot hoặc Generative UI, và dùng `results` để hiển thị thẻ xe ngay bên dưới câu trả lời của Bot.

---

Chúc các anh em Frontend code mượt mà và tận dụng tối đa sức mạnh của Supabase nhé! 🥂

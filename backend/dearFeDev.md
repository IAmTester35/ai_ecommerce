# Tài liệu Tích hợp Frontend

Tài liệu này cung cấp hướng dẫn tích hợp dựa trên kiến trúc mới nhất của hệ thống **AutoMatch AI**. Để tối ưu hóa hiệu năng và bảo mật, dự án đã chuyển đổi sang mô hình **Supabase-first**.

**Tổng quan kiến trúc:**
- Các thao tác CRUD (Thêm/Đọc/Sửa/Xóa) cơ bản được thực hiện trực tiếp từ Frontend thông qua thư viện `supabase-js`.
- Backend FastAPI hiện chỉ đảm nhiệm việc xử lý logic trí tuệ nhân tạo (AI Vector Search & RAG).

---

## 1. Cơ chế Xác thực và Bảo mật (RLS)

Frontend quản lý việc xác thực người dùng thông qua Supabase Auth:
1. Sử dụng `supabase.auth.signInWithPassword()` hoặc các phương thức tương tự để xác thực.
2. Khi thực hiện các thao tác CRUD lên Database, thư viện `supabase-js` tự động đính kèm Token của người dùng vào request.
3. **Bảo mật cấp dòng (Row Level Security - RLS):** Database Postgres tự động kiểm tra quyền truy cập dựa trên Token. Người dùng chỉ có thể thao tác trên dữ liệu thuộc quyền sở hữu của họ.

---

## 2. Thao tác Dữ liệu (CRUD)

*Lưu ý: Các endpoint RESTful truyền thống (`/api/cars`, `/api/users`, `/api/cart`, `/api/admin`) trên FastAPI đã được gỡ bỏ.*

Các thao tác cơ sở dữ liệu sẽ gọi trực tiếp đến Supabase. Dưới đây là các ví dụ tham khảo:

### 2.1. Truy vấn Dữ liệu (Ví dụ: Danh sách xe)
```javascript
const { data, error } = await supabase
  .from('cars')
  .select('*')
  .eq('make', 'Toyota')
  .lte('price', 50000)
  .limit(20);
```

### 2.2. Thao tác Giỏ hàng
```javascript
// Lấy giỏ hàng của người dùng đang đăng nhập
const { data: cartData, error: cartError } = await supabase
  .from('cart_items')
  .select('*, cars(*)');

// Thêm sản phẩm vào giỏ hàng
const { data: insertData, error: insertError } = await supabase
  .from('cart_items')
  .insert([{ car_id: 'UUID_CỦA_XE', quantity: 1 }]);
```

### 2.3. Thanh toán (Stored Procedure)
Hệ thống cung cấp sẵn hàm RPC an toàn cho các giao dịch.
```javascript
const { data, error } = await supabase
  .rpc('checkout_cart', { 
    p_user_id: user.id, 
    p_payment_method: 'credit_card' 
  });
// Trả về order_id nếu giao dịch thành công
```

### 2.4. Lịch sử mua hàng (Orders)
```javascript
// Lấy danh sách đơn hàng và chi tiết các xe đã mua
const { data, error } = await supabase
  .from('orders')
  .select('*, order_items(*, cars(*))')
  .order('created_at', { ascending: false });
```

### 2.5. Xe đã lưu (Wishlist)
```javascript
// Lưu một xe vào Wishlist
const { data, error } = await supabase
  .from('saved_cars')
  .insert([{ car_id: 'UUID_CỦA_XE' }]);

// Lấy danh sách xe đã lưu
const { data: savedCars, error: getError } = await supabase
  .from('saved_cars')
  .select('*, cars(*)')
  .order('created_at', { ascending: false });
```

### 2.6. Lịch sử xem xe (Recently Viewed)
```javascript
// Ghi nhận khi user xem chi tiết xe
const { data, error } = await supabase
  .from('viewed_cars')
  .insert([{ car_id: 'UUID_CỦA_XE' }]);

// Lấy danh sách xe vừa xem
const { data: viewedCars, error: getError } = await supabase
  .from('viewed_cars')
  .select('*, cars(*)')
  .order('viewed_at', { ascending: false })
  .limit(10);
```

### 2.7. Đặt lịch lái thử (Test Drives)
```javascript
// Lên lịch lái thử
const { data, error } = await supabase
  .from('test_drives')
  .insert([{ 
    car_id: 'UUID_CỦA_XE', 
    scheduled_date: '2026-08-01T10:00:00Z',
    notes: 'Vui lòng chuẩn bị xe trước 15 phút' 
  }]);
```

### 2.8. Hỏi đáp xe (Q&A)
```javascript
// Gửi câu hỏi về xe
const { data, error } = await supabase
  .from('car_qa')
  .insert([{ 
    car_id: 'UUID_CỦA_XE', 
    question: 'Xe này có hỗ trợ trả góp không?' 
  }]);

// Lấy danh sách câu hỏi của một xe (kèm tên và avatar người trả lời nếu có)
const { data: qaData, error: qaError } = await supabase
  .from('car_qa')
  .select('*, profiles(full_name, avatar_url)')
  .eq('car_id', 'UUID_CỦA_XE')
  .order('created_at', { ascending: false });
```

### 2.9. Đánh giá xe (Reviews)
```javascript
// Đăng đánh giá
const { data, error } = await supabase
  .from('reviews')
  .insert([{ 
    car_id: 'UUID_CỦA_XE', 
    rating: 5,
    comment: 'Xe chạy bốc, máy êm!' 
  }]);
```

### 2.10. Lịch sử tìm kiếm (Search History)
```javascript
// Lưu lịch sử tìm kiếm text
const { data, error } = await supabase
  .from('search_history')
  .insert([{ query_text: 'Xe SUV dưới 1 tỷ' }]);
```

### 2.11. Thông báo (Notifications)
```javascript
// Lấy danh sách thông báo
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .order('created_at', { ascending: false });

// Đánh dấu đã đọc
const { data: updateData, error: updateError } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', 'UUID_CỦA_THÔNG_BÁO');
```

### 2.12. Quản trị (Admin)
Chỉ người dùng có `role = 'admin'` mới có quyền Insert/Update trên bảng `cars`. Bất kỳ nỗ lực thay đổi dữ liệu từ người dùng không có quyền sẽ bị từ chối với lỗi 403 Forbidden.
```javascript
const { data, error } = await supabase
  .from('cars')
  .update({ is_active: false }) // Soft delete
  .eq('id', carId);
```

---

## 3. Tích hợp AI Search (FastAPI)

Endpoint duy nhất đi qua Backend FastAPI (`http://localhost:8000`) là API tìm kiếm, vì quá trình này đòi hỏi xử lý bảo mật (API Key) và logic phức tạp (Vector Hybrid Search).

### 3.1. Luồng hoạt động (Workflow) chi tiết

Dưới đây là sơ đồ chi tiết toàn bộ quá trình diễn ra khi Frontend gọi API tìm kiếm, giúp cả Frontend và Backend hiểu rõ kiến trúc hệ thống:

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant API as FastAPI (Backend)
    participant LLM1 as Gemini (Extract)
    participant EMB as Embedding API
    participant DB as Supabase (PostgreSQL)
    participant LLM2 as Gemini (Generate)

    FE->>API: POST /api/search { "query": "..." }
    
    API->>LLM1: Phân tích câu truy vấn (Prompt)
    LLM1-->>API: Trả về Constraints (Giá, Hãng, intent...)
    
    alt Nếu câu hỏi ngoài phạm vi (is_out_of_scope = true)
        API->>LLM2: Yêu cầu sinh câu từ chối khéo léo
    else Nếu câu hỏi hợp lệ (Về ô tô)
        API->>EMB: Tạo Vector (768 chiều) cho "soft_intent"
        EMB-->>API: Trả về Embedding Vector
        
        API->>DB: Gọi RPC: match_cars(vector, filters...)
        
        rect rgba(255, 255, 255, 0)
            Note over DB: Kiến trúc Database Post-Filter (4 Phases)
            DB->>DB: Phase 1: Pure Vector Search bằng HNSW Index trên bảng `reviews`<br/>(Tìm các review gần ngữ nghĩa nhất, không dùng filter để tối đa tốc độ)
            DB->>DB: Phase 2: JOIN bảng `cars` & Lọc Hard Filters<br/>(Lọc theo Giá tối đa, Hãng xe, Năm sản xuất...)
            DB->>DB: Phase 3: Deduplicate<br/>(Loại bỏ trùng lặp, chỉ giữ 1 review tốt nhất cho mỗi chiếc xe)
            DB->>DB: Phase 4: Limit Top K<br/>(Trả về danh sách 3 xe tốt nhất)
        end
        
        DB-->>API: Danh sách xe phù hợp (Kèm độ tương đồng)
        
        API->>API: Kiểm tra Conflict (Mâu thuẫn yêu cầu)
        
        API->>LLM2: Tổng hợp dữ liệu (Xe, Constraints, Conflict)
    end
    
    LLM2-->>API: Sinh lời thoại tư vấn tự nhiên
    API-->>FE: Trả về JSON (Results + relaxed_terms + ai_message)
```

### 3.2. Tìm kiếm AI bằng ngôn ngữ tự nhiên
- **Endpoint:** `POST /api/search`
- **Body Request:** 
  ```json
  { 
    "query": "Tôi muốn mua xe thể thao 2 cửa, tài chính 2 tỷ" 
  }
  ```
- **Response Format:**
  ```json
  {
    "original_query": "Tôi muốn mua xe thể thao...",
    "constraints": {
      "max_price": 2000000000,
      "min_hp": null,
      "make": null,
      "target_year": null,
      "fuel_type": null,
      "is_out_of_scope": false,
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
    "relaxed_terms": [],
    "ai_message": "Với ngân sách 2 tỷ và yêu cầu xe thể thao 2 cửa, hệ thống đã tìm được chiếc Porsche 911 phù hợp."
  }
  ```
- **Ứng dụng:** Sử dụng trường `ai_message` để hiển thị phản hồi từ Chatbot hoặc giao diện AI tạo sinh. Sử dụng trường `results` để hiển thị danh sách các thẻ sản phẩm tương ứng.

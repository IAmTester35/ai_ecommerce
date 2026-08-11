# Lỗi thường gặp & Cách xử lý (Troubleshooting) — AutoMatch AI

## 1. Lỗi "NOT NULL / Foreign Key constraint" khi lưu xe vào `saved_cars`
* **Khi nào gặp:** Gọi `saveCar(carId)` mà không truyền `userId`.
* **Nguyên nhân:** Bảng `saved_cars` trong PostgreSQL không khai báo `DEFAULT auth.uid()` cho cột `user_id`.
* **Cách fix:** Truyền rõ ràng `userId` trong `carService.saveCar(carId, userId)`.

## 2. Lỗi Duplicate Event Listeners trong `useSearchStore`
* **Khi nào gặp:** Thực hiện tìm kiếm nhiều lần liên tiếp qua SSE trong mobile app.
* **Nguyên nhân:** `aiSseService.on(...)` bị đăng ký chồng lên nhau mỗi lần gọi `executeSearch()`.
* **Cách fix:** Gọi `aiSseService.off(...)` cho các sự kiện `SEARCH_DATA`, `MESSAGE`, `ERROR`, `CLOSE` trước khi đăng ký listener mới.

## 3. Lỗi UUID Type Casting khi lưu `sessionId` vào DB `chat_sessions`
* **Khi nào gặp:** Backend hoặc Supabase thông báo lỗi `invalid input syntax for type uuid`.
* **Nguyên nhân:** Hàm sinh `sessionId` tạo chuỗi ngẫu nhiên bằng `Math.random().toString(36)` không khớp định dạng UUID.
* **Cách fix:** Sử dụng `crypto.randomUUID()` hoặc hàm format chuẩn 36 ký tự UUID v4 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`).

## 4. Lỗi RLS Permission Denied khi tạo đơn hàng trực tiếp từ API REST
* **Khi nào gặp:** Gọi `supabase.from('orders').insert(...)` từ client.
* **Nguyên nhân:** Policy `Orders select policy` / RLS chỉ cho phép SELECT/UPDATE đối với manager/owner, không cho phép client INSERT trực tiếp.
* **Cách fix:** Gọi thông qua SQL function `checkout_cart(p_user_id, p_payment_method)` với quyền `SECURITY DEFINER`.

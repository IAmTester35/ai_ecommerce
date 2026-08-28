# 🛡️ BÁO CÁO KIỂM TOÁN ROW LEVEL SECURITY (RLS) & PHÂN QUYỀN SUPABASE
**Dự Án:** AutoMatch AI Executive Platform (Admin Dashboard)  
**Thời gian kiểm toán:** 26/08/2026  
**Nguyên tắc bảo mật:** `100% Policy-Driven Access Control` — Tuyệt đối không dùng `service_role` key bypass trên giao diện Admin.

---

## 1. TỔNG QUAN HIỆN TRẠNG & NGUYÊN TẮC BẢO MẬT

Trong hệ thống AutoMatch AI, ứng dụng quản trị `admin-dashboard` tương tác với cơ sở dữ liệu Supabase PostgreSQL thông qua thư viện `@supabase/supabase-js` sử dụng khóa công khai (`SUPABASE_ANON_KEY`) kết hợp với **JWT Session** của người dùng đã đăng nhập.

Mọi quyền hạn (CRUD) của Ban Quản Trị được kiểm soát **trực tiếp tại tầng Cơ Sở Dữ Liệu bằng Postgres Row Level Security (RLS)** thông qua hàm bảo mật:

```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
STABLE AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'user'
  );
$$;
```

---

## 2. KẾT QUẢ RÀ SOÁT CHI TIẾT 15 BẢNG CƠ SỞ DỮ LIỆU

| STT | Tên Bảng | Trạng Thái RLS Hiện Tại | Lỗ Hổng / Vấn Đề Phát Hiện | Mức Độ | Đề Xuất Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `profiles` | Đã bật RLS | Chưa có ràng buộc giới hạn **chỉ có duy nhất 01 Owner** trong hệ thống; Chưa chặn trường hợp Owner duy nhất tự hạ cấp hoặc bị xóa. | 🔴 Nghiêm trọng | Bổ sung Trigger `enforce_single_owner()` và cung cấp RPC `transfer_ownership` chuyển giao quyền an toàn. |
| 2 | `notifications` | Đã bật RLS | Policy SELECT hiện tại là `user_id = auth.uid()`, khiến Admin không xem được các thông báo dạng broadcast toàn hệ thống (`user_id IS NULL`). Policy UPDATE cũng không cho phép admin cập nhật thông báo broadcast. | 🔴 Nghiêm trọng | Mở rộng Policy SELECT & UPDATE: Cho phép `user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner')`. |
| 3 | `search_history` | Đã bật RLS | Policy hiện tại là `user_id = auth.uid()`, làm cho tính năng **AI Vector & Conflict Hub** trên Admin không thể đọc lịch sử tìm kiếm của khách hàng để phân tích xu hướng và mâu thuẫn. | 🟠 Trung bình | Bổ sung Policy SELECT cho `get_my_role() IN ('manager', 'owner')`. |
| 4 | `chat_sessions` | Đã bật RLS | Policy hiện tại chỉ cho phép người dùng xem session của chính mình (`user_id = auth.uid() OR user_id IS NULL`). Admin không xem được lịch sử để audit chất lượng AI. | 🟡 Thấp | Bổ sung Policy SELECT cho `get_my_role() IN ('manager', 'owner')`. |
| 5 | `cars` | Đã bật RLS | Policy `Cars admin write` đang dùng `FOR ALL USING (get_my_role() IN ('manager', 'owner'))`, cho phép cả Manager xóa xe, trong khi quy định nghiệp vụ chỉ cho phép Owner xóa. | 🟡 Thấp | Tách riêng: Manager được `INSERT/UPDATE`, chỉ `Owner` được `DELETE`. |
| 6 | `showrooms` | Đã bật RLS | Policy `Showrooms admin write` đang dùng `FOR ALL USING (get_my_role() IN ('manager', 'owner'))`, cho phép cả Manager xóa chi nhánh showroom. | 🟡 Thấp | Tách riêng: Manager được `INSERT/UPDATE`, chỉ `Owner` được `DELETE`. |
| 7 | `vouchers` | Đã bật RLS | Tương tự bảng cars/showrooms, Manager không nên có quyền DELETE chiến dịch voucher đang chạy. | 🟡 Thấp | Tách riêng: Manager được `INSERT/UPDATE`, chỉ `Owner` được `DELETE`. |
| 8 | `orders` | Đã bật RLS | Đã chuẩn: Khách xem đơn của mình; Manager/Owner xem toàn bộ và cập nhật trạng thái; Chỉ Owner được DELETE đơn hàng. | 🟢 Đạt chuẩn | Giữ nguyên. |
| 9 | `order_items` | Đã bật RLS | Đã chuẩn: Liên kết theo Order hoặc quyền Manager/Owner. | 🟢 Đạt chuẩn | Giữ nguyên. |
| 10 | `test_drives` | Đã bật RLS | Đã chuẩn: Khách xem/đặt lịch của mình; Manager/Owner xem toàn bộ và duyệt/hủy lịch hẹn. | 🟢 Đạt chuẩn | Giữ nguyên. |
| 11 | `reviews` | Đã bật RLS | Đã chuẩn: Public đọc; Khách viết/sửa bài mình; Manager/Owner có quyền xóa bài vi phạm. | 🟢 Đạt chuẩn | Giữ nguyên. |
| 12 | `car_qa` | Đã bật RLS | Đã chuẩn: Public đọc; Khách đặt câu hỏi; Manager/Owner trả lời và xóa câu hỏi vi phạm. | 🟢 Đạt chuẩn | Giữ nguyên. |
| 13 | `saved_cars` | Đã bật RLS | Khách hàng lưu xe yêu thích của mình. | 🟢 Đạt chuẩn | Bổ sung quyền SELECT cho Admin nếu cần thống kê xe hot. |
| 14 | `viewed_cars` | Đã bật RLS | Khách hàng xem lịch sử xe đã xem. | 🟢 Đạt chuẩn | Bổ sung quyền SELECT cho Admin phục vụ Recommendation. |
| 15 | `cart_items` | Đã bật RLS | Khách hàng quản lý giỏ hàng cá nhân. | 🟢 Đạt chuẩn | Giữ nguyên. |

---

## 3. KỊCH BẢN SQL NÂNG CẤP VÀ HOÀN THIỆN RLS POLICIES

> [!IMPORTANT]
> **Hướng dẫn thực thi:**  
> Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard/project/vafxrjhzgzihjiphvhms) -> chọn **SQL Editor** -> Dán toàn bộ kịch bản bên dưới và bấm **Run**.

```sql
-- ==============================================================================
-- AUTOMATCH AI - SUPABASE RLS POLICIES & SINGLE OWNER PROTECTION MIGRATION
-- An toàn chạy trực tiếp trên Supabase SQL Editor hiện hữu (Giữ nguyên toàn bộ dữ liệu)
-- ==============================================================================

-- 1. BẢO VỆ TÀI KHOẢN OWNER DUY NHẤT (SINGLE OWNER ENFORCEMENT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_single_owner()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
    v_current_owner_count INT;
BEGIN
    -- Trường hợp INSERT tài khoản mới với vai trò Owner
    IF TG_OP = 'INSERT' AND NEW.role = 'owner' THEN
        SELECT COUNT(*) INTO v_current_owner_count FROM profiles WHERE role = 'owner';
        IF v_current_owner_count >= 1 THEN
            RAISE EXCEPTION 'Hệ thống chỉ cho phép duy nhất 01 tài khoản Chủ Sở Hữu (Owner).';
        END IF;
    END IF;

    -- Trường hợp UPDATE vai trò thành Owner hoặc hạ cấp Owner
    IF TG_OP = 'UPDATE' THEN
        -- Chặn gán thêm Owner thứ hai
        IF NEW.role = 'owner' AND OLD.role <> 'owner' THEN
            SELECT COUNT(*) INTO v_current_owner_count FROM profiles WHERE role = 'owner' AND id <> NEW.id;
            IF v_current_owner_count >= 1 THEN
                RAISE EXCEPTION 'Hệ thống chỉ cho phép duy nhất 01 tài khoản Chủ Sở Hữu (Owner).';
            END IF;
        END IF;

        -- Chặn hạ cấp tài khoản Owner duy nhất
        IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
            SELECT COUNT(*) INTO v_current_owner_count FROM profiles WHERE role = 'owner';
            IF v_current_owner_count <= 1 THEN
                RAISE EXCEPTION 'Không thể hạ cấp tài khoản Owner duy nhất của hệ thống.';
            END IF;
        END IF;
    END IF;

    -- Trường hợp DELETE tài khoản Owner
    IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
        SELECT COUNT(*) INTO v_current_owner_count FROM profiles WHERE role = 'owner';
        IF v_current_owner_count <= 1 THEN
            RAISE EXCEPTION 'Không thể xóa tài khoản Owner duy nhất của hệ thống.';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_owner ON profiles;
CREATE TRIGGER trg_enforce_single_owner
BEFORE INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION enforce_single_owner();

-- Thủ tục chuyển giao quyền Owner an toàn (Atomic Ownership Transfer)
CREATE OR REPLACE FUNCTION transfer_ownership(p_new_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
    IF v_caller_role <> 'owner' THEN
        RAISE EXCEPTION 'Chỉ tài khoản Chủ Sở Hữu (Owner) hiện tại mới có quyền chuyển giao quyền sở hữu.';
    END IF;

    IF auth.uid() = p_new_owner_id THEN
        RAISE EXCEPTION 'Tài khoản đích trùng với tài khoản Owner hiện tại.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_new_owner_id) THEN
        RAISE EXCEPTION 'Tài khoản đích không tồn tại trong hệ thống.';
    END IF;

    ALTER TABLE profiles DISABLE TRIGGER trg_enforce_single_owner;
    UPDATE profiles SET role = 'manager', updated_at = NOW() WHERE id = auth.uid();
    UPDATE profiles SET role = 'owner', updated_at = NOW() WHERE id = p_new_owner_id;
    ALTER TABLE profiles ENABLE TRIGGER trg_enforce_single_owner;

    RETURN TRUE;
END;
$$;


-- 2. HOÀN THIỆN POLICIES CHO BẢNG NOTIFICATIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notifications select policy" ON notifications;
CREATE POLICY "Notifications select policy" ON notifications 
FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IS NULL 
    OR get_my_role() IN ('manager', 'owner')
);

DROP POLICY IF EXISTS "Notifications update policy" ON notifications;
CREATE POLICY "Notifications update policy" ON notifications 
FOR UPDATE USING (
    user_id = auth.uid() 
    OR user_id IS NULL 
    OR get_my_role() IN ('manager', 'owner')
);

DROP POLICY IF EXISTS "Notifications insert policy" ON notifications;
CREATE POLICY "Notifications insert policy" ON notifications 
FOR INSERT WITH CHECK (
    get_my_role() IN ('manager', 'owner')
);

DROP POLICY IF EXISTS "Notifications delete policy" ON notifications;
CREATE POLICY "Notifications delete policy" ON notifications 
FOR DELETE USING (
    get_my_role() IN ('manager', 'owner')
);


-- 3. HOÀN THIỆN POLICIES CHO BẢNG SEARCH_HISTORY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Search history user policy" ON search_history;
DROP POLICY IF EXISTS "Search history select policy" ON search_history;
DROP POLICY IF EXISTS "Search history insert policy" ON search_history;
DROP POLICY IF EXISTS "Search history delete policy" ON search_history;

CREATE POLICY "Search history select policy" ON search_history 
FOR SELECT USING (
    user_id = auth.uid() 
    OR get_my_role() IN ('manager', 'owner')
);

CREATE POLICY "Search history insert policy" ON search_history 
FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Search history delete policy" ON search_history 
FOR DELETE USING (
    user_id = auth.uid() 
    OR get_my_role() = 'owner'
);


-- 4. HOÀN THIỆN POLICIES CHO BẢNG CHAT_SESSIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Chat sessions user policy" ON chat_sessions;
DROP POLICY IF EXISTS "Chat sessions select policy" ON chat_sessions;
DROP POLICY IF EXISTS "Chat sessions insert policy" ON chat_sessions;

CREATE POLICY "Chat sessions select policy" ON chat_sessions 
FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id IS NULL 
    OR get_my_role() IN ('manager', 'owner')
);

CREATE POLICY "Chat sessions insert policy" ON chat_sessions 
FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL
);


-- 5. TINH CHỈNH PHÂN QUYỀN DELETE CHO CARS, SHOWROOMS, VOUCHERS
-- ------------------------------------------------------------------------------
-- 5.1 CARS
DROP POLICY IF EXISTS "Cars admin write" ON cars;
DROP POLICY IF EXISTS "Cars admin insert" ON cars;
DROP POLICY IF EXISTS "Cars admin insert_update" ON cars;
DROP POLICY IF EXISTS "Cars admin update" ON cars;
DROP POLICY IF EXISTS "Cars owner delete" ON cars;

CREATE POLICY "Cars admin insert" ON cars 
FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Cars admin update" ON cars 
FOR UPDATE USING (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Cars owner delete" ON cars 
FOR DELETE USING (get_my_role() = 'owner');

-- 5.2 SHOWROOMS
DROP POLICY IF EXISTS "Showrooms admin write" ON showrooms;
DROP POLICY IF EXISTS "Showrooms admin insert" ON showrooms;
DROP POLICY IF EXISTS "Showrooms admin update" ON showrooms;
DROP POLICY IF EXISTS "Showrooms owner delete" ON showrooms;

CREATE POLICY "Showrooms admin insert" ON showrooms 
FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Showrooms admin update" ON showrooms 
FOR UPDATE USING (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Showrooms owner delete" ON showrooms 
FOR DELETE USING (get_my_role() = 'owner');

-- 5.3 VOUCHERS
DROP POLICY IF EXISTS "Vouchers admin write" ON vouchers;
DROP POLICY IF EXISTS "Vouchers admin insert" ON vouchers;
DROP POLICY IF EXISTS "Vouchers admin update" ON vouchers;
DROP POLICY IF EXISTS "Vouchers owner delete" ON vouchers;

CREATE POLICY "Vouchers admin insert" ON vouchers 
FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Vouchers admin update" ON vouchers 
FOR UPDATE USING (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Vouchers owner delete" ON vouchers 
FOR DELETE USING (get_my_role() = 'owner');


-- 6. KIỂM TRA & XÁC NHẬN TOÀN BỘ RLS ĐÃ BẬT
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewed_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
```

---

## 4. KẾT LUẬN & ĐÁNH GIÁ AN NINH

- **Bảo mật Đăng Nhập:** Đã loại bỏ kẽ hở tự đăng ký làm Owner/Manager từ trang Login.
- **Tính Duy Nhất Của Owner:** Được kiểm soát chặt chẽ ở cả 2 tầng:
  1. *Tầng Cơ Sở Dữ Liệu:* Trigger `enforce_single_owner()` ngăn chặn tuyệt đối việc phát sinh Owner thứ 2 hoặc xóa/hạ cấp Owner duy nhất; Hỗ trợ thủ tục chuyển giao quyền sở hữu `transfer_ownership()`.
  2. *Tầng Giao Diện Admin:* Tách bạch rõ ràng giữa danh bạ Khách hàng CRM (`role: user`) và Danh sách Quản Trị Nội Bộ (`role: owner, manager`).
- **Tuân Thủ RLS 100%:** Code client không dùng bypass RLS, không dùng master key, mọi quyền hạn vận hành đều được Supabase RLS xác thực qua token người dùng.

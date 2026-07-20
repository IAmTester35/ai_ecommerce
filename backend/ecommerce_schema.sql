-- ==============================================================================
-- BỔ SUNG CẤU TRÚC DATABASE CHO E-COMMERCE (AUTO MATCH AI)
-- Kịch bản này KHÔNG DROP bảng `cars` để bảo toàn dữ liệu Embedding (Vector).
-- ==============================================================================

-- 1. Bổ sung trường dữ liệu E-commerce cho bảng `cars` hiện tại
-- Thêm quản lý tồn kho, trạng thái hiển thị và ngày tạo
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Quản lý Hồ sơ Người dùng (Profiles)
-- Mở rộng từ bảng auth.users của Supabase
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quản lý xe yêu thích / So sánh (Saved Cars / Wishlist)
CREATE TABLE IF NOT EXISTS saved_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);

-- 4. Đặt lịch lái thử (Test Drives)
CREATE TABLE IF NOT EXISTS test_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Đơn hàng (Orders) - Phục vụ Checkout và Hợp đồng
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount BIGINT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    contract_url TEXT, -- Lưu đường dẫn đến hợp đồng điện tử
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chi tiết đơn hàng (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE SET NULL,
    price BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Đánh giá xe (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Hỏi & Đáp (Q&A)
CREATE TABLE IF NOT EXISTS car_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Tham chiếu tới admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm các function và trigger cho việc tự động cập nhật `updated_at` (Tùy chọn)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo triggers cho các bảng
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_car_qa_updated_at
BEFORE UPDATE ON car_qa
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==============================================================================
-- BỔ SUNG CÁC TÍNH NĂNG CÒN THIẾU TỪ THIẾT KẾ
-- ==============================================================================

-- 9. Bổ sung Role cho User (phục vụ Admin Dashboard)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 10. Lịch sử xem xe (Viewed Cars)
CREATE TABLE IF NOT EXISTS viewed_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Lịch sử tìm kiếm (Search History)
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Thông báo (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

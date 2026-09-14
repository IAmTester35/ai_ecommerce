-- ==============================================================================
-- MASTER SCHEMA FOR E-COMMERCE (AUTO MATCH AI)
-- Drops all existing tables and recreates the entire database structure.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. DROP EVERYTHING (Reverse dependency order to avoid constraint errors)
DROP FUNCTION IF EXISTS checkout_cart CASCADE;
-- Xóa rõ ràng các phiên bản overload cũ của match_cars để tránh lỗi PostgreSQL ambiguous function (PGRST203)
DROP FUNCTION IF EXISTS public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text);
DROP FUNCTION IF EXISTS public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text, uuid);
DROP FUNCTION IF EXISTS match_cars CASCADE;
DROP FUNCTION IF EXISTS distribute_cars_to_showrooms CASCADE;
DROP FUNCTION IF EXISTS update_modified_column CASCADE;
DROP FUNCTION IF EXISTS prevent_profile_role_escalation CASCADE;
DROP FUNCTION IF EXISTS get_my_role CASCADE;

DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS viewed_cars CASCADE;
DROP TABLE IF EXISTS car_qa CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS test_drives CASCADE;
DROP TABLE IF EXISTS saved_cars CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS showrooms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. TABLES CREATION

-- 3.1 Profiles (Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'manager', 'owner')),
    showroom_id UUID,                            -- Showroom trực thuộc cho Manager
    is_active BOOLEAN DEFAULT TRUE,              -- Trạng thái kích hoạt tài khoản
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Showrooms (Hệ thống Chi nhánh / Đại lý Ô tô)
CREATE TABLE showrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    image_url TEXT,
    opening_hours TEXT DEFAULT '08:00 - 20:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liên kết showroom cho profile manager
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_showroom FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE SET NULL;

-- 3.3 Vouchers (Mã khuyến mãi & Ưu đãi đặt cọc / mua xe)
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value BIGINT NOT NULL,              -- Số tiền cố định (VNĐ) hoặc phần trăm (%)
    max_discount_amount BIGINT,                  -- Giới hạn giảm tối đa cho voucher dạng %
    min_order_value BIGINT DEFAULT 0,            -- Giá trị đơn hàng tối thiểu
    applies_to TEXT DEFAULT 'deposit' CHECK (applies_to IN ('deposit', 'total')),
    usage_limit INT DEFAULT 100,                 -- Giới hạn tổng số lượt sử dụng
    used_count INT DEFAULT 0,                    -- Số lượt đã dùng
    max_uses_per_user INT DEFAULT 1,             -- Giới hạn lượt dùng tối đa trên mỗi tài khoản
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_voucher_percentage CHECK (discount_type = 'fixed' OR (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100))
);

-- 3.4 Cars (Golden Dataset & Inventory)
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make TEXT NOT NULL,         
    model TEXT NOT NULL,
    year INT NOT NULL,
    engine_hp INT,
    price BIGINT,                                -- MSRP (Giá niêm yết tính bằng VNĐ hoặc quy đổi)
    showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL, -- Showroom trưng bày / lưu kho
    metadata JSONB,                              -- Thông số phụ (hộp số, nhiên liệu, số chỗ,...)
    image_url TEXT,                              -- Link ảnh xe
    stock_quantity INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(make, model, year)
);

-- Tạo Index GIN cho metadata để truy vấn JSON tốc độ cao
CREATE INDEX ON cars USING GIN (metadata);

-- 3.5 Saved Cars (Wishlist)
CREATE TABLE saved_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);

-- 3.6 Test Drives (Lịch hẹn Lái thử tại Showroom)
CREATE TABLE test_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL, -- Địa điểm lái thử
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Cố vấn bán hàng phụ trách
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Orders (Hợp đồng Đặt cọc & Mua xe)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL, -- Showroom nhận xe / bàn giao
    voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,   -- Voucher áp dụng
    total_amount BIGINT NOT NULL,                                 -- Tổng giá trị xe sau giảm giá (VNĐ)
    deposit_amount BIGINT NOT NULL DEFAULT 0,                     -- Số tiền đặt cọc cần thu online (VNĐ)
    remaining_amount BIGINT NOT NULL DEFAULT 0,                   -- Số tiền còn lại thu tại Showroom (VNĐ)
    discount_amount BIGINT NOT NULL DEFAULT 0,                    -- Số tiền đã giảm trừ từ voucher (VNĐ)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deposit_paid', 'preparing_car', 'ready_for_pickup', 'completed', 'cancelled')),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')), -- Trạng thái chung
    deposit_status TEXT DEFAULT 'unpaid' CHECK (deposit_status IN ('unpaid', 'paid', 'refunded')), -- Trạng thái tiền cọc
    contract_url TEXT,
    app_trans_id TEXT,                                            -- Mã giao dịch đối soát ZaloPay (YYMMDD_XXXXXX)
    cancellation_reason TEXT,                                     -- Lý do hủy đơn hàng
    cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Người thực hiện hủy
    cancelled_at TIMESTAMPTZ,                                     -- Thời điểm hủy
    refund_amount BIGINT DEFAULT 0,                               -- Số tiền đã hoàn (VNĐ)
    refund_reason TEXT,                                           -- Lý do hoàn tiền cọc
    refund_trans_id TEXT,                                         -- Mã giao dịch hoàn tiền ZaloPay
    refunded_at TIMESTAMPTZ,                                      -- Thời điểm hoàn cọc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    price BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    rating FLOAT,
    comment TEXT,
    source TEXT DEFAULT 'user',
    is_approved BOOLEAN DEFAULT TRUE,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo Index HNSW cho việc tìm kiếm Vector siêu tốc
CREATE INDEX ON reviews USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_reviews_car_id ON reviews (car_id);

-- 3.10 Q&A
CREATE TABLE car_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 Viewed Cars
CREATE TABLE viewed_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 Search History
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.13 Chat Sessions (AI Chatbot)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15 Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);


-- ==============================================================================
-- 3.16 PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cars_showroom_id ON cars(showroom_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_showroom_id ON orders(showroom_id);
CREATE INDEX IF NOT EXISTS idx_orders_voucher_id ON orders(voucher_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_user_id ON test_drives(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_car_id ON test_drives(car_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_showroom_id ON test_drives(showroom_id);
CREATE INDEX IF NOT EXISTS idx_viewed_cars_user_id_viewed_at ON viewed_cars(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_car_id ON order_items(car_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_car_qa_car_id ON car_qa(car_id);
CREATE INDEX IF NOT EXISTS idx_car_qa_user_id ON car_qa(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cars_car_id ON saved_cars(car_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_car_id ON cart_items(car_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);


-- ==============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 4.1 Trigger Function: Update `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_showrooms_updated_at BEFORE UPDATE ON showrooms FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_car_qa_updated_at BEFORE UPDATE ON car_qa FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- 4.2 Function: Phân bổ ngẫu nhiên xe vào N Showroom (Random distribution)
CREATE OR REPLACE FUNCTION distribute_cars_to_showrooms()
RETURNS INT AS $$
DECLARE
    v_showroom_ids UUID[];
    v_showroom_count INT;
    v_updated_count INT := 0;
BEGIN
    -- Lấy mảng ID của tất cả showroom đang hoạt động
    SELECT array_agg(id) INTO v_showroom_ids FROM showrooms WHERE is_active = TRUE;
    v_showroom_count := COALESCE(array_length(v_showroom_ids, 1), 0);
    
    IF v_showroom_count = 0 THEN
        RAISE EXCEPTION 'No active showrooms found to distribute cars.';
    END IF;

    -- Phân bổ ngẫu nhiên và đồng đều toàn bộ xe vào các Showroom
    WITH randomized_cars AS (
        SELECT id, (ROW_NUMBER() OVER (ORDER BY random()) - 1) % v_showroom_count + 1 AS showroom_idx
        FROM cars
    )
    UPDATE cars c
    SET showroom_id = v_showroom_ids[rc.showroom_idx]
    FROM randomized_cars rc
    WHERE c.id = rc.id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4.3 Function: Checkout Cart & Đặt cọc (Deposit & Voucher aware)
CREATE OR REPLACE FUNCTION checkout_cart(
    p_user_id UUID,
    p_payment_method TEXT,
    p_showroom_id UUID DEFAULT NULL,
    p_voucher_code TEXT DEFAULT NULL,
    p_deposit_rate FLOAT DEFAULT 0.10
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total_amount BIGINT := 0;
    v_deposit_amount BIGINT := 0;
    v_remaining_amount BIGINT := 0;
    v_discount_amount BIGINT := 0;
    v_voucher_id UUID := NULL;
    v_voucher RECORD;
    v_final_showroom_id UUID := p_showroom_id;
    cart_item RECORD;
BEGIN
    -- 1. Kiểm tra giỏ hàng
    IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    -- 2. Kiểm tra Voucher nếu có truyền vào
    IF p_voucher_code IS NOT NULL AND TRIM(p_voucher_code) <> '' THEN
        SELECT * INTO v_voucher 
        FROM vouchers 
        WHERE UPPER(code) = UPPER(TRIM(p_voucher_code))
          AND is_active = TRUE
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
          AND (usage_limit IS NULL OR used_count < usage_limit);

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Voucher invalid, expired, or out of usages: %', p_voucher_code;
        END IF;

        -- Kiểm tra giới hạn số lần sử dụng của mỗi tài khoản khách hàng
        IF v_voucher.max_uses_per_user IS NOT NULL THEN
            IF (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND voucher_id = v_voucher.id AND status != 'cancelled') >= v_voucher.max_uses_per_user THEN
                RAISE EXCEPTION 'Mã voucher % đã vượt quá giới hạn % lần sử dụng cho mỗi khách hàng', p_voucher_code, v_voucher.max_uses_per_user;
            END IF;
        END IF;

        v_voucher_id := v_voucher.id;
    END IF;

    -- 3. Tạo order sơ bộ
    INSERT INTO orders (
        user_id, 
        showroom_id,
        voucher_id,
        total_amount, 
        deposit_amount, 
        remaining_amount, 
        discount_amount, 
        payment_method, 
        status, 
        deposit_status, 
        payment_status
    )
    VALUES (
        p_user_id, 
        v_final_showroom_id,
        v_voucher_id,
        0, 
        0, 
        0, 
        0, 
        p_payment_method, 
        'pending', 
        'unpaid', 
        'unpaid'
    )
    RETURNING id INTO v_order_id;

    -- 4. Khóa các xe trong giỏ hàng để kiểm tra tồn kho và trừ kho
    FOR cart_item IN
        SELECT ci.car_id, ci.quantity AS order_qty, c.price, c.stock_quantity, c.showroom_id
        FROM cart_items ci
        JOIN cars c ON ci.car_id = c.id
        WHERE ci.user_id = p_user_id
        ORDER BY ci.car_id
        FOR UPDATE OF c
    LOOP
        IF COALESCE(cart_item.stock_quantity, 0) < cart_item.order_qty THEN
            RAISE EXCEPTION 'Car ID % out of stock or not enough stock', cart_item.car_id;
        END IF;

        IF cart_item.price IS NULL THEN
            RAISE EXCEPTION 'Car ID % has no price set', cart_item.car_id;
        END IF;

        -- Tự động fallback showroom_id từ xe nếu người dùng chưa chọn showroom
        IF v_final_showroom_id IS NULL AND cart_item.showroom_id IS NOT NULL THEN
            v_final_showroom_id := cart_item.showroom_id;
        END IF;

        -- Trừ tồn kho và cập nhật is_active nếu hết hàng
        UPDATE cars 
        SET stock_quantity = GREATEST(0, stock_quantity - cart_item.order_qty),
            is_active = CASE WHEN (stock_quantity - cart_item.order_qty) <= 0 THEN FALSE ELSE is_active END
        WHERE id = cart_item.car_id;

        -- Lưu vào order_items
        INSERT INTO order_items (order_id, car_id, price, quantity)
        VALUES (v_order_id, cart_item.car_id, cart_item.price, cart_item.order_qty);

        -- Cộng dồn tổng giá trị niêm yết
        v_total_amount := v_total_amount + (cart_item.price * cart_item.order_qty);
    END LOOP;

    IF v_total_amount <= 0 THEN
        RAISE EXCEPTION 'Cart items have invalid total price';
    END IF;

    -- 5. Tính toán giảm giá Voucher (nếu có)
    IF v_voucher_id IS NOT NULL THEN
        IF v_voucher.min_order_value > 0 AND v_total_amount < v_voucher.min_order_value THEN
            RAISE EXCEPTION 'Order value (%) must be at least % to apply voucher %', 
                v_total_amount, v_voucher.min_order_value, p_voucher_code;
        END IF;

        IF v_voucher.discount_type = 'fixed' THEN
            v_discount_amount := v_voucher.discount_value;
        ELSIF v_voucher.discount_type = 'percentage' THEN
            v_discount_amount := (v_total_amount * v_voucher.discount_value) / 100;
            IF v_voucher.max_discount_amount IS NOT NULL AND v_discount_amount > v_voucher.max_discount_amount THEN
                v_discount_amount := v_voucher.max_discount_amount;
            END IF;
        END IF;

        -- Đảm bảo giảm giá không vượt quá tổng tiền đơn hàng
        v_discount_amount := LEAST(v_discount_amount, v_total_amount);

        -- Tăng số lượt đã sử dụng voucher
        UPDATE vouchers SET used_count = used_count + 1 WHERE id = v_voucher_id;
    END IF;

    -- 6. Tính toán Tiền cọc (Deposit) & Tiền còn lại thanh toán tại Showroom
    v_deposit_amount := GREATEST(0, ROUND((v_total_amount - v_discount_amount) * COALESCE(p_deposit_rate, 0.10)));
    v_remaining_amount := GREATEST(0, (v_total_amount - v_discount_amount) - v_deposit_amount);

    -- 7. Cập nhật đơn hàng chính thức
    UPDATE orders 
    SET total_amount = (v_total_amount - v_discount_amount),
        deposit_amount = v_deposit_amount,
        remaining_amount = v_remaining_amount,
        discount_amount = v_discount_amount,
        showroom_id = v_final_showroom_id
    WHERE id = v_order_id;

    -- 8. Xóa giỏ hàng
    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4.4 Function: Match Cars (Vector Search RAG) — Post-filter architecture
CREATE OR REPLACE FUNCTION match_cars(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_make TEXT DEFAULT NULL,
  filter_max_price BIGINT DEFAULT NULL,
  filter_target_year INT DEFAULT NULL,
  filter_min_hp INT DEFAULT NULL,
  filter_fuel_type TEXT DEFAULT NULL,
  filter_showroom_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  make TEXT,
  model TEXT,
  year INT,
  engine_hp INT,
  price BIGINT,
  showroom_id UUID,
  metadata JSONB,
  review TEXT,
  similarity DOUBLE PRECISION,
  image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY

  -- Phase 1: Vector search trên reviews bằng HNSW
  WITH vector_matches AS MATERIALIZED (
    SELECT
      r.id AS review_id,
      r.car_id,
      r.comment,
      1 - (r.embedding <=> query_embedding) AS sim
    FROM reviews r
    WHERE r.embedding IS NOT NULL
    ORDER BY r.embedding <=> query_embedding ASC
    LIMIT match_count * 20
  ),

  -- Phase 2: JOIN + filter
  filtered AS (
    SELECT
      vm.review_id,
      vm.car_id,
      vm.comment,
      vm.sim,
      c.make AS car_make,
      c.model AS car_model,
      c.year AS car_year,
      c.engine_hp AS car_engine_hp,
      c.price AS car_price,
      c.showroom_id AS car_showroom_id,
      c.metadata AS car_metadata,
      c.image_url AS car_image_url
    FROM vector_matches vm
    JOIN cars c ON vm.car_id = c.id
    WHERE
      vm.sim > match_threshold
      AND (filter_make IS NULL OR c.make ILIKE filter_make)
      AND (filter_max_price IS NULL OR c.price <= filter_max_price)
      AND (filter_target_year IS NULL OR c.year >= filter_target_year - 2)
      AND (filter_min_hp IS NULL OR c.engine_hp >= filter_min_hp)
      AND (filter_fuel_type IS NULL OR c.metadata->>'engine_fuel_type' ILIKE '%' || filter_fuel_type || '%')
      AND (filter_showroom_id IS NULL OR c.showroom_id = filter_showroom_id)
  ),

  -- Phase 3: Deduplicate (1 review per car)
  deduplicated AS (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY car_id ORDER BY sim DESC) AS rn
    FROM filtered
  )

  -- Phase 4: Output
  SELECT
    d.car_id AS id,
    d.car_make AS make,
    d.car_model AS model,
    d.car_year AS year,
    d.car_engine_hp AS engine_hp,
    d.car_price AS price,
    d.car_showroom_id AS showroom_id,
    d.car_metadata AS metadata,
    d.comment AS review,
    d.sim AS similarity,
    d.car_image_url AS image_url
  FROM deduplicated d
  WHERE d.rn = 1
  ORDER BY d.sim DESC
  LIMIT match_count;

END;
$$;

-- Cấp quyền gọi hàm cho các roles PostgREST
GRANT EXECUTE ON FUNCTION public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.checkout_cart(uuid, text, uuid, text, double precision) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.distribute_cars_to_showrooms() TO authenticated, service_role;


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==============================================================================

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

CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
    -- Cho phép superuser hoặc service_role bypass trigger kiểm tra
    IF current_user IN ('postgres', 'supabase_admin') 
       OR (NULLIF(current_setting('request.jwt.claim.role', true), '') = 'service_role') THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Nếu caller không phải owner thì ép buộc role phải là 'user', is_active = TRUE, showroom_id = NULL
        IF get_my_role() != 'owner' THEN
            NEW.role := 'user';
            NEW.is_active := TRUE;
            NEW.showroom_id := NULL;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            IF get_my_role() != 'owner' THEN
                NEW.role := OLD.role;
            END IF;
        END IF;
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            IF get_my_role() != 'owner' THEN
                NEW.is_active := OLD.is_active;
            END IF;
        END IF;
        IF NEW.showroom_id IS DISTINCT FROM OLD.showroom_id THEN
            IF get_my_role() != 'owner' THEN
                NEW.showroom_id := OLD.showroom_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON profiles;
CREATE TRIGGER protect_profile_role
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_profile_role_escalation();

-- ENABLE RLS ON ALL TABLES
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

-- 5.1 PROFILES POLICIES
CREATE POLICY "Profiles read access" ON profiles 
  FOR SELECT USING (id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Profiles self insert" ON profiles 
  FOR INSERT WITH CHECK (id = auth.uid() AND (role IS NULL OR role = 'user'));

CREATE POLICY "Profiles update access" ON profiles 
  FOR UPDATE USING (id = auth.uid() OR get_my_role() = 'owner');

-- 5.2 SHOWROOMS POLICIES
CREATE POLICY "Showrooms public read" ON showrooms 
  FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Showrooms admin write" ON showrooms 
  FOR ALL USING (get_my_role() IN ('manager', 'owner'));

-- 5.3 VOUCHERS POLICIES
CREATE POLICY "Vouchers public read active" ON vouchers 
  FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Vouchers admin write" ON vouchers 
  FOR ALL USING (get_my_role() IN ('manager', 'owner'));

-- 5.4 CARS POLICIES
CREATE POLICY "Cars public read" ON cars 
  FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Cars admin write" ON cars 
  FOR ALL USING (get_my_role() IN ('manager', 'owner'));

-- 5.5 ORDERS POLICIES
CREATE POLICY "Orders select policy" ON orders 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Orders manager update policy" ON orders 
  FOR UPDATE USING (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Orders owner full access" ON orders 
  FOR ALL USING (get_my_role() = 'owner');

-- 5.6 ORDER_ITEMS POLICIES
CREATE POLICY "Order items select policy" ON order_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    ) 
    OR get_my_role() IN ('manager', 'owner')
  );

CREATE POLICY "Order items owner full access" ON order_items 
  FOR ALL USING (get_my_role() = 'owner');

-- 5.7 CART ITEMS POLICIES
CREATE POLICY "Cart items user policy" ON cart_items 
  FOR ALL USING (user_id = auth.uid());

-- 5.8 TEST DRIVES POLICIES
CREATE POLICY "Test drives select policy" ON test_drives 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Test drives insert policy" ON test_drives 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Test drives update policy" ON test_drives 
  FOR UPDATE USING (
    (user_id = auth.uid() AND status = 'pending') 
    OR get_my_role() IN ('manager', 'owner')
  );

CREATE POLICY "Test drives delete policy" ON test_drives 
  FOR DELETE USING (get_my_role() IN ('manager', 'owner'));

-- 5.9 REVIEWS POLICIES
CREATE POLICY "Reviews public read" ON reviews 
  FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Reviews user insert" ON reviews 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reviews update policy" ON reviews 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Reviews delete policy" ON reviews 
  FOR DELETE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

-- 5.10 CAR QA POLICIES
CREATE POLICY "Car QA public read" ON car_qa 
  FOR SELECT USING (TRUE);

CREATE POLICY "Car QA user insert" ON car_qa 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Car QA update policy" ON car_qa 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Car QA delete policy" ON car_qa 
  FOR DELETE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

-- 5.11 SAVED CARS POLICIES
CREATE POLICY "Saved cars select policy" ON saved_cars 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Saved cars user manage" ON saved_cars 
  FOR ALL USING (user_id = auth.uid());

-- 5.12 VIEWED CARS POLICIES
CREATE POLICY "Viewed cars select policy" ON viewed_cars 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Viewed cars user manage" ON viewed_cars 
  FOR ALL USING (user_id = auth.uid());

-- 5.13 SEARCH HISTORY POLICIES
CREATE POLICY "Search history select policy" ON search_history 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Search history insert policy" ON search_history 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5.14 NOTIFICATIONS POLICIES
CREATE POLICY "Notifications select policy" ON notifications 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Notifications update policy" ON notifications 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Notifications insert policy" ON notifications 
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'owner'));

-- 5.15 CHAT SESSIONS POLICIES
CREATE POLICY "Chat sessions select policy" ON chat_sessions 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Chat sessions insert policy" ON chat_sessions 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

-- 5.16 INVENTORY & VOUCHER RESTORATION TRIGGERS ON ORDERS
CREATE OR REPLACE FUNCTION restore_order_inventory_and_voucher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    item RECORD;
BEGIN
    -- Khi đơn hàng chuyển sang cancelled từ trạng thái khác
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        FOR item IN SELECT car_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            IF item.car_id IS NOT NULL THEN
                UPDATE cars 
                SET stock_quantity = stock_quantity + item.quantity,
                    is_active = TRUE
                WHERE id = item.car_id;
            END IF;
        END LOOP;

        IF NEW.voucher_id IS NOT NULL THEN
            UPDATE vouchers 
            SET used_count = GREATEST(0, used_count - 1) 
            WHERE id = NEW.voucher_id;
        END IF;

    -- Khi đơn hàng được phục hồi từ cancelled
    ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        FOR item IN SELECT car_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            IF item.car_id IS NOT NULL THEN
                UPDATE cars 
                SET stock_quantity = GREATEST(0, stock_quantity - item.quantity),
                    is_active = CASE WHEN (stock_quantity - item.quantity) <= 0 THEN FALSE ELSE is_active END
                WHERE id = item.car_id;
            END IF;
        END LOOP;

        IF NEW.voucher_id IS NOT NULL THEN
            UPDATE vouchers SET used_count = used_count + 1 WHERE id = NEW.voucher_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_inventory_on_cancel ON orders;
CREATE TRIGGER trg_restore_inventory_on_cancel
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_order_inventory_and_voucher();

CREATE OR REPLACE FUNCTION restore_order_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    item RECORD;
BEGIN
    IF OLD.status != 'cancelled' THEN
        FOR item IN SELECT car_id, quantity FROM order_items WHERE order_id = OLD.id LOOP
            IF item.car_id IS NOT NULL THEN
                UPDATE cars 
                SET stock_quantity = stock_quantity + item.quantity,
                    is_active = TRUE
                WHERE id = item.car_id;
            END IF;
        END LOOP;

        IF OLD.voucher_id IS NOT NULL THEN
            UPDATE vouchers 
            SET used_count = GREATEST(0, used_count - 1) 
            WHERE id = OLD.voucher_id;
        END IF;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_inventory_on_delete ON orders;
CREATE TRIGGER trg_restore_inventory_on_delete
BEFORE DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_order_on_delete();


-- ==============================================================================
-- 6. SEED DATA (Showrooms & Vouchers)
-- ==============================================================================

-- 6.1 Showrooms Seed
INSERT INTO showrooms (name, code, address, city, phone, email, image_url, opening_hours)
VALUES 
    (
        'AutoMatch Hà Nội - Cầu Giấy Flagship',
        'SR_HN_CG',
        'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy',
        'Hà Nội',
        '024 3888 9999',
        'hanoi.caugiay@automatch.vn',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 21:00'
    ),
    (
        'AutoMatch TP.HCM - Landmark Quận 7',
        'SR_HCM_Q7',
        'Số 101 Tôn Dật Tiên, Phường Tân Phú, Quận 7',
        'TP. Hồ Chí Minh',
        '028 5411 2233',
        'hcm.quan7@automatch.vn',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 21:30'
    ),
    (
        'AutoMatch TP.HCM - Trung Tâm Thủ Đức',
        'SR_HCM_TD',
        'Số 216 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức',
        'TP. Hồ Chí Minh',
        '028 3722 5566',
        'hcm.thuduc@automatch.vn',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 20:30'
    ),
    (
        'AutoMatch Đà Nẵng - Hải Châu Center',
        'SR_DN_HC',
        'Số 45 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
        'Đà Nẵng',
        '0236 365 8888',
        'danang.haichau@automatch.vn',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 20:00'
    ),
    (
        'AutoMatch Hải Phòng - Lê Chân Hub',
        'SR_HP_LC',
        'Số 12 Hồ Sen, Phường Trại Cau, Quận Lê Chân',
        'Hải Phòng',
        '0225 385 7777',
        'haiphong@automatch.vn',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 20:00'
    )
ON CONFLICT (code) DO NOTHING;

-- 6.2 Vouchers Seed
INSERT INTO vouchers (code, title, description, discount_type, discount_value, max_discount_amount, min_order_value, applies_to, usage_limit, is_active)
VALUES
    (
        'WELCOME10M',
        'Ưu đãi Chào mừng Khách hàng mới',
        'Giảm trực tiếp 10.000.000 VNĐ vào tiền đặt cọc giữ xe trực tuyến.',
        'fixed',
        10000000,
        10000000,
        300000000,
        'deposit',
        500,
        TRUE
    ),
    (
        'SUMMER50M',
        'Đại tiệc Mua xe Mùa hè',
        'Giảm ngay 50.000.000 VNĐ vào tổng giá trị hợp đồng mua xe.',
        'fixed',
        50000000,
        50000000,
        800000000,
        'total',
        100,
        TRUE
    ),
    (
        'VIPPROMO5',
        'Đặc quyền Khách hàng VIP',
        'Giảm 5% tổng giá trị xe (Tối đa 30.000.000 VNĐ).',
        'percentage',
        5,
        30000000,
        500000000,
        'total',
        200,
        TRUE
    )
ON CONFLICT (code) DO NOTHING;

-- 6.3 Tự động phân bổ ngẫu nhiên danh sách xe ban đầu vào các Showroom (nếu có xe trong bảng cars)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cars) THEN
        PERFORM distribute_cars_to_showrooms();
    END IF;
END;
$$;

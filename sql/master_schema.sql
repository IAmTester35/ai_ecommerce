-- ==============================================================================
-- MASTER SCHEMA FOR E-COMMERCE (AUTO MATCH AI)
-- Drops all existing tables and recreates the entire database structure.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. DROP EVERYTHING (Reverse dependency order to avoid constraint errors)
DROP FUNCTION IF EXISTS checkout_cart CASCADE;
DROP FUNCTION IF EXISTS match_cars CASCADE;
DROP FUNCTION IF EXISTS update_modified_column CASCADE;

DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS viewed_cars CASCADE;
DROP TABLE IF EXISTS car_qa CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS test_drives CASCADE;
DROP TABLE IF EXISTS saved_cars CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS cars CASCADE;

-- 3. TABLES CREATION

-- Profiles (Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cars (Golden Dataset)
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make TEXT NOT NULL,         
    model TEXT NOT NULL,
    year INT NOT NULL,
    engine_hp INT,
    price BIGINT,                  -- MSRP 
    metadata JSONB,             -- Chứa các thông số phụ (kiểu dáng, hộp số, nhiên liệu,...)
    stock_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(make, model, year)
);

-- Tạo Index GIN cho metadata để truy vấn JSON tốc độ cao
CREATE INDEX ON cars USING GIN (metadata);

-- Saved Cars (Wishlist)
CREATE TABLE saved_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);

-- Test Drives
CREATE TABLE test_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount BIGINT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    contract_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    price BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Có thể NULL cho review từ external source
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    rating FLOAT, -- Hỗ trợ rating float từ file CSV
    comment TEXT,
    source TEXT DEFAULT 'user', -- 'user' hoặc 'edmunds'
    embedding VECTOR(768),      -- Vector từ nội dung
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo Index HNSW cho việc tìm kiếm Vector siêu tốc
CREATE INDEX ON reviews USING hnsw (embedding vector_cosine_ops);

-- Index hỗ trợ JOIN reviews → cars trong post-filter phase
CREATE INDEX idx_reviews_car_id ON reviews (car_id);

-- Q&A
CREATE TABLE car_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewed Cars
CREATE TABLE viewed_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search History
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);


-- 3.5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_user_id ON test_drives(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_car_id ON test_drives(car_id);
CREATE INDEX IF NOT EXISTS idx_viewed_cars_user_id_viewed_at ON viewed_cars(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_car_id ON order_items(car_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_car_qa_car_id ON car_qa(car_id);
CREATE INDEX IF NOT EXISTS idx_car_qa_user_id ON car_qa(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cars_car_id ON saved_cars(car_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_car_id ON cart_items(car_id);

-- 4. FUNCTIONS & TRIGGERS

-- Trigger Function: Update `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_car_qa_updated_at BEFORE UPDATE ON car_qa FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function: Checkout Cart
CREATE OR REPLACE FUNCTION checkout_cart(p_user_id UUID, p_payment_method TEXT)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total_amount BIGINT := 0;
    cart_item RECORD;
BEGIN
    -- Kiểm tra giỏ hàng
    IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    -- Tạo order với tổng tiền = 0 trước
    INSERT INTO orders (user_id, total_amount, payment_method, status)
    VALUES (p_user_id, 0, p_payment_method, 'pending')
    RETURNING id INTO v_order_id;

    -- Khóa (Lock) các xe trong giỏ hàng để tránh race condition
    FOR cart_item IN
        SELECT ci.car_id, ci.quantity AS order_qty, c.price, c.stock_quantity 
        FROM cart_items ci
        JOIN cars c ON ci.car_id = c.id
        WHERE ci.user_id = p_user_id
        ORDER BY ci.car_id
        FOR UPDATE OF c
    LOOP
        -- Kiểm tra tồn kho
        IF cart_item.stock_quantity < cart_item.order_qty THEN
            RAISE EXCEPTION 'Car ID % out of stock or not enough stock', cart_item.car_id;
        END IF;

        -- Trừ tồn kho
        UPDATE cars 
        SET stock_quantity = stock_quantity - cart_item.order_qty
        WHERE id = cart_item.car_id;

        -- Lưu vào order_items
        INSERT INTO order_items (order_id, car_id, price, quantity)
        VALUES (v_order_id, cart_item.car_id, cart_item.price, cart_item.order_qty);

        -- Kiểm tra giá xe (chống lỗi NULL price biến tổng tiền thành NULL)
        IF cart_item.price IS NULL THEN
            RAISE EXCEPTION 'Car ID % has no price set', cart_item.car_id;
        END IF;

        -- Cộng dồn tổng tiền
        v_total_amount := v_total_amount + (cart_item.price * cart_item.order_qty);
    END LOOP;

    IF v_total_amount = 0 THEN
        RAISE EXCEPTION 'Cart items have no price';
    END IF;

    -- Cập nhật tổng tiền chính thức
    UPDATE orders SET total_amount = v_total_amount WHERE id = v_order_id;

    -- Xóa giỏ hàng
    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Match Cars (Vector Search RAG) — Post-filter architecture
CREATE OR REPLACE FUNCTION match_cars(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_make TEXT DEFAULT NULL,
  filter_max_price BIGINT DEFAULT NULL,
  filter_target_year INT DEFAULT NULL,
  filter_min_hp INT DEFAULT NULL,
  filter_fuel_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  make TEXT,
  model TEXT,
  year INT,
  engine_hp INT,
  price BIGINT,
  metadata JSONB,
  review TEXT,
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY

  -- Phase 1: Pure vector search, ÉP Postgres phải chạy riêng bước này với HNSW Index
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

  -- Phase 2: JOIN + filter trên cars và lấy luôn data để khỏi JOIN lại
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
      c.metadata AS car_metadata
    FROM vector_matches vm
    JOIN cars c ON vm.car_id = c.id
    WHERE
      vm.sim > match_threshold
      AND (filter_make IS NULL OR c.make ILIKE filter_make)
      AND (filter_max_price IS NULL OR c.price <= filter_max_price)
      AND (filter_target_year IS NULL OR c.year >= filter_target_year - 2)
      AND (filter_min_hp IS NULL OR c.engine_hp >= filter_min_hp)
      AND (filter_fuel_type IS NULL OR c.metadata->>'engine_fuel_type' ILIKE '%' || filter_fuel_type || '%')
  ),

  -- Phase 3: Deduplicate (1 review/car, giữ similarity cao nhất)
  deduplicated AS (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY car_id ORDER BY sim DESC) AS rn
    FROM filtered
  )

  -- Phase 4: Trả về kết quả, không JOIN lại bảng cars
  SELECT
    d.car_id AS id,
    d.car_make AS make,
    d.car_model AS model,
    d.car_year AS year,
    d.car_engine_hp AS engine_hp,
    d.car_price AS price,
    d.car_metadata AS metadata,
    d.comment AS review,
    d.sim AS similarity
  FROM deduplicated d
  WHERE d.rn = 1
  ORDER BY d.sim DESC
  LIMIT match_count;

END;
$$;


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==============================================================================

-- Helper Function: Get User Role safely (Custom Claim JWT -> Profiles Table fallback)
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

-- Trigger Function: Prevent Privilege Escalation on `profiles.role`
CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF get_my_role() != 'owner' THEN
            NEW.role := OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON profiles;
CREATE TRIGGER protect_profile_role
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_profile_role_escalation();


-- ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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


-- 5.1 PROFILES POLICIES
CREATE POLICY "Profiles read access" ON profiles 
  FOR SELECT USING (id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Profiles self insert" ON profiles 
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles update access" ON profiles 
  FOR UPDATE USING (id = auth.uid() OR get_my_role() = 'owner');


-- 5.2 CARS POLICIES
CREATE POLICY "Cars public read" ON cars 
  FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Cars admin write" ON cars 
  FOR ALL USING (get_my_role() IN ('manager', 'owner'));


-- 5.3 ORDERS POLICIES
-- NOTE: Users CANNOT INSERT/UPDATE directly via REST API. Orders must be created via `checkout_cart()` (SECURITY DEFINER).
CREATE POLICY "Orders select policy" ON orders 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Orders manager update policy" ON orders 
  FOR UPDATE USING (get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Orders owner full access" ON orders 
  FOR ALL USING (get_my_role() = 'owner');


-- 5.4 ORDER_ITEMS POLICIES
-- NOTE: Users read items belonging to their own orders via EXISTS subquery.
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


-- 5.5 CART ITEMS POLICIES
CREATE POLICY "Cart items user policy" ON cart_items 
  FOR ALL USING (user_id = auth.uid());


-- 5.6 TEST DRIVES POLICIES
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


-- 5.7 REVIEWS POLICIES
CREATE POLICY "Reviews public read" ON reviews 
  FOR SELECT USING (TRUE);

CREATE POLICY "Reviews user insert" ON reviews 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reviews user update" ON reviews 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Reviews delete policy" ON reviews 
  FOR DELETE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));


-- 5.8 CAR QA POLICIES
CREATE POLICY "Car QA public read" ON car_qa 
  FOR SELECT USING (TRUE);

CREATE POLICY "Car QA user insert" ON car_qa 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Car QA update policy" ON car_qa 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

CREATE POLICY "Car QA delete policy" ON car_qa 
  FOR DELETE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));


-- 5.9 SAVED CARS POLICIES
CREATE POLICY "Saved cars user policy" ON saved_cars 
  FOR ALL USING (user_id = auth.uid());


-- 5.10 VIEWED CARS POLICIES
CREATE POLICY "Viewed cars user policy" ON viewed_cars 
  FOR ALL USING (user_id = auth.uid());


-- 5.11 SEARCH HISTORY POLICIES
CREATE POLICY "Search history user policy" ON search_history 
  FOR ALL USING (user_id = auth.uid());


-- 5.12 NOTIFICATIONS POLICIES
CREATE POLICY "Notifications select policy" ON notifications 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Notifications update policy" ON notifications 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Notifications insert policy" ON notifications 
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'owner'));


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
    price INT,                  -- MSRP 
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
BEGIN
    SELECT COALESCE(SUM(c.price * ci.quantity), 0) INTO v_total_amount
    FROM cart_items ci
    JOIN cars c ON ci.car_id = c.id
    WHERE ci.user_id = p_user_id;

    IF v_total_amount = 0 THEN
        RAISE EXCEPTION 'Cart is empty or items have no price';
    END IF;

    INSERT INTO orders (user_id, total_amount, payment_method, status)
    VALUES (p_user_id, v_total_amount, p_payment_method, 'pending')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, car_id, price)
    SELECT v_order_id, ci.car_id, c.price
    FROM cart_items ci
    JOIN cars c ON ci.car_id = c.id
    WHERE ci.user_id = p_user_id;

    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Match Cars (Vector Search RAG)
CREATE OR REPLACE FUNCTION match_cars(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_make TEXT DEFAULT NULL,
  filter_max_price INT DEFAULT NULL,
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
  price INT,
  metadata JSONB,
  review TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_reviews AS (
    SELECT 
      c.id AS car_id,
      c.make,
      c.model,
      c.year,
      c.engine_hp,
      c.price,
      c.metadata,
      r.comment AS review,
      1 - (r.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER(PARTITION BY c.id ORDER BY r.embedding <=> query_embedding ASC) as rn
    FROM reviews r
    JOIN cars c ON r.car_id = c.id
    WHERE 
      (filter_make IS NULL OR c.make ILIKE filter_make)
      AND (filter_max_price IS NULL OR c.price <= filter_max_price)
      AND (filter_target_year IS NULL OR c.year >= filter_target_year - 2)
      AND (filter_min_hp IS NULL OR c.engine_hp >= filter_min_hp)
      AND (filter_fuel_type IS NULL OR c.metadata->>'engine_fuel_type' ILIKE '%' || filter_fuel_type || '%')
      AND 1 - (r.embedding <=> query_embedding) > match_threshold
  )
  SELECT 
    ranked_reviews.car_id AS id,
    ranked_reviews.make,
    ranked_reviews.model,
    ranked_reviews.year,
    ranked_reviews.engine_hp,
    ranked_reviews.price,
    ranked_reviews.metadata,
    ranked_reviews.review,
    ranked_reviews.similarity
  FROM ranked_reviews
  WHERE rn = 1
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

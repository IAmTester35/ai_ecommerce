-- ==============================================================================
-- MIGRATION SCRIPT: SHOWROOMS, VOUCHERS, CAR DISTRIBUTION & DEPOSIT MECHANISM
-- An toàn chạy trực tiếp trên Supabase SQL Editor hiện hữu (Giữ nguyên dữ liệu cũ)
-- ==============================================================================

-- 1. BẢNG SHOWROOMS (Hệ thống Chi nhánh / Đại lý Ô tô)
CREATE TABLE IF NOT EXISTS showrooms (
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

-- Trigger cập nhật updated_at cho showrooms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_showrooms_updated_at'
    ) THEN
        CREATE TRIGGER update_showrooms_updated_at 
        BEFORE UPDATE ON showrooms 
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END;
$$;

-- 2. BẢNG VOUCHERS (Mã giảm giá & Khuyến mãi)
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value BIGINT NOT NULL,
    max_discount_amount BIGINT,
    min_order_value BIGINT DEFAULT 0,
    applies_to TEXT DEFAULT 'deposit' CHECK (applies_to IN ('deposit', 'total')),
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NÂNG CẤP CỘT TRONG CÁC BẢNG HIỆN HỮU (CARS, TEST_DRIVES, ORDERS)
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL;

ALTER TABLE test_drives 
ADD COLUMN IF NOT EXISTS showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deposit_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'unpaid';

-- Cập nhật ràng buộc trạng thái nếu cần
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'deposit_paid', 'preparing_car', 'ready_for_pickup', 'completed', 'cancelled'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_deposit_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_deposit_status_check 
CHECK (deposit_status IN ('unpaid', 'paid', 'refunded'));

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cars_showroom_id ON cars(showroom_id);
CREATE INDEX IF NOT EXISTS idx_orders_showroom_id ON orders(showroom_id);
CREATE INDEX IF NOT EXISTS idx_orders_voucher_id ON orders(voucher_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_showroom_id ON test_drives(showroom_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES CHO SHOWROOMS & VOUCHERS
ALTER TABLE showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Showrooms public read') THEN
        CREATE POLICY "Showrooms public read" ON showrooms 
        FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Showrooms admin write') THEN
        CREATE POLICY "Showrooms admin write" ON showrooms 
        FOR ALL USING (get_my_role() IN ('manager', 'owner'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vouchers public read active') THEN
        CREATE POLICY "Vouchers public read active" ON vouchers 
        FOR SELECT USING (is_active = TRUE OR get_my_role() IN ('manager', 'owner'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vouchers admin write') THEN
        CREATE POLICY "Vouchers admin write" ON vouchers 
        FOR ALL USING (get_my_role() IN ('manager', 'owner'));
    END IF;
END;
$$;

-- 6. HÀM PHÂN BỔ NGẪU NHIÊN XE VÀO SHOWROOM
CREATE OR REPLACE FUNCTION distribute_cars_to_showrooms()
RETURNS INT AS $$
DECLARE
    v_showroom_ids UUID[];
    v_showroom_count INT;
    v_updated_count INT := 0;
BEGIN
    SELECT array_agg(id) INTO v_showroom_ids FROM showrooms WHERE is_active = TRUE;
    v_showroom_count := COALESCE(array_length(v_showroom_ids, 1), 0);
    
    IF v_showroom_count = 0 THEN
        RAISE EXCEPTION 'No active showrooms found to distribute cars.';
    END IF;

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

-- 7. CẬP NHẬT THỦ TỤC CHECKOUT & ĐẶT CỌC (CHECKOUT_CART RPC)
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

        IF v_final_showroom_id IS NULL AND cart_item.showroom_id IS NOT NULL THEN
            v_final_showroom_id := cart_item.showroom_id;
        END IF;

        UPDATE cars 
        SET stock_quantity = GREATEST(0, stock_quantity - cart_item.order_qty),
            is_active = CASE WHEN (stock_quantity - cart_item.order_qty) <= 0 THEN FALSE ELSE is_active END
        WHERE id = cart_item.car_id;

        INSERT INTO order_items (order_id, car_id, price, quantity)
        VALUES (v_order_id, cart_item.car_id, cart_item.price, cart_item.order_qty);

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

        v_discount_amount := LEAST(v_discount_amount, v_total_amount);
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

-- 8. CẬP NHẬT HÀM MATCH_CARS HỖ TRỢ SHOWROOM FILTER
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
AS $$
BEGIN
  RETURN QUERY

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

  deduplicated AS (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY car_id ORDER BY sim DESC) AS rn
    FROM filtered
  )

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

-- 9. DỮ LIỆU MẪU BAN ĐẦU CHO SHOWROOMS & VOUCHERS
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
        'AutoMatch TP.HCM - Trung Tâm Thủ Đức',
        'SR_HCM_TD',
        'Số 216 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức',
        'TP. Hồ Chí Minh',
        '028 3722 5566',
        'hcm.thuduc@automatch.vn',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        '08:00 - 20:30'
    )
ON CONFLICT (code) DO NOTHING;

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

-- 10. TỰ ĐỘNG PHÂN BỔ TOÀN BỘ XE HIỆN CÓ VÀO CÁC SHOWROOM
SELECT distribute_cars_to_showrooms();

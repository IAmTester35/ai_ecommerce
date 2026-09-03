-- ==============================================================================
-- AUTOMATCH AI: MIGRATION AUDIT FIXES & BUSINESS LOGIC ENHANCEMENTS
-- ==============================================================================

-- 1. VÁ LỖ HỔNG LEO QUYỀN & BẢO VỆ DỮ LIỆU NHẠY CẢM TRÊN BẢNG PROFILES
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

DROP POLICY IF EXISTS "Profiles self insert" ON profiles;
CREATE POLICY "Profiles self insert" ON profiles 
  FOR INSERT WITH CHECK (id = auth.uid() AND (role IS NULL OR role = 'user'));


-- 2. BỔ SUNG CỘT NGHIỆP VỤ CHO CÁC BẢNG

-- 2.1 Bổ sung cho bảng orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_trans_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount BIGINT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_trans_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 2.2 Bổ sung cho bảng profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2.3 Bổ sung cho bảng vouchers
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_uses_per_user INT DEFAULT 1;

-- Kiểm tra ràng buộc tỷ lệ phần trăm
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS check_voucher_percentage;
ALTER TABLE vouchers ADD CONSTRAINT check_voucher_percentage 
    CHECK (discount_type = 'fixed' OR (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100));

-- 2.4 Bổ sung cho bảng test_drives
ALTER TABLE test_drives ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2.5 Bổ sung cho bảng reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;


-- 3. CẬP NHẬT CHÍNH SÁCH RLS CHO QUẢN TRỊ VIÊN & PHÂN QUYỀN DỮ LIỆU

-- 3.1 Notifications
DROP POLICY IF EXISTS "Notifications select policy" ON notifications;
CREATE POLICY "Notifications select policy" ON notifications 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Notifications update policy" ON notifications;
CREATE POLICY "Notifications update policy" ON notifications 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

-- 3.2 Search History
DROP POLICY IF EXISTS "Search history user policy" ON search_history;
DROP POLICY IF EXISTS "Search history select policy" ON search_history;
CREATE POLICY "Search history select policy" ON search_history 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Search history insert policy" ON search_history;
CREATE POLICY "Search history insert policy" ON search_history 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3.3 Chat Sessions
DROP POLICY IF EXISTS "Chat sessions user policy" ON chat_sessions;
DROP POLICY IF EXISTS "Chat sessions select policy" ON chat_sessions;
CREATE POLICY "Chat sessions select policy" ON chat_sessions 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Chat sessions insert policy" ON chat_sessions;
CREATE POLICY "Chat sessions insert policy" ON chat_sessions 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR get_my_role() IN ('manager', 'owner'));

-- 3.4 Reviews & Moderation
DROP POLICY IF EXISTS "Reviews public read" ON reviews;
CREATE POLICY "Reviews public read" ON reviews 
  FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Reviews user update" ON reviews;
DROP POLICY IF EXISTS "Reviews update policy" ON reviews;
CREATE POLICY "Reviews update policy" ON reviews 
  FOR UPDATE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Reviews delete policy" ON reviews;
CREATE POLICY "Reviews delete policy" ON reviews 
  FOR DELETE USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

-- 3.5 Customer 360: Saved Cars & Viewed Cars
DROP POLICY IF EXISTS "Saved cars user policy" ON saved_cars;
DROP POLICY IF EXISTS "Saved cars select policy" ON saved_cars;
CREATE POLICY "Saved cars select policy" ON saved_cars 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Saved cars user manage" ON saved_cars;
CREATE POLICY "Saved cars user manage" ON saved_cars 
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Viewed cars user policy" ON viewed_cars;
DROP POLICY IF EXISTS "Viewed cars select policy" ON viewed_cars;
CREATE POLICY "Viewed cars select policy" ON viewed_cars 
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('manager', 'owner'));

DROP POLICY IF EXISTS "Viewed cars user manage" ON viewed_cars;
CREATE POLICY "Viewed cars user manage" ON viewed_cars 
  FOR ALL USING (user_id = auth.uid());


-- 4. TRIGGER TỰ ĐỘNG HOÀN TRẢ TỒN KHO & VOUCHER KHI HỦY HOẶC XÓA ĐƠN HÀNG

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

    -- Khi đơn hàng được phục hồi từ cancelled (hiếm gặp)
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
    -- Nếu đơn hàng bị xóa khi chưa hủy, hoàn trả tồn kho và voucher
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


-- 5. CẬP NHẬT HÀM CHECKOUT_CART THỰC THI MAX_USES_PER_USER
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

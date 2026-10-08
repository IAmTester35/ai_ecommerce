-- =========================================================================
-- MIGRATION: Chuẩn Hóa Tiền Tệ Toàn Hệ Thống Sang VNĐ (Single Source of Truth)
-- File: sql/migration_standardize_currency_vnd.sql
-- Mục đích:
--   1. Lưu trữ MSRP USD gốc vào metadata->'msrp_usd' cho bảng cars
--   2. Quy đổi toàn bộ cars.price từ USD sang VNĐ niêm yết tại thị trường Việt Nam
--   3. Quy đổi các đơn hàng (orders) và chi tiết đơn hàng (order_items) cũ sang VNĐ
--   4. Đảm bảo tính nhất quán 100% giữa Database, ZaloPay, Mobile App và Admin
-- =========================================================================

BEGIN;

-- 1. Lưu lại MSRP USD gốc vào metadata và chuyển đổi cars.price sang VNĐ
-- Quy đổi các xe chưa có msrp_usd trong metadata
UPDATE cars
SET 
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{msrp_usd}',
        to_jsonb(price)
    ),
    price = ROUND(
        price * 25400 * (
            CASE 
                -- Xe thuần điện (EV): thuế ưu đãi nhập khẩu & TTĐB thấp hơn (hệ số ~1.60)
                WHEN LOWER(COALESCE(metadata->>'engine_fuel_type', metadata->>'fuel_type', '')) LIKE '%electric%' 
                  OR LOWER(COALESCE(metadata->>'engine_fuel_type', metadata->>'fuel_type', '')) LIKE '%thuần điện%' 
                  OR LOWER(COALESCE(metadata->>'engine_fuel_type', metadata->>'fuel_type', '')) = 'điện'
                THEN 1.60
                -- Xe xăng / hiệu năng cao thông thường (hệ số thuế CBU ~2.54)
                ELSE 2.54
            END
        )
    )
WHERE price IS NOT NULL 
  AND price > 0 
  AND (metadata->>'msrp_usd' IS NULL);

COMMENT ON COLUMN cars.price IS 'MSRP (Giá niêm yết bán lẻ tính bằng VNĐ)';

-- 2. Chuẩn hóa các đơn hàng cũ (orders) nếu đang lưu dạng USD
UPDATE orders
SET 
    total_amount = ROUND(total_amount * 25400 * 2.54),
    deposit_amount = ROUND(deposit_amount * 25400 * 2.54),
    remaining_amount = ROUND(remaining_amount * 25400 * 2.54),
    discount_amount = CASE 
        WHEN discount_amount IS NOT NULL AND discount_amount > 0 AND discount_amount < 50000000 
        THEN ROUND(discount_amount * 25400 * 2.54) 
        ELSE discount_amount 
    END,
    refund_amount = CASE 
        WHEN refund_amount IS NOT NULL AND refund_amount > 0 AND refund_amount < 50000000 
        THEN ROUND(refund_amount * 25400 * 2.54) 
        ELSE refund_amount 
    END
WHERE (total_amount IS NOT NULL AND total_amount > 0 AND total_amount < 50000000)
   OR (discount_amount IS NOT NULL AND discount_amount > 0 AND discount_amount < 50000000);

COMMENT ON COLUMN orders.total_amount IS 'Tổng giá trị xe sau ưu đãi tính bằng VNĐ';
COMMENT ON COLUMN orders.deposit_amount IS 'Tiền đặt cọc trực tuyến (10%) tính bằng VNĐ';
COMMENT ON COLUMN orders.remaining_amount IS 'Tiền còn lại thanh toán tại showroom (90%) tính bằng VNĐ';
COMMENT ON COLUMN orders.refund_amount IS 'Số tiền đã hoàn cọc lại cho khách hàng tính bằng VNĐ';
COMMENT ON COLUMN orders.discount_amount IS 'Số tiền chiết khấu giảm trừ từ voucher tính bằng VNĐ';

-- 3. Chuẩn hóa các order_items cũ nếu đang lưu dạng USD
UPDATE order_items
SET 
    price = ROUND(price * 25400 * 2.54)
WHERE price IS NOT NULL 
  AND price > 0 
  AND price < 50000000;

COMMENT ON COLUMN order_items.price IS 'Đơn giá xe tại thời điểm đặt hàng tính bằng VNĐ';

-- 4. Seed Voucher Kiểm Thử Giảm 99% Giá Xe / Tiền Cọc Cho Môi Trường Test/QA
INSERT INTO vouchers (
    code, 
    title, 
    description, 
    discount_type, 
    discount_value, 
    max_discount_amount, 
    min_order_value, 
    applies_to, 
    usage_limit, 
    max_uses_per_user,
    is_active
)
VALUES
    (
        'TEST99',
        'Ưu Đãi Kiểm Thử Giảm 99% Giá Xe',
        'Mã kiểm thử QA / Developer: Giảm 99% tổng giá trị xe (không giới hạn tối đa), giúp kiểm thử đặt cọc và thanh toán ZaloPay với số tiền nhỏ.',
        'percentage',
        99,
        NULL,
        0,
        'total',
        999999,
        999999,
        TRUE
    ),
    (
        'TESTDEP99',
        'Ưu Đãi Kiểm Thử Giảm 99% Tiền Cọc',
        'Mã kiểm thử QA / Developer: Giảm 99% trực tiếp vào tiền cọc xe trực tuyến, tối ưu test thanh toán nhanh.',
        'percentage',
        99,
        NULL,
        0,
        'deposit',
        999999,
        999999,
        TRUE
    )
ON CONFLICT (code) DO UPDATE
SET 
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    max_discount_amount = EXCLUDED.max_discount_amount,
    min_order_value = EXCLUDED.min_order_value,
    applies_to = EXCLUDED.applies_to,
    usage_limit = EXCLUDED.usage_limit,
    max_uses_per_user = EXCLUDED.max_uses_per_user,
    is_active = EXCLUDED.is_active;

COMMIT;

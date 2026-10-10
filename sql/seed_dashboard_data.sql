-- ==============================================================================
-- AUTOMATCH AI - COMPREHENSIVE SEEDING SCRIPT FOR ADMIN DASHBOARD
-- Note: Does NOT modify 'cars' or 'reviews' tables (Strictly Protected)
-- Targets: test_drives, orders, order_items, vouchers, car_qa, notifications, user interactions
-- ==============================================================================

BEGIN;

-- 1. CẬP NHẬT & BỔ SUNG VOUCHERS HỢP LỆ CHO NĂM 2026
-- ------------------------------------------------------------------------------
INSERT INTO public.vouchers (code, title, description, discount_type, discount_value, max_discount_amount, min_order_value, applies_to, usage_limit, used_count, max_uses_per_user, start_date, end_date, is_active)
VALUES
  ('TET2026', 'Ưu đãi Đón Xuân 2026 - Lộc Vàng May Mắn', 'Giảm ngay 25.000.000 VNĐ vào tiền đặt cọc giữ xe trực tuyến cho các dòng Sedan và SUV cao cấp.', 'fixed', 25000000, 25000000, 500000000, 'deposit', 500, 48, 1, NOW() - interval '60 days', NOW() + interval '120 days', true),
  ('ECOGREEN10', 'Chương Trình Khuyến Khích Xe Xanh & Hybrid', 'Giảm 10% tổng giá trị xe (Tối đa 60.000.000 VNĐ) khi đặt cọc trực tuyến các dòng Hybrid / Electric.', 'percentage', 10, 60000000, 600000000, 'total', 300, 24, 1, NOW() - interval '90 days', NOW() + interval '150 days', true),
  ('TESTDRIVE5M', 'Lộc Vàng Lái Thử Showroom', 'Tặng ngay voucher 5.000.000 VNĐ tiền cọc cho khách hàng hoàn tất buổi lái thử tại Showroom AutoMatch.', 'fixed', 5000000, 5000000, 300000000, 'deposit', 1000, 115, 1, NOW() - interval '45 days', NOW() + interval '180 days', true),
  ('FLASHDEAL8', 'Flash Deal Cuối Tuần - Đón Xe Liền Tay', 'Giảm 8% (Tối đa 40.000.000 VNĐ) áp dụng cho tất cả các giao dịch cọc trong 48 giờ cuối tuần.', 'percentage', 8, 40000000, 450000000, 'total', 100, 62, 1, NOW() - interval '7 days', NOW() + interval '30 days', true),
  ('LUXURY100M', 'Đặc Quyền Khách Hàng Thượng Lưu - Luxury Car', 'Đặc quyền giảm 100.000.000 VNĐ trực tiếp cho các dòng xe sang giá trị trên 2 tỷ VNĐ.', 'fixed', 100000000, 100000000, 2000000000, 'total', 50, 12, 1, NOW() - interval '120 days', NOW() + interval '240 days', true),
  ('AUTOFALL26', 'Ưu Đãi Mùa Thu Vàng 2026', 'Giảm ngay 15.000.000 VNĐ chi phí phụ kiện chính hãng khi ký hợp đồng mua xe trong tháng.', 'fixed', 15000000, 15000000, 400000000, 'deposit', 200, 31, 1, NOW() - interval '30 days', NOW() + interval '60 days', true),
  ('EXPIRED2025', 'Tri Ân Khai Trương Hệ Thống (Đã kết thúc)', 'Chương trình ưu đãi ngày khai trương ban đầu (dùng kiểm thử bộ lọc hết hạn trên Dashboard).', 'fixed', 20000000, 20000000, 400000000, 'deposit', 100, 100, 1, NOW() - interval '300 days', NOW() - interval '60 days', false)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  max_discount_amount = EXCLUDED.max_discount_amount,
  min_order_value = EXCLUDED.min_order_value,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active;

-- 2. LÀM MỚI BẢNG TEST DRIVES VỚI 42 LỊCH HẸN ĐA DẠNG TRẠNG THÁI & THỜI ĐIỂM
-- ------------------------------------------------------------------------------
DELETE FROM public.test_drives;

WITH 
showroom_list AS (
  SELECT id, code, ROW_NUMBER() OVER(ORDER BY code) as rn FROM public.showrooms WHERE is_active = true
),
staff_list AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role IN ('manager', 'owner')
),
customer_list AS (
  SELECT id, full_name, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role = 'user'
),
car_list AS (
  SELECT id, make, model, ROW_NUMBER() OVER(ORDER BY make, model) as rn 
  FROM public.cars 
  WHERE is_active = true AND make IN ('Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Toyota', 'Ford', 'Hyundai', 'Porsche', 'Land Rover', 'Lincoln', 'Volkswagen')
)
INSERT INTO public.test_drives (id, user_id, car_id, showroom_id, scheduled_date, status, notes, assigned_staff_id, created_at)
SELECT
  gen_random_uuid(),
  c.id as user_id,
  car.id as car_id,
  sr.id as showroom_id,
  raw.sched_date,
  raw.st as status,
  raw.note as notes,
  stf.id as assigned_staff_id,
  raw.created_dt as created_at
FROM (
  VALUES
    -- == HÔM NAY & NGÀY MAI (Sắp diễn ra - Upcoming: Hiển thị ngay trên Dashboard Overview) ==
    (1, 1, 1, 1, NOW() + interval '2 hours', 'confirmed', 'Khách VIP hẹn chạy thử xe giờ trưa, yêu cầu chuẩn bị xe sạch sẽ có điều hòa mát sẵn và nước khoáng.', NOW() - interval '1 day'),
    (2, 2, 2, 2, NOW() + interval '4 hours', 'confirmed', 'Khách nữ trải nghiệm cảm giác lái trong nội đô, quan tâm camera 360 và trợ lực lái điện nhẹ nhàng.', NOW() - interval '2 days'),
    (3, 3, 3, 3, NOW() + interval '6 hours', 'pending', 'Khách hàng đăng ký trực tuyến qua website trưa nay, cố vấn cần liên hệ xác nhận khung giờ đón khách.', NOW() - interval '3 hours'),
    (4, 4, 4, 4, NOW() + interval '1 day 2 hours', 'confirmed', 'Khách đi cùng gia đình 4 người, muốn thử độ êm hàng ghế thứ 2 và khả năng gập phẳng ghế chứa đồ golf.', NOW() - interval '1 day'),
    (5, 5, 5, 5, NOW() + interval '1 day 5 hours', 'confirmed', 'Yêu cầu chạy thử trên đại lộ Võ Văn Kiệt để đánh giá khả năng tăng tốc và phanh khẩn cấp ADAS.', NOW() - interval '2 days'),
    (6, 6, 6, 6, NOW() + interval '1 day 8 hours', 'pending', 'Khách hẹn sau giờ làm việc lúc 17:30, cần chuẩn bị xe màu trắng hoặc đen bóng.', NOW() - interval '1 day'),

    -- == 2 ĐẾN 7 NGÀY TỚI (Tuần này - Confirmed & Pending) ==
    (7, 1, 7, 7, NOW() + interval '2 days 3 hours', 'confirmed', 'Khách hàng muốn thử chế độ lái thể thao Sport+ và nghe thử dàn âm thanh cao cấp.', NOW() - interval '3 days'),
    (8, 2, 8, 1, NOW() + interval '2 days 6 hours', 'pending', 'Khách muốn so sánh cảm giác lái giữa bản máy xăng và hybrid tự sạc trước khi đặt cọc.', NOW() - interval '2 days'),
    (9, 3, 9, 2, NOW() + interval '3 days 1 hour', 'confirmed', 'Hẹn đón khách tại sảnh Showroom Cầu Giấy lúc 9:00 sáng. Chuẩn bị tài liệu brochure và bảng giá.', NOW() - interval '4 days'),
    (10, 4, 10, 3, NOW() + interval '3 days 4 hours', 'pending', 'Khách hàng phân vân giữa dòng SUV gầm cao và Sedan, muốn thử xe trên đoạn đường xấu.', NOW() - interval '1 day'),
    (11, 5, 11, 4, NOW() + interval '4 days 2 hours', 'confirmed', 'Lịch lái thử cuối tuần cùng hội bạn yêu xe, yêu cầu cố vấn kỹ thuật cao cấp đồng hành giải thích tính năng.', NOW() - interval '5 days'),
    (12, 6, 12, 5, NOW() + interval '4 days 6 hours', 'pending', 'Khách quan tâm đến mức tiêu hao nhiên liệu thực tế và chính sách bảo hành 5 năm chính hãng.', NOW() - interval '3 days'),
    (13, 1, 13, 6, NOW() + interval '5 days 3 hours', 'confirmed', 'Khách lái thử xe bán tải 2 cầu, yêu cầu hướng dẫn chi tiết các chế độ gài cầu điện tử 4H/4L.', NOW() - interval '4 days'),
    (14, 2, 14, 7, NOW() + interval '5 days 7 hours', 'pending', 'Khách hàng ở tỉnh ghé showroom cuối tuần, cần hỗ trợ chỗ đỗ xe ô tô cá nhân khi đến.', NOW() - interval '2 days'),
    (15, 3, 15, 1, NOW() + interval '6 days 4 hours', 'confirmed', 'Lịch hẹn trải nghiệm dòng xe sang Luxury, yêu cầu chuẩn bị lộ trình lái thử qua khu đô thị Sala.', NOW() - interval '6 days'),
    (16, 4, 16, 2, NOW() + interval '7 days 2 hours', 'pending', 'Đăng ký online, khách hàng cần tư vấn thêm về gói phụ kiện dán phim cách nhiệt và phủ ceramic.', NOW() - interval '1 day'),

    -- == 8 ĐẾN 14 NGÀY TỚI (Tuần tới) ==
    (17, 5, 17, 3, NOW() + interval '8 days 3 hours', 'confirmed', 'Khách hàng doanh nghiệp đặt lịch lái thử dòng SUV 7 chỗ cho ban giám đốc công ty.', NOW() - interval '3 days'),
    (18, 6, 18, 4, NOW() + interval '9 days 5 hours', 'pending', 'Khách chờ ngày đẹp cuối tháng đến trải nghiệm và làm thủ tục hợp đồng cọc giữ xe.', NOW() - interval '4 days'),
    (19, 1, 19, 5, NOW() + interval '10 days 2 hours', 'confirmed', 'Lịch hẹn chạy thử cao tốc Phan Thiết - Dầu Giây 30km để kiểm tra tính năng tự giữ làn đường Lane Keep Assist.', NOW() - interval '7 days'),
    (20, 2, 20, 6, NOW() + interval '12 days 4 hours', 'pending', 'Khách muốn xem trực tiếp nội thất màu nâu da bò da Nappa trước khi quyết định ký hợp đồng.', NOW() - interval '5 days'),

    -- == QUÁ KHỨ GẦN (1 - 7 ngày trước: Đã hoàn tất & Hài lòng) ==
    (21, 3, 21, 7, NOW() - interval '1 day 3 hours', 'completed', 'Khách hàng cực kỳ ưng ý độ êm của hệ thống treo khí nén và độ nhạy chân ga. Đã nhận báo giá lăn bánh, dự kiến đặt cọc trong 48h.', NOW() - interval '4 days'),
    (22, 4, 22, 1, NOW() - interval '2 days 5 hours', 'completed', 'Buổi trải nghiệm diễn ra suôn sẻ. Khách khen ngợi khả năng cách âm vòm lốp khi đi qua gờ giảm tốc.', NOW() - interval '5 days'),
    (23, 5, 23, 2, NOW() - interval '3 days 2 hours', 'completed', 'Khách lái thử 15km nội thành, đánh giá cao hộp số tự động 8 cấp mượt mà không bị giật ở dải tốc độ thấp.', NOW() - interval '6 days'),
    (24, 6, 24, 3, NOW() - interval '3 days 6 hours', 'cancelled', 'Khách hàng có chuyến bay công tác đột xuất đi Hàn Quốc, đã gọi điện xin dời lịch sang tháng tới.', NOW() - interval '5 days'),
    (25, 1, 25, 4, NOW() - interval '4 days 4 hours', 'completed', 'Khách hàng đã chốt mẫu xe và áp dụng voucher TESTDRIVE5M để làm hợp đồng cọc ngay sau khi lái thử.', NOW() - interval '7 days'),
    (26, 2, 26, 5, NOW() - interval '5 days 1 hour', 'completed', 'Gia đình khách hàng rất hài lòng về không gian rộng rãi của hàng ghế thứ 3 và cửa sổ trời toàn cảnh panorama.', NOW() - interval '8 days'),
    (27, 3, 27, 6, NOW() - interval '5 days 6 hours', 'cancelled', 'Khách hàng báo đã nhận chuyển nhượng lại chiếc xe lướt từ người quen nên xin hủy lịch lái thử.', NOW() - interval '7 days'),
    (28, 4, 28, 7, NOW() - interval '6 days 3 hours', 'completed', 'Khách thử nghiệm thành công tính năng lùi chuồng tự động và phanh khẩn cấp phía sau RCTA.', NOW() - interval '9 days'),
    (29, 5, 1, 1, NOW() - interval '7 days 2 hours', 'completed', 'Khách hàng khen ngợi phong cách phục vụ chuyên nghiệp của cố vấn bán hàng Showroom Cầu Giấy.', NOW() - interval '10 days'),

    -- == QUÁ KHỨ 8 - 20 NGÀY TRƯỚC (Lịch sử hoàn tất & phân tích dữ liệu) ==
    (30, 6, 2, 2, NOW() - interval '8 days 4 hours', 'completed', 'Trải nghiệm lộ trình vòng xoay Landmark 81. Khách hài lòng về góc nhìn thoáng và bán kính quay vòng nhỏ.', NOW() - interval '12 days'),
    (31, 1, 3, 3, NOW() - interval '9 days 2 hours', 'completed', 'Khách hàng là tài xế có kinh nghiệm lâu năm, đánh giá cao khung gầm đầm chắc ở tốc độ 100km/h trên cao tốc.', NOW() - interval '13 days'),
    (32, 2, 4, 4, NOW() - interval '10 days 5 hours', 'cancelled', 'Thời tiết mưa bão ngập đường cục bộ, khách chủ động gọi xin hủy lịch hẹn.', NOW() - interval '12 days'),
    (33, 3, 5, 5, NOW() - interval '11 days 3 hours', 'completed', 'Khách hàng thử nghiệm hệ dẫn động 4 bánh toàn thời gian AWD trên cung đường trơn trượt.', NOW() - interval '15 days'),
    (34, 4, 6, 6, NOW() - interval '12 days 6 hours', 'completed', 'Khách hàng thử khả năng tăng tốc của động cơ tăng áp Turbo điện tử, cảm giác dính lưng phấn khích.', NOW() - interval '16 days'),
    (35, 5, 7, 7, NOW() - interval '13 days 1 hour', 'completed', 'Đã ký biên bản bàn giao xe lái thử và tặng quà lưu niệm áo thun AutoMatch cho khách hàng.', NOW() - interval '17 days'),
    (36, 6, 8, 1, NOW() - interval '14 days 4 hours', 'completed', 'Khách hàng rất thích màn hình giải trí trung tâm sắc nét và kết nối Apple CarPlay không dây ổn định.', NOW() - interval '18 days'),
    (37, 1, 9, 2, NOW() - interval '16 days 2 hours', 'completed', 'Lái thử thành công, khách chuyển khoản đặt cọc 50.000.000 VNĐ giữ xe ngay tại bàn tư vấn.', NOW() - interval '20 days'),
    (38, 2, 10, 3, NOW() - interval '17 days 5 hours', 'cancelled', 'Khách hàng đổi ý muốn chờ thêm phiên bản facelift dự kiến ra mắt vào quý 4.', NOW() - interval '19 days'),
    (39, 3, 11, 4, NOW() - interval '18 days 3 hours', 'completed', 'Khách thử nghiệm hệ thống đèn pha thích ứng thông minh Matrix LED khi chạy vào hầm chui.', NOW() - interval '22 days'),
    (40, 4, 12, 5, NOW() - interval '19 days 6 hours', 'completed', 'Khách hàng hài lòng tuyệt đối về sự êm ái và khả năng khử mùi điều hòa ion âm của xe.', NOW() - interval '23 days'),
    (41, 5, 13, 6, NOW() - interval '20 days 2 hours', 'completed', 'Khách trải nghiệm xong đã giới thiệu thêm một người bạn cùng đăng ký lái thử phiên bản Hybrid.', NOW() - interval '24 days'),
    (42, 6, 14, 7, NOW() - interval '21 days 4 hours', 'cancelled', 'Khách không liên lạc được khi cố vấn gọi điện xác nhận trước giờ hẹn.', NOW() - interval '22 days')
) as raw(cust_idx, stf_idx, car_idx, sr_idx, sched_date, st, note, created_dt)
JOIN customer_list c ON c.rn = ((raw.cust_idx - 1) % (SELECT COUNT(*) FROM customer_list) + 1)
JOIN staff_list stf ON stf.rn = ((raw.stf_idx - 1) % (SELECT COUNT(*) FROM staff_list) + 1)
JOIN car_list car ON car.rn = ((raw.car_idx - 1) % (SELECT COUNT(*) FROM car_list) + 1)
JOIN showroom_list sr ON sr.rn = ((raw.sr_idx - 1) % (SELECT COUNT(*) FROM showroom_list) + 1);

-- 3. LÀM MỚI BẢNG ORDERS & ORDER_ITEMS TRẢI DÀI 6 THÁNG GẦN NHẤT
-- ------------------------------------------------------------------------------
DELETE FROM public.orders; -- Tự động CASCADE xóa order_items

WITH 
showroom_list AS (
  SELECT id, code, ROW_NUMBER() OVER(ORDER BY code) as rn FROM public.showrooms WHERE is_active = true
),
staff_list AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role IN ('manager', 'owner')
),
customer_list AS (
  SELECT id, full_name, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role = 'user'
),
voucher_list AS (
  SELECT id, code, discount_type, discount_value, ROW_NUMBER() OVER(ORDER BY code) as rn FROM public.vouchers WHERE is_active = true
),
car_list AS (
  SELECT id, make, model, price, ROW_NUMBER() OVER(ORDER BY make, model) as rn 
  FROM public.cars 
  WHERE is_active = true AND price IS NOT NULL AND price > 0
)
INSERT INTO public.orders (
  id, user_id, showroom_id, voucher_id, total_amount, deposit_amount, remaining_amount, discount_amount,
  status, payment_method, payment_status, deposit_status, contract_url, app_trans_id,
  cancellation_reason, cancelled_by, cancelled_at, refund_amount, refund_reason, refund_trans_id, refunded_at,
  created_at, updated_at
)
SELECT
  raw.order_id,
  c.id,
  sr.id,
  v.id,
  raw.final_total,
  raw.deposit_amt,
  raw.remaining_amt,
  raw.discount_amt,
  raw.st,
  raw.pay_m,
  raw.pay_st,
  raw.dep_st,
  raw.contract_link,
  raw.trans_id,
  raw.canc_reason,
  CASE WHEN raw.canc_reason IS NOT NULL THEN stf.id ELSE NULL END,
  raw.canc_at,
  raw.ref_amt,
  raw.ref_reason,
  raw.ref_trans,
  raw.ref_at,
  raw.created_dt,
  raw.updated_dt
FROM (
  VALUES
    -- Tháng 5/2026 (~150 ngày trước)
    (gen_random_uuid(), 1, 1, 1, 1, 1850000000, 185000000, 1665000000, 25000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2605_01.pdf', 'ZP260515_839201', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '148 days', NOW() - interval '140 days'),
    (gen_random_uuid(), 2, 2, 2, 2, 2450000000, 245000000, 2205000000, 60000000, 'completed', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2605_02.pdf', 'VN260520_491823', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '143 days', NOW() - interval '135 days'),
    (gen_random_uuid(), 3, 3, 3, 3, 3200000000, 320000000, 2880000000, 0, 'completed', 'bank_transfer', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2605_03.pdf', 'BT260528_109283', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '136 days', NOW() - interval '128 days'),

    -- Tháng 6/2026 (~120 ngày trước)
    (gen_random_uuid(), 4, 4, 4, 4, 1650000000, 165000000, 1485000000, 25000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2606_01.pdf', 'ZP260605_592810', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '118 days', NOW() - interval '110 days'),
    (gen_random_uuid(), 5, 5, 5, 5, 4100000000, 410000000, 3690000000, 100000000, 'completed', 'bank_transfer', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2606_02.pdf', 'BT260614_773629', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '112 days', NOW() - interval '105 days'),
    (gen_random_uuid(), 6, 6, 6, 1, 2150000000, 215000000, 1935000000, 25000000, 'completed', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2606_03.pdf', 'VN260622_382910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '104 days', NOW() - interval '96 days'),

    -- Tháng 7/2026 (~90 ngày trước)
    (gen_random_uuid(), 1, 7, 7, 2, 2800000000, 280000000, 2520000000, 60000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2607_01.pdf', 'ZP260703_482910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '92 days', NOW() - interval '85 days'),
    (gen_random_uuid(), 2, 1, 8, 3, 1450000000, 145000000, 1305000000, 5000000, 'completed', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2607_02.pdf', 'VN260712_982736', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '86 days', NOW() - interval '78 days'),
    (gen_random_uuid(), 3, 2, 9, 4, 3850000000, 385000000, 3465000000, 40000000, 'completed', 'bank_transfer', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2607_03.pdf', 'BT260720_192837', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '80 days', NOW() - interval '72 days'),
    (gen_random_uuid(), 4, 3, 10, NULL, 2300000000, 230000000, 2070000000, 0, 'cancelled', 'zalopay', 'refunded', 'refunded', NULL, 'ZP260725_283910', 'Khách hàng đổi ý mua phiên bản nhập khẩu nguyên chiếc', NOW() - interval '70 days', 230000000, 'Hoàn cọc bảo lưu 100% trong 48h', 'RF_7829102', NOW() - interval '69 days', NOW() - interval '74 days', NOW() - interval '69 days'),

    -- Tháng 8/2026 (~60 ngày trước)
    (gen_random_uuid(), 5, 4, 11, 1, 1950000000, 195000000, 1755000000, 25000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2608_01.pdf', 'ZP260802_382910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '63 days', NOW() - interval '55 days'),
    (gen_random_uuid(), 6, 5, 12, 2, 2750000000, 275000000, 2475000000, 60000000, 'completed', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2608_02.pdf', 'VN260810_582910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '58 days', NOW() - interval '50 days'),
    (gen_random_uuid(), 1, 6, 13, 3, 3100000000, 310000000, 2790000000, 5000000, 'completed', 'bank_transfer', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2608_03.pdf', 'BT260818_283910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '51 days', NOW() - interval '43 days'),
    (gen_random_uuid(), 2, 7, 14, 5, 5200000000, 520000000, 4680000000, 100000000, 'completed', 'bank_transfer', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2608_04.pdf', 'BT260826_829102', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '45 days', NOW() - interval '38 days'),

    -- Tháng 9/2026 (~30 ngày trước)
    (gen_random_uuid(), 3, 1, 15, 1, 1800000000, 180000000, 1620000000, 25000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2609_01.pdf', 'ZP260904_482910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '34 days', NOW() - interval '26 days'),
    (gen_random_uuid(), 4, 2, 16, 2, 2600000000, 260000000, 2340000000, 60000000, 'completed', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2609_02.pdf', 'VN260911_382910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '28 days', NOW() - interval '20 days'),
    (gen_random_uuid(), 5, 3, 17, 3, 3450000000, 345000000, 3105000000, 5000000, 'completed', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2609_03.pdf', 'ZP260918_182930', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '22 days', NOW() - interval '15 days'),
    (gen_random_uuid(), 6, 4, 18, 4, 2250000000, 225000000, 2025000000, 40000000, 'ready_for_pickup', 'vnpay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2609_04.pdf', 'VN260925_928192', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '17 days', NOW() - interval '2 days'),
    (gen_random_uuid(), 1, 5, 19, NULL, 1550000000, 0, 1550000000, 0, 'cancelled', 'vnpay', 'unpaid', 'unpaid', NULL, NULL, 'Khách hàng chưa thu xếp được hồ sơ vay ngân hàng', NOW() - interval '12 days', 0, NULL, NULL, NULL, NOW() - interval '14 days', NOW() - interval '12 days'),

    -- Tháng 10/2026 (Tháng hiện tại: 1 - 10 ngày trước)
    (gen_random_uuid(), 2, 6, 20, 1, 2350000000, 235000000, 2115000000, 25000000, 'ready_for_pickup', 'zalopay', 'paid', 'paid', 'https://automatch.vn/contracts/HD_2610_01.pdf', 'ZP261002_482910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '8 days', NOW() - interval '1 day'),
    (gen_random_uuid(), 3, 7, 21, 2, 2900000000, 290000000, 2610000000, 60000000, 'preparing_car', 'zalopay', 'paid', 'paid', NULL, 'ZP261004_182930', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '6 days', NOW() - interval '2 days'),
    (gen_random_uuid(), 4, 1, 22, 3, 1750000000, 175000000, 1575000000, 5000000, 'preparing_car', 'bank_transfer', 'paid', 'paid', NULL, 'BT261006_918239', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '4 days', NOW() - interval '1 day'),
    (gen_random_uuid(), 5, 2, 23, 4, 2100000000, 210000000, 1890000000, 40000000, 'deposit_paid', 'zalopay', 'paid', 'paid', NULL, 'ZP261007_829102', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '3 days', NOW() - interval '1 day'),
    (gen_random_uuid(), 6, 3, 24, 6, 1600000000, 160000000, 1440000000, 15000000, 'deposit_paid', 'vnpay', 'paid', 'paid', NULL, 'VN261008_382910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '2 days', NOW() - interval '12 hours'),
    (gen_random_uuid(), 1, 4, 25, 1, 2850000000, 285000000, 2565000000, 25000000, 'deposit_paid', 'zalopay', 'paid', 'paid', NULL, 'ZP261009_582910', NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '1 day', NOW() - interval '6 hours'),
    (gen_random_uuid(), 2, 5, 26, NULL, 1950000000, 0, 1950000000, 0, 'pending', 'zalopay', 'unpaid', 'unpaid', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '18 hours', NOW() - interval '18 hours'),
    (gen_random_uuid(), 3, 6, 27, 3, 3150000000, 0, 3150000000, 5000000, 'pending', 'vnpay', 'unpaid', 'unpaid', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '10 hours', NOW() - interval '10 hours'),
    (gen_random_uuid(), 4, 7, 28, NULL, 1400000000, 0, 1400000000, 0, 'pending', 'bank_transfer', 'unpaid', 'unpaid', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NOW() - interval '3 hours', NOW() - interval '3 hours')
) as raw(order_id, cust_idx, sr_idx, car_idx, vouch_idx, final_total, deposit_amt, remaining_amt, discount_amt, st, pay_m, pay_st, dep_st, contract_link, trans_id, canc_reason, canc_at, ref_amt, ref_reason, ref_trans, ref_at, created_dt, updated_dt)
JOIN customer_list c ON c.rn = ((raw.cust_idx - 1) % (SELECT COUNT(*) FROM customer_list) + 1)
JOIN staff_list stf ON stf.rn = 1
JOIN showroom_list sr ON sr.rn = ((raw.sr_idx - 1) % (SELECT COUNT(*) FROM showroom_list) + 1)
LEFT JOIN voucher_list v ON raw.vouch_idx IS NOT NULL AND v.rn = ((raw.vouch_idx - 1) % (SELECT COUNT(*) FROM voucher_list) + 1);

-- 4. TẠO ORDER ITEMS TƯƠNG ỨNG VỚI CÁC XE THẬT TRONG BẢNG CARS
-- ------------------------------------------------------------------------------
WITH 
ranked_orders AS (
  SELECT id, total_amount, created_at, ROW_NUMBER() OVER(ORDER BY created_at ASC) as rn FROM public.orders
),
car_list AS (
  SELECT id, price, ROW_NUMBER() OVER(ORDER BY make, model) as rn 
  FROM public.cars 
  WHERE is_active = true AND price IS NOT NULL AND price > 0
)
INSERT INTO public.order_items (id, order_id, car_id, price, quantity, created_at)
SELECT
  gen_random_uuid(),
  o.id,
  c.id,
  o.total_amount,
  1,
  o.created_at
FROM ranked_orders o
JOIN car_list c ON c.rn = ((o.rn - 1) % (SELECT COUNT(*) FROM car_list) + 1);

-- 5. BỔ SUNG CÂU HỎI & TRẢ LỜI XE (CAR Q&A)
-- ------------------------------------------------------------------------------
DELETE FROM public.car_qa;

WITH
customer_list AS (
  SELECT id, full_name, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role = 'user'
),
staff_list AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role IN ('manager', 'owner')
),
car_list AS (
  SELECT id, make, model, ROW_NUMBER() OVER(ORDER BY make, model) as rn 
  FROM public.cars 
  WHERE is_active = true
)
INSERT INTO public.car_qa (id, car_id, user_id, question, answer, answered_by, created_at, updated_at)
SELECT
  gen_random_uuid(),
  car.id,
  c.id,
  raw.q,
  raw.a,
  CASE WHEN raw.a IS NOT NULL THEN stf.id ELSE NULL END,
  raw.created_dt,
  raw.updated_dt
FROM (
  VALUES
    (1, 1, 1, 'Mức tiêu hao nhiên liệu thực tế trong điều kiện đô thị kẹt xe giờ cao điểm là bao nhiêu lít/100km?', 'Chào bạn! Theo đo đạc thực tế của khách hàng tại TP.HCM và Hà Nội, xe tiêu thụ khoảng 8.5L - 9.2L/100km trong nội đô kẹt xe và chỉ 6.0L/100km trên cao tốc bạn nhé.', NOW() - interval '8 days', NOW() - interval '7 days'),
    (2, 2, 2, 'Mẫu xe này tại Showroom Cầu Giấy hiện có sẵn xe giao ngay không hay phải chờ nhập?', 'Dạ Showroom Cầu Giấy hiện đang có sẵn 02 xe màu Trắng ngọc trai và Đen ánh kim đủ hồ sơ bấm biển giao ngay trong ngày ạ.', NOW() - interval '6 days', NOW() - interval '5 days'),
    (3, 3, 3, 'Chính sách bảo hành chính hãng của xe tại Việt Nam được áp dụng mấy năm?', 'AutoMatch cam kết bảo hành chính hãng 5 năm hoặc 150.000 km (tùy điều kiện nào đến trước), kèm gói cứu hộ 24/7 miễn phí toàn quốc năm đầu tiên.', NOW() - interval '5 days', NOW() - interval '4 days'),
    (4, 4, 4, 'Bên showroom có hỗ trợ gói vay ngân hàng 80% giá trị xe không, thủ tục duyệt bao lâu?', 'Showroom liên kết độc quyền với Vietcombank, Techcombank, VPBank hỗ trợ vay tối đa 80-85% lãi suất ưu đãi cố định năm đầu. Hồ sơ duyệt online chỉ từ 4-8 giờ làm việc.', NOW() - interval '3 days', NOW() - interval '2 days'),
    (5, 5, 5, 'Hệ thống an toàn chủ động ADAS trên xe có tính năng tự động phanh khẩn cấp và giữ làn đường không?', 'Có đầy đủ bạn nhé. Xe trang bị gói ADAS cao cấp nhất với Radar sóng milimet và Camera kép hỗ trợ phanh khẩn cấp AEB, giữ làn LKA và ga tự động thích ứng ACC Stop & Go.', NOW() - interval '2 days', NOW() - interval '1 day'),
    (6, 6, 6, 'Tôi ở tỉnh xa thì bên showroom có hỗ trợ giao xe tận nhà bằng xe lồng chuyên dụng không?', 'Dạ có ạ! AutoMatch có dịch vụ vận chuyển xe lồng chuyên dụng bàn giao tận cửa nhà khách hàng trên toàn quốc, kèm hoa chúc mừng và lễ bàn giao chu đáo.', NOW() - interval '1 day', NOW() - interval '18 hours'),
    (7, 1, 7, 'Động cơ Hybrid của xe là loại tự sạc hay phải cắm sạc ngoài?', 'Đây là hệ truyền động Hybrid tự sạc thông minh (HEV). Xe tự thu hồi động năng khi phanh để nạp pin, quý khách sử dụng bình thường như xe xăng mà không cần trạm sạc ngoài.', NOW() - interval '12 hours', NOW() - interval '6 hours'),
    (8, 2, 8, 'Chi phí lăn bánh trọn gói mẫu xe này tại TP. Hồ Chí Minh hiện tại khoảng bao nhiêu?', NULL, NOW() - interval '5 hours', NOW() - interval '5 hours'),
    (9, 3, 9, 'Xe có tính năng sấy sưởi và thông gió cho cả hai hàng ghế trước và sau không?', NULL, NOW() - interval '3 hours', NOW() - interval '3 hours'),
    (10, 4, 10, 'Nếu tôi đặt cọc online 10% giữ xe thì trong bao lâu có thể rút lại cọc nếu lái thử không ưng ý?', 'Chính sách bảo vệ người mua độc quyền của AutoMatch cho phép quý khách bảo lưu hoặc hoàn 100% tiền đặt cọc trong vòng 48 giờ sau buổi lái thử nếu không ưng ý.', NOW() - interval '2 days', NOW() - interval '1 day')
) as raw(cust_idx, stf_idx, car_idx, q, a, created_dt, updated_dt)
JOIN customer_list c ON c.rn = ((raw.cust_idx - 1) % (SELECT COUNT(*) FROM customer_list) + 1)
JOIN staff_list stf ON stf.rn = ((raw.stf_idx - 1) % (SELECT COUNT(*) FROM staff_list) + 1)
JOIN car_list car ON car.rn = ((raw.car_idx - 1) % (SELECT COUNT(*) FROM car_list) + 1);

-- 6. BỔ SUNG NOTIFICATIONS MỚI NHẤT
-- ------------------------------------------------------------------------------
DELETE FROM public.notifications;

WITH customer_list AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY email) as rn FROM public.profiles WHERE role = 'user'
)
INSERT INTO public.notifications (id, user_id, title, content, type, is_read, created_at)
SELECT
  gen_random_uuid(),
  c.id,
  raw.title,
  raw.content,
  raw.type,
  raw.is_read,
  raw.created_dt
FROM (
  VALUES
    (1, 'Xác nhận đặt cọc thành công', 'Khoản cọc 10% cho hợp đồng mua xe của bạn đã được ghi nhận an toàn qua cổng thanh toán ZaloPay.', 'order', false, NOW() - interval '1 day 2 hours'),
    (2, 'Xe của bạn đang được kiểm tra PDI', 'Đội ngũ kỹ thuật viên đang tiến hành kiểm tra 120 hạng mục tiêu chuẩn trước khi bàn giao xe.', 'order', true, NOW() - interval '2 days'),
    (3, 'Sẵn sàng bàn giao xe tại Showroom', 'Hồ sơ bấm biển và giấy chứng nhận đăng kiểm đã sẵn sàng. Trân trọng kính mời quý khách đến nhận xe.', 'order', false, NOW() - interval '3 days'),
    (4, 'Xác nhận lịch hẹn lái thử hôm nay', 'Lịch lái thử tại Showroom AutoMatch Cầu Giấy lúc 10:00 sáng đã được xếp lịch cho chuyên viên tư vấn.', 'test_drive', false, NOW() - interval '4 hours'),
    (5, 'Cảm ơn bạn đã tham gia lái thử', 'Buổi lái thử xe đã hoàn tất. Bạn nhận được ưu đãi voucher cọc 5.000.000đ TESTDRIVE5M có hiệu lực trong 7 ngày.', 'test_drive', true, NOW() - interval '1 day'),
    (6, 'Ưu Đãi Đặc Biệt Mùa Thu 2026', 'Áp dụng mã AUTOFALL26 để nhận ngay 15.000.000đ khi đặt cọc bất kỳ mẫu xe SUV sang trọng.', 'promotion', false, NOW() - interval '2 days'),
    (7, 'Flash Deal Cuối Tuần: Giảm 8% xe Hybrid', 'Cơ hội sở hữu các dòng xe tiết kiệm nhiên liệu với mức chiết khấu chưa từng có.', 'promotion', false, NOW() - interval '4 days'),
    (8, 'Cập nhật ứng dụng phiên bản 2.5', 'Trải nghiệm tính năng tìm kiếm xe bằng AI thông minh thế hệ mới, so sánh chi phí vận hành chi tiết.', 'system', true, NOW() - interval '5 days'),
    (9, 'Bảo trì hệ thống đối soát định kỳ', 'Hệ thống đối soát thanh toán ngân hàng định kỳ đã hoàn tất lúc 04:00 sáng ngày Chủ Nhật.', 'system', true, NOW() - interval '6 days')
) as raw(cust_idx, title, content, type, is_read, created_dt)
JOIN customer_list c ON c.rn = ((raw.cust_idx - 1) % (SELECT COUNT(*) FROM customer_list) + 1);

COMMIT;

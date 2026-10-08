import os
import uuid
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Environment Loading
for p in [Path(__file__).parent, Path(__file__).parent.parent, Path(__file__).parent.parent / "backend"]:
    env_file = p / ".env"
    if env_file.exists():
        load_dotenv(env_file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

NOW = datetime.now(timezone.utc)

def days_ago(d: int, hours: int = 0) -> str:
    return (NOW - timedelta(days=d, hours=hours)).isoformat()

def days_ahead(d: int, hours: int = 0) -> str:
    return (NOW + timedelta(days=d, hours=hours)).isoformat()


# 2. Showrooms Definition
NEW_SHOWROOMS = [
    {
        "name": "AutoMatch TP.HCM - Landmark Quận 7",
        "code": "SR_HCM_Q7",
        "address": "Số 101 Tôn Dật Tiên, Phường Tân Phú, Quận 7",
        "city": "TP. Hồ Chí Minh",
        "phone": "028 5411 2233",
        "email": "hcm.quan7@automatch.vn",
        "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "opening_hours": "08:00 - 21:30",
        "is_active": True
    },
    {
        "name": "AutoMatch Đà Nẵng - Hải Châu Center",
        "code": "SR_DN_HC",
        "address": "Số 45 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu",
        "city": "Đà Nẵng",
        "phone": "0236 365 8888",
        "email": "danang.haichau@automatch.vn",
        "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "opening_hours": "08:00 - 20:00",
        "is_active": True
    },
    {
        "name": "AutoMatch Hải Phòng - Lê Chân Hub",
        "code": "SR_HP_LC",
        "address": "Số 12 Hồ Sen, Phường Trại Cau, Quận Lê Chân",
        "city": "Hải Phòng",
        "phone": "0225 385 7777",
        "email": "haiphong@automatch.vn",
        "image_url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        "opening_hours": "08:00 - 20:00",
        "is_active": True
    },
    {
        "name": "AutoMatch Cần Thơ - Ninh Kiều Plaza",
        "code": "SR_CT_NK",
        "address": "Số 88 Đường 30 Tháng 4, Phường An Phú, Quận Ninh Kiều",
        "city": "Cần Thơ",
        "phone": "0292 382 6688",
        "email": "cantho@automatch.vn",
        "image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        "opening_hours": "08:00 - 20:30",
        "is_active": True
    },
    {
        "name": "AutoMatch Bình Dương - Thủ Dầu Một Mega Mall",
        "code": "SR_BD_TDM",
        "address": "Số 230 Đại lộ Bình Dương, Phường Phú Hòa, TP. Thủ Dầu Một",
        "city": "Bình Dương",
        "phone": "0274 381 9999",
        "email": "binhduong@automatch.vn",
        "image_url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
        "opening_hours": "08:00 - 21:00",
        "is_active": True
    }
]

# 3. Vouchers Definition
NEW_VOUCHERS = [
    {
        "code": "TET2026",
        "title": "Ưu đãi Đón Xuân 2026 - Lộc Vàng May Mắn",
        "description": "Giảm ngay 25.000.000 VNĐ vào tiền đặt cọc giữ xe trực tuyến cho các dòng Sedan và SUV cao cấp.",
        "discount_type": "fixed",
        "discount_value": 25000000,
        "max_discount_amount": 25000000,
        "min_order_value": 500000000,
        "applies_to": "deposit",
        "usage_limit": 300,
        "used_count": 12,
        "max_uses_per_user": 1,
        "start_date": days_ago(30),
        "end_date": days_ahead(60),
        "is_active": True
    },
    {
        "code": "ECOGREEN10",
        "title": "Chương Trình Khuyến Khích Xe Xanh & Hybrid",
        "description": "Giảm 10% tổng giá trị xe (Tối đa 60.000.000 VNĐ) khi đặt cọc trực tuyến các dòng Hybrid / Electric.",
        "discount_type": "percentage",
        "discount_value": 10,
        "max_discount_amount": 60000000,
        "min_order_value": 600000000,
        "applies_to": "total",
        "usage_limit": 150,
        "used_count": 8,
        "max_uses_per_user": 1,
        "start_date": days_ago(60),
        "end_date": days_ahead(90),
        "is_active": True
    },
    {
        "code": "TESTDRIVE5M",
        "title": "Lộc Vàng Lái Thử Showroom",
        "description": "Tặng ngay voucher 5.000.000 VNĐ tiền cọc cho khách hàng hoàn tất buổi lái thử tại Showroom AutoMatch.",
        "discount_type": "fixed",
        "discount_value": 5000000,
        "max_discount_amount": 5000000,
        "min_order_value": 300000000,
        "applies_to": "deposit",
        "usage_limit": 1000,
        "used_count": 35,
        "max_uses_per_user": 1,
        "start_date": days_ago(45),
        "end_date": days_ahead(120),
        "is_active": True
    },
    {
        "code": "FLASHDEAL8",
        "title": "Flash Deal Cuối Tuần - Đón Xe Liền Tay",
        "description": "Giảm 8% (Tối đa 40.000.000 VNĐ) áp dụng cho tất cả các giao dịch cọc trong 48 giờ cuối tuần.",
        "discount_type": "percentage",
        "discount_value": 8,
        "max_discount_amount": 40000000,
        "min_order_value": 450000000,
        "applies_to": "total",
        "usage_limit": 50,
        "used_count": 22,
        "max_uses_per_user": 1,
        "start_date": days_ago(5),
        "end_date": days_ahead(2),
        "is_active": True
    },
    {
        "code": "LUXURY100M",
        "title": "Đặc Quyền Khách Hàng Thượng Lưu - Luxury Car",
        "description": "Đặc quyền giảm 100.000.000 VNĐ trực tiếp cho các dòng xe sang giá trị trên 2 tỷ VNĐ.",
        "discount_type": "fixed",
        "discount_value": 100000000,
        "max_discount_amount": 100000000,
        "min_order_value": 2000000000,
        "applies_to": "total",
        "usage_limit": 30,
        "used_count": 3,
        "max_uses_per_user": 1,
        "start_date": days_ago(90),
        "end_date": days_ahead(180),
        "is_active": True
    },
    {
        "code": "EXPIRED2025",
        "title": "Tri Ân Khai Trương Chuỗi Hệ Thống (Hết hạn)",
        "description": "Chương trình ưu đãi ngày khai trương ban đầu (dùng kiểm thử bộ lọc hết hạn trên Dashboard).",
        "discount_type": "fixed",
        "discount_value": 20000000,
        "max_discount_amount": 20000000,
        "min_order_value": 400000000,
        "applies_to": "deposit",
        "usage_limit": 100,
        "used_count": 100,
        "max_uses_per_user": 1,
        "start_date": days_ago(180),
        "end_date": days_ago(30),
        "is_active": False
    }
]

# 4. User Profiles Definition
USER_PROFILES = [
    # System Admin / Owner
    {
        "email": "admin@automatch.vn",
        "full_name": "Quản Trị Viên Hệ Thống",
        "phone": "0999999999",
        "role": "owner",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80"
    },
    # Managers (associated with showrooms)
    {
        "email": "manager.hanoi@automatch.vn",
        "full_name": "Hoàng Minh Tuấn",
        "phone": "0982345671",
        "role": "manager",
        "showroom_code": "SR_HN_CG",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "manager.danang@automatch.vn",
        "full_name": "Lê Thị Ngọc Mai",
        "phone": "0913988772",
        "role": "manager",
        "showroom_code": "SR_DN_HC",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "manager.quan7@automatch.vn",
        "full_name": "Trần Quang Huy",
        "phone": "0934112233",
        "role": "manager",
        "showroom_code": "SR_HCM_Q7",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "manager.haiphong@automatch.vn",
        "full_name": "Phạm Đức Anh",
        "phone": "0945889900",
        "role": "manager",
        "showroom_code": "SR_HP_LC",
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80"
    },
    # Customers
    {
        "email": "duc.nguyen@automatch.dev",
        "full_name": "Nguyễn Minh Đức",
        "phone": "0903124578",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "khanh.vu@automatch.dev",
        "full_name": "Vũ Nam Khánh",
        "phone": "0918765432",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "huong.le@automatch.dev",
        "full_name": "Lê Thanh Hương",
        "phone": "0987654321",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "khoa.pham@automatch.dev",
        "full_name": "Phạm Đăng Khoa",
        "phone": "0938112233",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "ngoc.tran@automatch.dev",
        "full_name": "Trần Bảo Ngọc",
        "phone": "0976554433",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "phat.doan@automatch.dev",
        "full_name": "Đoàn Gia Phát",
        "phone": "0945998877",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "nhi.hoang@automatch.dev",
        "full_name": "Hoàng Yến Nhi",
        "phone": "0919223344",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80"
    },
    {
        "email": "loc.nguyen@automatch.dev",
        "full_name": "Nguyễn Hữu Lộc",
        "phone": "0908889900",
        "role": "user",
        "showroom_code": None,
        "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80"
    }
]

def seed_showrooms():
    print("\n🏢 --- SEEDING SHOWROOMS ---")
    created = 0
    for sr in NEW_SHOWROOMS:
        existing = supabase.table("showrooms").select("id").eq("code", sr["code"]).execute().data
        if not existing:
            supabase.table("showrooms").insert(sr).execute()
            created += 1
            print(f"  + Added showroom: {sr['name']} ({sr['code']})")
        else:
            print(f"  = Showroom already exists: {sr['code']}")
    print(f"✅ Showrooms seeded: {created} new added.")

def seed_vouchers():
    print("\n🎟️ --- SEEDING VOUCHERS ---")
    created = 0
    for v in NEW_VOUCHERS:
        existing = supabase.table("vouchers").select("id").eq("code", v["code"]).execute().data
        if not existing:
            supabase.table("vouchers").insert(v).execute()
            created += 1
            print(f"  + Added voucher: {v['code']} - {v['title']}")
        else:
            print(f"  = Voucher already exists: {v['code']}")
    print(f"✅ Vouchers seeded: {created} new added.")

def seed_users():
    print("\n👤 --- SEEDING AUTH USERS & PROFILES ---")
    # Get showrooms mapping (code -> id)
    showrooms_data = supabase.table("showrooms").select("id, code").execute().data
    showroom_map = {s["code"]: s["id"] for s in showrooms_data}
    
    # Existing auth users
    existing_users = {u.email: u.id for u in supabase.auth.admin.list_users()}
    
    created_count = 0
    for udef in USER_PROFILES:
        email = udef["email"]
        user_id = existing_users.get(email)
        
        if not user_id:
            try:
                user_res = supabase.auth.admin.create_user({
                    "email": email,
                    "password": "AutoMatchPassword2026!",
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": udef["full_name"],
                        "phone": udef["phone"]
                    }
                })
                user_id = user_res.user.id
                print(f"  + Created auth user: {email} ({user_id})")
            except Exception as e:
                print(f"  ! Error creating auth user {email}: {e}")
                continue
        
        sr_id = showroom_map.get(udef.get("showroom_code")) if udef.get("showroom_code") else None
        
        # Check profiles table
        p_res = supabase.table("profiles").select("id").eq("id", user_id).execute().data
        profile_payload = {
            "id": user_id,
            "email": email,
            "full_name": udef["full_name"],
            "phone": udef["phone"],
            "avatar_url": udef["avatar_url"],
            "role": udef["role"],
            "showroom_id": sr_id,
            "is_active": True
        }
        if not p_res:
            supabase.table("profiles").insert(profile_payload).execute()
            created_count += 1
            print(f"  + Created profile: {udef['full_name']} [{udef['role']}]")
        else:
            supabase.table("profiles").update(profile_payload).eq("id", user_id).execute()
            print(f"  = Updated profile: {udef['full_name']}")
            
    print(f"✅ Users & Profiles processed. New profiles: {created_count}.")

def seed_orders_and_items():
    print("\n🛒 --- SEEDING ORDERS & ORDER ITEMS ---")
    # Fetch dependencies
    profiles = supabase.table("profiles").select("id, email, full_name, role").execute().data
    customers = [p for p in profiles if p["role"] == "user"]
    managers = [p for p in profiles if p["role"] in ("manager", "owner")]
    showrooms = supabase.table("showrooms").select("id, name").execute().data
    vouchers = supabase.table("vouchers").select("id, code, discount_type, discount_value").eq("is_active", True).execute().data
    cars = supabase.table("cars").select("id, make, model, year, price, showroom_id").not_.is_("price", "null").limit(50).execute().data

    if not customers or not cars or not showrooms:
        print("❌ Cannot seed orders: Missing customers, cars, or showrooms.")
        return

    existing_orders = supabase.table("orders").select("id", count="exact").execute()
    if existing_orders.count and existing_orders.count > 15:
        print(f"  = Orders already have {existing_orders.count} records. Skipping bulk order creation.")
        return

    order_configs = [
        # (status, payment_method, payment_status, deposit_status, days_ago_val, with_voucher, is_cancelled)
        ("completed", "zalopay", "paid", "paid", 75, True, False),
        ("completed", "vnpay", "paid", "paid", 62, False, False),
        ("completed", "bank_transfer", "paid", "paid", 45, True, False),
        ("ready_for_pickup", "zalopay", "paid", "paid", 18, True, False),
        ("ready_for_pickup", "vnpay", "paid", "paid", 12, False, False),
        ("preparing_car", "zalopay", "paid", "paid", 8, False, False),
        ("preparing_car", "bank_transfer", "paid", "paid", 5, True, False),
        ("deposit_paid", "zalopay", "paid", "paid", 3, False, False),
        ("deposit_paid", "vnpay", "paid", "paid", 2, True, False),
        ("deposit_paid", "zalopay", "paid", "paid", 1, False, False),
        ("pending", "zalopay", "unpaid", "unpaid", 2, False, False),
        ("pending", "vnpay", "unpaid", "unpaid", 1, True, False),
        ("pending", "bank_transfer", "unpaid", "unpaid", 0, False, False),
        ("cancelled", "zalopay", "refunded", "refunded", 28, False, True),
        ("cancelled", "vnpay", "unpaid", "unpaid", 15, False, True),
        ("completed", "zalopay", "paid", "paid", 35, False, False),
        ("deposit_paid", "cash", "paid", "paid", 4, False, False),
        ("preparing_car", "zalopay", "paid", "paid", 7, True, False),
    ]

    orders_added = 0
    for idx, (st, pay_m, pay_st, dep_st, d_ago, use_vouch, is_canc) in enumerate(order_configs):
        cust = customers[idx % len(customers)]
        car = cars[idx % len(cars)]
        sr = showrooms[idx % len(showrooms)]
        vouch = vouchers[idx % len(vouchers)] if use_vouch and vouchers else None

        raw_price = car.get("price") or 35000
        fuel_type = str(car.get("metadata", {}).get("engine_fuel_type") or car.get("metadata", {}).get("fuel_type") or "").strip().lower()
        is_ev = "electric" in fuel_type or "thuần điện" in fuel_type or fuel_type == "điện"
        tax_mult = 1.60 if is_ev else 2.54
        price = int(round(raw_price * 25400 * tax_mult)) if raw_price < 1000000 else raw_price
        qty = 1
        total_before_discount = price * qty
        discount = 0
        voucher_id = None

        if vouch:
            voucher_id = vouch["id"]
            if vouch["discount_type"] == "fixed":
                discount = min(vouch["discount_value"], total_before_discount)
            else:
                pct = vouch["discount_value"] / 100.0
                discount = int(total_before_discount * pct)

        total_amount = max(0, total_before_discount - discount)
        deposit_amount = int(total_amount * 0.10) if dep_st != "unpaid" else 0
        remaining_amount = max(0, total_amount - deposit_amount)

        app_trans_id = f"ZP{datetime.now().strftime('%y%m%d')}_{random.randint(100000, 999999)}" if pay_st == "paid" else None
        
        cancelled_by = managers[0]["id"] if is_canc and managers else None
        cancelled_at = days_ago(d_ago, 2) if is_canc else None
        cancellation_reason = "Khách hàng đổi ý muốn chờ phiên bản màu nội thất mới" if is_canc else None
        
        refund_amount = deposit_amount if is_canc and pay_st == "refunded" else 0
        refund_reason = "Hoàn lại tiền cọc theo chính sách bảo lưu giá trong 48h" if refund_amount > 0 else None
        refund_trans_id = f"RF_{random.randint(1000000, 9999999)}" if refund_amount > 0 else None
        refunded_at = days_ago(d_ago, 1) if refund_amount > 0 else None

        order_data = {
            "user_id": cust["id"],
            "showroom_id": sr["id"],
            "voucher_id": voucher_id,
            "total_amount": total_amount,
            "deposit_amount": deposit_amount,
            "remaining_amount": remaining_amount,
            "discount_amount": discount,
            "status": st,
            "payment_method": pay_m,
            "payment_status": pay_st,
            "deposit_status": dep_st,
            "contract_url": "https://automatch.vn/contracts/sample_contract.pdf" if st in ("completed", "ready_for_pickup") else None,
            "app_trans_id": app_trans_id,
            "cancellation_reason": cancellation_reason,
            "cancelled_by": cancelled_by,
            "cancelled_at": cancelled_at,
            "refund_amount": refund_amount,
            "refund_reason": refund_reason,
            "refund_trans_id": refund_trans_id,
            "refunded_at": refunded_at,
            "created_at": days_ago(d_ago, random.randint(1, 10)),
            "updated_at": days_ago(d_ago, 1)
        }

        try:
            res = supabase.table("orders").insert(order_data).execute()
            if res.data:
                order_id = res.data[0]["id"]
                # Insert order item
                supabase.table("order_items").insert({
                    "order_id": order_id,
                    "car_id": car["id"],
                    "price": price,
                    "quantity": qty,
                    "created_at": order_data["created_at"]
                }).execute()
                orders_added += 1
                print(f"  + Order #{order_id[:8]} ({st}) for {cust['full_name']} - {car['make']} {car['model']}")
        except Exception as e:
            print(f"  ! Error creating order: {e}")

    print(f"✅ Orders & Items seeded: {orders_added} new orders added.")

def seed_test_drives():
    print("\n🚗 --- SEEDING TEST DRIVES ---")
    profiles = supabase.table("profiles").select("id, full_name, role").execute().data
    customers = [p for p in profiles if p["role"] == "user"]
    managers = [p for p in profiles if p["role"] in ("manager", "owner")]
    showrooms = supabase.table("showrooms").select("id, name").execute().data
    cars = supabase.table("cars").select("id, make, model").limit(40).execute().data

    if not customers or not cars or not showrooms:
        print("❌ Cannot seed test drives: Missing prerequisite data.")
        return

    existing_td = supabase.table("test_drives").select("id", count="exact").execute()
    if existing_td.count and existing_td.count > 15:
        print(f"  = Test drives already have {existing_td.count} records. Skipping.")
        return

    td_configs = [
        ("completed", -14, "Đã hoàn thành buổi lái thử. Khách rất ưng ý hệ thống treo khí nén và khả năng cách âm."),
        ("completed", -8, "Khách lái thử vòng quanh khu đô thị Sala, hài lòng với độ nhạy của chân ga và camera 360."),
        ("confirmed", 1, "Hẹn đón khách lúc 9:30 sáng. Cần chuẩn bị xe sạch sẽ và đầy bình nhiên liệu."),
        ("confirmed", 2, "Khách hàng muốn thử thêm khả năng gập phẳng hàng ghế sau để vali golf."),
        ("confirmed", 4, "Lịch hẹn lái thử cùng gia đình, yêu cầu lắp thêm ghế an toàn cho trẻ em."),
        ("pending", 3, "Khách hàng đăng ký online qua website, đang chờ cố vấn liên hệ chốt giờ."),
        ("pending", 5, "Khách quan tâm đến cảm giác lái trên cao tốc và hệ thống ADAS hỗ trợ giữ làn."),
        ("pending", 6, "Yêu cầu lái thử vào khung giờ chiều 16:30 sau giờ làm việc."),
        ("cancelled", -3, "Khách bận công tác đột xuất tại Singapore nên xin dời lịch sang tháng sau."),
        ("cancelled", -10, "Đã mua xe lướt từ người quen trước ngày hẹn, xin hủy lịch.")
    ]

    added = 0
    for idx, (st, d_offset, note) in enumerate(td_configs):
        cust = customers[idx % len(customers)]
        car = cars[idx % len(cars)]
        sr = showrooms[idx % len(showrooms)]
        staff = managers[idx % len(managers)] if managers else None

        sched_date = days_ahead(d_offset, random.randint(9, 17)) if d_offset >= 0 else days_ago(-d_offset, random.randint(9, 17))
        
        td_data = {
            "user_id": cust["id"],
            "car_id": car["id"],
            "showroom_id": sr["id"],
            "scheduled_date": sched_date,
            "status": st,
            "notes": note,
            "assigned_staff_id": staff["id"] if staff else None,
            "created_at": days_ago(abs(d_offset) + 2)
        }
        try:
            supabase.table("test_drives").insert(td_data).execute()
            added += 1
            print(f"  + Test drive: {cust['full_name']} -> {car['make']} {car['model']} [{st}]")
        except Exception as e:
            print(f"  ! Error inserting test drive: {e}")

    print(f"✅ Test drives seeded: {added} new records.")

def seed_car_qa():
    print("\n❓ --- SEEDING CAR Q&A ---")
    profiles = supabase.table("profiles").select("id, full_name, role").execute().data
    customers = [p for p in profiles if p["role"] == "user"]
    managers = [p for p in profiles if p["role"] in ("manager", "owner")]
    cars = supabase.table("cars").select("id, make, model").limit(30).execute().data

    if not customers or not cars:
        print("❌ Cannot seed car Q&A: Missing customers or cars.")
        return

    existing_qa = supabase.table("car_qa").select("id", count="exact").execute()
    if existing_qa.count and existing_qa.count > 15:
        print(f"  = Car Q&A already has {existing_qa.count} records. Skipping.")
        return

    qa_list = [
        (
            "Dòng xe này mức tiêu hao nhiên liệu thực tế trong điều kiện đô thị giờ cao điểm là bao nhiêu lít/100km?",
            "Chào bạn, theo kiểm nghiệm thực tế từ showroom và các khách hàng trải nghiệm, xe tiêu thụ khoảng 8.5L - 9.2L/100km trong nội đô kẹt xe và chỉ khoảng 6.2L/100km trên đường trường cao tốc bạn nhé."
        ),
        (
            "Mẫu xe này có sẵn xe giao ngay tại Showroom Hà Nội hay phải chờ đặt cọc nhập khẩu?",
            "Hiện tại Showroom Cầu Giấy đang có sẵn 02 xe màu Trắng ngọc trai và Đen ánh kim đủ hồ sơ bấm biển trong ngày. Mời quý khách ghé trải nghiệm trực tiếp!"
        ),
        (
            "Chính sách bảo hành chính hãng của xe này tại Việt Nam là mấy năm?",
            "AutoMatch cung cấp gói bảo hành chính hãng 5 năm hoặc 150.000 km tùy điều kiện nào đến trước, kèm gói cứu hộ 24/7 miễn phí toàn quốc năm đầu tiên."
        ),
        (
            "Bên showroom có hỗ trợ gói vay trả góp ngân hàng 80% giá trị xe không, thủ tục duyệt hồ sơ mất bao lâu?",
            "Showroom liên kết với các ngân hàng lớn (Vietcombank, Techcombank, VPBank, Shinhan) hỗ trợ vay tối đa 80-85% với lãi suất ưu đãi cố định năm đầu. Hồ sơ phê duyệt nhanh trong vòng 4-8 giờ làm việc."
        ),
        (
            "Hệ thống an toàn chủ động ADAS trên xe có trang bị tính năng phanh khẩn cấp tự động và ga tự động thích ứng Stop & Go không?",
            "Có đầy đủ bạn nhé. Xe được trang bị gói an toàn chủ động cao cấp nhất với Radar sóng milimet và Camera kép hỗ trợ Adaptive Cruise Control Stop & Go và hỗ trợ giữ làn thông minh."
        ),
        (
            "Tôi ở tỉnh xa thì bên showroom có hỗ trợ vận chuyển xe bàn giao tận nhà (xe lồng cứu hộ) không?",
            "Dạ có ạ. AutoMatch có dịch vụ vận chuyển xe lồng chuyên dụng bàn giao tận cửa nhà khách hàng trên toàn bộ 63 tỉnh thành, kèm hoa chúc mừng và lễ bàn giao chu đáo."
        ),
        (
            "Động cơ Hybrid của phiên bản này có cần cắm sạc tại nhà không hay tự sạc khi vận hành?",
            "Đây là hệ truyền động Hybrid tự sạc thông minh (HEV). Xe tự thu hồi động năng khi phanh và tận dụng động cơ xăng để sạc pin, quý khách sử dụng bình thường như xe xăng truyền thống mà không cần trụ sạc."
        ),
        (
            "Phí lăn bánh trọn gói mẫu này tại khu vực TP. Hồ Chí Minh hiện tại khoảng bao nhiêu?",
            None  # Pending answer
        ),
        (
            "Xe này có trang bị tính năng sấy sưởi và thông gió cho cả hai hàng ghế không?",
            None  # Pending answer
        ),
        (
            "Nếu đặt cọc trực tuyến 10% giữ xe thì trong bao lâu tôi có thể nhận lại cọc nếu không ưng ý khi lái thử?",
            "Chính sách bảo vệ người mua của AutoMatch cho phép quý khách bảo lưu hoặc rút 100% tiền đặt cọc trong vòng 48 giờ sau khi lái thử nếu thông số thực tế không đúng cam kết."
        )
    ]

    added = 0
    for idx, (q, a) in enumerate(qa_list):
        cust = customers[idx % len(customers)]
        car = cars[idx % len(cars)]
        mgr = managers[idx % len(managers)] if managers and a else None

        qa_data = {
            "car_id": car["id"],
            "user_id": cust["id"],
            "question": q,
            "answer": a,
            "answered_by": mgr["id"] if mgr else None,
            "created_at": days_ago(idx * 2 + 1),
            "updated_at": days_ago(idx * 2) if a else days_ago(idx * 2 + 1)
        }
        try:
            supabase.table("car_qa").insert(qa_data).execute()
            added += 1
            print(f"  + Q&A: {cust['full_name']} -> {car['make']} {car['model']} ({'Answered' if a else 'Pending'})")
        except Exception as e:
            print(f"  ! Error inserting Q&A: {e}")

    print(f"✅ Car Q&A seeded: {added} new records.")

def seed_notifications():
    print("\n🔔 --- SEEDING NOTIFICATIONS ---")
    profiles = supabase.table("profiles").select("id, full_name, email").execute().data
    if not profiles:
        print("❌ Cannot seed notifications: No profiles.")
        return

    existing_notif = supabase.table("notifications").select("id", count="exact").execute()
    if existing_notif.count and existing_notif.count > 15:
        print(f"  = Notifications already have {existing_notif.count} records. Skipping.")
        return

    notif_templates = [
        ("order", "Xác nhận đặt cọc thành công", "Khoản cọc 10% cho hợp đồng mua xe của bạn đã được ghi nhận an toàn qua cổng thanh toán ZaloPay.", False),
        ("order", "Xe của bạn đang được kiểm tra PDI", "Đội ngũ kỹ thuật viên đang tiến hành kiểm tra 120 hạng mục tiêu chuẩn trước khi bàn giao xe.", True),
        ("order", "Sẵn sàng bàn giao xe tại Showroom", "Hồ sơ bấm biển và giấy chứng nhận đăng kiểm đã sẵn sàng. Trân trọng kính mời quý khách đến nhận xe.", False),
        ("test_drive", "Xác nhận lịch hẹn lái thử cuối tuần", "Lịch lái thử tại Showroom AutoMatch Cầu Giấy lúc 10:00 sáng đã được xếp lịch cho chuyên viên tư vấn.", True),
        ("test_drive", "Cảm ơn bạn đã tham gia lái thử", "Buổi lái thử xe đã hoàn tất. Bạn nhận được ưu đãi voucher cọc 5.000.000đ có hiệu lực trong 7 ngày.", True),
        ("promotion", "Ưu Đãi Đặc Biệt Mùa Xuân 2026", "Áp dụng mã TET2026 để nhận ngay 25.000.000đ khi đặt cọc bất kỳ mẫu xe SUV sang trọng.", False),
        ("promotion", "Flash Deal 48H: Giảm 8% xe Hybrid", "Cơ hội sở hữu các dòng xe tiết kiệm nhiên liệu với mức chiết khấu chưa từng có.", False),
        ("system", "Cập nhật ứng dụng phiên bản 2.5", "Trải nghiệm tính năng tìm kiếm xe bằng AI thông minh thế hệ mới, so sánh chi phí vận hành chi tiết.", True),
        ("system", "Bảo trì cổng thanh toán trực tuyến", "Hệ thống sẽ bảo trì đối soát thanh toán ngân hàng định kỳ từ 02:00 đến 04:00 ngày Chủ Nhật.", True),
    ]

    added = 0
    for idx, (ntype, title, content, is_read) in enumerate(notif_templates):
        # Distribute across profiles
        user = profiles[idx % len(profiles)]
        notif_data = {
            "user_id": user["id"],
            "title": title,
            "content": content,
            "type": ntype,
            "is_read": is_read,
            "created_at": days_ago(idx * 2, random.randint(1, 8))
        }
        try:
            supabase.table("notifications").insert(notif_data).execute()
            added += 1
        except Exception as e:
            print(f"  ! Error inserting notification: {e}")

    print(f"✅ Notifications seeded: {added} new records.")

def seed_user_interactions():
    print("\n❤️ --- SEEDING USER INTERACTIONS (Wishlist, Cart, Viewed, Search, Chat) ---")
    profiles = supabase.table("profiles").select("id, full_name, email").eq("role", "user").execute().data
    cars = supabase.table("cars").select("id, make, model").limit(40).execute().data

    if not profiles or not cars:
        print("❌ Cannot seed interactions: Missing users or cars.")
        return

    # 1. Saved Cars (Wishlist)
    existing_saved = supabase.table("saved_cars").select("id", count="exact").execute()
    if not existing_saved.count or existing_saved.count == 0:
        saved_added = 0
        for i, user in enumerate(profiles):
            # Each user saves 2-3 cars
            sample_cars = random.sample(cars, min(3, len(cars)))
            for c in sample_cars:
                try:
                    supabase.table("saved_cars").insert({
                        "user_id": user["id"],
                        "car_id": c["id"],
                        "created_at": days_ago(random.randint(1, 20))
                    }).execute()
                    saved_added += 1
                except Exception:
                    pass
        print(f"  + Seeded {saved_added} saved cars.")
    else:
        print(f"  = Saved cars already has {existing_saved.count} records.")

    # 2. Cart Items
    existing_cart = supabase.table("cart_items").select("id", count="exact").execute()
    if not existing_cart.count or existing_cart.count == 0:
        cart_added = 0
        for user in profiles[:5]:
            chosen_car = random.choice(cars)
            try:
                supabase.table("cart_items").insert({
                    "user_id": user["id"],
                    "car_id": chosen_car["id"],
                    "quantity": 1,
                    "created_at": days_ago(random.randint(0, 3))
                }).execute()
                cart_added += 1
            except Exception:
                pass
        print(f"  + Seeded {cart_added} cart items.")
    else:
        print(f"  = Cart items already has {existing_cart.count} records.")

    # 3. Viewed Cars
    viewed_added = 0
    for user in profiles:
        sample_cars = random.sample(cars, min(4, len(cars)))
        for c in sample_cars:
            try:
                supabase.table("viewed_cars").insert({
                    "user_id": user["id"],
                    "car_id": c["id"],
                    "viewed_at": days_ago(random.randint(0, 14), random.randint(1, 23))
                }).execute()
                viewed_added += 1
            except Exception:
                pass
    print(f"  + Seeded {viewed_added} viewed cars.")

    # 4. Search History
    popular_queries = [
        "xe 7 cho gam cao gia re",
        "suv gia dinh duoi 1 ty",
        "mercedes glc 300 4matic",
        "xe dien pin chay tren 400km",
        "sedan hang b tiet kiem xang",
        "ban tai 2 cau may dau di phuot",
        "xe hybrid gia tot nhat",
        "bmw serie 3 cu luot",
        "porsche macan mau trang",
        "xe 5 cho co cop rong"
    ]
    search_added = 0
    for q in popular_queries:
        user = random.choice(profiles)
        try:
            supabase.table("search_history").insert({
                "user_id": user["id"],
                "query_text": q,
                "created_at": days_ago(random.randint(0, 10), random.randint(1, 20))
            }).execute()
            search_added += 1
        except Exception:
            pass
    print(f"  + Seeded {search_added} search history items.")

    # 5. Chat Sessions
    chat_dialogues = [
        [
            ("user", "Tôi đang tìm một chiếc xe SUV 7 chỗ cho gia đình 5 người lớn và 2 trẻ em, tầm ngân sách khoảng 1.2 đến 1.5 tỷ đồng."),
            ("assistant", "Chào bạn! Trong tầm giá 1.2 - 1.5 tỷ, có 3 ứng cử viên hàng đầu rất phù hợp với nhu cầu gia đình bạn:\n1. Kia Sorento / Hyundai Santa Fe: Thiết kế hiện đại, hàng ghế thứ 3 rộng rãi và nhiều tính năng an toàn ADAS.\n2. Ford Everest: Khung gầm rời đầm chắc, khả năng cách âm đỉnh cao và leo lề hoặc đi dã ngoại rất tốt.\nBạn ưu tiên xe êm ái đô thị hay xe khỏe để đi đường trường thường xuyên?"),
            ("user", "Gia đình mình chủ yếu đi lại trong phố và thỉnh thoảng cuối tuần về quê cách 100km, mong muốn xe cách âm tốt và êm."),
            ("assistant", "Với nhu cầu đó, Ford Everest phiên bản Titanium hoặc Kia Sorento Signature máy dầu sẽ là sự lựa chọn hoàn hảo nhất về độ cách âm và êm ái. Hiện tại AutoMatch có sẵn cả hai mẫu tại showroom Cầu Giấy và Landmark Quận 7, bạn có muốn đặt lịch lái thử trực tiếp vào cuối tuần này không?")
        ],
        [
            ("user", "Chính sách mua xe trả góp của showroom như thế nào vậy? Tôi muốn vay 70% giá trị xe."),
            ("assistant", "Chào bạn, AutoMatch hợp tác độc quyền với các ngân hàng lớn với gói hỗ trợ vay lên đến 80-85% giá trị hợp đồng:\n- Thời hạn vay linh hoạt: từ 1 đến 8 năm.\n- Lãi suất ưu đãi từ 6.99%/năm cố định 12 tháng đầu.\n- Thủ tục đơn giản: Chỉ cần CCCD gắn chip và sao kê thu nhập, duyệt hồ sơ online trong 4h.\nBạn đang nhắm tới dòng xe nào để mình lập bảng tính chi tiết số tiền gốc và lãi trả hàng tháng giúp bạn nhé?")
        ],
        [
            ("user", "So sánh giúp mình sự khác nhau giữa xe Hybrid tự sạc (HEV) và Plug-in Hybrid (PHEV)?"),
            ("assistant", "Dạ đây là điểm khác biệt cốt lõi giữa hai công nghệ:\n1. HEV (Hybrid tự sạc): Không cần cắm điện ngoài. Pin tự sạc lại khi xe phanh hoặc từ động cơ xăng. Phù hợp tuyệt đối với gia đình ở chung cư hoặc không có chỗ lắp trụ sạc riêng.\n2. PHEV (Plug-in Hybrid): Pin dung lượng lớn hơn nhiều, có cổng sạc ngoài. Có thể chạy hoàn toàn bằng điện nguyên chất từ 50-80km mỗi ngày như xe điện thuần túy, khi hết pin sẽ tự động chuyển sang máy xăng.\nNếu bạn ở nhà phố có garage riêng, PHEV là giải pháp tối ưu chi phí nhiên liệu vượt trội.")
        ]
    ]

    chat_added = 0
    for dialogue in chat_dialogues:
        session_id = str(uuid.uuid4())
        user = random.choice(profiles)
        base_time = random.randint(1, 7)
        for step_idx, (role, text) in enumerate(dialogue):
            msg_time = days_ago(base_time, 24 - step_idx * 2)
            try:
                supabase.table("chat_sessions").insert({
                    "session_id": session_id,
                    "user_id": user["id"],
                    "role": role,
                    "content": text,
                    "created_at": msg_time
                }).execute()
                chat_added += 1
            except Exception as e:
                print(f"  ! Error inserting chat message: {e}")
    print(f"✅ Seeded {chat_added} chat session messages across dialogues.")

def print_final_summary():
    print("\n================ FINAL DATABASE ROW COUNTS ================")
    tables = [
        'profiles', 'showrooms', 'vouchers', 'cars', 'saved_cars',
        'test_drives', 'orders', 'order_items', 'reviews', 'car_qa',
        'viewed_cars', 'search_history', 'chat_sessions', 'notifications', 'cart_items'
    ]
    for t in tables:
        try:
            res = supabase.table(t).select('id', count='exact').limit(1).execute()
            print(f"  📊 {t:16}: {res.count} rows")
        except Exception as e:
            print(f"  ⚠️ {t:16}: ERROR {e}")
    print("===========================================================\n")

def main():
    print("🚀 Starting AutoMatch Database Comprehensive Seeding...")
    seed_showrooms()
    seed_vouchers()
    seed_users()
    seed_orders_and_items()
    seed_test_drives()
    seed_car_qa()
    seed_notifications()
    seed_user_interactions()
    print_final_summary()
    print("✨ Seeding completed successfully!")

if __name__ == "__main__":
    main()

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing environment variables. Please check .env file.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("Đang thống kê tiến độ trên Supabase...\n")
    
    try:
        # 1. Thống kê Reviews Embeddings
        pending_resp = supabase.table('reviews').select('id', count='exact').is_('embedding', 'null').limit(1).execute()
        pending_count = pending_resp.count if pending_resp.count is not None else 0
        
        done_resp = supabase.table('reviews').select('id', count='exact').not_.is_('embedding', 'null').limit(1).execute()
        done_count = done_resp.count if done_resp.count is not None else 0
        
        total = pending_count + done_count
        percent = (done_count / total * 100) if total > 0 else 0
        
        print("=== 1. TIẾN ĐỘ EMBEDDINGS (REVIEWS) ===")
        print(f"✅ Đã xử lý xong: {done_count:,} reviews ({percent:.2f}%)")
        print(f"⏳ Đang chờ (NULL): {pending_count:,} reviews")
        print(f"📊 Tổng cộng:      {total:,} reviews\n")

        # 2. Thống kê Car Images
        car_pending_resp = supabase.table('cars').select('id', count='exact').is_('image_url', 'null').limit(1).execute()
        car_pending_count = car_pending_resp.count if car_pending_resp.count is not None else 0

        car_done_resp = supabase.table('cars').select('id', count='exact').not_.is_('image_url', 'null').limit(1).execute()
        car_done_count = car_done_resp.count if car_done_resp.count is not None else 0

        car_total = car_pending_count + car_done_count
        car_percent = (car_done_count / car_total * 100) if car_total > 0 else 0

        print("=== 2. TIẾN ĐỘ HÌNH ẢNH XE (CARS) ===")
        print(f"✅ Đã có ảnh:     {car_done_count:,} xe ({car_percent:.2f}%)")
        print(f"⏳ Đang chờ (NULL): {car_pending_count:,} xe")
        print(f"📊 Tổng cộng:      {car_total:,} xe")
        
    except Exception as e:
        print(f"Lỗi khi truy vấn Supabase: {e}")

if __name__ == "__main__":
    main()

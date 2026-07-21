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
    print("Đang thống kê tiến độ Embedding trên Supabase...\n")
    
    try:
        # Đếm số lượng chưa có embedding
        pending_resp = supabase.table('reviews').select('id', count='exact').is_('embedding', 'null').limit(1).execute()
        pending_count = pending_resp.count if pending_resp.count is not None else 0
        
        # Đếm số lượng đã có embedding
        done_resp = supabase.table('reviews').select('id', count='exact').not_.is_('embedding', 'null').limit(1).execute()
        done_count = done_resp.count if done_resp.count is not None else 0
        
        total = pending_count + done_count
        
        if total == 0:
            print("Không có dữ liệu trong bảng reviews.")
            return
            
        percent = (done_count / total) * 100
        
        print("=== THỐNG KÊ TIẾN ĐỘ EMBEDDING ===")
        print(f"✅ Đã xử lý xong: {done_count:,} reviews ({percent:.2f}%)")
        print(f"⏳ Đang chờ (NULL): {pending_count:,} reviews")
        print(f"📊 Tổng cộng:      {total:,} reviews")
        
    except Exception as e:
        print(f"Lỗi khi truy vấn Supabase: {e}")

if __name__ == "__main__":
    main()

import os
import sqlite3
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables from data_pipeline or root
for p in [Path(__file__).parent, Path(__file__).parent.parent, Path(__file__).parent.parent.parent]:
    env_file = p / ".env"
    if env_file.exists():
        load_dotenv(env_file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables (SUPABASE_URL, SUPABASE_KEY). Please check .env file.")

CACHE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "car_images_cache.db")


def cleanup_data(reset_all: bool = False):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("=" * 60)
    print("🧹 BẮT ĐẦU DỌN DẸP DỮ LIỆU HÌNH ẢNH XE")
    print(f"• Chế độ: {'XÓA TOÀN BỘ (RESET ALL)' if reset_all else 'CHỈ XÓA CÁC ẢNH LỖI (REGCHECK/FANCYBOX)'}")
    print("=" * 60)

    # 1. Đọc danh sách ID bị ảnh hưởng từ SQLite Cache
    broken_ids = []
    if os.path.exists(CACHE_DB_PATH):
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                cursor = conn.cursor()
                if reset_all:
                    cursor.execute("SELECT id FROM car_images")
                else:
                    cursor.execute(
                        "SELECT id FROM car_images WHERE image_url LIKE '%regcheck%' OR image_url LIKE '%fancybox%'"
                    )
                broken_ids = [row[0] for row in cursor.fetchall()]
        except Exception as e:
            print(f"Lỗi khi đọc file SQLite cache: {e}")

    print(f"\n📦 Tìm thấy {len(broken_ids)} bản ghi cần reset trong Cache SQLite.")

    # 2. Truy vấn thêm từ Supabase để đảm bảo không sót ID nào
    print("🔍 Đang kiểm tra bảng 'cars' trên Supabase...")
    try:
        if reset_all:
            supa_resp = supabase.table('cars').select('id').not_.is_('image_url', 'null').execute()
        else:
            supa_resp = supabase.table('cars').select('id').ilike('image_url', '%regcheck%').execute()
        
        supa_ids = [item['id'] for item in supa_resp.data]
        all_target_ids = list(set(broken_ids + supa_ids))
        print(f"⚡ Tổng số xe trên Supabase cần gỡ bỏ ảnh: {len(all_target_ids)} xe.")
    except Exception as e:
        print(f"Lỗi khi truy vấn Supabase: {e}")
        all_target_ids = broken_ids

    # 3. Cập nhật Supabase: Set image_url = NULL
    if all_target_ids:
        print(f"\n⏳ Đang cập nhật image_url = NULL cho {len(all_target_ids)} xe trên Supabase...")
        batch_size = 50
        updated_count = 0
        for i in range(0, len(all_target_ids), batch_size):
            chunk = all_target_ids[i:i + batch_size]
            try:
                supabase.table('cars').update({"image_url": None}).in_('id', chunk).execute()
                updated_count += len(chunk)
                print(f"  -> Đã reset {updated_count}/{len(all_target_ids)} xe...")
            except Exception as e:
                print(f"Lỗi khi reset batch {i} trên Supabase: {e}")

    # 4. Dọn dẹp Cache SQLite
    if os.path.exists(CACHE_DB_PATH):
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                cursor = conn.cursor()
                if reset_all:
                    cursor.execute("DELETE FROM car_images")
                    print("🧹 Đã xóa toàn bộ bản ghi trong car_images_cache.db.")
                elif all_target_ids:
                    del_batch_size = 500
                    for i in range(0, len(all_target_ids), del_batch_size):
                        del_chunk = all_target_ids[i:i + del_batch_size]
                        placeholders = ','.join('?' for _ in del_chunk)
                        cursor.execute(f"DELETE FROM car_images WHERE id IN ({placeholders})", del_chunk)
                    conn.commit()
                    print(f"🧹 Đã xóa {len(all_target_ids)} bản ghi lỗi khỏi car_images_cache.db.")

                cursor.execute("VACUUM")
                print("✨ Đã tối ưu hóa file SQLite (VACUUM).")
        except Exception as e:
            print(f"Lỗi khi dọn dẹp file cache SQLite: {e}")

    print("\n" + "=" * 60)
    print("✅ HOÀN TẤT DỌN DẸP!")
    print("Database Supabase và Cache SQLite đã sạch sẽ.")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cleanup car image URLs from Supabase and SQLite cache.")
    parser.add_argument("--all", action="store_true", help="Reset toàn bộ ảnh xe về NULL và xóa toàn bộ SQLite cache")
    args = parser.parse_args()

    cleanup_data(reset_all=args.all)

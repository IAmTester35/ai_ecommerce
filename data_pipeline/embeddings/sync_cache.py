import os
import json
import sqlite3
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
    raise ValueError("Missing Supabase environment variables. Please check .env file.")

CACHE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings_cache.db")


def main():
    if not os.path.exists(CACHE_DB_PATH):
        print(f"File cache '{CACHE_DB_PATH}' không tồn tại.")
        return

    conn = sqlite3.connect(CACHE_DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='review_embeddings'")
    if not cursor.fetchone():
        print("Bảng 'review_embeddings' không tồn tại trong cache.")
        conn.close()
        return

    cursor.execute("SELECT id, embedding FROM review_embeddings")
    cached_records = cursor.fetchall()

    if not cached_records:
        print("File cache rỗng. Không có dữ liệu để kiểm tra.")
        conn.close()
        return

    print(f"Tổng số bản ghi trong Cache SQLite: {len(cached_records)}")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    cached_dict = {row[0]: json.loads(row[1]) for row in cached_records}
    all_ids = list(cached_dict.keys())

    synced_count = 0
    already_on_supabase_count = 0
    ids_to_delete = []

    batch_size = 200
    for i in range(0, len(all_ids), batch_size):
        chunk_ids = all_ids[i:i + batch_size]
        
        try:
            response = supabase.table('reviews').select('id, embedding').in_('id', chunk_ids).execute()
            db_records = {item['id']: item.get('embedding') for item in response.data}
        except Exception as e:
            print(f"Lỗi khi kiểm tra Supabase cho batch {i}: {e}")
            continue

        to_upsert = []
        for r_id in chunk_ids:
            if r_id in db_records:
                supa_emb = db_records[r_id]
                if supa_emb is None:
                    to_upsert.append({"id": r_id, "embedding": cached_dict[r_id]})
                else:
                    already_on_supabase_count += 1
                    ids_to_delete.append(r_id)

        if to_upsert:
            try:
                supabase.table('reviews').upsert(to_upsert).execute()
                synced_count += len(to_upsert)
                ids_to_delete.extend([item['id'] for item in to_upsert])
                print(f"Đã đồng bộ {len(to_upsert)} bản ghi từ cache lên Supabase.")
            except Exception as e:
                print(f"Lỗi khi upsert batch từ cache lên Supabase: {e}")

    if ids_to_delete:
        print(f"Đang xóa {len(ids_to_delete)} bản ghi đã đồng bộ khỏi Cache SQLite...")
        del_batch_size = 500
        for i in range(0, len(ids_to_delete), del_batch_size):
            del_chunk = ids_to_delete[i:i + del_batch_size]
            placeholders = ','.join('?' for _ in del_chunk)
            cursor.execute(f"DELETE FROM review_embeddings WHERE id IN ({placeholders})", del_chunk)
        conn.commit()

        cursor.execute("VACUUM")
        conn.close()
        print("Đã giải phóng dung lượng file cache SQLite (VACUUM).")
    else:
        conn.close()

    print("\n--- Báo Cáo Đồng Bộ & Dọn Dẹp Cache ---")
    print(f"📦 Tổng số kiểm tra: {len(cached_records)}")
    print(f"⚡ Đã đồng bộ lên Supabase (chưa có trước đó): {synced_count}")
    print(f"✅ Đã có sẵn trên Supabase: {already_on_supabase_count}")
    print(f"🧹 Đã xóa khỏi Cache SQLite: {len(ids_to_delete)}")


if __name__ == "__main__":
    main()

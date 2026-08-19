import os
import time
import threading
import queue
import json
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai

# Load env variables from data_pipeline or root
for p in [Path(__file__).parent, Path(__file__).parent.parent, Path(__file__).parent.parent.parent]:
    env_file = p / ".env"
    if env_file.exists():
        load_dotenv(env_file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables. Please check .env file.")

# Initialize API Keys
keys = [
    os.environ.get("GEMINI_API_KEY_1"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3"),
    os.environ.get("GEMINI_API_KEY_4"),
    os.environ.get("GEMINI_API_KEY"),
]
keys = [k for k in keys if k]

if not keys:
    raise ValueError("No Gemini API keys found. Please set GEMINI_API_KEY_1 or GEMINI_API_KEY in .env.")

# Global variables for Producer-Consumer
data_queue = queue.Queue(maxsize=1000)
stop_event = threading.Event()
counters = {'processed': 0, 'failed': 0}
counter_lock = threading.Lock()
backup_lock = threading.Lock()
db_lock = threading.Lock()

CACHE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings_cache.db")
FAILED_BACKUP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "failed_embeddings_backup.jsonl")


def init_cache_db():
    with db_lock:
        with sqlite3.connect(CACHE_DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS review_embeddings (
                    id TEXT PRIMARY KEY,
                    embedding TEXT NOT NULL
                )
            """)


def get_cached_embedding(review_id: str) -> list[float] | None:
    with db_lock:
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT embedding FROM review_embeddings WHERE id = ?", (review_id,))
                row = cursor.fetchone()
                if row:
                    return json.loads(row[0])
        except Exception:
            pass
    return None


def save_cached_embedding(review_id: str, embedding: list[float]):
    with db_lock:
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO review_embeddings (id, embedding) VALUES (?, ?)",
                    (review_id, json.dumps(embedding))
                )
        except Exception as e:
            print(f"Lỗi khi lưu cache SQLite: {e}")


def save_failed_batch(batch: list):
    with backup_lock:
        with open(FAILED_BACKUP_PATH, "a", encoding="utf-8") as f:
            for item in batch:
                item_id = item.get("id")
                embedding = item.get("embedding")
                if item_id and embedding:
                    f.write(json.dumps({"id": item_id, "embedding": embedding}) + "\n")
            f.flush()


failed_record_ids = set()
in_flight_ids = set()


def get_embedding(client: genai.Client, text: str, thread_id: int) -> list[float]:
    """Generate 768-dimensional embedding"""
    max_retries = 3
    for attempt in range(max_retries):
        if stop_event.is_set():
            raise Exception("STOP_EVENT_SET")
            
        try:
            response = client.models.embed_content(
                model='gemini-embedding-2',
                contents=text,
                config={'output_dimensionality': 768}
            )
            return response.embeddings[0].values
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"\n[Luồng {thread_id}] Rate limit hit (429). Sleeping for 60s (Attempt {attempt+1}/{max_retries})...")
                for _ in range(60):
                    if stop_event.is_set():
                        raise Exception("STOP_EVENT_SET")
                    time.sleep(1)
            else:
                print(f"\n[Luồng {thread_id}] Error generating embedding: {e}")
                time.sleep(5)
    
    raise Exception("API_QUOTA_EXHAUSTED")


def upsert_batch(supabase_local: Client, batch: list, thread_id: int):
    dedup_dict = {item.get('id'): item for item in batch}
    unique_batch = list(dedup_dict.values())

    max_upsert_retries = 3
    for attempt in range(max_upsert_retries):
        try:
            supabase_local.table('reviews').upsert(unique_batch).execute()
            with counter_lock:
                counters['processed'] += len(unique_batch)
                for item in unique_batch:
                    in_flight_ids.discard(item.get('id'))
            batch_ids = [str(item.get('id', 'Unknown')) for item in unique_batch]
            print(f"[Luồng {thread_id}] Đã upsert {len(unique_batch)} dòng. IDs: {', '.join(batch_ids[:5])}{'...' if len(batch_ids) > 5 else ''}")
            return
        except Exception as e:
            if attempt < max_upsert_retries - 1:
                print(f"\n[Luồng {thread_id}] Thử upsert lần {attempt+1}/{max_upsert_retries} thất bại ({e}). Thử lại sau 3s...")
                time.sleep(3)
            else:
                print(f"\n[Luồng {thread_id}] Error bulk upserting sau {max_upsert_retries} lần thử: {e}")
                save_failed_batch(unique_batch)
                with counter_lock:
                    for item in unique_batch:
                        item_id = item.get('id')
                        failed_record_ids.add(item_id)
                        in_flight_ids.discard(item_id)
                    counters['failed'] += len(unique_batch)


def worker_thread(thread_id: int, api_key: str):
    supabase_local: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    gemini_client = genai.Client(api_key=api_key)
    batch_upsert = []
    
    while not stop_event.is_set():
        try:
            review = data_queue.get(timeout=2)
        except queue.Empty:
            if batch_upsert:
                upsert_batch(supabase_local, batch_upsert, thread_id)
                batch_upsert = []
            continue

        if review is None:
            data_queue.task_done()
            break

        review_id = review.get('id')
        car_data = review.get('cars', {})
        
        if not car_data:
            rich_text = f"Review: {review['comment']}"
        else:
            year = car_data.get('year', '')
            make = car_data.get('make', '')
            model = car_data.get('model', '')
            hp = car_data.get('engine_hp')
            rating = review.get('rating')
            
            rich_text = f"Car: {year} {make} {model}. "
            if hp: rich_text += f"Engine Power: {hp} HP. "
            if rating: rich_text += f"Rating: {rating}/5. "
            rich_text += f"Review: {review['comment']}"

        cached_emb = get_cached_embedding(review_id)
        if cached_emb:
            embedding = cached_emb
        else:
            try:
                print(f"[Luồng {thread_id}] Đang lấy embedding từ API cho review ID: {review_id}")
                embedding = get_embedding(gemini_client, rich_text, thread_id)
                save_cached_embedding(review_id, embedding)
                time.sleep(1)
            except Exception as e:
                err_msg = str(e)
                if err_msg == "STOP_EVENT_SET":
                    with counter_lock:
                        in_flight_ids.discard(review_id)
                    data_queue.task_done()
                    break
                elif err_msg == "API_QUOTA_EXHAUSTED":
                    print(f"\n[Luồng {thread_id}] Google API lỗi 3 lần liên tiếp (Hết Quota). Dừng luồng.")
                    data_queue.put(review)
                    data_queue.task_done()
                    break
                else:
                    print(f"\n[Luồng {thread_id}] Unhandled error for review ID {review_id}: {e}")
                    with counter_lock:
                        failed_record_ids.add(review_id)
                        in_flight_ids.discard(review_id)
                        counters['failed'] += 1
                    data_queue.task_done()
                    continue
        
        row_to_upsert = review.copy()
        row_to_upsert.pop('cars', None)
        row_to_upsert['embedding'] = embedding
        batch_upsert.append(row_to_upsert)
        
        if len(batch_upsert) >= 50:
            upsert_batch(supabase_local, batch_upsert, thread_id)
            batch_upsert = []
            
        data_queue.task_done()

    if batch_upsert:
        upsert_batch(supabase_local, batch_upsert, thread_id)


def main():
    init_cache_db()
    print(f"Starting embedding update process with {len(keys)} threads (Producer-Consumer)...")
    
    threads = []
    for i, key in enumerate(keys):
        t = threading.Thread(target=worker_thread, args=(i+1, key))
        t.start()
        threads.append(t)
        
    supabase_main: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        while not stop_event.is_set():
            if not any(t.is_alive() for t in threads):
                print("\nTất cả các API keys đã hết Quota hoặc gặp lỗi. Dừng script.")
                break
                
            if data_queue.qsize() > 500:
                time.sleep(2)
                continue

            print(f"[Producer] Đang truy vấn Supabase để lấy tối đa 300 reviews trống embedding...")
            try:
                response = supabase_main.table('reviews').select('*, cars(year, make, model, engine_hp)').is_('embedding', 'null').limit(300).execute()
                reviews = response.data
            except Exception as e:
                print(f"Error fetching reviews: {e}")
                time.sleep(5)
                continue
                
            if not reviews:
                print(f"\nKhông còn reviews nào cần xử lý. Hoàn tất!")
                break

            added = 0
            for r in reviews:
                r_id = r.get('id')
                with counter_lock:
                    if r_id in failed_record_ids or r_id in in_flight_ids:
                        continue
                    in_flight_ids.add(r_id)
                data_queue.put(r)
                added += 1
            
            if added == 0:
                with counter_lock:
                    all_failed = all(r.get('id') in failed_record_ids for r in reviews)
                
                if all_failed:
                    print("\n[Producer] Chỉ lấy được các reviews đã gặp lỗi nghiêm trọng trước đó. Dừng.")
                    break
                else:
                    time.sleep(3)
                    continue

            print(f"\n[Producer] Fetch được {len(reviews)} dòng. Đã thêm {added} reviews mới vào Queue.")
            
            while data_queue.qsize() > 50 and not stop_event.is_set() and any(t.is_alive() for t in threads):
                time.sleep(2)

    except KeyboardInterrupt:
        print("\n\nNhận lệnh dừng từ người dùng. Đang chờ lưu dữ liệu...")
        stop_event.set()

    for t in threads:
        if t.is_alive():
            data_queue.put(None)

    for t in threads:
        t.join()
        
    print(f"\n--- Báo Cáo Cuối Cùng ---")
    print(f"✅ Upsert thành công: {counters['processed']} dòng.")
    print(f"❌ Lỗi / Bỏ qua: {counters['failed']} dòng.")
    print("Đã dừng an toàn!")


if __name__ == "__main__":
    main()

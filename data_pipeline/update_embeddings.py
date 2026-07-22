import os
import time
import threading
import queue
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai

# Load env variables
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables. Please check .env file.")

# Initialize API Keys
keys = [
    os.environ.get("GEMINI_API_KEY_1"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3")
]
keys = [k for k in keys if k]

if not keys:
    raise ValueError("No Gemini API keys found. Please set GEMINI_API_KEY_1, etc.")

# Global variables for Producer-Consumer
data_queue = queue.Queue(maxsize=1000)
stop_event = threading.Event()
counters = {'processed': 0, 'failed': 0}
counter_lock = threading.Lock()

# Lưu ID các dòng bị lỗi (tránh lặp vô tận khi fetch data mới)
failed_record_ids = set()

def get_embedding(client: genai.Client, text: str, thread_id: int) -> list[float]:
    """Generate 768-dimensional embedding"""
    max_retries = 5
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
                # Sleep từng giây để có thể thoát nhanh nếu nhận lệnh dừng
                for _ in range(60):
                    if stop_event.is_set():
                        raise Exception("STOP_EVENT_SET")
                    time.sleep(1)
            else:
                print(f"\n[Luồng {thread_id}] Error generating embedding: {e}")
                time.sleep(5)
    
    raise Exception("API_QUOTA_EXHAUSTED")

def upsert_batch(supabase_local: Client, batch: list, thread_id: int):
    try:
        supabase_local.table('reviews').upsert(batch).execute()
        with counter_lock:
            counters['processed'] += len(batch)
        batch_ids = [str(item.get('id', 'Unknown')) for item in batch]
        print(f"[Luồng {thread_id}] Đã upsert {len(batch)} dòng. IDs: {', '.join(batch_ids[:5])}{'...' if len(batch_ids) > 5 else ''}")
    except Exception as e:
        print(f"\n[Luồng {thread_id}] Error bulk upserting: {e}")
        with counter_lock:
            for item in batch:
                failed_record_ids.add(item.get('id', hash(str(item))))
            counters['failed'] += len(batch)

def worker_thread(thread_id: int, api_key: str):
    # Khởi tạo Supabase client riêng cho luồng (Thread-Safety)
    supabase_local: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    gemini_client = genai.Client(api_key=api_key)
    
    batch_upsert = []
    
    while not stop_event.is_set():
        try:
            # Lấy data từ queue, dùng timeout để luồng không bị kẹt khi cần dừng
            review = data_queue.get(timeout=2)
        except queue.Empty:
            continue

        # Tín hiệu kết thúc từ Producer
        if review is None:
            data_queue.task_done()
            break

        review_id = review.get('id', hash(str(review)))
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

        try:
            print(f"[Luồng {thread_id}] Đang lấy embedding cho review ID: {review_id}")
            embedding = get_embedding(gemini_client, rich_text, thread_id)
        except Exception as e:
            err_msg = str(e)
            if err_msg == "STOP_EVENT_SET":
                data_queue.task_done()
                break
            elif err_msg == "API_QUOTA_EXHAUSTED":
                print(f"\n[Luồng {thread_id}] Google API lỗi 5 lần liên tiếp (Hết Quota). Dừng luồng.")
                # Trả lại item vào queue cho các luồng khác xử lý
                data_queue.put(review)
                data_queue.task_done()
                break
            else:
                print(f"\n[Luồng {thread_id}] Unhandled error for review ID {review_id}: {e}")
                # Lưu ID lại để không fetch ở những lần lặp tiếp theo
                with counter_lock:
                    failed_record_ids.add(review_id)
                    counters['failed'] += 1
                data_queue.task_done()
                continue # Bỏ qua item này để tiếp tục
                
        time.sleep(1) # Tránh Rate limit embedding
        
        row_to_upsert = review.copy()
        row_to_upsert.pop('cars', None)
        row_to_upsert['embedding'] = embedding
        
        batch_upsert.append(row_to_upsert)
        
        if len(batch_upsert) >= 50:
            upsert_batch(supabase_local, batch_upsert, thread_id)
            batch_upsert = []
            
        data_queue.task_done()

    # Flush lượng data còn dư chưa đủ 50 dòng trước khi đóng luồng
    if batch_upsert:
        upsert_batch(supabase_local, batch_upsert, thread_id)


def main():
    print(f"Starting embedding update process with {len(keys)} threads (Producer-Consumer)...")
    
    threads = []
    for i, key in enumerate(keys):
        t = threading.Thread(target=worker_thread, args=(i+1, key))
        t.start()
        threads.append(t)
        
    supabase_main: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        while not stop_event.is_set():
            # Kiểm tra xem còn worker nào sống không (Trường hợp tất cả đều hết quota)
            if not any(t.is_alive() for t in threads):
                print("\nTất cả các API keys đã hết Quota hoặc gặp lỗi. Dừng script.")
                break
                
            # Kiểm soát Queue, tránh fetch quá nhiều chiếm bộ nhớ
            if data_queue.qsize() > 500:
                time.sleep(2)
                continue

            print(f"[Producer] Đang truy vấn Supabase để lấy tối đa 300 reviews trống embedding...")
            try:
                # Mỗi lần lấy 300 dòng để luôn có sẵn việc cho các luồng
                response = supabase_main.table('reviews').select('*, cars(year, make, model, engine_hp)').is_('embedding', 'null').limit(300).execute()
                reviews = response.data
            except Exception as e:
                print(f"Error fetching reviews: {e}")
                time.sleep(5)
                continue
                
            if not reviews:
                print(f"\nKhông còn reviews nào cần xử lý. Hoàn tất!")
                break

            # Lọc bỏ những dòng đã từng lỗi trước đó để tránh lặp vô tận
            added = 0
            for r in reviews:
                r_id = r.get('id', hash(str(r)))
                if r_id not in failed_record_ids:
                    data_queue.put(r)
                    added += 1
            
            if added == 0:
                print("\n[Producer] Chỉ lấy được các reviews đã gặp lỗi nghiêm trọng trước đó. Dừng tiến trình để tránh lặp vô tận.")
                break

            print(f"\n[Producer] Fetch được {len(reviews)} dòng. Đã thêm {added} reviews mới vào Queue.")
            print(f"[Producer] Kích thước Queue hiện tại: {data_queue.qsize()}. Đang phân bổ cho các luồng...")
            
            # Đợi cho Queue được tiêu thụ bớt rồi mới fetch vòng tiếp theo
            while data_queue.qsize() > 100 and not stop_event.is_set() and any(t.is_alive() for t in threads):
                time.sleep(2)

    except KeyboardInterrupt:
        print("\n\nNhận lệnh dừng từ người dùng. Đang chờ các luồng hiện tại hoàn thành việc lưu dữ liệu...")
        stop_event.set()

    # Gửi tín hiệu báo dừng (poison pill) cho từng luồng
    for _ in threads:
        data_queue.put(None)

    # Đợi tất cả hoàn thành thao tác cuối cùng
    for t in threads:
        t.join()
        
    print(f"\n--- Báo Cáo Cuối Cùng ---")
    print(f"✅ Upsert thành công: {counters['processed']} dòng.")
    print(f"❌ Lỗi / Bỏ qua: {counters['failed']} dòng.")
    print("Đã dừng an toàn!")

if __name__ == "__main__":
    main()

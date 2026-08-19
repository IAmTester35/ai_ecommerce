import os
import time
import threading
import queue
import json
import sqlite3
import argparse
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Set

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables from data_pipeline or root
for p in [Path(__file__).parent, Path(__file__).parent.parent, Path(__file__).parent.parent.parent]:
    env_file = p / ".env"
    if env_file.exists():
        load_dotenv(env_file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GOOGLE_SEARCH_API_KEY = os.environ.get("GOOGLE_SEARCH_API_KEY")
GOOGLE_CX = os.environ.get("GOOGLE_CX")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables (SUPABASE_URL, SUPABASE_KEY). Please check .env file.")

CACHE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "car_images_cache.db")
FAILED_BACKUP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "failed_images_backup.jsonl")

# Thread synchronization
data_queue = queue.Queue(maxsize=1000)
stop_event = threading.Event()
counter_lock = threading.Lock()
backup_lock = threading.Lock()
db_lock = threading.Lock()

counters = {
    'processed': 0,
    'cached': 0,
    'fetched': 0,
    'failed': 0,
    'upserted': 0
}

failed_record_ids: Set[str] = set()
in_flight_ids: Set[str] = set()
processed_results: List[Dict] = []

HTTP_HEADERS = {
    "User-Agent": "CarEcommerceDataPipeline/2.0 (contact@ecommerce-car.com)"
}


# ==========================================
# 1. CACHE LAYER (SQLite)
# ==========================================

def init_cache_db():
    """Khởi tạo SQLite DB để lưu cache image_url của từng xe."""
    with db_lock:
        with sqlite3.connect(CACHE_DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS car_images (
                    id TEXT PRIMARY KEY,
                    make TEXT NOT NULL,
                    model TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    image_url TEXT,
                    status TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_car_mmy ON car_images (make, model, year)")


def get_cached_image(car_id: str, make: str, model: str, year: int) -> Optional[str]:
    """
    Tra cứu cache:
    1. Ưu tiên theo car_id
    2. Nếu không có, tra cứu theo (make, model, year)
    Lọc bỏ các URL regcheck hoặc loading gif cũ.
    """
    with db_lock:
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT image_url FROM car_images WHERE id = ? AND image_url IS NOT NULL", (car_id,))
                row = cursor.fetchone()
                if row and row[0] and "regcheck" not in row[0] and "fancybox" not in row[0]:
                    return row[0]
                
                cursor.execute(
                    "SELECT image_url FROM car_images WHERE make = ? AND model = ? AND year = ? AND image_url IS NOT NULL LIMIT 1",
                    (make, model, year)
                )
                row = cursor.fetchone()
                if row and row[0] and "regcheck" not in row[0] and "fancybox" not in row[0]:
                    return row[0]
        except Exception as e:
            print(f"Lỗi khi đọc cache SQLite: {e}")
    return None


def save_cached_image(car_id: str, make: str, model: str, year: int, image_url: Optional[str], status: str = "success"):
    """Lưu image_url vào SQLite cache."""
    with db_lock:
        try:
            with sqlite3.connect(CACHE_DB_PATH) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO car_images (id, make, model, year, image_url, status, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (car_id, make, model, year, image_url, status, datetime.now(timezone.utc).isoformat())
                )
        except Exception as e:
            print(f"Lỗi khi lưu cache SQLite: {e}")


def save_failed_record(car: dict, reason: str):
    """Ghi nhận các xe không lấy được ảnh vào file JSONL dự phòng."""
    with backup_lock:
        with open(FAILED_BACKUP_PATH, "a", encoding="utf-8") as f:
            record = {
                "id": car.get("id"),
                "make": car.get("make"),
                "model": car.get("model"),
                "year": car.get("year"),
                "reason": reason,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            f.flush()


# ==========================================
# 2. IMAGE FETCHING LAYER (Wikimedia / Wikipedia / Google)
# ==========================================

def fetch_from_wikimedia_commons(client: httpx.Client, query: str, timeout: float = 6.0) -> Optional[str]:
    """
    Lấy ảnh thật độ phân giải cao từ Wikimedia Commons Search API (Direct CDN JPG/PNG).
    """
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": 6,
        "gsrlimit": 1,
        "prop": "imageinfo",
        "iiprop": "url",
        "iiurlwidth": 960,
        "format": "json"
    }
    try:
        response = client.get(url, params=params, headers=HTTP_HEADERS, timeout=timeout)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                imageinfo = pdata.get("imageinfo", [])
                if imageinfo:
                    img_url = imageinfo[0].get("thumburl") or imageinfo[0].get("url")
                    if img_url and img_url.startswith("http") and not img_url.endswith(".svg"):
                        return img_url
    except Exception:
        pass
    return None


def fetch_from_wikipedia_pageimages(client: httpx.Client, query: str, timeout: float = 6.0) -> Optional[str]:
    """
    Lấy ảnh từ Wikipedia PageImages API (Direct CDN JPG/PNG).
    """
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} car",
        "gsrlimit": 1,
        "prop": "pageimages",
        "piprop": "thumbnail|original",
        "pithumbsize": 960
    }
    try:
        response = client.get(url, params=params, headers=HTTP_HEADERS, timeout=timeout)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if "thumbnail" in pdata and pdata["thumbnail"].get("source"):
                    return pdata["thumbnail"]["source"]
                if "original" in pdata and pdata["original"].get("source"):
                    return pdata["original"]["source"]
    except Exception:
        pass
    return None


def fetch_from_google_search(client: httpx.Client, query: str, timeout: float = 5.0) -> Optional[str]:
    """
    Dự phòng: Tìm ảnh bằng Google Custom Search API nếu có cấu hình API Key và CX.
    """
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_CX:
        return None
        
    try:
        response = client.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": GOOGLE_SEARCH_API_KEY,
                "cx": GOOGLE_CX,
                "q": f"{query} car exterior high quality",
                "searchType": "image",
                "num": 1
            },
            timeout=timeout
        )
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                img_url = items[0].get("link")
                if img_url and img_url.startswith("http"):
                    return img_url
    except Exception:
        pass
    return None


def get_car_image(client: httpx.Client, car: dict, thread_id: int, request_delay: float = 0.2) -> Optional[str]:
    """
    Lấy ảnh xe theo thứ tự ưu tiên:
    1. Wikimedia Commons theo '{year} {make} {model}'
    2. Wikimedia Commons theo '{make} {model}'
    3. Wikipedia Pageimages theo '{make} {model}'
    4. Google Custom Search (nếu có key)
    """
    make = car.get("make", "").strip()
    model = car.get("model", "").strip()
    year = int(car.get("year", 0))
    
    search_candidates = []
    if year > 0 and make and model:
        search_candidates.append(f"{year} {make} {model}")
    if make and model:
        search_candidates.append(f"{make} {model}")
    
    max_retries = 3
    for attempt in range(max_retries):
        if stop_event.is_set():
            raise Exception("STOP_EVENT_SET")
            
        try:
            # 1. Thử Wikimedia Commons
            for term in search_candidates:
                img_url = fetch_from_wikimedia_commons(client, term)
                if img_url:
                    time.sleep(request_delay)
                    return img_url

            # 2. Thử Wikipedia Pageimages
            for term in search_candidates:
                img_url = fetch_from_wikipedia_pageimages(client, term)
                if img_url:
                    time.sleep(request_delay)
                    return img_url

            # 3. Thử Google Search (nếu có key)
            if search_candidates:
                img_url = fetch_from_google_search(client, search_candidates[0])
                if img_url:
                    time.sleep(request_delay)
                    return img_url

            return None

        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                backoff_time = (attempt + 1) * 5
                print(f"\n[Luồng {thread_id}] Rate limit (429). Tạm dừng {backoff_time}s...")
                for _ in range(backoff_time):
                    if stop_event.is_set():
                        raise Exception("STOP_EVENT_SET")
                    time.sleep(1)
            else:
                time.sleep(1)

    return None


# ==========================================
# 3. DATABASE UPSERT LAYER (Supabase)
# ==========================================

def upsert_batch_cars(supabase_client: Client, batch: List[Dict], thread_id: int, dry_run: bool = False):
    """
    Upsert batch xe đã có image_url lên Supabase.
    """
    if not batch:
        return

    dedup_dict = {item['id']: item for item in batch}
    unique_batch = list(dedup_dict.values())

    if dry_run:
        with counter_lock:
            counters['upserted'] += len(unique_batch)
            for item in unique_batch:
                in_flight_ids.discard(item.get('id'))
        print(f"[Luồng {thread_id}] [DRY-RUN] Bỏ qua ghi DB ({len(unique_batch)} xe).")
        return

    max_retries = 3
    for attempt in range(max_retries):
        try:
            supabase_client.table('cars').upsert(unique_batch).execute()
            with counter_lock:
                counters['upserted'] += len(unique_batch)
                for item in unique_batch:
                    in_flight_ids.discard(item.get('id'))
            print(f"[Luồng {thread_id}] ✅ Đã cập nhật {len(unique_batch)} xe lên Supabase.")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"\n[Luồng {thread_id}] Upsert lần {attempt+1} thất bại ({e}). Thử lại sau 3s...")
                time.sleep(3)
            else:
                print(f"\n[Luồng {thread_id}] ❌ Lỗi upsert sau {max_retries} lần thử: {e}")
                with counter_lock:
                    for item in unique_batch:
                        c_id = item.get('id')
                        failed_record_ids.add(c_id)
                        in_flight_ids.discard(c_id)
                        counters['failed'] += 1
                        save_failed_record(item, f"DB upsert error: {e}")


# ==========================================
# 4. WORKER THREAD (Producer-Consumer)
# ==========================================

def worker_thread(thread_id: int, batch_size: int, delay: float, dry_run: bool, force: bool):
    """
    Worker xử lý từng item từ queue.
    """
    supabase_worker: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    http_client = httpx.Client(timeout=10.0)
    batch_upsert: List[Dict] = []

    try:
        while not stop_event.is_set():
            try:
                car = data_queue.get(timeout=2)
            except queue.Empty:
                if batch_upsert:
                    upsert_batch_cars(supabase_worker, batch_upsert, thread_id, dry_run)
                    batch_upsert = []
                continue

            if car is None:
                data_queue.task_done()
                break

            car_id = car.get('id')
            make = car.get('make', '')
            model = car.get('model', '')
            year = int(car.get('year', 0))

            cached_url = None if force else get_cached_image(car_id, make, model, year)
            if cached_url:
                image_url = cached_url
                with counter_lock:
                    counters['cached'] += 1
            else:
                try:
                    image_url = get_car_image(http_client, car, thread_id, request_delay=delay)
                    if image_url:
                        save_cached_image(car_id, make, model, year, image_url, status="success")
                        with counter_lock:
                            counters['fetched'] += 1
                    else:
                        save_cached_image(car_id, make, model, year, None, status="not_found")
                        save_failed_record(car, "Image not found from Wikimedia/Wikipedia")
                        with counter_lock:
                            counters['failed'] += 1
                            failed_record_ids.add(car_id)
                            in_flight_ids.discard(car_id)
                        data_queue.task_done()
                        continue
                except Exception as e:
                    if str(e) == "STOP_EVENT_SET":
                        with counter_lock:
                            in_flight_ids.discard(car_id)
                        data_queue.task_done()
                        break
                    else:
                        print(f"[Luồng {thread_id}] Lỗi lấy ảnh xe {year} {make} {model}: {e}")
                        with counter_lock:
                            counters['failed'] += 1
                            failed_record_ids.add(car_id)
                            in_flight_ids.discard(car_id)
                        data_queue.task_done()
                        continue

            updated_car = car.copy()
            updated_car['image_url'] = image_url
            batch_upsert.append(updated_car)

            with counter_lock:
                counters['processed'] += 1
                processed_results.append({
                    "id": car_id,
                    "year": year,
                    "make": make,
                    "model": model,
                    "image_url": image_url
                })

            if len(batch_upsert) >= batch_size:
                upsert_batch_cars(supabase_worker, batch_upsert, thread_id, dry_run)
                batch_upsert = []

            data_queue.task_done()

        if batch_upsert:
            upsert_batch_cars(supabase_worker, batch_upsert, thread_id, dry_run)

    finally:
        http_client.close()


# ==========================================
# 5. MAIN PIPELINE
# ==========================================

def run_pipeline(limit: Optional[int] = None, num_workers: int = 4, batch_size: int = 20, delay: float = 0.2, dry_run: bool = False, force: bool = False):
    init_cache_db()
    
    print("=" * 60)
    print("🚗 KHỞI ĐỘNG DATA PIPELINE CẬP NHẬT ẢNH XE (WIKIMEDIA/WIKIPEDIA)")
    print(f"• Workers: {num_workers} | Batch size: {batch_size} | Delay: {delay}s | Force: {force} | Dry run: {dry_run}")
    if limit:
        print(f"• Giới hạn số lượng chạy: {limit} xe")
    print("=" * 60)

    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=worker_thread, args=(i + 1, batch_size, delay, dry_run, force))
        t.start()
        threads.append(t)

    supabase_main: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    total_enqueued = 0

    try:
        while not stop_event.is_set():
            if not any(t.is_alive() for t in threads):
                print("\nTất cả worker threads đã dừng.")
                break

            if data_queue.qsize() > 200:
                time.sleep(1)
                continue

            fetch_size = 100
            if limit:
                remaining = limit - total_enqueued
                if remaining <= 0:
                    break
                fetch_size = min(fetch_size, remaining)

            print(f"\n[Producer] Đang truy vấn Supabase lấy tối đa {fetch_size} xe...")
            try:
                query = supabase_main.table('cars').select('*')
                if not force:
                    query = query.or_("image_url.is.null,image_url.ilike.%regcheck%")
                
                response = query.limit(fetch_size).execute()
                cars = response.data
            except Exception as e:
                print(f"[Producer] Lỗi truy vấn Supabase: {e}")
                time.sleep(3)
                continue

            if not cars:
                print("[Producer] Không còn xe nào cần cập nhật ảnh.")
                break

            added = 0
            for car in cars:
                c_id = car.get('id')
                with counter_lock:
                    if c_id in failed_record_ids or c_id in in_flight_ids:
                        continue
                    in_flight_ids.add(c_id)
                data_queue.put(car)
                added += 1
                total_enqueued += 1
                if limit and total_enqueued >= limit:
                    break

            if added == 0:
                with counter_lock:
                    all_failed = all(c.get('id') in failed_record_ids for c in cars)
                if all_failed:
                    print("[Producer] Tất cả xe trong đợt này đều đã gặp lỗi trước đó. Dừng.")
                    break
                time.sleep(2)
                continue

            print(f"[Producer] Đã nạp {added} xe vào hàng đợi (Tổng đã nạp: {total_enqueued}).")

            if limit and total_enqueued >= limit:
                print(f"[Producer] Đã đạt giới hạn --limit={limit}. Chờ workers hoàn tất...")
                break

            while data_queue.qsize() > 20 and not stop_event.is_set() and any(t.is_alive() for t in threads):
                time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n⚠️ Nhận tín hiệu dừng từ người dùng (Ctrl+C). Đang hoàn tất lưu dữ liệu...")
        stop_event.set()

    for t in threads:
        if t.is_alive():
            data_queue.put(None)

    for t in threads:
        t.join()

    print("\n" + "=" * 60)
    print("📊 BÁO CÁO KẾT QUẢ")
    print("=" * 60)
    print(f"✅ Tổng xe đã xử lý:      {counters['processed']}")
    print(f"📦 Đã lấy từ Cache:       {counters['cached']}")
    print(f"🌐 Đã tải mới qua API:    {counters['fetched']}")
    print(f"💾 Đã ghi vào Supabase:   {counters['upserted']}")
    print(f"❌ Thất bại / Không ảnh:  {counters['failed']}")
    print("=" * 60)

    if processed_results:
        print("\n📋 DANH SÁCH ẢNH XE ĐÃ LẤY ĐƯỢC:")
        for idx, res in enumerate(processed_results, 1):
            print(f"{idx}. [{res['year']} {res['make']} {res['model']}]")
            print(f"   ID:  {res['id']}")
            print(f"   URL: {res['image_url']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch update car images from Wikimedia/Wikipedia to Supabase.")
    parser.add_argument("--limit", type=int, default=None, help="Chỉ xử lý tối đa N xe (dùng để test thử nghiệm)")
    parser.add_argument("--workers", type=int, default=4, help="Số lượng luồng worker chạy song song (mặc định: 4)")
    parser.add_argument("--batch-size", type=int, default=20, help="Kích thước batch upsert lên Supabase (mặc định: 20)")
    parser.add_argument("--delay", type=float, default=0.2, help="Khoảng nghỉ giữa các request (giây) (mặc định: 0.2)")
    parser.add_argument("--force", action="store_true", help="Cập nhật lại toàn bộ xe kể cả đã có URL")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ fetch ảnh và lưu cache SQLite, không ghi vào Supabase")
    
    args = parser.parse_args()
    run_pipeline(
        limit=args.limit,
        num_workers=args.workers,
        batch_size=args.batch_size,
        delay=args.delay,
        dry_run=args.dry_run,
        force=args.force
    )

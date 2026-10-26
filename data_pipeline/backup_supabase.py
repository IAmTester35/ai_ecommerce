#!/usr/bin/env python3
"""
Export all Supabase tables to backup_supabase_data.json and compress to backup_supabase_data.zip.
"""
import os
import sys
import json
import zipfile
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
for p in [Path(__file__).parent, Path(__file__).parent.parent, Path(__file__).parent.parent / "backend"]:
    env_file = p / ".env"
    if env_file.exists():
        load_dotenv(env_file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_KEY in environment.")
    sys.exit(1)

TABLES = [
    "profiles",
    "showrooms",
    "vouchers",
    "cars",
    "saved_cars",
    "test_drives",
    "orders",
    "order_items",
    "reviews",
    "car_qa",
    "viewed_cars",
    "search_history",
    "chat_sessions",
    "notifications",
    "cart_items"
]

BATCH_SIZE = 1000

def fetch_table_data(sb: Client, table: str):
    records = []
    start = 0
    while True:
        end = start + BATCH_SIZE - 1
        query = sb.table(table).select("*").order("id").range(start, end)
        res = query.execute()
        rows = res.data or []
        records.extend(rows)
        if len(rows) < BATCH_SIZE:
            break
        start += BATCH_SIZE
    return records

def main():
    root_dir = Path(__file__).resolve().parent.parent
    json_path = root_dir / "backup_supabase_data.json"
    zip_path = root_dir / "backup_supabase_data.zip"

    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    backup_data = {}
    total_records = 0
    t0 = time.time()

    for table in TABLES:
        t_start = time.time()
        print(f"Fetching table '{table}'...", end="", flush=True)
        try:
            records = fetch_table_data(sb, table)
            backup_data[table] = records
            total_records += len(records)
            print(f" {len(records)} rows ({time.time() - t_start:.2f}s)")
        except Exception as e:
            print(f" ERROR: {e}")
            raise e

    print(f"\nFetched total {total_records} records across {len(TABLES)} tables in {time.time() - t0:.2f}s")

    print(f"Writing to {json_path}...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)

    json_size_mb = json_path.stat().st_size / (1024 * 1024)
    print(f"JSON file created: {json_size_mb:.2f} MB")

    print(f"Compressing to {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.write(json_path, arcname="backup_supabase_data.json")

    zip_size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"ZIP file created: {zip_size_mb:.2f} MB")

    # Clean up uncompressed json to keep workspace clean
    if json_path.exists():
        json_path.unlink()
        print("Cleaned up temporary JSON file.")

    print("\n✅ Backup completed successfully!")

if __name__ == "__main__":
    main()

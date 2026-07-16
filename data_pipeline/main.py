import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from tqdm import tqdm
import time
import csv

# Load env variables
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise ValueError("Missing environment variables. Please check .env file.")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# Configuration
CSV_PATH = "../car/vehicles.csv"
SAMPLE_SIZE = 1000  # Small sample size for testing
TARGET_BRANDS = ['toyota', 'bmw', 'honda', 'ford']

def get_embedding(text: str) -> list[float]:
    """Generate 3072-dimensional embedding using Gemini text-embedding-004"""
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = ai_client.models.embed_content(
                model='gemini-embedding-2',
                contents=text,
            )
            return response.embeddings[0].values
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"\nRate limit hit (429). Sleeping for 60s (Attempt {attempt+1}/{max_retries})...")
                time.sleep(60)
            else:
                print(f"\nError generating embedding: {e}")
                return None
    return None

def main():
    print("Loading data...")
    # Load data in chunks to save memory
    df = pd.read_csv(CSV_PATH, usecols=['id', 'price', 'year', 'manufacturer', 'model', 
                                        'condition', 'cylinders', 'fuel', 'odometer', 
                                        'title_status', 'transmission', 'drive', 'size', 
                                        'type', 'paint_color', 'description'])
    
    # Filter missing essential data
    df = df.dropna(subset=['id', 'price', 'year', 'manufacturer', 'model', 'description'])
    df['manufacturer'] = df['manufacturer'].str.lower()
    
    # Filter by target brands
    df = df[df['manufacturer'].isin(TARGET_BRANDS)]
    
    # Sample data
    if len(df) > SAMPLE_SIZE:
        df = df.sample(n=SAMPLE_SIZE, random_state=42)
    
    print(f"Processing {len(df)} records...")
    
    print("Fetching existing IDs from Supabase to avoid reprocessing...")
    existing_ids = set()
    try:
        # Fetch existing IDs to resume progress
        response = supabase.table('cars').select('id').execute()
        existing_ids = {row['id'] for row in response.data}
        print(f"Found {len(existing_ids)} existing records in Supabase. These will be skipped.")
    except Exception as e:
        print(f"Could not fetch existing IDs: {e}")
    
    records_to_insert = []
    
    for index, row in tqdm(df.iterrows(), total=len(df)):
        car_id = int(row['id'])
        if car_id in existing_ids:
            continue
            
        # Construct a rich text for embedding
        year = int(row['year']) if pd.notnull(row['year']) else ""
        price = row['price']
        mfg = str(row['manufacturer']).title()
        model = str(row['model']).title()
        desc = str(row['description'])
        
        rich_text = f"{year} {mfg} {model}. Price: ${price}. Description: {desc}"
        
        # Get vector embedding
        embedding = get_embedding(rich_text)
        
        # To avoid hitting API rate limits for free tier (~15 RPM)
        time.sleep(4) 
        
        if not embedding:
            continue
            
        record = {
            "id": car_id,
            "price": int(row['price']),
            "year": year,
            "manufacturer": mfg,
            "model": model,
            "condition": str(row['condition']) if pd.notnull(row['condition']) else None,
            "cylinders": str(row['cylinders']) if pd.notnull(row['cylinders']) else None,
            "fuel": str(row['fuel']) if pd.notnull(row['fuel']) else None,
            "odometer": int(row['odometer']) if pd.notnull(row['odometer']) else None,
            "title_status": str(row['title_status']) if pd.notnull(row['title_status']) else None,
            "transmission": str(row['transmission']) if pd.notnull(row['transmission']) else None,
            "drive": str(row['drive']) if pd.notnull(row['drive']) else None,
            "size": str(row['size']) if pd.notnull(row['size']) else None,
            "type": str(row['type']) if pd.notnull(row['type']) else None,
            "paint_color": str(row['paint_color']) if pd.notnull(row['paint_color']) else None,
            "description": desc,
            "embedding": embedding
        }
        records_to_insert.append(record)
        
        # Batch insert every 10 records to save progress frequently
        if len(records_to_insert) >= 10:
            try:
                supabase.table('cars').upsert(records_to_insert).execute()
                # Thêm id vào set để tránh trùng nếu script lỗi ngay sau đó
                for r in records_to_insert:
                    existing_ids.add(r['id'])
            except Exception as e:
                print(f"\nError inserting to Supabase: {e}")
                # Ghi log các ID lỗi ra file csv
                with open('failed_ids.csv', 'a', newline='') as f:
                    writer = csv.writer(f)
                    for r in records_to_insert:
                        writer.writerow([r['id'], str(e)])
            finally:
                records_to_insert = []
                
    # Insert remaining
    if len(records_to_insert) > 0:
        try:
            supabase.table('cars').upsert(records_to_insert).execute()
        except Exception as e:
            print(f"\nError inserting to Supabase: {e}")
            with open('failed_ids.csv', 'a', newline='') as f:
                writer = csv.writer(f)
                for r in records_to_insert:
                    writer.writerow([r['id'], str(e)])
            
    print("Pipeline completed successfully!")

if __name__ == "__main__":
    main()

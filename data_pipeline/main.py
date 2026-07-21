import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from tqdm import tqdm
import time
import csv
import uuid

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
CSV_PATH = "../car/data/merged_golden_reviews.csv"
SAMPLE_SIZE = 100  # Small sample size for testing initial runs

def get_embedding(text: str) -> list[float]:
    """Generate 768-dimensional embedding"""
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = ai_client.models.embed_content(
                model='gemini-embedding-2',
                contents=text,
                config={'output_dimensionality': 768}
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
    print("Loading golden dataset...")
    df = pd.read_csv(CSV_PATH)
    
    # Drop rows without essential data
    df = df.dropna(subset=['Year', 'Make', 'Model', 'Review'])
    
    print(f"Total valid records: {len(df)}")
    
    # Optionally sample for testing
    if len(df) > SAMPLE_SIZE:
        df = df.sample(n=SAMPLE_SIZE)
    
    print(f"Selected {len(df)} records for this run...")
    
    CAR_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, 'ai_ecommerce.cars')
    REVIEW_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, 'ai_ecommerce.reviews')
    
    # 1. PROCESS AND INSERT UNIQUE CARS
    print("\n=== STEP 1: Processing unique cars ===")
    unique_cars = {}
    for index, row in df.iterrows():
        year = int(row['Year'])
        make = str(row['Make'])
        model = str(row['Model'])
        
        car_key = f"{make}_{model}_{year}"
        if car_key not in unique_cars:
            # Handle MSRP / Price
            price_val = row['MSRP']
            price = int(float(price_val)) if pd.notnull(price_val) and str(price_val).strip() != '' else None
            
            # Handle HP
            hp_val = row['Engine_HP']
            hp = int(float(hp_val)) if pd.notnull(hp_val) and str(hp_val).strip() != '' else None
            
            metadata = {
                "engine_fuel_type": str(row.get('Engine_Fuel_Type', '')).strip(),
                "engine_cylinders": str(row.get('Engine_Cylinders', '')).strip(),
                "transmission_type": str(row.get('Transmission_Type', '')).strip(),
                "driven_wheels": str(row.get('Driven_Wheels', '')).strip(),
                "number_of_doors": str(row.get('Number_of_Doors', '')).strip(),
                "market_category": str(row.get('Market_Category', '')).strip(),
                "vehicle_size": str(row.get('Vehicle_Size', '')).strip(),
                "vehicle_style": str(row.get('Vehicle_Style', '')).strip()
            }
            
            car_id = str(uuid.uuid5(CAR_NAMESPACE, car_key))
            unique_cars[car_key] = {
                "id": car_id,
                "make": make,
                "model": model,
                "year": year,
                "engine_hp": hp,
                "price": price,
                "metadata": metadata
            }

    cars_to_insert = list(unique_cars.values())
    print(f"Found {len(cars_to_insert)} unique cars. Upserting to Supabase...")
    
    # Upsert cars in batches
    batch_size = 50
    for i in range(0, len(cars_to_insert), batch_size):
        batch = cars_to_insert[i:i+batch_size]
        try:
            supabase.table('cars').upsert(batch).execute()
        except Exception as e:
            print(f"Error inserting cars to Supabase: {e}")

    # 2. PROCESS AND INSERT REVIEWS
    print("\n=== STEP 2: Processing and inserting reviews ===")
    reviews_to_insert = []
    
    for index, row in tqdm(df.iterrows(), total=len(df)):
        year = int(row['Year'])
        make = str(row['Make'])
        model = str(row['Model'])
        car_key = f"{make}_{model}_{year}"
        
        if car_key not in unique_cars:
            continue
            
        car_id = unique_cars[car_key]['id']
        car_data = unique_cars[car_key]
        
        review = str(row['Review']).strip()
        
        rating_val = row['Rating']
        rating = float(rating_val) if pd.notnull(rating_val) and str(rating_val).strip() != '' else None
        
        # Tích hợp thêm keyword thông số nhẹ vào review text để context embedding phong phú hơn
        rich_text = f"Car: {year} {make} {model}. "
        if car_data['engine_hp']: rich_text += f"Engine Power: {car_data['engine_hp']} HP. "
        if rating: rich_text += f"Rating: {rating}/5. "
        rich_text += f"Review: {review}"
        
        embedding = get_embedding(rich_text)
        time.sleep(4) # Rate limit protection
        
        if not embedding:
            continue
            
        review_unique_string = f"{car_id}_{review}"
        review_id = str(uuid.uuid5(REVIEW_NAMESPACE, review_unique_string))
        
        record = {
            "id": review_id,
            "car_id": car_id,
            "rating": rating,
            "comment": review,
            "source": "edmunds",
            "embedding": embedding
        }
        reviews_to_insert.append(record)
        
        if len(reviews_to_insert) >= 10:
            try:
                supabase.table('reviews').upsert(reviews_to_insert).execute()
            except Exception as e:
                print(f"\nError inserting reviews to Supabase: {e}")
                with open('failed_reviews.csv', 'a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    for r in reviews_to_insert:
                        writer.writerow([r['car_id'], str(e)])
            finally:
                reviews_to_insert = []
                
    if len(reviews_to_insert) > 0:
        try:
            supabase.table('reviews').upsert(reviews_to_insert).execute()
        except Exception as e:
            print(f"\nError inserting reviews to Supabase: {e}")

    print("\nPipeline completed successfully!")

if __name__ == "__main__":
    main()

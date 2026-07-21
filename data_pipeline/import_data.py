import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid
from tqdm import tqdm

# Load env variables
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing environment variables. Please check .env file.")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration
CSV_PATH = "../car/data/merged_golden_reviews.csv"

def main():
    print("Loading golden dataset...")
    df = pd.read_csv(CSV_PATH)
    
    # Drop rows without essential data
    df = df.dropna(subset=['Year', 'Make', 'Model', 'Review'])
    
    print(f"Total valid records: {len(df)}")
    
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
    
    try:
        count_response = supabase.table('cars').select('id', count='exact').limit(1).execute()
        db_car_count = count_response.count if count_response.count is not None else 0
        
        if db_car_count == len(cars_to_insert):
            print(f"Skip Step 1: Local cars ({len(cars_to_insert)}) matches DB ({db_car_count}).")
        else:
            print(f"Found {len(cars_to_insert)} unique cars (DB: {db_car_count}). Upserting to Supabase...")
            batch_size = 50
            for i in range(0, len(cars_to_insert), batch_size):
                batch = cars_to_insert[i:i+batch_size]
                try:
                    supabase.table('cars').upsert(batch).execute()
                except Exception as e:
                    print(f"Error inserting cars to Supabase: {e}")
    except Exception as e:
        print(f"Error checking cars count: {e}")

    # 2. PROCESS REVIEWS (Không gọi Embedding)
    print("\n=== STEP 2: Inserting reviews ===")
    reviews_to_insert = []
    seen_review_ids = set()
    
    for index, row in tqdm(df.iterrows(), total=len(df)):
        year = int(row['Year'])
        make = str(row['Make'])
        model = str(row['Model'])
        car_key = f"{make}_{model}_{year}"
        
        if car_key not in unique_cars:
            continue
            
        car_id = unique_cars[car_key]['id']
        
        review_text = str(row['Review']).strip()
        
        rating_val = row['Rating']
        rating = float(rating_val) if pd.notnull(rating_val) and str(rating_val).strip() != '' else None
        
        source = str(row.get('Source', 'edmunds')).strip()
        
        review_unique_string = f"{car_id}_{review_text[:50]}"
        review_id = str(uuid.uuid5(REVIEW_NAMESPACE, review_unique_string))
        
        if review_id in seen_review_ids:
            continue
        seen_review_ids.add(review_id)
        
        record = {
            "id": review_id,
            "car_id": car_id,
            "rating": rating,
            "comment": review_text,
            "source": source
            # embedding = null
        }
        reviews_to_insert.append(record)
        
        if len(reviews_to_insert) >= 200: # Không gọi API nên tăng batch size lên cho nhanh
            try:
                supabase.table('reviews').upsert(reviews_to_insert).execute()
            except Exception as e:
                print(f"\nError inserting reviews to Supabase: {e}")
            finally:
                reviews_to_insert = []
                
    # Insert remaining
    if len(reviews_to_insert) > 0:
        try:
            supabase.table('reviews').upsert(reviews_to_insert).execute()
        except Exception as e:
            print(f"\nError inserting reviews to Supabase: {e}")

    print("\nImport data completed successfully!")

if __name__ == "__main__":
    main()

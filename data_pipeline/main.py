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
    
    records_to_insert = []
    
    for index, row in tqdm(df.iterrows(), total=len(df)):
        # Extract fields safely
        year = int(row['Year'])
        make = str(row['Make'])
        model = str(row['Model'])
        
        # Handle MSRP / Price (can be empty)
        price_val = row['MSRP']
        price = int(float(price_val)) if pd.notnull(price_val) and str(price_val).strip() != '' else None
        
        # Handle HP
        hp_val = row['Engine_HP']
        hp = int(float(hp_val)) if pd.notnull(hp_val) and str(hp_val).strip() != '' else None
        
        # Handle Rating
        rating_val = row['Rating']
        rating = float(rating_val) if pd.notnull(rating_val) and str(rating_val).strip() != '' else None
        
        review = str(row['Review']).strip()
        
        # Gather metadata
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
        
        # Construct a rich text for embedding - THIS IS THE SOUL OF THE RAG
        rich_text = f"Car: {year} {make} {model}. "
        if hp: rich_text += f"Engine Power: {hp} HP. "
        if metadata['engine_cylinders']: rich_text += f"Engine Cylinders: {metadata['engine_cylinders']}. "
        if metadata['engine_fuel_type']: rich_text += f"Fuel Type: {metadata['engine_fuel_type']}. "
        if metadata['vehicle_style']: rich_text += f"Style: {metadata['vehicle_style']}. "
        if metadata['market_category']: rich_text += f"Category: {metadata['market_category']}. "
        if metadata['transmission_type']: rich_text += f"Transmission: {metadata['transmission_type']}. "
        if rating: rich_text += f"User Rating: {rating}/5. "
        rich_text += f"User Reviews and Driving Feel: {review}"
        
        # Get vector embedding
        embedding = get_embedding(rich_text)
        
        time.sleep(4) # Rate limit protection
        
        if not embedding:
            continue
            
        record = {
            "id": str(uuid.uuid4()), # Generate UUID manually for Supabase upsert
            "make": make,
            "model": model,
            "year": year,
            "engine_hp": hp,
            "price": price,
            "rating": rating,
            "review": review,
            "metadata": metadata,
            "embedding": embedding
        }
        records_to_insert.append(record)
        
        # Batch insert
        if len(records_to_insert) >= 10:
            try:
                supabase.table('cars').upsert(records_to_insert).execute()
            except Exception as e:
                print(f"\nError inserting to Supabase: {e}")
                with open('failed_records.csv', 'a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    for r in records_to_insert:
                        writer.writerow([r['make'], r['model'], str(e)])
            finally:
                records_to_insert = []
                
    # Insert remaining
    if len(records_to_insert) > 0:
        try:
            supabase.table('cars').upsert(records_to_insert).execute()
        except Exception as e:
            print(f"\nError inserting to Supabase: {e}")
            
    print("Pipeline completed successfully!")

if __name__ == "__main__":
    main()

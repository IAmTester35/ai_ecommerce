import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from tqdm import tqdm
import time
import sys

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
                time.sleep(5)
    
    # Ném exception để loop ngoài có thể flush dữ liệu
    raise Exception("API_QUOTA_EXHAUSTED")

def main():
    print("Starting embedding update process...")
    total_processed = 0
    batch_size = 50

    while True:
        try:
            # Dùng JOIN để lấy luôn data từ bảng cars (tránh gọi lẻ từng xe)
            # Lấy toàn bộ (*) để phục vụ cho bulk upsert
            response = supabase.table('reviews').select('*, cars(year, make, model, engine_hp)').is_('embedding', 'null').limit(batch_size).execute()
            reviews = response.data
        except Exception as e:
            print(f"Error fetching reviews: {e}")
            sys.exit(1)
            
        if not reviews:
            print(f"\nNo reviews found that need embeddings. Processed {total_processed} total. All done!")
            break

        print(f"\nFetched {len(reviews)} reviews. Processing batch...")
        
        batch_upsert = []
        quota_exhausted = False
        
        for review in tqdm(reviews):
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
                embedding = get_embedding(rich_text)
            except Exception as e:
                if str(e) == "API_QUOTA_EXHAUSTED":
                    quota_exhausted = True
                    break # Thoát vòng lặp để push những gì đã có lên DB
                else:
                    raise e
                    
            time.sleep(1) # Tránh Rate limit embedding
            
            # Xóa key quan hệ trước khi upsert để tránh lỗi relation insertion của postgrest
            row_to_upsert = review.copy()
            row_to_upsert.pop('cars', None)
            row_to_upsert['embedding'] = embedding
            
            batch_upsert.append(row_to_upsert)
            
            # Gửi upsert mỗi 50 dòng để an toàn
            if len(batch_upsert) >= 50:
                try:
                    supabase.table('reviews').upsert(batch_upsert).execute()
                except Exception as e:
                    print(f"\nError bulk upserting reviews: {e}")
                finally:
                    batch_upsert = []

        # Flush lượng data còn dư chưa đủ 50
        if batch_upsert:
            try:
                supabase.table('reviews').upsert(batch_upsert).execute()
            except Exception as e:
                print(f"\nError bulk upserting remaining reviews: {e}")
                
        total_processed += len(reviews) if not quota_exhausted else (len(reviews) - (batch_size - len(batch_upsert))) 
        # Thực tế, total_processed chỉ cần dùng để đếm ước chừng, ko quá quan trọng
        
        if quota_exhausted:
            print("\nGoogle API lỗi 5 lần liên tiếp (Hết Quota). Đã lưu dữ liệu an toàn. Dừng script.")
            break

if __name__ == "__main__":
    main()

import csv
import re
import random
import glob
import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from google import genai
from tqdm import tqdm

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY is not set. Fake review generation will fail.")
else:
    ai_client = genai.Client(api_key=GEMINI_API_KEY)

# 1. Tải Data MSRP
print("=== 1. TẢI DỮ LIỆU MSRP ===")
msrp_data = []
try:
    with open("data/car_features_msrp.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            msrp_data.append(row)
    print(f"Đã tải {len(msrp_data)} dòng từ car_features_msrp.csv")
except Exception as e:
    print(f"Lỗi: {e}")
    exit()

# 2. Chuẩn hóa Khóa từ MSRP và Tạo Fallback Dictionary
print("\n=== 2. CHUẨN HÓA MSRP DATA ===")
msrp_dict = {}       
fallback_dict = {}   

for row in msrp_data:
    year = str(row['Year']).strip()
    make = str(row['Make']).lower().replace(' ', '').replace('-', '')
    model = str(row['Model']).lower().replace(' ', '').replace('-', '')
    
    make_model = f"{make}{model}"
    exact_key = f"{year}{make_model}"
    
    if exact_key not in msrp_dict:
        msrp_dict[exact_key] = []
    msrp_dict[exact_key].append(row)
    
    if make_model not in fallback_dict:
        fallback_dict[make_model] = set()
    fallback_dict[make_model].add(year)

# 3. Quét toàn bộ file Review và Hợp nhất
print("\n=== 3. QUÉT VÀ MERGE TOÀN BỘ DATASET REVIEW ===")
review_files = glob.glob("review/*.csv")
print(f"Tìm thấy {len(review_files)} file CSV reviews.")

# Store reviews grouped by car key: "Year Make Model"
car_reviews_dict = defaultdict(list)
car_info_dict = {}

unmatched = []
total_reviews = 0

for file_path in review_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_reviews += 1
                raw_title = str(row.get('Vehicle_Title', '')).lower()
                title_no_spaces = raw_title.replace(' ', '').replace('-', '')
                
                if raw_title == 'none' or not raw_title:
                    unmatched.append((row, "Thiếu Vehicle_Title"))
                    continue
                
                best_make_model = None
                for mm in fallback_dict.keys():
                    if mm in title_no_spaces:
                        if best_make_model is None or len(mm) > len(best_make_model):
                            best_make_model = mm
                            
                if best_make_model:
                    match = re.search(r'(\d{4})', raw_title)
                    year_rev = match.group(1) if match else "0000"
                    exact_key = f"{year_rev}{best_make_model}"
                    
                    if exact_key in msrp_dict:
                        car_data = msrp_dict[exact_key][0]
                        match_type = "Exact"
                    else:
                        available_years = list(fallback_dict[best_make_model])
                        chosen_year = random.choice(available_years)
                        fallback_key = f"{chosen_year}{best_make_model}"
                        car_data = msrp_dict[fallback_key][0]
                        match_type = "Fallback"
                    
                    car_make = str(car_data['Make']).strip()
                    car_model = str(car_data['Model']).strip()
                    car_year = str(car_data['Year']).strip()
                    car_key_str = f"{car_year}_{car_make}_{car_model}"
                    
                    review_text = str(row.get('Review', '')).strip()
                    word_count = len(review_text.split())
                    
                    # Heuristic 1: Filter out short reviews (< 15 words)
                    if word_count < 15:
                        continue
                        
                    if car_key_str not in car_info_dict:
                        car_info_dict[car_key_str] = car_data
                        
                    car_reviews_dict[car_key_str].append({
                        'review': review_text,
                        'rating': row.get('Rating', ''),
                        'match_type': match_type,
                        'source': 'edmunds',
                        'word_count': word_count
                    })
                else:
                    unmatched.append((row, "Không nhận diện được Hãng & Model"))
    except Exception as e:
        print(f"Lỗi đọc file {file_path}: {e}")


print("\n=== 4. XỬ LÝ CHẤT LƯỢNG VÀ SINH REVIEW GIẢ ===")
total_final_reviews = 0
final_dataset = []

for car_key_str, car_data in tqdm(car_info_dict.items(), desc="Processing cars"):
    reviews = car_reviews_dict.get(car_key_str, [])
    
    # Heuristic 2 & 3: Sort by length and limit to 30
    reviews.sort(key=lambda x: x['word_count'], reverse=True)
    reviews = reviews[:30]
    
    # Heuristic 4: Generate fake reviews if < 5
    if len(reviews) < 5 and GEMINI_API_KEY:
        needed = 5 - len(reviews)
        make = car_data['Make']
        model = car_data['Model']
        year = car_data['Year']
        hp = car_data.get('Engine HP', '')
        
        prompt = f"Write {needed} distinct, realistic, and short customer reviews (each around 30-50 words) for a {year} {make} {model}"
        if hp:
            prompt += f" with {hp} HP engine"
        prompt += ".\nSeparate each review with exactly '---'."
        
        try:
            response = ai_client.models.generate_content(
                model='gemma-4-31b-it', 
                contents=prompt,
            )
            generated_text = response.text
            fake_reviews = [r.strip() for r in generated_text.split('---') if len(r.strip()) > 10]
            
            for fake_review in fake_reviews[:needed]:
                reviews.append({
                    'review': fake_review,
                    'rating': '4.0', 
                    'match_type': 'Exact',
                    'source': 'ai_generated',
                    'word_count': len(fake_review.split())
                })
            time.sleep(2)
        except Exception as e:
            # Lỗi API hoặc model gemma-4-31b-it không tồn tại thì sẽ bypass luôn
            pass
            
    # Add to final dataset
    for rev in reviews:
        final_dataset.append({
            'car_data': car_data,
            'review_data': rev
        })
        total_final_reviews += 1

print(f"\nĐã xử lý xong. Tổng số xe độc nhất: {len(car_info_dict):,}")
print(f"Tổng số review sau khi lọc và sinh thêm: {total_final_reviews:,}")

# 5. Xuất file kết quả
output_file = "data/merged_golden_reviews.csv"
print(f"\n=== 5. XUẤT DỮ LIỆU ===")
try:
    with open(output_file, "w", encoding="utf-8", newline='') as f:
        writer = csv.writer(f)
        # Bổ sung cột Source
        writer.writerow(["Year", "Make", "Model", "Engine_HP", "MSRP", "Rating", "Review", "Match_Type", "Source", "Engine_Fuel_Type", "Engine_Cylinders", "Transmission_Type", "Driven_Wheels", "Number_of_Doors", "Market_Category", "Vehicle_Size", "Vehicle_Style"])
        
        for item in final_dataset:
            car = item['car_data']
            rev = item['review_data']
            writer.writerow([
                car['Year'], car['Make'], car['Model'], car.get('Engine HP', ''), car.get('MSRP', ''), 
                rev['rating'], rev['review'], rev['match_type'], rev['source'],
                car.get('Engine Fuel Type', ''), car.get('Engine Cylinders', ''), car.get('Transmission Type', ''), 
                car.get('Driven_Wheels', ''), car.get('Number of Doors', ''), car.get('Market Category', ''), 
                car.get('Vehicle Size', ''), car.get('Vehicle Style', '')
            ])
            
    print(f"🎉 Đã lưu thành công {total_final_reviews:,} dòng dữ liệu sạch vào: {output_file}")
except Exception as e:
    print(f"Lỗi khi ghi file: {e}")

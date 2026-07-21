import csv
import re
import random
import os
import glob

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

exact_matched = []
fallback_matched = []
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
                
                # Bỏ qua dòng cạo lỗi
                if raw_title == 'none' or not raw_title:
                    unmatched.append((row, "Thiếu Vehicle_Title (Lỗi scrape)"))
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
                        exact_matched.append((row, msrp_dict[exact_key][0], exact_key))
                    else:
                        available_years = list(fallback_dict[best_make_model])
                        chosen_year = random.choice(available_years)
                        fallback_key = f"{chosen_year}{best_make_model}"
                        fallback_matched.append((row, msrp_dict[fallback_key][0], fallback_key, year_rev))
                else:
                    unmatched.append((row, f"Không nhận diện được Hãng & Model"))
    except Exception as e:
        print(f"Lỗi đọc file {file_path}: {e}")

# 4. In báo cáo
total_matched = len(exact_matched) + len(fallback_matched)

print(f"\n=== 4. BÁO CÁO KẾT QUẢ GLOBAL ===")
print(f"Tổng số review đã xử lý: {total_reviews:,}")
print(f"✅ TỔNG CỘNG ĐÃ LƯU: {total_matched:,} / {total_reviews:,} review (Tỷ lệ: {total_matched/total_reviews if total_reviews else 0:.1%})")
print(f"  - Trùng khớp hoàn toàn (Exact Year): {len(exact_matched):,}")
print(f"  - Mượn đời xe khác (Fallback Year): {len(fallback_matched):,}")
print(f"❌ LỖI / KHÔNG THỂ LƯU: {len(unmatched):,} (Chủ yếu do data rác 'none')")

# 5. Xuất file kết quả để lưu trữ (Golden Dataset)
output_file = "data/merged_golden_reviews.csv"
print(f"\n=== 5. XUẤT DỮ LIỆU ===")
try:
    with open(output_file, "w", encoding="utf-8", newline='') as f:
        writer = csv.writer(f)
        # Header: Thông số MSRP + Review text + Metadata
        writer.writerow(["Year", "Make", "Model", "Engine_HP", "MSRP", "Rating", "Review", "Match_Type", "Engine_Fuel_Type", "Engine_Cylinders", "Transmission_Type", "Driven_Wheels", "Number_of_Doors", "Market_Category", "Vehicle_Size", "Vehicle_Style"])
        
        for rev, car, _ in exact_matched:
            writer.writerow([car['Year'], car['Make'], car['Model'], car.get('Engine HP', ''), car.get('MSRP', ''), rev.get('Rating', ''), rev.get('Review', ''), "Exact", car.get('Engine Fuel Type', ''), car.get('Engine Cylinders', ''), car.get('Transmission Type', ''), car.get('Driven_Wheels', ''), car.get('Number of Doors', ''), car.get('Market Category', ''), car.get('Vehicle Size', ''), car.get('Vehicle Style', '')])
            
        for rev, car, _, _ in fallback_matched:
            writer.writerow([car['Year'], car['Make'], car['Model'], car.get('Engine HP', ''), car.get('MSRP', ''), rev.get('Rating', ''), rev.get('Review', ''), "Fallback", car.get('Engine Fuel Type', ''), car.get('Engine Cylinders', ''), car.get('Transmission Type', ''), car.get('Driven_Wheels', ''), car.get('Number of Doors', ''), car.get('Market Category', ''), car.get('Vehicle Size', ''), car.get('Vehicle Style', '')])
            
    print(f"🎉 Đã lưu thành công {total_matched:,} dòng dữ liệu sạch vào: {output_file}")
except Exception as e:
    print(f"Lỗi khi ghi file: {e}")

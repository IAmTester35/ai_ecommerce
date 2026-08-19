# AI E-Commerce Data Pipeline

Thư mục chứa toàn bộ các công cụ, script xử lý dữ liệu, đồng bộ cơ sở dữ liệu Supabase, sinh Vector Embedding và nạp hình ảnh xe cho hệ thống thương mại điện tử xe hơi.

---

## Cấu Trúc Thư Mục

```
data_pipeline/
├── stats.py                     # Dashboard tổng quan tiến độ (Embeddings & Images)
├── ingestion/                   # Nhóm nạp và khởi tạo dữ liệu thô
│   └── import_data.py             # Nạp xe (cars) và reviews từ CSV vào Supabase
├── images/                      # Nhóm xử lý hình ảnh xe
│   ├── update_images.py           # Pipeline tải ảnh xe đa luồng (Wikimedia/Wikipedia)
│   ├── cleanup_images.py          # Dọn dẹp/reset URL ảnh lỗi trên DB và SQLite
│   └── car_images_cache.db        # File cache SQLite lưu URL ảnh xe nội bộ
├── embeddings/                  # Nhóm xử lý Vector Embeddings
│   ├── update_embeddings.py       # Pipeline sinh vector embedding đa luồng (Gemini API)
│   ├── sync_cache.py              # Đồng bộ cache embedding lên Supabase & dọn dẹp
│   └── embeddings_cache.db        # File cache SQLite lưu vector embeddings nội bộ
├── requirements.txt             # Danh sách thư viện Python phụ thuộc
├── .env / .env.example          # Cấu hình biến môi trường
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## Hướng Dẫn Sử Dụng Theo Chức Năng

### 1. Chuẩn bị môi trường

```bash
# Kích hoạt virtualenv từ thư mục gốc
source .venv/bin/activate

# Cài đặt thư viện phụ thuộc (nếu chưa có)
pip install -r data_pipeline/requirements.txt
```

---

### 2. Kiểm tra tiến độ tổng thể (`stats.py`)

Xem trạng thái hiện tại của toàn bộ Database (Reviews embeddings & Cars images):

```bash
python data_pipeline/stats.py
```

---

### 3. Nhóm Xử Lý Hình Ảnh Xe (`data_pipeline/images/`)

#### A. Cập nhật ảnh xe hàng loạt (`update_images.py`)

Tải ảnh chất lượng cao từ **Wikimedia Commons** & **Wikipedia API**, lưu cache SQLite và upsert vào Supabase:

- **Chạy toàn bộ 1,840 xe**:

  ```bash
  python data_pipeline/images/update_images.py --workers 4 --delay 0.2 --batch-size 20
  ```

- **Chạy thử nghiệm N xe** (ví dụ 10 xe):

  ```bash
  python data_pipeline/images/update_images.py --limit 10
  ```

- **Các cờ tùy chọn**:
  - `--workers N`: Số luồng chạy song song (mặc định: `4`).
  - `--delay SEC`: Khoảng nghỉ giữa các request để chống rate-limit (mặc định: `0.2`).
  - `--batch-size N`: Số xe upsert mỗi lần lên Supabase (mặc định: `20`).
  - `--dry-run`: Chỉ tải ảnh và lưu cache SQLite, không ghi vào Supabase.
  - `--force`: Bắt buộc cập nhật lại cả những xe đã có ảnh.

#### B. Dọn dẹp / Reset ảnh xe (`cleanup_images.py`)

- **Chỉ xóa các link ảnh lỗi (regcheck / placeholder)**:

  ```bash
  python data_pipeline/images/cleanup_images.py
  ```

- **Reset toàn bộ ảnh xe về NULL và xóa sạch SQLite cache**:
  ```bash
  python data_pipeline/images/cleanup_images.py --all
  ```

---

### 4. Nhóm Xử Lý Vector Embeddings (`data_pipeline/embeddings/`)

#### A. Sinh Vector Embeddings cho Reviews (`update_embeddings.py`)

Producer-Consumer đa luồng gọi Gemini Embedding API (sử dụng luân phiên các `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`,...):

```bash
python data_pipeline/embeddings/update_embeddings.py
```

#### B. Đồng bộ Cache Embeddings (`sync_cache.py`)

Đẩy các vector embedding trong `embeddings_cache.db` chưa có trên Supabase và dọn dẹp dung lượng file:

```bash
python data_pipeline/embeddings/sync_cache.py
```

---

### 5. Nhóm Khởi Tạo Dữ Liệu (`data_pipeline/ingestion/`)

#### Nạp dữ liệu ban đầu từ file CSV (`import_data.py`)

Đọc `merged_golden_reviews.csv`, tạo unique cars và reviews nạp vào Supabase:

```bash
python data_pipeline/ingestion/import_data.py
```

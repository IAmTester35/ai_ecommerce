# Quy trình Phát triển & Kiểm thử (Workflows) — AutoMatch AI

## Mục lục
- Cài đặt & Khởi chạy Môi trường Local
- Kiểm tra Type & Linting
- Khởi chạy Mobile App & FastAPI Backend
- Migration & Cập nhật Database Schema

---

## 1. Cài đặt Môi trường Local

### Bước 1: Python Virtual Environment (Backend & Pipeline)
```bash
# Khởi động virtualenv có sẵn trong repo
source .venv/bin/activate

# Hoặc tạo mới nếu cần
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Bước 2: Environment Variables
Đảm bảo đã khai báo các biến môi trường trong file `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-api-key
```

---

## 2. Khởi chạy Ứng dụng (Run Dev Servers)

### Khởi chạy Backend FastAPI (SSE Search Service)
```bash
source .venv/bin/activate
cd backend
uvicorn main:app --reload --port 8000
```

### Khởi chạy Mobile App (`ecommerce-car`)
```bash
cd ecommerce-car
npm install
npm run dev # Hoặc npx expo start
```

---

## 3. Kiểm tra Mã nguồn (Verification & Type Check)

### Chạy TypeScript Compiler Check (bắt buộc trước khi commit)
```bash
cd ecommerce-car
yarn tsc --noEmit && yarn lint
```

Checklist đảm bảo code đạt chuẩn:
- [ ] Không có lỗi TypeScript (`yarn tsc --noEmit && yarn lint` thành công 0 lỗi).
- [ ] Mọi hàm mới trong `services/` không import từ React/Zustand.
- [ ] Các store mới đều export qua `src/store/index.ts`.
- [ ] Các service mới đều export qua `src/services/index.ts`.

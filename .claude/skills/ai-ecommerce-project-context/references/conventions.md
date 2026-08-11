# Quy ước Code & Kiến trúc Layer — AutoMatch AI

## Mục lục
- Nguyên tắc Separation of Concerns (SoC)
- Quy ước đặt tên & cấu trúc file
- Quy tắc xử lý bất đồng bộ & Error Handling
- Quy tắc Commit & Merge Code

---

## 1. Nguyên tắc Separation of Concerns (SoC) — BẮT BUỘC

Ứng dụng di động (`ecommerce-car`) và các ứng dụng frontend tuân thủ nghiêm ngặt mô hình 3 tầng:

```
[UI Components / Screens]
         │ (chỉ đọc state & gọi action từ store)
         ▼
[Zustand Stores] (src/store/*)
         │ (quản lý state ứng dụng, gọi service)
         ▼
[Services Layer] (src/services/*)
         │ (chỉ thực hiện fetch API / Supabase queries)
         ▼
[Supabase Client / API Backend]
```

### Quy tắc từng tầng:

1. **Services Layer (`src/services/*.ts`)**:
   - Chứa logic gọi API pure TypeScript (`supabase.from(...)`, `supabase.rpc(...)`, SSE client).
   - Trả về data đã được parse/type hoặc throw Error.
   - **TUYỆT ĐỐI KHÔNG**: Sử dụng React hooks (`useState`, `useEffect`), không gọi Zustand store, không thao tác UI.

2. **Store Layer (`src/store/*.ts`)**:
   - Sử dụng Zustand để quản lý reactive state của ứng dụng (`items`, `isLoading`, `error`).
   - Gọi các hàm trong Services Layer và bắt lỗi (`try...catch`), cập nhật trạng thái `isLoading` và `error`.
   - **TUYỆT ĐỐI KHÔNG**: Viết trực tiếp câu lệnh Supabase query trong Store (`supabase.from(...)`). Mọi thao tác DB phải đi qua Services.

3. **UI Layer (`src/components/`, `src/app/`)**:
   - Sử dụng custom store hooks (`useAuthStore`, `useCarStore`, `useCartStore`, `useSearchStore`...).
   - **TUYỆT ĐỐI KHÔNG**: Import `supabaseClient` để query DB trực tiếp từ Component.

---

## 2. Quy ước Đặt tên & Cấu trúc File

- **File Service**: camelCase kèm hậu tố `Service.ts` (ví dụ: `carService.ts`, `authService.ts`, `cartService.ts`).
- **File Store**: camelCase dạng hook `use<Name>Store.ts` (ví dụ: `useAuthStore.ts`, `useCarStore.ts`).
- **Types / Interfaces**: PascalCase (ví dụ: `Profile`, `Car`, `SavedCar`, `TestDrive`, `Order`).
- **Export Barrels**: Mỗi thư mục `src/services` và `src/store` đều có `index.ts` re-export toàn bộ module.

---

## 3. Quy tắc Error Handling & Validation

- Mọi Service method khi gặp lỗi từ Supabase (`if (error) throw error`) đều phải ném lỗi rõ ràng để Store bắt và hiển thị thông báo thân thiện tới người dùng.
- Mọi hàm Insert/Update vào DB phải đảm bảo truyền đúng `user_id` nếu bảng không có `DEFAULT auth.uid()`.
- Các hàm sinh ID phiên (Session ID) phải dùng chuẩn UUID v4 (`crypto.randomUUID()`), không dùng `Math.random()`.

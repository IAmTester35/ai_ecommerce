# 🎨 AutoMatch AI - Minimalist Luxury Automotive Design System Standard

Bản tài liệu tiêu chuẩn thiết kế (Design System & Standards) đồng bộ cho toàn bộ hệ thống ứng dụng thương mại điện tử ô tô **AutoMatch AI**.

---

## 1. Triết Lý Thiết Kế (Design Philosophy)

Ứng dụng hướng đến phong cách **Minimalist Luxury Automotive Dark Theme** (Porsche, Polestar, Tesla, Apple):

- **Tối giản & Đẳng cấp:** Tông nền Obsidian Graphite (`#090A0C`, `#11141B`, `#171B24`) với các đường viền siêu mỏng (`rgba(255,255,255,0.08)`), không gian thoáng đãng, mang lại trải nghiệm buồng lái kỹ thuật số hiện đại.
- **Điểm nhấn tinh tế:** Màu xanh Sapphire (`#3B82F6`) và Indigo (`#6366F1`) thanh lịch, phản ánh công nghệ AI thông minh mà không gây chói mắt.
- **Biểu tượng vector chuẩn hóa:** 100% sử dụng `@expo/vector-icons` (`Ionicons`), loại bỏ hoàn toàn emoji để tạo cảm giác chuyên nghiệp, cao cấp.
- **Typography tinh gọn:** Giảm cỡ chữ, phân cấp thông tin rõ ràng, loại bỏ văn bản thừa và từ ngữ hoa mỹ.

---

## 2. Bảng Màu Tiêu Chuẩn (Color Tokens)

```typescript
export const colors = {
  // Nền & Bề mặt
  background: "#090A0C", // Nền chính đen Obsidian
  surface: "#11141B", // Bề mặt cấp 1 (Header, Tab bar, Containers)
  surfaceElevated: "#171B24", // Bề mặt cấp 2 (Thẻ xe, Form inputs, Bottom sheets)
  surfaceGlass: "rgba(17, 20, 27, 0.90)", // Hiệu ứng kính mờ (Glassmorphism)
  surfaceSubtle: "rgba(255, 255, 255, 0.03)",

  // Đường viền & Phân cách
  border: "rgba(255, 255, 255, 0.08)", // Viền tiêu chuẩn
  borderHighlight: "rgba(59, 130, 246, 0.35)",

  // Màu thương hiệu & Điểm nhấn
  primary: "#3B82F6", // Sapphire Blue (Hành động chính, Giá tiền, Điểm nhấn)
  primaryMuted: "rgba(59, 130, 246, 0.12)",
  secondary: "#6366F1", // Soft Indigo (Tag AI, So sánh)
  secondaryMuted: "rgba(99, 102, 241, 0.12)",

  // Trạng thái ngữ nghĩa (Semantic)
  conflict: "#F59E0B", // Warm Amber (Sao đánh giá, Lưu ý)
  conflictMuted: "rgba(245, 158, 11, 0.12)",
  success: "#10B981", // Emerald (Đã thanh toán, Sẵn xe, Đã duyệt)
  danger: "#EF4444", // Rose Red (Xóa, Hủy đơn)

  // Màu chữ (Typography)
  text: "#F8FAFC", // Chữ chính (Ice White)
  textSecondary: "#94A3B8", // Chữ phụ (Soft Slate)
  textMuted: "#64748B", // Chữ chú thích, thời gian
  textDark: "#090A0C", // Chữ đen trên nền sáng
};
```

---

## 3. Hệ Thống Spacing & Bo Góc (Spacing & Radii)

| Token         | Giá trị (px) | Ứng dụng                                    |
| :------------ | :----------- | :------------------------------------------ |
| `spacing.xs`  | `4px`        | Khoảng cách icon nhỏ, tag badge             |
| `spacing.sm`  | `8px`        | Khoảng cách giữa các chip, padding nút nhỏ  |
| `spacing.md`  | `12px`       | Padding trong của card nhỏ, gutter          |
| `spacing.lg`  | `16px`       | Padding lề chuẩn màn hình (`screenPadding`) |
| `spacing.xl`  | `20px`       | Khoảng cách giữa các section                |
| `radii.sm`    | `6px`        | Bo góc nút nhỏ, input, chip                 |
| `radii.md`    | `10px`       | Bo góc ảnh thumbnail, card danh sách        |
| `radii.lg`    | `14px`       | Bo góc thẻ sản phẩm lớn, modal, sheet       |
| `radii.full`  | `9999px`     | Bo tròn hoàn toàn (Pill, Avatar, Icon tròn) |

---

## 4. Danh Sách UI Primitives Chuẩn Hóa (`src/components/ui/`)

1. **`Button`**: Tối giản, gọn gàng với 6 biến thể, icon vector trái/phải.
2. **`Badge`**: Tag thông tin thanh mảnh, hỗ trợ chấm trạng thái `dot`.
3. **`Card`**: Khung chứa tối giản với viền mờ tự nhiên.
4. **`Input`**: Trường nhập liệu với icon vector định dạng, nhãn chữ nhỏ gọn.
5. **`SearchBar`**: Thanh tìm kiếm tinh tế kèm nút xóa nhanh và phím tắt AI.
6. **`PillFilter`**: Thanh cuộn chọn danh mục xe dạng viên thuốc (Pill).
7. **`RatingStars`**: Hệ thống hiển thị sao Amber Gold sắc nét.
8. **`PriceTag`**: Hiển thị giá tiền định dạng chuẩn Việt Nam kèm dự toán trả góp tự động.
9. **`SectionHeader`**: Tiêu đề phân mục có liên kết "Xem tất cả" và icon vector.
10. **`EmptyState`**: Màn hình rỗng có minh họa icon vector và nút điều hướng.
11. **`ModalSheet`**: Bottom sheet trượt mượt mà cho bộ lọc, đặt lái thử, dự toán vay và đánh giá xe.


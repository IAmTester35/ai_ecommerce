# 🎨 AutoMatch AI - Minimalist Luxury Automotive Design System (Light Mode Admin Standard)

Bản đặc tả tiêu chuẩn thiết kế (Design System Standards) cho nền tảng quản trị **AutoMatch AI Admin Dashboard**, đồng bộ phong cách tối giản sang trọng của ngành ô tô cao cấp (Porsche, Tesla, Polestar Studio) trong không gian giao diện **Light Mode**.

---

## 1. Triết Lý Thiết Kế (Design Philosophy)

1. **Thanh Lịch & Sang Trọng (Minimalist Luxury):**
   - Không gian trắng sáng, sạch sẽ với tông nền **Porcelain White** (`#F8FAFC`, `#FFFFFF`) kết hợp các đường viền siêu mỏng (`#E2E8F0` / `rgba(0,0,0,0.06)`).
   - Đem lại cảm giác trực quan, chuẩn xác như buồng điều khiển của một hãng xe cao cấp.

2. **Điểm Nhấn Công Nghệ (Sapphire & Indigo):**
   - **Sapphire Blue (`#2563EB`)**: Đại diện cho sự tin cậy, hành động chính, trạng thái tích cực, giá tiền.
   - **Soft Indigo (`#4F46E5`)**: Biểu trưng cho công nghệ AI, thuật toán Vector Search và xử lý mâu thuẫn (Conflict Resolution).

3. **Phân Cấp Thị Giác Sắc Nét (Visual Hierarchy):**
   - Thông tin số liệu (KPIs) to bản, dễ đọc.
   - Tối ưu diện tích hiển thị bảng biểu, lọc dữ liệu nhanh, thao tác đơn giản và dứt khoát.

---

## 2. Bảng Màu Tiêu Chuẩn (Color Tokens)

```typescript
export const colors = {
  // Nền & Bề mặt (Light Mode Surfaces)
  background: "#F8FAFC",       // Slate 50 - Nền ứng dụng chính
  surface: "#FFFFFF",          // Trắng thuần - Thẻ Card, Table, Header, Sidebar
  surfaceSubtle: "#F1F5F9",    // Slate 100 - Bề mặt phụ, input background, hover
  surfaceElevated: "#FFFFFF",  // Modal, Drawer, Popover
  surfaceMuted: "#E2E8F0",     // Slate 200 - Phân cách nhẹ

  // Đường viền & Phân chia (Borders)
  border: "#E2E8F0",           // Slate 200 - Viền tiêu chuẩn
  borderSubtle: "#F1F5F9",     // Slate 100 - Viền siêu nhạt
  borderFocus: "rgba(37, 99, 235, 0.4)", // Viền Sapphire khi active/focus

  // Màu thương hiệu & Điểm nhấn (Brand Accents)
  primary: "#2563EB",          // Blue 600 - Sapphire Blue (Nút chính, link, active)
  primaryHover: "#1D4ED8",     // Blue 700 - Hover nút chính
  primarySubtle: "#EFF6FF",    // Blue 50 - Background badge, menu active
  
  secondary: "#4F46E5",        // Indigo 600 - Soft Indigo (AI Features)
  secondaryHover: "#4338CA",   // Indigo 700
  secondarySubtle: "#EEF2FF",  // Indigo 50 - AI Badge background

  // Trạng thái ngữ nghĩa (Semantic Status)
  success: "#059669",          // Emerald 600 - Đã cọc, thanh toán xong, sẵn xe
  successSubtle: "#ECFDF5",    // Emerald 50
  
  warning: "#D97706",          // Amber 600 - Chờ xử lý, mâu thuẫn logic, lịch hẹn mới
  warningSubtle: "#FFFBEB",    // Amber 50
  
  danger: "#DC2626",           // Red 600 - Hủy đơn, xóa dữ liệu, lỗi hệ thống
  dangerSubtle: "#FEF2F2",     // Red 50
  
  info: "#0284C7",             // Sky 600 - Đang chuẩn bị xe, hướng dẫn
  infoSubtle: "#F0F9FF",       // Sky 50

  // Màu chữ (Typography)
  textPrimary: "#0F172A",      // Slate 900 - Tiêu đề, số liệu chính
  textSecondary: "#475569",    // Slate 600 - Nhãn form, phụ đề
  textMuted: "#94A3B8",        // Slate 400 - Placeholder, ngày tháng, helper text
  textInverse: "#FFFFFF",      // Trắng trên nền đậm
};
```

---

## 3. Hệ Thống Spacing, Radius & Bóng Đổ (Tokens)

| Token | Giá trị | Ứng dụng |
| :--- | :--- | :--- |
| `radii.sm` | `6px` | Tag nhỏ, input, button nhỏ |
| `radii.md` | `10px` | Button chuẩn, dropdown, input lớn |
| `radii.lg` | `14px` | Card, table wrapper, widget |
| `radii.xl` | `20px` | Modal, drawer, header container |
| `radii.full` | `9999px` | Pill status, Avatar, Round Icon Button |

| Shadow | Cấu hình | Ứng dụng |
| :--- | :--- | :--- |
| `shadow.xs` | `0 1px 2px rgba(0,0,0,0.04)` | Button, input nhẹ |
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Card thông thường |
| `shadow.md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)` | Card nổi bật, Popover |
| `shadow.xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | Modal, Drawer |

---

## 4. UI Primitives Tiêu Chuẩn

1. **`Button`**: 6 biến thể (`primary`, `secondary`, `outline`, `ghost`, `danger`, `subdued`) có hỗ trợ vector icon và loading spinner.
2. **`Badge`**: Hiển thị trạng thái gọn gàng với chấm tròn chỉ thị màu và biến thể `pill` hoặc `square`.
3. **`MetricCard`**: Thẻ hiển thị chỉ số KPI thông minh, kèm xu hướng tăng/giảm phần trăm và biểu tượng vector phong cách sang trọng.
4. **`Table`**: Bảng dữ liệu chuẩn Enterprise với phân trang, bộ lọc nhanh, highlight khi hover và hỗ trợ format tiền tệ VNĐ.
5. **`Drawer / Modal`**: Khung trượt hoặc hộp thoại mượt mà để xem chi tiết đơn hàng, thêm xe và sửa hợp đồng.

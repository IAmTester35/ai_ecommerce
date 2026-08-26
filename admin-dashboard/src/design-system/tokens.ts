/**
 * AutoMatch AI - Minimalist Luxury Automotive Design System Tokens (Light Mode)
 */

export const colors = {
  // Backgrounds & Surfaces
  background: "#F8FAFC",       // Slate 50 - Base app canvas
  surface: "#FFFFFF",          // Pure White - Cards, table panels
  surfaceSubtle: "#F1F5F9",    // Slate 100 - Secondary containers, tag backgrounds
  surfaceElevated: "#FFFFFF",  // Modals, Popovers, Drawers
  surfaceMuted: "#E2E8F0",     // Slate 200 - Borders, Dividers

  // Borders
  border: "#E2E8F0",           // Slate 200
  borderSubtle: "#F1F5F9",     // Slate 100
  borderFocus: "rgba(37, 99, 235, 0.4)", // Sapphire Blue Focus Ring

  // Brand Accents
  primary: "#2563EB",          // Sapphire Blue (Main CTA, links)
  primaryHover: "#1D4ED8",     // Blue 700
  primarySubtle: "#EFF6FF",    // Blue 50
  
  secondary: "#4F46E5",        // Soft Indigo (AI & Smart features)
  secondaryHover: "#4338CA",   // Indigo 700
  secondarySubtle: "#EEF2FF",  // Indigo 50

  // Semantic Status
  success: "#059669",          // Emerald 600
  successSubtle: "#ECFDF5",    // Emerald 50
  successBorder: "#A7F3D0",    // Emerald 200
  
  warning: "#D97706",          // Amber 600
  warningSubtle: "#FFFBEB",    // Amber 50
  warningBorder: "#FDE68A",    // Amber 200

  danger: "#DC2626",           // Rose Red 600
  dangerSubtle: "#FEF2F2",     // Rose Red 50
  dangerBorder: "#FECACA",     // Rose Red 200

  info: "#0284C7",             // Sky 600
  infoSubtle: "#F0F9FF",       // Sky 50
  infoBorder: "#BAE6FD",       // Sky 200

  // Typography
  textPrimary: "#0F172A",      // Slate 900
  textSecondary: "#475569",    // Slate 600
  textMuted: "#94A3B8",        // Slate 400
  textInverse: "#FFFFFF",      // White
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  full: "9999px",
} as const;

export const shadows = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
} as const;

export const statusMap = {
  // Order Statuses
  pending: {
    label: "Chờ xử lý",
    color: colors.warning,
    bg: colors.warningSubtle,
    border: colors.warningBorder,
    dotColor: "bg-amber-500",
  },
  deposit_paid: {
    label: "Đã cọc",
    color: colors.primary,
    bg: colors.primarySubtle,
    border: "#BFDBFE",
    dotColor: "bg-blue-600",
  },
  preparing_car: {
    label: "Chuẩn bị xe",
    color: colors.info,
    bg: colors.infoSubtle,
    border: colors.infoBorder,
    dotColor: "bg-sky-500",
  },
  ready_for_pickup: {
    label: "Sẵn sàng bàn giao",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dotColor: "bg-purple-600",
  },
  completed: {
    label: "Hoàn tất",
    color: colors.success,
    bg: colors.successSubtle,
    border: colors.successBorder,
    dotColor: "bg-emerald-600",
  },
  cancelled: {
    label: "Đã hủy",
    color: colors.danger,
    bg: colors.dangerSubtle,
    border: colors.dangerBorder,
    dotColor: "bg-rose-500",
  },

  // Payment Status
  unpaid: {
    label: "Chưa thanh toán",
    color: colors.warning,
    bg: colors.warningSubtle,
    border: colors.warningBorder,
    dotColor: "bg-amber-500",
  },
  paid: {
    label: "Đã thanh toán",
    color: colors.success,
    bg: colors.successSubtle,
    border: colors.successBorder,
    dotColor: "bg-emerald-600",
  },
  refunded: {
    label: "Đã hoàn tiền",
    color: colors.textSecondary,
    bg: colors.surfaceSubtle,
    border: colors.border,
    dotColor: "bg-slate-500",
  },

  // Test Drive Status
  confirmed: {
    label: "Đã xác nhận",
    color: colors.primary,
    bg: colors.primarySubtle,
    border: "#BFDBFE",
    dotColor: "bg-blue-600",
  },

  // General Active / Inactive
  active: {
    label: "Đang hoạt động",
    color: colors.success,
    bg: colors.successSubtle,
    border: colors.successBorder,
    dotColor: "bg-emerald-600",
  },
  inactive: {
    label: "Tạm dừng",
    color: colors.textMuted,
    bg: colors.surfaceSubtle,
    border: colors.border,
    dotColor: "bg-slate-400",
  },
} as const;

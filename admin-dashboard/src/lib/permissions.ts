import type { UserRole } from '../types';

export type AppPermission =
  // Dashboard
  | 'VIEW_DASHBOARD'
  
  // Cars Inventory
  | 'CARS_VIEW'
  | 'CARS_CREATE'
  | 'CARS_UPDATE'
  | 'CARS_DELETE'
  
  // Orders & Deposits
  | 'ORDERS_VIEW'
  | 'ORDERS_UPDATE_STATUS'
  | 'ORDERS_DELETE'
  
  // Showrooms
  | 'SHOWROOMS_VIEW'
  | 'SHOWROOMS_CREATE'
  | 'SHOWROOMS_UPDATE'
  | 'SHOWROOMS_DELETE'
  | 'SHOWROOMS_DISTRIBUTE_RPC'
  
  // Vouchers
  | 'VOUCHERS_VIEW'
  | 'VOUCHERS_CREATE'
  | 'VOUCHERS_UPDATE'
  | 'VOUCHERS_DELETE'
  
  // Customers & Roles
  | 'USERS_VIEW'
  | 'USERS_CHANGE_ROLE'
  | 'USERS_DELETE'
  
  // Reviews & Q&A
  | 'REVIEWS_VIEW'
  | 'REVIEWS_DELETE'
  | 'QA_VIEW'
  | 'QA_ANSWER'
  | 'QA_DELETE'
  
  // Notifications
  | 'NOTIFICATIONS_VIEW'
  | 'NOTIFICATIONS_BROADCAST'
  
  // System & Database Settings
  | 'SETTINGS_VIEW'
  | 'SETTINGS_MANAGE';

/**
 * Role-Based Access Control (RBAC) Matrix
 * Explicitly defines what Owner vs Manager can do.
 */
const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  // OWNER: Super Admin with full system authority
  owner: [
    'VIEW_DASHBOARD',
    'CARS_VIEW',
    'CARS_CREATE',
    'CARS_UPDATE',
    'CARS_DELETE',
    'ORDERS_VIEW',
    'ORDERS_UPDATE_STATUS',
    'ORDERS_DELETE',
    'SHOWROOMS_VIEW',
    'SHOWROOMS_CREATE',
    'SHOWROOMS_UPDATE',
    'SHOWROOMS_DELETE',
    'SHOWROOMS_DISTRIBUTE_RPC',
    'VOUCHERS_VIEW',
    'VOUCHERS_CREATE',
    'VOUCHERS_UPDATE',
    'VOUCHERS_DELETE',
    'USERS_VIEW',
    'USERS_CHANGE_ROLE',
    'USERS_DELETE',
    'REVIEWS_VIEW',
    'REVIEWS_DELETE',
    'QA_VIEW',
    'QA_ANSWER',
    'QA_DELETE',
    'NOTIFICATIONS_VIEW',
    'NOTIFICATIONS_BROADCAST',
    'SETTINGS_VIEW',
    'SETTINGS_MANAGE',
  ],

  // MANAGER: Showroom Manager & Operations Admin
  // Restricted from: CARS_DELETE, ORDERS_DELETE, SHOWROOMS_DELETE, SHOWROOMS_DISTRIBUTE_RPC,
  //                   VOUCHERS_DELETE, USERS_CHANGE_ROLE, USERS_DELETE, SETTINGS_MANAGE
  manager: [
    'VIEW_DASHBOARD',
    'CARS_VIEW',
    'CARS_CREATE',
    'CARS_UPDATE',
    'ORDERS_VIEW',
    'ORDERS_UPDATE_STATUS',
    'SHOWROOMS_VIEW',
    'SHOWROOMS_CREATE',
    'SHOWROOMS_UPDATE',
    'VOUCHERS_VIEW',
    'VOUCHERS_CREATE',
    'VOUCHERS_UPDATE',
    'USERS_VIEW',
    'REVIEWS_VIEW',
    'REVIEWS_DELETE',
    'QA_VIEW',
    'QA_ANSWER',
    'NOTIFICATIONS_VIEW',
    'NOTIFICATIONS_BROADCAST',
    'SETTINGS_VIEW',
  ],

  // USER: Standard Storefront customer (Cannot access admin portal)
  user: [],
};

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role: UserRole | undefined | null, permission: AppPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Description of role capabilities for UI tooltips and badges
 */
export const ROLE_INFO: Record<UserRole, { label: string; tag: string; description: string; color: string; bg: string }> = {
  owner: {
    label: 'Chủ Sở Hữu Duy Nhất (Super Admin)',
    tag: 'OWNER',
    description: 'Toàn quyền điều hành tối cao: Bổ nhiệm & quản lý Manager, phân bổ kho xe RPC, xóa xe/voucher/đơn hàng, cấu hình RLS.',
    color: '#4F46E5',
    bg: '#EEF2FF',
  },
  manager: {
    label: 'Quản Lý Showroom (Manager)',
    tag: 'MANAGER',
    description: 'Quản lý kho xe, duyệt hợp đồng đặt cọc, duyệt lịch lái thử, giải đáp Q&A, gửi thông báo push.',
    color: '#0284C7',
    bg: '#E0F2FE',
  },
  user: {
    label: 'Khách Hàng (User)',
    tag: 'USER',
    description: 'Tài khoản khách hàng mua xe và đặt lịch lái thử trên ứng dụng thương mại điện tử.',
    color: '#64748B',
    bg: '#F1F5F9',
  },
};

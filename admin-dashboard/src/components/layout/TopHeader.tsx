import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Database,
  Plus,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { NavView } from './Sidebar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../lib/utils';
import { ROLE_INFO } from '../../lib/permissions';

interface TopHeaderProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenMobileMenu?: () => void;
  onQuickAddCar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  onSelectView,
  onOpenMobileMenu,
  onQuickAddCar,
}) => {
  const { notifications, markNotificationRead, isLiveSupabase } = useData();
  const { currentUser, role, signOut, can } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const currentRoleInfo = role ? ROLE_INFO[role] : ROLE_INFO.manager;

  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Trung tâm chỉ huy & Báo cáo tổng thể hệ thống AutoMatch AI',
    },
    cars: {
      title: 'Kho Xe & Mạng Lưới Showroom',
      subtitle: 'Danh mục xe sang, tồn kho chi nhánh và điều phối trưng bày',
    },
    orders: {
      title: 'Đơn Hàng Đặt Cọc & Lịch Hẹn Lái Thử',
      subtitle: 'Theo dõi tiến trình cọc xe online, thanh toán ZaloPay và lịch trải nghiệm',
    },
    customers: {
      title: 'Khách Hàng CRM & Ban Điều Hành',
      subtitle: 'Danh bạ khách hàng CRM, hồ sơ giao dịch và phân quyền nhân sự',
    },
    marketing: {
      title: 'Marketing & Chăm Sóc Khách Hàng',
      subtitle: 'Chiến dịch voucher ưu đãi, đánh giá xe Vector AI và thông báo Push',
    },
    settings: {
      title: 'Cấu Hình Hệ Thống & Kết Nối Database',
      subtitle: 'Trạng thái kết nối Supabase PostgreSQL, FastAPI AI Core và Backup',
    },
  };

  const currentInfo = viewTitles[currentView] || {
    title: 'Admin Dashboard',
    subtitle: 'Hệ thống quản trị',
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-10 lg:px-12 py-3.5">
      <div className="max-w-384 w-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-slate-400 font-medium">AutoMatch AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-semibold text-sm tracking-tight">{currentInfo.title}</span>
          </div>
        </div>
      </div>

      {/* Right: Status Pill, Add Car CTA & Notification Popover */}
      <div className="flex items-center gap-3">
        {/* Supabase Connection Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium">
          <Database className={`w-3.5 h-3.5 ${isLiveSupabase ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span className="text-slate-600">
            {isLiveSupabase ? 'Supabase Live DB' : 'Supabase Disconnected'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* Quick Add Car Action */}
        {onQuickAddCar && can('CARS_CREATE') && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onQuickAddCar}
            className="hidden sm:inline-flex"
          >
            Thêm Xe Mới
          </Button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-100">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Thông Báo Hệ Thống</h4>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {unreadCount} mới
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => {
                    notifications.forEach((n) => markNotificationRead(n.id));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Không có thông báo nào</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                        !notif.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.content}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {formatDateTime(notif.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectView('marketing');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 w-full cursor-pointer"
                >
                  Xem tất cả thông báo
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 py-1 pr-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <img
              src={
                currentUser?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt="Profile"
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-32">
                {currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Admin'}
              </p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.2 rounded-md uppercase inline-block mt-0.5"
                style={{ backgroundColor: currentRoleInfo.bg, color: currentRoleInfo.color }}
              >
                {currentRoleInfo.tag}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden py-2 text-left animate-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.full_name || 'Admin'}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
              </div>

              <div className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Quyền: </span>
                {currentRoleInfo.label}
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                }}
                className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};

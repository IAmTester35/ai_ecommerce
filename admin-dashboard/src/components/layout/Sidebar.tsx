import React from 'react';
import {
  LayoutDashboard,
  Car as CarIcon,
  ShoppingBag,
  Calendar,
  Building2,
  Ticket,
  Users,
  MessageSquare,
  Sparkles,
  Bell,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export type NavView =
  | 'dashboard'
  | 'cars'
  | 'orders'
  | 'test_drives'
  | 'showrooms'
  | 'vouchers'
  | 'customers'
  | 'reviews_qa'
  | 'ai_inspector'
  | 'notifications'
  | 'settings';

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ReactNode;
  isSpecial?: boolean;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed = false,
}) => {
  const { metrics, notifications } = useData();
  const { currentUser, switchRole } = useAuth();

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  const navItems: NavGroup[] = [
    {
      group: 'Tổng Quan',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'ai_inspector',
          label: 'AI Vector & Conflict Hub',
          icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
          isSpecial: true,
        },
      ],
    },
    {
      group: 'Quản Lý Kho & Giao Dịch',
      items: [
        {
          id: 'cars',
          label: 'Kho Xe & Thông Số',
          icon: <CarIcon className="w-4 h-4" />,
          badge: metrics.activeCars,
        },
        {
          id: 'orders',
          label: 'Hợp Đồng & Đặt Cọc',
          icon: <ShoppingBag className="w-4 h-4" />,
          badge: metrics.pendingOrders > 0 ? `${metrics.pendingOrders} mới` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          id: 'test_drives',
          label: 'Lịch Hẹn Lái Thử',
          icon: <Calendar className="w-4 h-4" />,
          badge: metrics.testDrivesThisWeek > 0 ? metrics.testDrivesThisWeek : undefined,
          badgeColor: 'bg-blue-100 text-blue-800',
        },
      ],
    },
    {
      group: 'Hệ Thống Phân Phối',
      items: [
        {
          id: 'showrooms',
          label: 'Mạng Lưới Showroom',
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          id: 'vouchers',
          label: 'Khuyến Mãi & Voucher',
          icon: <Ticket className="w-4 h-4" />,
        },
        {
          id: 'customers',
          label: 'Khách Hàng & Quyền',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'reviews_qa',
          label: 'Đánh Giá & Q&A AI',
          icon: <MessageSquare className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Hệ Thống',
      items: [
        {
          id: 'notifications',
          label: 'Thông Báo Push',
          icon: <Bell className="w-4 h-4" />,
          badge: unreadNotifs > 0 ? unreadNotifs : undefined,
          badgeColor: 'bg-rose-100 text-rose-800',
        },
        {
          id: 'settings',
          label: 'Cấu Hình & Kết Nối DB',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-white border-r border-slate-200/80 flex flex-col justify-between z-30 transition-all duration-200 select-none shrink-0',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">AutoMatch</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/60 px-1.5 py-0.2 rounded-md">
                  AI Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Luxury Automotive Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.group}
              </p>
            )}

            {group.items.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer group',
                    isActive
                      ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                    isCollapsed ? 'justify-center px-0 py-3' : ''
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                    )}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== undefined && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold rounded-full',
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile & Role Switcher Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        {!isCollapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 px-2">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.full_name || 'Admin'}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.full_name || 'Admin User'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-semibold text-blue-600 uppercase">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Role Switcher for Testing/Role Demonstration */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => switchRole('owner')}
                className={cn(
                  'flex-1 text-[10px] font-bold py-1 rounded-lg transition-all',
                  currentUser.role === 'owner'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Owner
              </button>
              <button
                onClick={() => switchRole('manager')}
                className={cn(
                  'flex-1 text-[10px] font-bold py-1 rounded-lg transition-all',
                  currentUser.role === 'manager'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Manager
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={currentUser.full_name || 'Admin'}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

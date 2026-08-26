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
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ROLE_INFO } from '../../lib/permissions';

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
  const { currentUser, signOut, role } = useAuth();

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const currentRoleInfo = role ? ROLE_INFO[role] : ROLE_INFO.manager;

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
          badge: metrics.activeCars > 0 ? metrics.activeCars : undefined,
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

      {/* Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.full_name || 'Admin'}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.full_name || 'Admin User'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.2 rounded-md uppercase"
                    style={{ backgroundColor: currentRoleInfo.bg, color: currentRoleInfo.color }}
                  >
                    {currentRoleInfo.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={currentUser?.full_name || 'Admin'}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
            />
            <button
              onClick={() => signOut()}
              title="Đăng Xuất"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

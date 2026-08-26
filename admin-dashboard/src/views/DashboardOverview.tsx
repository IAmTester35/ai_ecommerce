import React, { useMemo } from 'react';
import {
  DollarSign,
  Car,
  ShoppingBag,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/ui/MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { formatVND, formatVNDCompact, formatDateTime, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';
import type { NavView } from '../components/layout/Sidebar';

interface DashboardOverviewProps {
  onNavigate: (view: NavView) => void;
  onOpenAddCar: () => void;
}

const BRAND_COLORS = ['#2563EB', '#4F46E5', '#059669', '#D97706', '#0284C7', '#7C3AED', '#EC4899', '#64748B'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate, onOpenAddCar }) => {
  const { metrics, orders, testDrives, cars } = useData();
  const { can } = useAuth();

  const recentOrders = orders.slice(0, 5);
  const upcomingTestDrives = testDrives.filter((t) => t.status === 'confirmed' || t.status === 'pending').slice(0, 4);

  // Dynamic Monthly Revenue & Deposit Trend from Real Orders
  const monthlyRevenueData = useMemo(() => {
    if (!orders.length) {
      // Return 6 month window structure if no orders yet
      const months = ['T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
      return months.map((m) => ({ month: m, revenue: 0, deposit: 0, orders: 0 }));
    }

    const monthMap: Record<string, { month: string; revenue: number; deposit: number; orders: number }> = {};
    orders.forEach((ord) => {
      const d = ord.created_at ? new Date(ord.created_at) : new Date(2026, 0, 1);
      const mKey = `T${d.getMonth() + 1}`;
      if (!monthMap[mKey]) {
        monthMap[mKey] = { month: mKey, revenue: 0, deposit: 0, orders: 0 };
      }
      monthMap[mKey].revenue += Number(ord.total_amount || 0);
      monthMap[mKey].deposit += Number(ord.deposit_amount || 0);
      monthMap[mKey].orders += 1;
    });

    const data = Object.values(monthMap);
    return data.length > 0
      ? data
      : [{ month: 'T1', revenue: 0, deposit: 0, orders: 0 }];
  }, [orders]);

  // Dynamic Brand Distribution from Real Cars in Supabase
  const brandPopularityData = useMemo(() => {
    if (!cars.length) {
      return [{ name: 'Đang tải xe...', count: 0, color: '#94A3B8' }];
    }

    const makeCount: Record<string, number> = {};
    cars.forEach((c) => {
      const make = c.make || 'Khác';
      makeCount[make] = (makeCount[make] || 0) + 1;
    });

    const sorted = Object.entries(makeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([name, count], idx) => ({
      name,
      count,
      color: BRAND_COLORS[idx % BRAND_COLORS.length],
    }));
  }, [cars]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick AI & Inventory Shortcut */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 text-left">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-spin" style={{ animationDuration: '4s' }} />
            Hệ Thống Trợ Lý AI Tìm Kiếm & Xử Lý Mâu Thuẫn Hoạt Động 100%
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trung Tâm Điều Hành Bán Lẻ Ô Tô AutoMatch AI
          </h2>

          <p className="text-sm text-blue-100/90 leading-relaxed">
            Theo dõi dòng tiền cọc trực tuyến, phân bổ tồn kho xe theo Showroom, duyệt lịch hẹn lái thử và giám sát thuật toán Hybrid RAG theo thời gian thực.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-indigo-200" />}
              onClick={() => onNavigate('ai_inspector')}
              className="bg-white text-blue-900 hover:bg-blue-50 border-none font-bold shadow-md"
            >
              Mở AI Vector & Conflict Hub
            </Button>
            {can('CARS_CREATE') && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Car className="w-4 h-4 text-white" />}
                onClick={onOpenAddCar}
                className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
              >
                Nhập Xe Vào Kho
              </Button>
            )}
          </div>
        </div>

        {/* Decorative Background Blur Glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Core Executive Metric Cards (Calculated from Real Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Tổng Tiền Cọc Đã Thu"
          value={formatVNDCompact(metrics.totalDeposit)}
          change={metrics.totalDeposit > 0 ? 100 : 0}
          changePeriod="từ hợp đồng đặt cọc"
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border border-emerald-100"
          subtitle="Thu qua ZaloPay & Chuyển khoản"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Xe Sẵn Sàng Giao"
          value={`${metrics.activeCars || cars.length} mẫu xe`}
          change={cars.length}
          changePeriod="tổng số xe trong DB"
          icon={<Car className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600 border border-blue-100"
          subtitle="Dữ liệu thực từ Supabase"
          onClick={() => onNavigate('cars')}
        />

        <MetricCard
          title="Hợp Đồng Đặt Cọc"
          value={`${metrics.totalOrders} đơn`}
          change={metrics.pendingOrders}
          changePeriod={`${metrics.pendingOrders} đơn chờ duyệt`}
          icon={<ShoppingBag className="w-6 h-6" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-100"
          subtitle="Hợp đồng điện tử online"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Lịch Lái Thử Tuần Này"
          value={`${metrics.testDrivesThisWeek} cuộc hẹn`}
          change={testDrives.length}
          changePeriod="tổng lịch hẹn khách hàng"
          icon={<Calendar className="w-6 h-6" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-100"
          subtitle="Tại mạng lưới Showroom"
          onClick={() => onNavigate('test_drives')}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Deposit Trend Chart (2 columns) */}
        <Card className="lg:col-span-2 text-left">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Xu Hướng Doanh Số & Dòng Tiền Đặt Cọc
              </CardTitle>
              <CardDescription>Biểu đồ dòng tiền cọc thực thu từ cơ sở dữ liệu Supabase</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-blue-600" /> Tiền cọc (VNĐ)
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}T`}
                />
                <Tooltip
                  formatter={(val) => [formatVND(Number(val)), 'Tiền Cọc']}
                  labelFormatter={(label) => `Tháng ${label}`}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deposit"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDeposit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Brand Distribution Breakdown (1 column) */}
        <Card className="text-left">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Cơ Cấu Thương Hiệu
              </CardTitle>
              <CardDescription>Top thương hiệu xe trong kho Supabase</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-between">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandPopularityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {brandPopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} mẫu xe`, String(name)]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      borderColor: '#E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              {brandPopularityData.map((b) => (
                <div key={b.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-slate-600 truncate">{b.name}</span>
                  <span className="font-bold text-slate-900 ml-auto">{b.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section: Recent Orders & Upcoming Test Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Recent Orders (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                Hợp Đồng Đặt Cọc Gần Đây
              </CardTitle>
              <CardDescription>Giao dịch mua xe trực tuyến mới phát sinh</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => onNavigate('orders')}
            >
              Xem tất cả
            </Button>
          </CardHeader>

          <div className="p-0 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có giao dịch đặt cọc nào được ghi nhận trong cơ sở dữ liệu.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Đơn / Khách Hàng</TableHead>
                    <TableHead>Mẫu Xe</TableHead>
                    <TableHead>Tiền Cọc (VNĐ)</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Thanh Toán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((ord) => {
                    const statusInfo = statusMap[ord.status as keyof typeof statusMap] || {
                      label: ord.status,
                      bg: '#F1F5F9',
                      color: '#475569',
                      dotColor: 'bg-slate-500',
                    };
                    const paymentInfo = statusMap[ord.deposit_status as keyof typeof statusMap] || {
                      label: ord.deposit_status,
                      bg: '#F1F5F9',
                      color: '#475569',
                    };

                    const carName = ord.items?.[0]?.car
                      ? `${ord.items[0].car.make} ${ord.items[0].car.model}`
                      : 'Giao dịch xe';

                    return (
                      <TableRow key={ord.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs uppercase">{ord.id.slice(0, 8)}</div>
                          <div className="text-xs text-slate-500">
                            {ord.profile?.full_name || ord.profile?.email || 'Khách vãng lai'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-800 text-xs">{carName}</span>
                          <div className="text-[11px] text-slate-400">
                            {ord.showroom?.name?.split('-')[0] || 'Showroom trung tâm'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-blue-600 text-xs">
                            {formatVND(ord.deposit_amount)}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Tổng: {formatVNDCompact(ord.total_amount)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dotColor)} />
                            {statusInfo.label}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={ord.deposit_status === 'paid' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {paymentInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Upcoming Test Drives (1 column) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Lịch Lái Thử Sắp Tới
              </CardTitle>
              <CardDescription>Khách hàng đã đặt lịch trải nghiệm</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => onNavigate('test_drives')}
            >
              Chi tiết
            </Button>
          </CardHeader>

          <CardContent className="space-y-3.5 p-4">
            {upcomingTestDrives.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Không có lịch hẹn nào sắp tới</p>
            ) : (
              upcomingTestDrives.map((td) => (
                <div
                  key={td.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {td.profile?.full_name || 'Khách hàng VIP'}
                    </p>
                    <Badge variant={td.status === 'confirmed' ? 'primary' : 'warning'} size="sm">
                      {td.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ duyệt'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                    <Car className="w-3.5 h-3.5" />
                    <span>{td.car ? `${td.car.make} ${td.car.model}` : 'Xe lái thử'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(td.scheduled_date)}
                    </span>
                    <span className="truncate max-w-30">
                      {td.showroom?.city || 'Chi nhánh'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

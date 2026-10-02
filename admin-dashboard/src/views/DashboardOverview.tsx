import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Car,
  ShoppingBag,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Coins,
  Receipt,
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
import { formatUSD, formatUSDCompact, formatDateTime, cn } from '../lib/utils';
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

  // Date Range Filter State
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7_days' | 'this_month' | 'this_year'>('all');

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const now = new Date();

    return orders.filter((o) => {
      if (!o.created_at) return true;
      const d = new Date(o.created_at);

      if (dateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateRange === '7_days') {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateRange === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, dateRange]);

  // Dynamic Financial Metrics
  const activeOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
  const totalContractValue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalDepositCollected = filteredOrders
    .filter((o) => o.deposit_status === 'paid')
    .reduce((sum, o) => sum + Number(o.deposit_amount || 0), 0);
  const remainingDue = activeOrders
    .filter((o) => o.status !== 'completed')
    .reduce((sum, o) => sum + Number(o.remaining_amount || 0), 0);

  const conversionRate = testDrives.length > 0
    ? Number(((filteredOrders.length / testDrives.length) * 100).toFixed(1))
    : 0;

  const recentOrders = filteredOrders.slice(0, 5);
  const upcomingTestDrives = testDrives.filter((t) => t.status === 'confirmed' || t.status === 'pending').slice(0, 4);

  // Dynamic Monthly Revenue & Deposit Trend from Real Orders
  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    // Continuous timeline of the last 6 calendar months
    const monthKeys: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: `T${d.getMonth() + 1}`,
      });
    }

    const monthMap: Record<string, { month: string; revenue: number; deposit: number; orders: number }> = {};
    monthKeys.forEach((m) => {
      monthMap[m.key] = { month: m.label, revenue: 0, deposit: 0, orders: 0 };
    });

    filteredOrders.forEach((ord) => {
      const d = ord.created_at ? new Date(ord.created_at) : null;
      if (d) {
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (monthMap[key]) {
          monthMap[key].revenue += Number(ord.total_amount || 0);
          monthMap[key].deposit += Number(ord.deposit_amount || 0);
          monthMap[key].orders += 1;
        } else {
          monthMap[key] = {
            month: `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`,
            revenue: Number(ord.total_amount || 0),
            deposit: Number(ord.deposit_amount || 0),
            orders: 1,
          };
        }
      }
    });

    return Object.values(monthMap);
  }, [filteredOrders]);

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
    <div className="space-y-8 sm:space-y-10 text-left">
      {/* Sleek Executive Header & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-xs font-semibold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Hệ Thống Trợ Lý AI & Supabase Live
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Trung Tâm Điều Hành
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Báo cáo tài chính, tiến độ cọc xe ZaloPay và lịch trải nghiệm xe theo thời gian thực
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Date Filter Segmented Tabs */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold h-10">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'today', label: 'Hôm nay' },
              { key: '7_days', label: '7 ngày' },
              { key: 'this_month', label: 'Tháng này' },
              { key: 'this_year', label: 'Năm nay' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDateRange(tab.key as typeof dateRange)}
                className={cn(
                  'h-8 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  dateRange === tab.key
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {can('CARS_CREATE') && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<Car className="w-4 h-4 text-slate-700" />}
              onClick={onOpenAddCar}
              className="hidden sm:inline-flex"
            >
              Nhập Xe
            </Button>
          )}
        </div>
      </div>

      {/* 4 Primary Financial & Conversion KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
        <MetricCard
          title="Tổng Giá Trị Hợp Đồng"
          value={formatUSDCompact(totalContractValue)}
          change={filteredOrders.length}
          changePeriod="hợp đồng ký kết"
          icon={<Receipt className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600 border border-blue-100/60"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Tiền Cọc Thực Thu"
          value={formatUSDCompact(totalDepositCollected)}
          change={filteredOrders.filter((o) => o.deposit_status === 'paid').length}
          changePeriod="giao dịch đã cọc"
          icon={<Coins className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border border-emerald-100/60"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Còn Lại Thu Tại Showroom"
          value={formatUSDCompact(remainingDue)}
          change={activeOrders.length}
          changePeriod="đơn đang tiến hành"
          icon={<DollarSign className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-100/60"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Tỷ Lệ Chuyển Đổi (Lái Thử → Cọc)"
          value={`${conversionRate}%`}
          change={testDrives.length}
          changePeriod={`${testDrives.length} lượt hẹn`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-100/60"
          onClick={() => onNavigate('orders')}
        />
      </div>

      {/* Sleek Operational Summary Strip */}
      <div className="bg-white border border-slate-200/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => onNavigate('cars')}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100/60 flex items-center justify-center text-sky-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Xe Sẵn Sàng</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.activeCars || cars.length} <span className="text-xs font-normal text-slate-400">mẫu xe</span>
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100/60 flex items-center justify-center text-purple-600 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Hợp Đồng Chờ</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {filteredOrders.filter((o) => o.status === 'pending').length} <span className="text-xs font-normal text-slate-400">đơn</span>
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Lịch Lái Thử</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {upcomingTestDrives.length} <span className="text-xs font-normal text-slate-400">cuộc hẹn</span>
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('marketing')}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Hài Lòng</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.averageRating} <span className="text-xs font-normal text-slate-400">/ 5.0 ⭐</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Revenue & Deposit Trend Chart (2 columns) */}
        <Card className="lg:col-span-2 text-left">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Xu Hướng Dòng Tiền Hợp Đồng & Đặt Cọc
              </CardTitle>
              <CardDescription>Đối chiếu Tổng Giá Trị Xe và Tiền Cọc Thực Thu theo tháng</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Tiền cọc online
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300" /> Tổng hợp đồng
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatUSDCompact(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-300">{payload[0].payload.month}</p>
                          <p className="text-blue-400 font-semibold">
                            Tiền cọc: {formatUSD(payload[0].value as number)}
                          </p>
                          {payload[1] && (
                            <p className="text-indigo-300">
                              Tổng hợp đồng: {formatUSD(payload[1].value as number)}
                            </p>
                          )}
                          <p className="text-slate-400 text-[10px]">
                            Số lượng: {payload[0].payload.orders} hợp đồng
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deposit"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDeposit)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#818CF8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Brand Popularity Distribution (1 column) */}
        <Card className="text-left">
          <CardHeader>
            <div>
              <CardTitle>Cơ Cấu Thương Hiệu</CardTitle>
              <CardDescription>Top thương hiệu nhiều nhất trong kho</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandPopularityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {brandPopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs">
                            <span className="font-bold">{payload[0].name}:</span> {payload[0].value} xe
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2 pt-2">
              {brandPopularityData.map((brand) => (
                <div key={brand.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.color }} />
                    <span className="font-medium text-slate-700">{brand.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{brand.count} xe</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Split: Recent Orders & Upcoming Test Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 text-left">
        {/* Recent Orders */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Hợp Đồng Đặt Cọc Mới Nhất</CardTitle>
              <CardDescription>Các đơn đặt cọc vừa phát sinh trên nền tảng</CardDescription>
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
          <Table bare>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Đơn</TableHead>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Tiền Cọc</TableHead>
                <TableHead>Trạng Thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-400 text-xs">
                    Chưa có hợp đồng nào phát sinh
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((ord) => {
                  const statusConfig = statusMap[ord.status] || {
                    label: ord.status,
                    color: '#475569',
                    bg: '#F1F5F9',
                    border: '#E2E8F0',
                    dotColor: 'bg-slate-500',
                  };
                  return (
                    <TableRow key={ord.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        #{ord.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs text-slate-900">
                          {ord.profile?.full_name || 'Khách hàng'}
                        </div>
                        <div className="text-[11px] text-slate-500">{ord.profile?.email}</div>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-emerald-600">
                        {formatUSD(ord.deposit_amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                          {statusConfig.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Upcoming Test Drives */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Lịch Hẹn Lái Thử Sắp Tới</CardTitle>
              <CardDescription>Khách hàng đã đăng ký trải nghiệm xe tại Showroom</CardDescription>
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
          <div className="p-6 space-y-3.5">
            {upcomingTestDrives.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có lịch hẹn lái thử nào đang chờ xử lý
              </div>
            ) : (
              upcomingTestDrives.map((td) => (
                <div
                  key={td.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {td.car ? `${td.car.make} ${td.car.model}` : 'Mẫu xe lái thử'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Khách: <strong className="text-slate-700">{td.profile?.full_name || 'Khách hàng VIP'}</strong> • {td.showroom?.name?.split('-')[0] || 'Trung Tâm'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={td.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                      {td.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatDateTime(td.scheduled_date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

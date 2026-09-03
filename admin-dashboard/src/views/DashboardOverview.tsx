import React, { useState, useMemo } from 'react';
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
  Coins,
  Receipt,
  Filter,
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
  const { metrics, orders, testDrives, cars, reviews } = useData();
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
    if (!filteredOrders.length) {
      const months = ['T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
      return months.map((m) => ({ month: m, revenue: 0, deposit: 0, orders: 0 }));
    }

    const monthMap: Record<string, { month: string; revenue: number; deposit: number; orders: number }> = {};
    filteredOrders.forEach((ord) => {
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
    return data.length > 0 ? data : [{ month: 'T1', revenue: 0, deposit: 0, orders: 0 }];
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
    <div className="space-y-6">
      {/* Welcome Banner */}
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
            Theo dõi dòng tiền cọc trực tuyến, phân bổ tồn kho xe theo Showroom, duyệt lịch hẹn lái thử và đối soát ZaloPay theo thời gian thực.
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

        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Date Range Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Khoảng Thời Gian Báo Cáo Doanh Thu & Giao Dịch:</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'today', label: 'Hôm nay' },
            { key: '7_days', label: '7 ngày qua' },
            { key: 'this_month', label: 'Tháng này' },
            { key: 'this_year', label: 'Năm nay' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDateRange(tab.key as any)}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                dateRange === tab.key
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Standardized Financial & Conversion KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Tổng Giá Trị Hợp Đồng"
          value={formatVNDCompact(totalContractValue)}
          change={filteredOrders.length}
          changePeriod="từ tất cả xe ký kết"
          icon={<Receipt className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600 border border-blue-100"
          subtitle="Tổng giá trị niêm yết bán"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Tiền Cọc Thực Thu (Online)"
          value={formatVNDCompact(totalDepositCollected)}
          change={filteredOrders.filter((o) => o.deposit_status === 'paid').length}
          changePeriod="giao dịch đã khớp lệnh"
          icon={<Coins className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border border-emerald-100"
          subtitle="ZaloPay & Chuyển khoản"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Còn Lại Thu Tại Showroom"
          value={formatVNDCompact(remainingDue)}
          change={activeOrders.length}
          changePeriod="hợp đồng đang tiến hành"
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-100"
          subtitle="Tất toán khi nhận xe"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Tỷ Lệ Chuyển Đổi (Lái Thử → Cọc)"
          value={`${conversionRate}%`}
          change={testDrives.length}
          changePeriod={`${testDrives.length} lượt lái thử`}
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-100"
          subtitle="Hiệu quả phễu bán hàng"
          onClick={() => onNavigate('test_drives')}
        />
      </div>

      {/* 4 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Xe Sẵn Sàng Giao"
          value={`${metrics.activeCars || cars.length} mẫu xe`}
          change={cars.length}
          changePeriod="tổng số xe trong DB"
          icon={<Car className="w-6 h-6" />}
          iconBgColor="bg-sky-50 text-sky-600 border border-sky-100"
          subtitle="Dữ liệu thực từ Supabase"
          onClick={() => onNavigate('cars')}
        />

        <MetricCard
          title="Hợp Đồng Trong Kỳ"
          value={`${filteredOrders.length} hợp đồng`}
          change={filteredOrders.filter((o) => o.status === 'pending').length}
          changePeriod="đơn chờ duyệt"
          icon={<ShoppingBag className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600 border border-purple-100"
          subtitle="Quản lý tiến độ bàn giao"
          onClick={() => onNavigate('orders')}
        />

        <MetricCard
          title="Lịch Lái Thử Hẹn Trước"
          value={`${upcomingTestDrives.length} cuộc hẹn`}
          change={testDrives.length}
          changePeriod="tổng số lịch ghi nhận"
          icon={<Calendar className="w-6 h-6" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-100"
          subtitle="Tại mạng lưới Showroom"
          onClick={() => onNavigate('test_drives')}
        />

        <MetricCard
          title="Đánh Giá & Hài Lòng"
          value={`${metrics.averageRating} / 5.0 ⭐`}
          change={reviews.length}
          changePeriod={`${reviews.length} bài đánh giá`}
          icon={<Award className="w-6 h-6" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-100"
          subtitle="Vector HNSW RAG Context"
          onClick={() => onNavigate('reviews_qa')}
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
                Xu Hướng Dòng Tiền Hợp Đồng & Đặt Cọc
              </CardTitle>
              <CardDescription>Biểu đồ đối chiếu giữa Tổng Giá Trị Xe và Tiền Cọc Thực Thu</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-blue-600" /> Tiền cọc thu online
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-indigo-300" /> Tổng giá trị xe
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
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.2} />
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
                  tickFormatter={(val) => formatVNDCompact(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-300">{payload[0].payload.month}</p>
                          <p className="text-blue-400">
                            Tiền cọc: {formatVND(payload[0].value as number)}
                          </p>
                          {payload[1] && (
                            <p className="text-indigo-300">
                              Tổng hợp đồng: {formatVND(payload[1].value as number)}
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
            <CardTitle>Cơ Cấu Thương Hiệu Xe</CardTitle>
            <CardDescription>Top 5 thương hiệu xe nhiều nhất trong kho</CardDescription>
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
                          <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs">
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

            <div className="w-full space-y-1.5">
              {brandPopularityData.map((brand) => (
                <div key={brand.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
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
          <Table>
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
                        {formatVND(ord.deposit_amount)}
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
              onClick={() => onNavigate('test_drives')}
            >
              Xem tất cả
            </Button>
          </CardHeader>
          <div className="p-4 space-y-3">
            {upcomingTestDrives.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có lịch hẹn lái thử nào đang chờ xử lý
              </div>
            ) : (
              upcomingTestDrives.map((td) => (
                <div
                  key={td.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {td.car ? `${td.car.make} ${td.car.model}` : 'Mẫu xe lái thử'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Khách: <strong>{td.profile?.full_name || 'Khách hàng VIP'}</strong> • Showroom:{' '}
                        {td.showroom?.name?.split('-')[0] || 'Trung Tâm'}
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

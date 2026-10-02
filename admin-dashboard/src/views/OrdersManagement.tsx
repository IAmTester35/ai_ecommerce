import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  User,
  Building2,
  Eye,
  RefreshCw,
  Percent,
  Trash2,
  Car,
  Ban,
  RotateCcw,
  FileText,
  Download,
  ExternalLink,
  Printer,
  Calendar,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderStatus, PaymentStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatUSD, formatDateTime, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';
import { checkZaloPayStatus } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { TestDrivesView } from './TestDrivesView';

interface OrdersManagementProps {
  initialTab?: 'orders' | 'test_drives';
}

export const OrdersManagement: React.FC<OrdersManagementProps> = ({ initialTab = 'orders' }) => {
  const {
    orders,
    testDrives,
    showrooms,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    updateOrderShowroom,
    updateOrderContract,
    deleteOrder,
  } = useData();
  const { isOwner } = useAuth();
  const { success, info, error } = useToast();

  const [salesTab, setSalesTab] = useState<'orders' | 'test_drives'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setSalesTab(initialTab);
  }

  // Detail Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckingZalo, setIsCheckingZalo] = useState(false);

  // Order Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Contract URL Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractUrlInput, setContractUrlInput] = useState('');

  // Handover Sheet (Biên bản bàn giao) Modal State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const openOrderDrawer = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (status: OrderStatus, paymentStatus?: PaymentStatus) => {
    if (!selectedOrder) return;
    await updateOrderStatus(selectedOrder.id, status, paymentStatus, paymentStatus);
    setSelectedOrder((prev) =>
      prev
        ? {
          ...prev,
          status,
          ...(paymentStatus
            ? { deposit_status: paymentStatus, payment_status: paymentStatus }
            : {}),
        }
        : null
    );
  };

  const handleShowroomChange = async (newShowroomId: string) => {
    if (!selectedOrder || !newShowroomId) return;
    const ok = await updateOrderShowroom(selectedOrder.id, newShowroomId);
    if (ok) {
      const updatedShowroom = showrooms.find((s) => s.id === newShowroomId) || null;
      setSelectedOrder((prev) => (prev ? { ...prev, showroom_id: newShowroomId, showroom: updatedShowroom } : null));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản cấp Owner mới có quyền xóa đơn đặt cọc.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng #${orderId.slice(0, 8)} khỏi cơ sở dữ liệu?`)) {
      await deleteOrder(orderId);
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    }
  };

  // ZaloPay Status Reconciliation
  const handleCheckZaloPay = async () => {
    if (!selectedOrder) return;
    const transId = selectedOrder.app_trans_id;
    if (!transId) {
      info(
        'Cổng Thanh Toán ZaloPay',
        'Đơn hàng này chưa có mã giao dịch cổng ZaloPay (app_trans_id). Khách hàng có thể đã chọn thanh toán tiền mặt tại showroom.'
      );
      return;
    }

    setIsCheckingZalo(true);
    const res = await checkZaloPayStatus(transId);
    setIsCheckingZalo(false);

    if (res.return_code === 1) {
      success(
        'Khớp lệnh thành công',
        `Mã giao dịch ${transId} (${formatUSD(selectedOrder.deposit_amount)}) đã được xác nhận thanh toán trên cổng ZaloPay.`
      );
      if (selectedOrder.deposit_status === 'unpaid') {
        handleUpdateStatus('deposit_paid', 'paid');
      }
    } else {
      info('ZaloPay Gateway', res.return_message || 'Chưa ghi nhận thanh toán thành công trên cổng.');
    }
  };

  // Confirm Cancellation
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !cancelReason.trim()) return;

    setIsSubmittingCancel(true);
    const ok = await cancelOrder(selectedOrder.id, cancelReason.trim());
    setIsSubmittingCancel(false);

    if (ok) {
      setIsCancelModalOpen(false);
      setCancelReason('');
      setSelectedOrder((prev) =>
        prev
          ? {
            ...prev,
            status: 'cancelled',
            cancellation_reason: cancelReason.trim(),
            cancelled_at: new Date().toISOString(),
          }
          : null
      );
    }
  };

  // Confirm Refund
  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || refundAmount <= 0) return;

    setIsSubmittingRefund(true);
    const ok = await refundOrder(selectedOrder.id, refundAmount, refundReason.trim());
    setIsSubmittingRefund(false);

    if (ok) {
      setIsRefundModalOpen(false);
      setRefundReason('');
      setSelectedOrder((prev) =>
        prev
          ? {
            ...prev,
            payment_status: 'refunded',
            deposit_status: 'refunded',
            refund_amount: refundAmount,
            refund_reason: refundReason.trim(),
            refunded_at: new Date().toISOString(),
          }
          : null
      );
    }
  };

  // Save Contract URL
  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const ok = await updateOrderContract(selectedOrder.id, contractUrlInput.trim());
    if (ok) {
      setSelectedOrder((prev) => (prev ? { ...prev, contract_url: contractUrlInput.trim() } : null));
      setIsContractModalOpen(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((ord) => {
      const matchSearch =
        `${ord.id} ${ord.app_trans_id || ''} ${ord.profile?.full_name || ''} ${ord.profile?.email || ''} ${ord.items?.[0]?.car?.model || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || ord.status === filterStatus;
      const matchPayment = filterPayment === 'all' || ord.deposit_status === filterPayment;
      const matchShowroom = filterShowroom === 'all' || ord.showroom_id === filterShowroom;

      let matchDate = true;
      if (filterDateRange !== 'all' && ord.created_at) {
        const ordDate = new Date(ord.created_at);
        if (filterDateRange === 'today') {
          matchDate = ordDate.toDateString() === now.toDateString();
        } else if (filterDateRange === '7_days') {
          const diffDays = (now.getTime() - ordDate.getTime()) / (1000 * 3600 * 24);
          matchDate = diffDays <= 7;
        } else if (filterDateRange === 'this_month') {
          matchDate = ordDate.getMonth() === now.getMonth() && ordDate.getFullYear() === now.getFullYear();
        }
      }

      return matchSearch && matchStatus && matchPayment && matchShowroom && matchDate;
    });
  }, [orders, searchTerm, filterStatus, filterPayment, filterShowroom, filterDateRange]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      info('Xuất báo cáo', 'Không có đơn hàng nào khớp với bộ lọc hiện tại.');
      return;
    }

    const headers = [
      'Mã Hợp Đồng',
      'Khách Hàng',
      'Email',
      'SĐT',
      'Showroom Bàn Giao',
      'Mã ZaloPay',
      'Tổng Giá Trị Xe (USD)',
      'Tiền Cọc (USD)',
      'Tiền Còn Lại (USD)',
      'Giảm Giá (USD)',
      'Trạng Thái Hợp Đồng',
      'Trạng Thái Cọc',
      'Ngày Khởi Tạo',
      'Lý Do Hủy / Hoàn Cọc',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.profile?.full_name || 'Khách hàng'}"`,
      `"${o.profile?.email || ''}"`,
      `"${o.profile?.phone || ''}"`,
      `"${o.showroom?.name || 'Showroom Trung Tâm'}"`,
      `"${o.app_trans_id || 'N/A'}"`,
      o.total_amount,
      o.deposit_amount,
      o.remaining_amount,
      o.discount_amount,
      `"${statusMap[o.status]?.label || o.status}"`,
      `"${o.deposit_status === 'paid' ? 'Đã thu cọc' : o.deposit_status === 'refunded' ? 'Đã hoàn cọc' : 'Chưa thu cọc'}"`,
      `"${formatDateTime(o.created_at)}"`,
      `"${o.cancellation_reason || o.refund_reason || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Don_hang_AutoMatch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Xuất dữ liệu thành công!', `Đã xuất ${filteredOrders.length} đơn hàng ra file CSV.`);
  };

  // Status Stepper list
  const steps: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'deposit_paid', label: 'Đã nhận cọc' },
    { key: 'preparing_car', label: 'Chuẩn bị xe' },
    { key: 'ready_for_pickup', label: 'Sẵn sàng giao' },
    { key: 'completed', label: 'Hoàn tất' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    return steps.findIndex((s) => s.key === status);
  };

  const getStatusBadgeVariant = (status: OrderStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'deposit_paid': return 'primary';
      case 'preparing_car': return 'info';
      case 'ready_for_pickup': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Subtab Switcher: Orders vs Test Drives */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSalesTab('orders')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              salesTab === 'orders'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Hợp Đồng & Đặt Cọc</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                salesTab === 'orders' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {orders.length} hợp đồng
            </span>
          </button>

          <button
            onClick={() => setSalesTab('test_drives')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              salesTab === 'test_drives'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Hẹn Lái Thử Thực Tế</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                salesTab === 'test_drives' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {testDrives.length} lịch hẹn
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Quản lý toàn bộ giao dịch mua bán & trải nghiệm lái thử
        </span>
      </div>

      {salesTab === 'test_drives' ? (
        <TestDrivesView />
      ) : (
        <>
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hợp Đồng & Đặt Cọc</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Theo dõi tiến độ cọc online, đối soát thanh toán ZaloPay và hợp đồng điện tử
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportCSV}
              >
                Xuất Báo Cáo
              </Button>
              <Badge variant="primary" size="md">
                {orders.length} hợp đồng
              </Badge>
              {orders.filter((o) => o.status === 'pending').length > 0 && (
                <Badge variant="warning" size="md">
                  {orders.filter((o) => o.status === 'pending').length} chờ duyệt
                </Badge>
              )}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <SearchBar
                  placeholder="Tìm mã HĐ, ZaloPay, khách hàng, xe..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>

              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">Tiến độ (Tất cả)</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="deposit_paid">Đã nhận cọc</option>
                  <option value="preparing_car">Chuẩn bị xe</option>
                  <option value="ready_for_pickup">Sẵn sàng giao</option>
                  <option value="completed">Đã giao xe</option>
                  <option value="cancelled">Đã hủy</option>
                </Select>

                <Select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                  <option value="all">Thanh toán (Tất cả)</option>
                  <option value="unpaid">Chưa thu cọc</option>
                  <option value="paid">Đã thu cọc</option>
                  <option value="refunded">Đã hoàn cọc</option>
                </Select>

                <Select value={filterShowroom} onChange={(e) => setFilterShowroom(e.target.value)}>
                  <option value="all">Showroom (Tất cả)</option>
                  {showrooms.map((sr) => (
                    <option key={sr.id} value={sr.id}>
                      {sr.name}
                    </option>
                  ))}
                </Select>

                <Select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}>
                  <option value="all">Thời gian (Tất cả)</option>
                  <option value="today">Hôm nay</option>
                  <option value="7_days">7 ngày qua</option>
                  <option value="this_month">Tháng này</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Orders List Table */}
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-12 h-12 text-slate-300" />}
              title="Không tìm thấy hợp đồng nào"
              description="Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa tra cứu."
            />
          ) : (
            <Card className="overflow-hidden">
              <Table bare>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Hợp Đồng</TableHead>
                    <TableHead>Khách Hàng</TableHead>
                    <TableHead>Mẫu Xe Đặt</TableHead>
                    <TableHead>Showroom Bàn Giao</TableHead>
                    <TableHead>Tổng Giá Trị</TableHead>
                    <TableHead>Tiền Cọc Thu</TableHead>
                    <TableHead>Tiến Độ HĐ</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((ord) => {
                    const statusConfig = statusMap[ord.status] || {
                      label: ord.status,
                      variant: 'neutral',
                    };
                    const firstItem = ord.items?.[0];
                    const car = firstItem?.car;

                    return (
                      <TableRow key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-slate-800">
                          <div>#{ord.id.slice(0, 8)}</div>
                          {ord.app_trans_id && (
                            <div className="text-[10px] font-normal text-blue-600 font-mono">
                              ZP: {ord.app_trans_id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-900">
                              {ord.profile?.full_name || 'Khách hàng ẩn danh'}
                            </span>
                            <span className="text-[11px] text-slate-500">{ord.profile?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {car?.image_url && (
                              <img
                                src={car.image_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-xs text-slate-900 leading-snug">
                                {car ? `${car.make} ${car.model}` : 'Đơn đặt cọc xe'}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {firstItem ? `SL: x${firstItem.quantity}` : '1 xe'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-700 font-medium">
                            {ord.showroom?.name || 'Showroom Trung Tâm'}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-900">
                          {formatUSD(ord.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-emerald-600">
                              {formatUSD(ord.deposit_amount)}
                            </span>
                            <Badge
                              variant={
                                ord.deposit_status === 'paid'
                                  ? 'success'
                                  : ord.deposit_status === 'refunded'
                                    ? 'neutral'
                                    : 'warning'
                              }
                              size="sm"
                              className="w-fit mt-0.5"
                            >
                              {ord.deposit_status === 'paid'
                                ? 'Đã thu cọc'
                                : ord.deposit_status === 'refunded'
                                  ? 'Đã hoàn cọc'
                                  : 'Chưa thanh toán'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ord.status)} size="sm">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => openOrderDrawer(ord)}
                          >
                            Chi Tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
              />
            </Card>
          )}
        </>
      )}

      {/* Order Detail & Action Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedOrder ? `Hợp Đồng #${selectedOrder.id.slice(0, 8)}` : 'Chi Tiết Đơn Hàng'}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-left">
            {/* Stepper Header (Only shown if not cancelled) */}
            {selectedOrder.status !== 'cancelled' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tiến Trình Xử Lý Hợp Đồng
                </span>
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
                  {steps.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedOrder.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                            isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                              : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-500'
                          )}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-semibold mt-1.5 whitespace-nowrap',
                            isCurrent
                              ? 'text-blue-600 font-bold'
                              : isDone
                                ? 'text-slate-800'
                                : 'text-slate-400'
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <Ban className="w-4 h-4" />
                  <span>Hợp Đồng Này Đã Bị Hủy</span>
                </div>
                <p className="text-xs text-rose-600">
                  Lý do: {selectedOrder.cancellation_reason || 'Quản trị viên hủy đơn hàng'}
                </p>
                {selectedOrder.cancelled_at && (
                  <p className="text-[10px] text-rose-400">
                    Thời điểm hủy: {formatDateTime(selectedOrder.cancelled_at)}
                  </p>
                )}
              </div>
            )}

            {/* Customer & Showroom Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Khách Hàng Đặt Mua</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900">
                    {selectedOrder.profile?.full_name || 'Khách Hàng'}
                  </p>
                  <p className="text-slate-500">{selectedOrder.profile?.email}</p>
                  <p className="text-slate-500">{selectedOrder.profile?.phone || 'Chưa cập nhật SĐT'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Showroom Bàn Giao</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900">
                    {selectedOrder.showroom?.name || 'Showroom Trung Tâm'}
                  </p>
                  <p className="text-slate-500">{selectedOrder.showroom?.address}</p>
                  {/* Showroom Reassignment Selector */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Đổi Chi Nhánh Bàn Giao:
                    </label>
                    <Select
                      value={selectedOrder.showroom_id || ''}
                      onChange={(e) => handleShowroomChange(e.target.value)}
                    >
                      {showrooms.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Cars / Items List */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>Danh Sách Xe Đặt Cọc ({selectedOrder.items.length})</span>
                </div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => {
                    const car = item.car;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        {car?.image_url ? (
                          <img
                            src={car.image_url}
                            alt={car.model || 'Car'}
                            className="w-14 h-10 object-cover rounded-lg bg-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {car ? `${car.make} ${car.model}` : 'Mẫu xe AutoMatch'}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>Năm {car?.year || 2024}</span>
                            <span>•</span>
                            <span>Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-blue-600 block">
                            {formatUSD(item.price * item.quantity)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({formatUSD(item.price)} / xe)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cơ Cấu Giá Trị Hợp Đồng & Thanh Toán
              </span>
              <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                <div className="flex justify-between text-slate-600 pb-1">
                  <span>Tổng giá trị niêm yết xe:</span>
                  <span className="font-semibold text-slate-900">{formatUSD(selectedOrder.total_amount)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 py-1">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      Ưu đãi Voucher giảm:
                    </span>
                    <span className="font-bold">-{formatUSD(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-blue-700 font-bold py-1">
                  <span>Tiền đặt cọc trực tuyến:</span>
                  <span>{formatUSD(selectedOrder.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold pt-1">
                  <span>Khoản còn lại tất toán tại Showroom:</span>
                  <span>{formatUSD(selectedOrder.remaining_amount)}</span>
                </div>
                {selectedOrder.refund_amount ? (
                  <div className="flex justify-between text-amber-600 font-bold pt-1">
                    <span>Đã hoàn cọc lại:</span>
                    <span>{formatUSD(selectedOrder.refund_amount)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Electronic Contract & Documents Section */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Hồ Sơ Hợp Đồng & Biên Bản Điện Tử</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => setIsHandoverModalOpen(true)}
                  >
                    Biên Bản Bàn Giao
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Hợp Đồng Mua Xe Đã Ký</p>
                  <p className="text-[11px] text-slate-500">
                    {selectedOrder.contract_url ? 'Đã đính kèm tệp hợp đồng PDF' : 'Chưa cập nhật tài liệu hợp đồng'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.contract_url ? (
                    <a
                      href={selectedOrder.contract_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Xem PDF
                    </a>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setContractUrlInput(selectedOrder.contract_url || '');
                      setIsContractModalOpen(true);
                    }}
                  >
                    {selectedOrder.contract_url ? 'Đổi Link' : 'Gắn Link HĐ'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Gateway Reconciliation Box */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-blue-50/70 to-indigo-50/70 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-900">Đối Soát Cổng ZaloPay</span>
                  {selectedOrder.app_trans_id && (
                    <span className="font-mono text-[11px] text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                      {selectedOrder.app_trans_id}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-700/80">
                  {selectedOrder.app_trans_id
                    ? 'Kiểm tra trạng thái đối soát trực tiếp với ZaloPay Gateway Server.'
                    : 'Đơn hàng này chưa có mã app_trans_id.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isCheckingZalo && 'animate-spin')} />}
                isLoading={isCheckingZalo}
                onClick={handleCheckZaloPay}
              >
                Đối Soát Ngay
              </Button>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Chuyển Bước Xử Lý Hợp Đồng:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedOrder.status === 'deposit_paid' || selectedOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus('deposit_paid', 'paid')}
                >
                  1. Đã Nhận Đặt Cọc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedOrder.status === 'preparing_car' || selectedOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus('preparing_car')}
                >
                  2. Đang Chuẩn Bị Xe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedOrder.status === 'ready_for_pickup' || selectedOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus('ready_for_pickup')}
                >
                  3. Xe Sẵn Sàng Giao
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus('completed', 'paid')}
                >
                  4. Đã Bàn Giao Xe
                </Button>
              </div>
            </div>

            {/* Advanced Actions: Cancel, Refund, Delete */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setCancelReason('');
                      setIsCancelModalOpen(true);
                    }}
                  >
                    Hủy Hợp Đồng
                  </Button>
                )}

                {selectedOrder.deposit_status === 'paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setRefundAmount(selectedOrder.deposit_amount);
                      setRefundReason('Khách hàng yêu cầu rút cọc theo chính sách');
                      setIsRefundModalOpen(true);
                    }}
                  >
                    Hoàn Cọc
                  </Button>
                )}
              </div>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                >
                  Xóa HĐ
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Xác Nhận Hủy Hợp Đồng & Đặt Cọc"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4 text-left">
          <p className="text-xs text-slate-600">
            Khi hủy hợp đồng, hệ thống sẽ <strong>tự động phục hồi tồn kho xe</strong> và <strong>hoàn trả lượt sử dụng voucher</strong> vào cơ sở dữ liệu.
          </p>

          <Textarea
            label="Lý Do Hủy Hợp Đồng *"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="VD: Khách hàng đổi sang dòng xe khác, hoặc quá thời hạn đến showroom ký hợp đồng chính thức..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setIsCancelModalOpen(false)} type="button">
              Đóng
            </Button>
            <Button variant="danger" size="md" type="submit" isLoading={isSubmittingCancel}>
              Xác Nhận Hủy Hợp Đồng
            </Button>
          </div>
        </form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Xử Lý Hoàn Tiền Đặt Cọc"
      >
        <form onSubmit={handleConfirmRefund} className="space-y-4 text-left">
          <p className="text-xs text-slate-600">
            Xác nhận hoàn lại số tiền cọc cho khách hàng qua cổng thanh toán ZaloPay hoặc chuyển khoản ngân hàng.
          </p>

          <Input
            label="Số Tiền Hoàn (USD) *"
            type="number"
            required
            min={1}
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
          />

          <Textarea
            label="Lý Do Hoàn Tiền Cọc *"
            required
            rows={2}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="VD: Hoàn cọc do showroom hết màu xe yêu cầu hoặc thỏa thuận chấm dứt hợp đồng..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setIsRefundModalOpen(false)} type="button">
              Hủy Bỏ
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmittingRefund}>
              Xác Nhận Hoàn Tiền Cọc
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contract URL Modal */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Cập Nhật Tài Liệu Hợp Đồng Điện Tử"
      >
        <form onSubmit={handleSaveContract} className="space-y-4 text-left">
          <Input
            label="Đường Dẫn Tài Liệu Hợp Đồng (PDF / Cloud Link) *"
            required
            placeholder="https://storage.automatch.vn/contracts/HD_2026_0903.pdf"
            value={contractUrlInput}
            onChange={(e) => setContractUrlInput(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setIsContractModalOpen(false)} type="button">
              Hủy
            </Button>
            <Button variant="primary" size="md" type="submit">
              Lưu Đường Dẫn
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Handover Minutes Modal */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Biên Bản Bàn Giao Xe Điện Tử"
        maxWidth="3xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-left p-2">
            <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-4 font-sans text-xs text-slate-800">
              <div className="text-center border-b pb-4 space-y-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
                  Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
                </h3>
                <p className="text-[11px] text-slate-500">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-20 h-0.5 bg-slate-300 mx-auto my-1" />
                <h4 className="font-bold text-base text-blue-900 pt-2">
                  BIÊN BẢN BÀN GIAO XE Ô TÔ & GIẤY TỜ PHÁP LÝ
                </h4>
                <p className="text-[10px] text-slate-400">Mã hợp đồng: #{selectedOrder.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">BÊN GIAO (AUTOMATCH AI):</h5>
                  <p>Đại diện Showroom: {selectedOrder.showroom?.name || 'Showroom AutoMatch Flagship'}</p>
                  <p>Địa chỉ: {selectedOrder.showroom?.address || 'Hà Nội & TP.HCM'}</p>
                  <p>Hotline: {selectedOrder.showroom?.phone || '1900 8888'}</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">BÊN NHẬN (KHÁCH HÀNG):</h5>
                  <p>Họ và tên: {selectedOrder.profile?.full_name || 'Khách Hàng'}</p>
                  <p>Email: {selectedOrder.profile?.email}</p>
                  <p>Điện thoại: {selectedOrder.profile?.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                <h5 className="font-bold text-slate-900">THÔNG TIN XE BÀN GIAO:</h5>
                <p>Mẫu xe: {selectedOrder.items?.[0]?.car ? `${selectedOrder.items[0].car.make} ${selectedOrder.items[0].car.model} (${selectedOrder.items[0].car.year})` : 'Mẫu xe sang AutoMatch'}</p>
                <p>Tổng giá trị hợp đồng: {formatUSD(selectedOrder.total_amount)}</p>
                <p>Đã thanh toán cọc online: {formatUSD(selectedOrder.deposit_amount)}</p>
                <p>Tất toán tại showroom: {formatUSD(selectedOrder.remaining_amount)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center">
                <div>
                  <p className="font-bold">ĐẠI DIỆN SHOWROOM</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-semibold text-slate-700">AutoMatch Executive</p>
                </div>
                <div>
                  <p className="font-bold">KHÁCH HÀNG NHẬN XE</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-semibold text-slate-700">{selectedOrder.profile?.full_name || 'Khách hàng'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="md" onClick={() => setIsHandoverModalOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                In Biên Bản Bàn Giao
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

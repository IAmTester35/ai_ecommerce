import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Car,
  DollarSign,
  User,
  Building2,
  Eye,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Order, OrderStatus, PaymentStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Drawer } from '../components/ui/Drawer';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatVND, formatVNDCompact, formatDateTime, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';
import { checkZaloPayStatus } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const OrdersManagement: React.FC = () => {
  const { orders, updateOrderStatus } = useData();
  const { success, info } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Detail Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckingZalo, setIsCheckingZalo] = useState(false);

  const openOrderDrawer = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (status: OrderStatus, paymentStatus?: PaymentStatus) => {
    if (!selectedOrder) return;
    await updateOrderStatus(selectedOrder.id, status, paymentStatus, paymentStatus);
    setSelectedOrder((prev) => (prev ? { ...prev, status, ...(paymentStatus ? { deposit_status: paymentStatus, payment_status: paymentStatus } : {}) } : null));
  };

  const handleCheckZaloPay = async () => {
    if (!selectedOrder) return;
    setIsCheckingZalo(true);
    const res = await checkZaloPayStatus(selectedOrder.id);
    setIsCheckingZalo(false);
    if (res.return_code === 1) {
      success('ZaloPay Gateway xác nhận', `Giao dịch ${formatVND(selectedOrder.deposit_amount)} đã khớp lệnh trên cổng.`);
      if (selectedOrder.deposit_status === 'unpaid') {
        handleUpdateStatus('deposit_paid', 'paid');
      }
    } else {
      info('ZaloPay Gateway', res.return_message || 'Chưa ghi nhận giao dịch thành công');
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        `${ord.id} ${ord.profile?.full_name || ''} ${ord.profile?.email || ''} ${ord.items?.[0]?.car?.model || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || ord.status === filterStatus;
      const matchPayment = filterPayment === 'all' || ord.deposit_status === filterPayment;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchTerm, filterStatus, filterPayment]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản Lý Hợp Đồng & Đặt Cọc Xe</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xử lý quy trình đặt cọc 10%, kiểm tra biên lai ZaloPay và theo dõi tiến trình bàn giao xe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md">
            {orders.filter((o) => o.status === 'deposit_paid').length} đơn đã nhận cọc
          </Badge>
          <Badge variant="warning" size="md">
            {orders.filter((o) => o.status === 'pending').length} đơn chờ xử lý
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã đơn, tên khách, email, mẫu xe..."
              shortcutHint="/"
            />

            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái tiến độ</option>
              <option value="pending">Chờ xử lý (Pending)</option>
              <option value="deposit_paid">Đã nhận cọc (Deposit Paid)</option>
              <option value="preparing_car">Đang chuẩn bị xe (Preparing)</option>
              <option value="ready_for_pickup">Sẵn sàng bàn giao (Ready)</option>
              <option value="completed">Đã hoàn tất (Completed)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
            </Select>

            <Select
              value={filterPayment}
              onChange={(e) => {
                setFilterPayment(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái thanh toán</option>
              <option value="paid">Đã thanh toán (Paid)</option>
              <option value="unpaid">Chưa thanh toán (Unpaid)</option>
              <option value="refunded">Đã hoàn tiền (Refunded)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Orders */}
      {paginatedOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Không tìm thấy đơn hàng nào"
          description="Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa tra cứu."
          actionLabel="Xóa bộ lọc"
          onAction={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setFilterPayment('all');
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Hợp Đồng</TableHead>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Mẫu Xe Đặt Mua</TableHead>
                <TableHead>Tiền Cọc Thu (10%)</TableHead>
                <TableHead>Còn Lại Tại Showroom</TableHead>
                <TableHead>Trạng Thái Tiến Độ</TableHead>
                <TableHead>Cổng Thanh Toán</TableHead>
                <TableHead className="text-right">Chi Tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((ord) => {
                const statusInfo = (statusMap as any)[ord.status] || {
                  label: ord.status,
                  bg: '#F1F5F9',
                  color: '#475569',
                  dotColor: 'bg-slate-500',
                };
                const depositPayment = (statusMap as any)[ord.deposit_status] || {
                  label: ord.deposit_status,
                };
                const carItem = ord.items?.[0]?.car;

                return (
                  <TableRow key={ord.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs uppercase">
                        #{ord.id}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(ord.created_at)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-900 text-xs">
                        {ord.profile?.full_name || 'Khách vãng lai'}
                      </div>
                      <div className="text-[11px] text-slate-500">{ord.profile?.phone || ord.profile?.email}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {carItem?.image_url && (
                          <img
                            src={carItem.image_url}
                            alt=""
                            className="w-10 h-7 rounded object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {carItem ? `${carItem.make} ${carItem.model}` : 'Giao dịch xe'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Giá: {formatVNDCompact(ord.total_amount)}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-extrabold text-blue-600 text-xs">
                        {formatVND(ord.deposit_amount)}
                      </span>
                      {ord.discount_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Percent className="w-2.5 h-2.5" />
                          Giảm {formatVNDCompact(ord.discount_amount)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-700 text-xs">
                        {formatVND(ord.remaining_amount)}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {ord.showroom?.city || 'Showroom chỉ định'}
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
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={ord.deposit_status === 'paid' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {depositPayment.label}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {ord.payment_method || 'ZaloPay'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => openOrderDrawer(ord)}
                      >
                        Xem
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

      {/* Detailed Order Inspection Drawer */}
      {selectedOrder && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Hợp Đồng Đặt Cọc #${selectedOrder.id}`}
          description={`Tạo lúc ${formatDateTime(selectedOrder.created_at)}`}
          width="xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isCheckingZalo ? 'animate-spin' : '')} />}
                onClick={handleCheckZaloPay}
                isLoading={isCheckingZalo}
              >
                Đối Soát ZaloPay
              </Button>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('deposit_paid', 'paid')}
                  >
                    Duyệt Tiền Cọc
                  </Button>
                )}

                {selectedOrder.status === 'deposit_paid' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('preparing_car')}
                  >
                    Bắt Đầu Chuẩn Bị Xe
                  </Button>
                )}

                {selectedOrder.status === 'preparing_car' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('ready_for_pickup')}
                  >
                    Sẵn Sàng Bàn Giao
                  </Button>
                )}

                {selectedOrder.status === 'ready_for_pickup' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('completed', 'paid')}
                  >
                    Xác Nhận Đã Bàn Giao Xe
                  </Button>
                )}

                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy đơn và hoàn cọc?')) {
                        handleUpdateStatus('cancelled', 'refunded');
                      }
                    }}
                  >
                    Hủy Hợp Đồng
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-left">
            {/* Status Progress Stepper */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Tiến Độ Hợp Đồng
              </p>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                {steps.map((step, idx) => {
                  const currentIdx = getStepIndex(selectedOrder.status);
                  const isDone = idx <= currentIdx && selectedOrder.status !== 'cancelled';
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all',
                          isDone
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-300 text-slate-400',
                          isCurrent ? 'ring-4 ring-blue-100' : ''
                        )}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-semibold mt-1.5 text-center',
                          isDone ? 'text-slate-900' : 'text-slate-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <User className="w-4 h-4 text-blue-600" />
                Thông Tin Khách Hàng
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Họ và tên:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedOrder.profile?.full_name || 'Khách hàng'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.profile?.phone || 'Chưa cung cấp'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email đăng ký:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.profile?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phân quyền tài khoản:</span>
                  <Badge variant="primary" size="sm">
                    {selectedOrder.profile?.role.toUpperCase() || 'USER'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Ordered Car Breakdown */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Car className="w-4 h-4 text-indigo-600" />
                Xe Đã Đặt Cọc
              </div>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  {item.car?.image_url && (
                    <img
                      src={item.car.image_url}
                      alt=""
                      className="w-20 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="font-bold text-slate-900 text-sm">
                      {item.car?.make} {item.car?.model} ({item.car?.year})
                    </h5>
                    <p className="text-xs text-slate-500">
                      Màu: {item.car?.metadata?.color || 'Đặc biệt'} • Nhiên liệu:{' '}
                      {item.car?.metadata?.engine_fuel_type || 'Xăng'}
                    </p>
                    <p className="text-xs font-extrabold text-blue-600">
                      Đơn giá: {formatVND(item.price)} x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary & Breakdown */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-blue-900">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Hạch Toán Dòng Tiền Hợp Đồng
              </div>

              <div className="space-y-2 pt-1 border-t border-blue-200/50">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng giá trị xe niêm yết:</span>
                  <span className="font-semibold text-slate-900">
                    {formatVND(selectedOrder.total_amount + selectedOrder.discount_amount)}
                  </span>
                </div>

                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Mã voucher áp dụng ({selectedOrder.voucher?.code || 'VOUCHER'}):</span>
                    <span>- {formatVND(selectedOrder.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-blue-200/50 text-sm">
                  <span>Giá sau ưu đãi:</span>
                  <span>{formatVND(selectedOrder.total_amount)}</span>
                </div>

                <div className="flex justify-between text-blue-700 font-extrabold text-sm bg-white p-2.5 rounded-xl border border-blue-200">
                  <span>Tiền cọc giữ xe (10%):</span>
                  <span>{formatVND(selectedOrder.deposit_amount)}</span>
                </div>

                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Số tiền còn lại thu tại Showroom:</span>
                  <span>{formatVND(selectedOrder.remaining_amount)}</span>
                </div>
              </div>
            </div>

            {/* Handover Showroom Location */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700">
                <Building2 className="w-4 h-4 text-slate-600" />
                Địa Điểm Nhận Xe
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {selectedOrder.showroom?.name || 'AutoMatch Hà Nội - Cầu Giấy'}
              </p>
              <p className="text-slate-500">{selectedOrder.showroom?.address}</p>
              <p className="text-slate-500">Hotline: {selectedOrder.showroom?.phone || '1900 6868'}</p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

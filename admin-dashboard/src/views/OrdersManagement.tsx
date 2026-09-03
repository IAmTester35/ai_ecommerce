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
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
  const { orders, updateOrderStatus, deleteOrder } = useData();
  const { isOwner } = useAuth();
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!isOwner) {
      alert('Chỉ tài khoản cấp Owner mới có quyền hủy/xóa đơn đặt cọc.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng #${orderId.slice(0, 8)} khỏi cơ sở dữ liệu?`)) {
      await deleteOrder(orderId);
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    }
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
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hợp Đồng & Đặt Cọc Xe</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý quy trình xử lý đơn đặt cọc trực tuyến, đối soát ZaloPay và lịch bàn giao xe tại Showroom
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            {orders.length} hợp đồng
          </Badge>
          <Badge variant="warning" size="md">
            {orders.filter((o) => o.status === 'pending').length} chờ duyệt
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
              placeholder="Tìm theo mã đơn, tên khách hàng, mẫu xe..."
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
              <option value="pending">Chờ duyệt hợp đồng</option>
              <option value="deposit_paid">Đã nhận tiền cọc</option>
              <option value="preparing_car">Đang chuẩn bị xe</option>
              <option value="ready_for_pickup">Sẵn sàng bàn giao</option>
              <option value="completed">Đã hoàn tất giao xe</option>
              <option value="cancelled">Đã hủy</option>
            </Select>

            <Select
              value={filterPayment}
              onChange={(e) => {
                setFilterPayment(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái tiền cọc</option>
              <option value="paid">Đã thanh toán (Paid)</option>
              <option value="unpaid">Chưa thanh toán (Unpaid)</option>
              <option value="refunded">Đã hoàn cọc (Refunded)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {paginatedOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Không tìm thấy hợp đồng nào"
          description="Chưa có đơn đặt cọc nào khớp với bộ lọc tìm kiếm trong cơ sở dữ liệu Supabase."
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
                <TableHead>Mẫu Xe / Chi Nhánh</TableHead>
                <TableHead>Tiền Cọc (VNĐ)</TableHead>
                <TableHead>Tổng Giá Trị Xe</TableHead>
                <TableHead>Tiến Độ Hợp Đồng</TableHead>
                <TableHead>Thanh Toán Cọc</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((ord) => {
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
                      <div className="font-bold text-slate-900 text-xs font-mono">
                        #{ord.id.slice(0, 8)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(ord.created_at)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {ord.profile?.full_name || ord.profile?.email || 'Khách vãng lai'}
                      </div>
                      <div className="text-[11px] text-slate-500">{ord.profile?.phone || 'Chưa có SĐT'}</div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">{carName}</span>
                      <div className="text-[11px] text-slate-400">
                        {ord.showroom?.name?.split('-')[0] || 'Showroom trung tâm'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-extrabold text-blue-600 text-xs">
                        {formatVND(ord.deposit_amount)}
                      </span>
                      {ord.discount_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Voucher: -{formatVNDCompact(ord.discount_amount)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-800 text-xs">
                        {formatVNDCompact(ord.total_amount)}
                      </span>
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

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
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

      {/* Order Detail & Action Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedOrder ? `Hợp Đồng #${selectedOrder.id.slice(0, 8)}` : 'Chi Tiết Đơn Hàng'}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-left">
            {/* Stepper Header */}
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
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Showroom Bàn Giao</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900">
                    {selectedOrder.showroom?.name || 'Showroom Trung Tâm'}
                  </p>
                  <p className="text-slate-500">{selectedOrder.showroom?.address}</p>
                  <p className="text-slate-500">Hotline: {selectedOrder.showroom?.phone || '1900 8888'}</p>
                </div>
              </div>
            </div>

            {/* Ordered Cars / Items List */}
            {((selectedOrder.items && selectedOrder.items.length > 0) || ((selectedOrder as any).order_items && (selectedOrder as any).order_items.length > 0)) && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>Danh Sách Xe Đặt Cọc ({((selectedOrder.items || (selectedOrder as any).order_items) as any[]).length})</span>
                </div>
                <div className="space-y-2">
                  {((selectedOrder.items || (selectedOrder as any).order_items) as any[]).map((item: any) => {
                    const car = item.car || item.cars;
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
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
                            {formatVND(item.price * item.quantity)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({formatVND(item.price)} / xe)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Giá Niêm Yết Xe:</span>
                <span className="text-xs font-bold text-slate-900">
                  {formatVND(selectedOrder.total_amount + selectedOrder.discount_amount)}
                </span>
              </div>

              {selectedOrder.discount_amount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span className="flex items-center gap-1 font-semibold">
                    <Percent className="w-3.5 h-3.5" />
                    Voucher Đã Giảm ({selectedOrder.voucher?.code || 'PROMO'}):
                  </span>
                  <span className="font-bold">-{formatVND(selectedOrder.discount_amount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-blue-200/60">
                <span className="text-xs font-extrabold text-blue-900">Tiền Đặt Cọc Cần Thu (Online):</span>
                <span className="text-sm font-extrabold text-blue-600">
                  {formatVND(selectedOrder.deposit_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Còn Lại Thanh Toán Tại Showroom:</span>
                <span className="font-semibold text-slate-800">
                  {formatVND(selectedOrder.remaining_amount)}
                </span>
              </div>
            </div>

            {/* Action Bar & Status Controllers */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Cập Nhật Trạng Thái & Quản Trị Đơn
              </span>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus('deposit_paid', 'paid')}
                  disabled={selectedOrder.status === 'deposit_paid'}
                >
                  Xác Nhận Đã Nhận Cọc
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus('preparing_car')}
                  disabled={selectedOrder.status === 'preparing_car'}
                >
                  Bắt Đầu Chuẩn Bị Xe
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus('ready_for_pickup')}
                  disabled={selectedOrder.status === 'ready_for_pickup'}
                >
                  Sẵn Sàng Bàn Giao
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={selectedOrder.status === 'completed'}
                >
                  Hoàn Tất Giao Xe
                </Button>
              </div>

              {/* ZaloPay Direct Check Button */}
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isCheckingZalo ? 'animate-spin' : ''}`} />}
                  onClick={handleCheckZaloPay}
                  isLoading={isCheckingZalo}
                >
                  Đối Soát Cổng Thanh Toán ZaloPay
                </Button>
              </div>

              {/* Owner Only Delete Order Action */}
              {isOwner && (
                <div className="pt-4 border-t border-slate-200">
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    Xóa Hợp Đồng (Owner Only)
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

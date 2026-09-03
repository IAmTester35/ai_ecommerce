import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Percent,
  CheckCircle2,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Voucher, DiscountType, VoucherAppliesTo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { formatVND, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const VouchersView: React.FC = () => {
  const { vouchers, orders, addVoucher, updateVoucher, deleteVoucher } = useData();
  const { isOwner, can } = useAuth();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const initialForm: Omit<Voucher, 'id' | 'created_at' | 'used_count'> = {
    code: '',
    title: '',
    description: '',
    discount_type: 'fixed',
    discount_value: 50000000,
    max_discount_amount: null,
    min_order_value: 1000000000,
    applies_to: 'deposit',
    usage_limit: 50,
    max_uses_per_user: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  };

  const [formData, setFormData] = useState<Omit<Voucher, 'id' | 'created_at' | 'used_count'>>(initialForm);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      title: v.title,
      description: v.description || '',
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      max_discount_amount: v.max_discount_amount || null,
      min_order_value: v.min_order_value,
      applies_to: v.applies_to,
      usage_limit: v.usage_limit,
      max_uses_per_user: v.max_uses_per_user || 1,
      start_date: v.start_date ? v.start_date.split('T')[0] : '',
      end_date: v.end_date ? v.end_date.split('T')[0] : '',
      is_active: v.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Đã sao chép mã voucher', code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ràng buộc phần trăm 1 - 100%
    if (formData.discount_type === 'percentage') {
      if (formData.discount_value < 1 || formData.discount_value > 100) {
        error('Tỷ lệ không hợp lệ', 'Mức giảm phần trăm phải nằm trong khoảng từ 1% đến 100%.');
        return;
      }
    }

    if (formData.usage_limit <= 0) {
      error('Lượt dùng không hợp lệ', 'Giới hạn lượt dùng phải lớn hơn 0.');
      return;
    }

    if (editingVoucher) {
      await updateVoucher(editingVoucher.id, formData);
    } else {
      await addVoucher(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (v: Voucher) => {
    if (!isOwner) {
      alert('Chỉ tài khoản cấp Owner mới có quyền xóa mã voucher.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã voucher ${v.code}?`)) {
      await deleteVoucher(v.id);
    }
  };

  // Campaign ROI Metrics
  const campaignMetrics = useMemo(() => {
    const ordersWithVoucher = orders.filter((o) => (o.discount_amount || 0) > 0);
    const totalDiscountGiven = orders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
    const depositRevenueWithVoucher = ordersWithVoucher.reduce(
      (sum, o) => sum + (o.deposit_amount || 0),
      0
    );
    const activeCampaigns = vouchers.filter((v) => v.is_active).length;

    return {
      activeCampaigns,
      ordersWithVoucherCount: ordersWithVoucher.length,
      totalDiscountGiven,
      depositRevenueWithVoucher,
    };
  }, [orders, vouchers]);

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chiến Dịch Khuyến Mãi & Voucher</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo mã ưu đãi giảm trực tiếp vào tiền cọc xe trực tuyến hoặc tổng giá trị hợp đồng
          </p>
        </div>

        {can('VOUCHERS_CREATE') && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
            className="w-full sm:w-auto"
          >
            Tạo Mã Voucher
          </Button>
        )}
      </div>

      {/* Campaign Effectiveness Analytics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-linear-to-br from-blue-50/60 to-indigo-50/60 border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Chiến Dịch Đang Chạy</span>
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-700 mt-1">
            {campaignMetrics.activeCampaigns} / {vouchers.length} mã
          </p>
          <span className="text-[11px] text-blue-600/80">Sẵn sàng áp dụng cho cọc</span>
        </Card>

        <Card className="p-4 bg-linear-to-br from-emerald-50/60 to-teal-50/60 border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Đơn Hàng Áp Dụng</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {campaignMetrics.ordersWithVoucherCount} hợp đồng
          </p>
          <span className="text-[11px] text-emerald-600/80">Người mua áp dụng khuyến mãi</span>
        </Card>

        <Card className="p-4 bg-linear-to-br from-rose-50/60 to-pink-50/60 border-rose-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Tổng Ưu Đãi Đã Giảm</span>
            <Percent className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-700 mt-1">
            {formatVND(campaignMetrics.totalDiscountGiven)}
          </p>
          <span className="text-[11px] text-rose-600/80">Chiết khấu tài chính</span>
        </Card>

        <Card className="p-4 bg-linear-to-br from-amber-50/60 to-orange-50/60 border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Doanh Thu Cọc Thu Về</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-1">
            {formatVND(campaignMetrics.depositRevenueWithVoucher)}
          </p>
          <span className="text-[11px] text-amber-600/80">Từ các đơn có voucher</span>
        </Card>
      </div>

      {/* Vouchers Grid */}
      {vouchers.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-8 h-8" />}
          title="Chưa có mã khuyến mãi nào"
          description="Tạo các mã khuyến mãi giảm giá cọc để kích cầu người mua đặt cọc xe trực tuyến."
          actionLabel="Tạo voucher đầu tiên"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((vc) => {
            const usagePercent = vc.usage_limit > 0 ? Math.round((vc.used_count / vc.usage_limit) * 100) : 0;

            return (
              <Card
                key={vc.id}
                className="relative overflow-hidden group hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={vc.is_active ? 'success' : 'neutral'} size="sm">
                          {vc.is_active ? 'Đang phát hành' : 'Tạm dừng'}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {vc.applies_to === 'deposit' ? 'Giảm cọc' : 'Tổng HĐ'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{vc.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(vc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Sửa voucher"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(vc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Voucher Code Banner */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <span className="font-mono font-extrabold text-blue-700 tracking-wider text-sm">
                      {vc.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(vc.code)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors cursor-pointer"
                      title="Sao chép mã"
                    >
                      {copiedCode === vc.code ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <span className="text-xs text-slate-500">Mức chiết khấu:</span>
                    <p className="text-lg font-black text-slate-900">
                      {vc.discount_type === 'percentage'
                        ? `Giảm ${vc.discount_value}%`
                        : `Giảm ${formatVND(vc.discount_value)}`}
                      {vc.discount_type === 'percentage' && vc.max_discount_amount && (
                        <span className="text-xs font-normal text-slate-500 block">
                          (Tối đa {formatVND(vc.max_discount_amount)})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Conditions & Per User Limit */}
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>• Đơn hàng tối thiểu: <strong>{formatVND(vc.min_order_value)}</strong></p>
                    <p>• Giới hạn mỗi người dùng: <strong>{vc.max_uses_per_user || 1} lần</strong></p>
                    {vc.start_date && vc.end_date && (
                      <p className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {formatDate(vc.start_date)} - {formatDate(vc.end_date)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Lượt sử dụng:</span>
                    <span className="font-bold text-slate-700">
                      {vc.used_count} / {vc.usage_limit} ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Voucher */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVoucher ? `Sửa Voucher: ${editingVoucher.code}` : 'Tạo Chiến Dịch Voucher Mới'}
        description="Mã khuyến mãi áp dụng trực tiếp khi khách hàng đặt cọc trực tuyến"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mã Khuyến Mãi (CODE) *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: AUTOSUMMER50M"
              required
            />

            <Input
              label="Tên Chiến Dịch *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Siêu Ưu Đãi Đặt Cọc Mùa Hè"
              required
            />
          </div>

          <Textarea
            label="Mô Tả Điều Khoản Áp Dụng"
            rows={2}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Giảm ngay 50.000.000 VNĐ vào tiền đặt cọc giữ xe..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Loại Hình Chiết Khấu *"
              value={formData.discount_type}
              onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as DiscountType })}
            >
              <option value="fixed">Số tiền cố định (VNĐ)</option>
              <option value="percentage">Phần trăm (%)</option>
            </Select>

            <Select
              label="Áp Dụng Cho Phần Tiền *"
              value={formData.applies_to}
              onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as VoucherAppliesTo })}
            >
              <option value="deposit">Tiền Đặt Cọc (Deposit)</option>
              <option value="total">Tổng Giá Trị Hợp Đồng Xe</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={formData.discount_type === 'percentage' ? 'Phần Trăm Giảm (1-100%) *' : 'Số Tiền Giảm (VNĐ) *'}
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
              min={1}
              max={formData.discount_type === 'percentage' ? 100 : undefined}
              required
            />

            {formData.discount_type === 'percentage' ? (
              <Input
                label="Giảm Tối Đa (VNĐ)"
                type="number"
                value={formData.max_discount_amount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_discount_amount: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="VD: 50000000"
              />
            ) : (
              <Input
                label="Giá Trị Đơn Hàng Tối Thiểu (VNĐ)"
                type="number"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                step={50000000}
                min={0}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Giới Hạn Toàn Hệ Thống *"
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
              min={1}
              required
            />

            <Input
              label="Lượt Dùng / Khách Hàng *"
              type="number"
              value={formData.max_uses_per_user || 1}
              onChange={(e) => setFormData({ ...formData, max_uses_per_user: Number(e.target.value) })}
              min={1}
              required
            />

            <Input
              label="Ngày Kết Thúc"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Switch
              label="Trạng Thái Phát Hành"
              description="Cho phép khách hàng áp dụng voucher này vào hợp đồng cọc"
              checked={formData.is_active}
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingVoucher ? 'Lưu Thay Đổi' : 'Tạo Voucher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

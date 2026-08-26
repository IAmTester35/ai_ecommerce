import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Ticket,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Voucher, DiscountType, VoucherAppliesTo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import { EmptyState } from '../components/ui/EmptyState';
import { formatVND, formatVNDCompact, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const VouchersView: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } = useData();
  const { isOwner, can } = useAuth();
  const { success } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const initialForm: Omit<Voucher, 'id' | 'created_at' | 'used_count'> = {
    code: '',
    title: '',
    description: '',
    discount_type: 'fixed',
    discount_value: 50000000,
    max_discount_amount: null,
    min_order_value: 1000000000,
    applies_to: 'deposit',
    usage_limit: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-12-31',
    is_active: true,
  };

  const [formData, setFormData] = useState(initialForm);

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
              <Card key={vc.id} className="overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all">
                <div className="p-6 space-y-4">
                  {/* Top Bar with Code & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200/80 tracking-wider">
                          {vc.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(vc.code)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Sao chép mã"
                        >
                          {copiedCode === vc.code ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Badge variant={vc.is_active ? 'success' : 'neutral'} size="sm">
                      {vc.is_active ? 'Đang chạy' : 'Tạm dừng'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{vc.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {vc.description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>

                  {/* Value Summary Box */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mức Giảm Giá:</span>
                      <span className="font-extrabold text-blue-700">
                        {vc.discount_type === 'percentage'
                          ? `${vc.discount_value}% (Tối đa ${formatVNDCompact(vc.max_discount_amount || 0)})`
                          : formatVND(vc.discount_value)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Áp Dụng Cho:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {vc.applies_to === 'deposit' ? 'Tiền Cọc Giữ Xe' : 'Tổng Hợp Đồng Xe'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Đơn Tối Thiểu:</span>
                      <span className="font-semibold text-slate-800">
                        {vc.min_order_value > 0 ? formatVNDCompact(vc.min_order_value) : 'Không giới hạn'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Thời Gian:</span>
                      <span className="font-semibold text-slate-800">
                        {vc.end_date ? `Đến ${formatDate(vc.end_date)}` : 'Vô thời hạn'}
                      </span>
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Đã dùng: {vc.used_count} / {vc.usage_limit} lượt</span>
                      <span className="font-bold text-slate-800">{usagePercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                  {can('VOUCHERS_UPDATE') && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(vc)}
                    >
                      Sửa
                    </Button>
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                      onClick={() => handleDelete(vc)}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Voucher */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVoucher ? `Chỉnh Sửa Voucher: ${editingVoucher.code}` : 'Tạo Chiến Dịch Khuyến Mãi'}
        description="Ưu đãi sẽ được tự động áp dụng khi khách hàng đặt cọc giữ xe trực tuyến"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mã Voucher (Code) *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
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
              label={formData.discount_type === 'percentage' ? 'Phần Trăm Giảm (%) *' : 'Số Tiền Giảm (VNĐ) *'}
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
              min={1}
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
              label="Giới Hạn Lượt Dùng *"
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
              min={1}
              required
            />

            <Input
              label="Ngày Bắt Đầu"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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

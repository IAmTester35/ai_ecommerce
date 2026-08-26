import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Percent,
  DollarSign,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Voucher, DiscountType, VoucherAppliesTo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import { formatVND, formatVNDCompact, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const VouchersView: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } = useData();
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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chiến Dịch Khuyến Mãi & Voucher</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo mã ưu đãi giảm trực tiếp vào tiền cọc xe trực tuyến hoặc tổng giá trị hợp đồng
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Tạo Mã Voucher Mới
        </Button>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((v) => {
          const usagePercent = Math.min(100, Math.round((v.used_count / v.usage_limit) * 100));
          return (
            <Card key={v.id} className="relative overflow-hidden flex flex-col justify-between group">
              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      {v.discount_type === 'percentage' ? (
                        <Percent className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{v.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        Áp dụng: {v.applies_to === 'deposit' ? 'Tiền cọc xe' : 'Tổng giá trị'}
                      </span>
                    </div>
                  </div>

                  <Badge variant={v.is_active ? 'success' : 'neutral'} size="sm">
                    {v.is_active ? 'Đang chạy' : 'Đã dừng'}
                  </Badge>
                </div>

                {/* Coupon Code Strip */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="font-mono font-extrabold text-blue-700 text-base tracking-wider">
                    {v.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(v.code)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copiedCode === v.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{v.description || 'Ưu đãi đặc biệt'}</p>

                {/* Value & Constraints */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mức giảm:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {v.discount_type === 'percentage'
                        ? `${v.discount_value}%`
                        : formatVND(v.discount_value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Đơn tối thiểu:</span>
                    <span className="font-semibold text-slate-800">
                      {formatVNDCompact(v.min_order_value)}
                    </span>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Đã dùng:</span>
                    <span className="font-bold text-slate-800">
                      {v.used_count} / {v.usage_limit} lượt ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  HSD: {formatDate(v.end_date)}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(v)}
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(`Xác nhận xóa mã ${v.code}?`)) {
                        deleteVoucher(v.id);
                      }
                    }}
                    title="Xóa voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Voucher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVoucher ? `Chỉnh Sửa Mã: ${editingVoucher.code}` : 'Tạo Chiến Dịch Voucher Mới'}
        description="Cấu hình quy tắc giảm giá và giới hạn lượt áp dụng"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mã Voucher (Code) *"
              placeholder="VD: VIP100M, SUMMER5"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Tên Chương Trình *"
              placeholder="VD: Ưu đãi Đặt Cọc Mùa Hè"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Loại Giảm Giá *"
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({ ...formData, discount_type: e.target.value as DiscountType })
              }
            >
              <option value="fixed">Số tiền cố định (VNĐ)</option>
              <option value="percentage">Phần trăm (%)</option>
            </Select>

            <Input
              label={formData.discount_type === 'percentage' ? 'Giá Trị Giảm (%) *' : 'Giá Trị Giảm (VNĐ) *'}
              type="number"
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })
              }
              required
            />

            <Select
              label="Áp Dụng Cho *"
              value={formData.applies_to}
              onChange={(e) =>
                setFormData({ ...formData, applies_to: e.target.value as VoucherAppliesTo })
              }
            >
              <option value="deposit">Tiền đặt cọc (Deposit)</option>
              <option value="total">Tổng giá xe (Total)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giá Trị Đơn Hàng Tối Thiểu (VNĐ)"
              type="number"
              value={formData.min_order_value}
              onChange={(e) =>
                setFormData({ ...formData, min_order_value: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Giới Hạn Lượt Sử Dụng *"
              type="number"
              value={formData.usage_limit}
              onChange={(e) =>
                setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 1 })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Textarea
            label="Mô Tả Điều Khoản Áp Dụng"
            rows={2}
            placeholder="Chi tiết điều kiện áp dụng cho khách hàng..."
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Switch
            checked={formData.is_active}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            label="Kích hoạt voucher ngay lập tức"
            description="Cho phép khách hàng nhập mã này khi checkout cọc xe"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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

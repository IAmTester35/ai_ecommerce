import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Plus,
  Edit2,
  Car,
  Shuffle,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Showroom } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';

export const ShowroomsView: React.FC = () => {
  const { showrooms, cars, addShowroom, updateShowroom, distributeCarsToShowrooms } = useData();
  const { isOwner, can } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);

  const initialForm: Omit<Showroom, 'id' | 'created_at' | 'updated_at'> = {
    name: '',
    code: '',
    address: '',
    city: 'Hà Nội',
    phone: '',
    email: '',
    image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    opening_hours: '08:00 - 21:00',
    is_active: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const openCreateModal = () => {
    setEditingShowroom(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (sr: Showroom) => {
    setEditingShowroom(sr);
    setFormData({
      name: sr.name,
      code: sr.code,
      address: sr.address,
      city: sr.city,
      phone: sr.phone || '',
      email: sr.email || '',
      image_url: sr.image_url || '',
      opening_hours: sr.opening_hours,
      is_active: sr.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShowroom) {
      await updateShowroom(editingShowroom.id, formData);
    } else {
      await addShowroom(formData);
    }
    setIsModalOpen(false);
  };

  const handleAutoDistribute = async () => {
    if (!isOwner) {
      alert('Chỉ tài khoản cấp Owner mới có quyền kích hoạt phân bổ kho xe.');
      return;
    }
    if (
      window.confirm(
        `Hệ thống sẽ tự động phân bổ đồng đều ${cars.length} mẫu xe trong kho đến ${showrooms.length} Showroom đang hoạt động. Bạn có chắc chắn?`
      )
    ) {
      setIsDistributing(true);
      await distributeCarsToShowrooms();
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mạng Lưới Showroom</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Hệ thống {showrooms.length} trung tâm trải nghiệm và kho xe trưng bày
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isOwner ? (
            <Button
              variant="outline"
              size="md"
              leftIcon={<Shuffle className="w-4 h-4 text-indigo-600" />}
              onClick={handleAutoDistribute}
              isLoading={isDistributing}
              title="Kích hoạt hàm RPC phân bổ ngẫu nhiên và đồng đều toàn bộ xe vào các chi nhánh"
            >
              Phân Bổ Xe Tự Động
            </Button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-[11px] text-slate-500 border border-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>RPC Phân bổ: Owner only</span>
            </div>
          )}

          {can('SHOWROOMS_CREATE') && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Thêm Showroom
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Showrooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-9">
        {showrooms.map((sr) => {
          const showroomCars = cars.filter((c) => c.showroom_id === sr.id);

          return (
            <Card key={sr.id} className="overflow-hidden group hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={sr.image_url || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'}
                    alt={sr.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Badge variant={sr.is_active ? 'success' : 'neutral'} size="sm">
                      {sr.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                    Mã: {sr.code}
                  </div>
                </div>

                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{sr.name}</h3>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{sr.address}, {sr.city}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3 h-3" />
                        Hotline:
                      </span>
                      <span className="font-semibold text-slate-800">{sr.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3 h-3" />
                        Email:
                      </span>
                      <span className="font-semibold text-slate-800">{sr.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3 h-3" />
                        Giờ mở cửa:
                      </span>
                      <span className="font-semibold text-slate-800">{sr.opening_hours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Showroom Inventory Footer */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    <Car className="w-4 h-4" />
                    <span>{showroomCars.length} mẫu xe trưng bày</span>
                  </div>

                  {can('SHOWROOMS_UPDATE') && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(sr)}
                    >
                      Sửa
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Add / Edit Showroom */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShowroom ? `Cập Nhật Showroom: ${editingShowroom.name}` : 'Thêm Showroom Mới'}
        description="Quản lý thông tin chi nhánh đại lý trên toàn quốc"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tên Showroom *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: AutoMatch Hà Nội - Cầu Giấy"
              required
            />

            <Input
              label="Mã Chi Nhánh (Code) *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: SR_HN_CG"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tỉnh / Thành Phố *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
              required
            />

            <Input
              label="Giờ Mở Cửa"
              value={formData.opening_hours}
              onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
              placeholder="08:00 - 21:00"
            />
          </div>

          <Input
            label="Địa Chỉ Chi Tiết *"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Số 68 Đường Cầu Giấy, Phường Quan Hoa..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số Điện Thoại Hotline"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="024 3888 9999"
            />

            <Input
              label="Email Liên Hệ"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="hanoi@automatch.vn"
            />
          </div>

          <Input
            label="Link Hình Ảnh Showroom (Image URL)"
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
          />

          <div className="pt-2">
            <Switch
              label="Trạng Thái Hoạt Động"
              description="Cho phép khách hàng chọn showroom này để lái thử và nhận xe"
              checked={formData.is_active}
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingShowroom ? 'Lưu Thay Đổi' : 'Thêm Mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

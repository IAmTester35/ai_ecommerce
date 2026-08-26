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
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Showroom } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';

export const ShowroomsView: React.FC = () => {
  const { showrooms, cars, addShowroom, updateShowroom, distributeCarsToShowrooms } = useData();

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
    if (window.confirm('Hệ thống sẽ tự động phân bổ đồng đều toàn bộ xe trong kho đến các Showroom đang hoạt động. Bạn có chắc chắn?')) {
      setIsDistributing(true);
      await distributeCarsToShowrooms();
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mạng Lưới Showroom & Đại Lý Toàn Quốc</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý {showrooms.length} trung tâm trải nghiệm, lưu kho và bàn giao xe trực tiếp cho khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Shuffle className="w-4 h-4 text-indigo-600" />}
            onClick={handleAutoDistribute}
            isLoading={isDistributing}
            title="Kích hoạt hàm RPC phân bổ ngẫu nhiên và đồng đều toàn bộ xe vào các chi nhánh"
          >
            Phân Bổ Kho Tự Động
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Thêm Showroom
          </Button>
        </div>
      </div>

      {/* Showrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showrooms.map((sr) => {
          const carCount = cars.filter((c) => c.showroom_id === sr.id).length;
          return (
            <Card key={sr.id} className="overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={sr.image_url || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'}
                    alt={sr.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-bold">
                    {sr.code}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={sr.is_active ? 'success' : 'neutral'} size="sm">
                      {sr.is_active ? 'Đang hoạt động' : 'Tạm đóng cửa'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                    <Car className="w-3.5 h-3.5" />
                    {carCount} xe tại showroom
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{sr.city}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{sr.name}</h4>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{sr.address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{sr.phone || '1900 6868'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{sr.opening_hours}</span>
                    </div>

                    {sr.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{sr.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Chi nhánh chuẩn Flagship</span>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => openEditModal(sr)}
                >
                  Chỉnh Sửa
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Showroom Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShowroom ? `Chỉnh Sửa Showroom: ${editingShowroom.name}` : 'Thêm Chi Nhánh Showroom Mới'}
        description="Thông tin trung tâm phân phối và địa điểm bàn giao xe"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên Showroom *"
            placeholder="VD: AutoMatch Cần Thơ - Ninh Kiều Center"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mã Chi Nhánh (Code) *"
              placeholder="VD: SR_CT_NK"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Tỉnh / Thành Phố *"
              placeholder="VD: Hà Nội, TP.HCM, Đà Nẵng..."
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <Input
            label="Địa Chỉ Chi Tiết *"
            placeholder="Số nhà, tên đường, phường/quận..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số Điện Thoại Hotline"
              placeholder="VD: 028 5411 2233"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Giờ Mở Cửa"
              placeholder="08:00 - 21:00"
              value={formData.opening_hours}
              onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
            />
          </div>

          <Input
            label="Email Liên Hệ"
            placeholder="showroom@automatch.vn"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Link Hình Ảnh Mặt Tiền Showroom"
            placeholder="https://images.unsplash.com/..."
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />

          <Switch
            checked={formData.is_active}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            label="Đang mở cửa hoạt động"
            description="Cho phép khách hàng chọn showroom này để lái thử và nhận xe"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingShowroom ? 'Lưu Thay Đổi' : 'Thêm Showroom'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Car as CarIcon,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Car } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatVND } from '../lib/utils';

interface CarsInventoryProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const CarsInventory: React.FC<CarsInventoryProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { cars, showrooms, addCar, updateCar, deleteCar, toggleCarActive } = useData();
  const { isOwner, can } = useAuth();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Form State
  const initialForm: Omit<Car, 'id' | 'created_at'> = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engine_hp: 300,
    price: 2000000000,
    stock_quantity: 5,
    showroom_id: showrooms[0]?.id || null,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    metadata: {
      engine_fuel_type: 'Xăng Cao Cấp',
      transmission_type: 'Tự động 8 cấp',
      driven_wheels: 'AWD',
      vehicle_style: 'Sedan Thể Thao',
      acceleration_0_100: '4.2 giây',
      top_speed: '250 km/h',
      color: 'Đen Obsidian',
      interior_color: 'Da Nappa Đen',
      features: ['Màn hình giải trí cảm ứng', 'Hệ thống treo khí nén', 'Hỗ trợ lái thông minh ADAS'],
      description: 'Mẫu xe sang trọng hiệu năng cao trang bị công nghệ lái tân tiến.',
    },
  };

  const [formData, setFormData] = useState<Omit<Car, 'id' | 'created_at'>>(initialForm);
  const [featuresText, setFeaturesText] = useState('Màn hình giải trí cảm ứng, Hệ thống treo khí nén, Hỗ trợ lái thông minh ADAS');

  const openCreateModal = () => {
    setEditingCar(null);
    setFormData(initialForm);
    setFeaturesText('Màn hình giải trí cảm ứng, Hệ thống treo khí nén, Hỗ trợ lái thông minh ADAS');
    setIsModalOpen(true);
  };

  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      engine_hp: car.engine_hp || 0,
      price: car.price || 0,
      stock_quantity: car.stock_quantity || 1,
      showroom_id: car.showroom_id || null,
      image_url: car.image_url || '',
      is_active: car.is_active,
      metadata: car.metadata || {},
    });
    setFeaturesText(car.metadata?.features?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCar(null);
    onCloseAddModal?.();
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFeatures = featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      metadata: {
        ...formData.metadata,
        features: updatedFeatures,
      },
    };

    if (editingCar) {
      await updateCar(editingCar.id, payload);
    } else {
      await addCar(payload);
    }
    handleCloseModal();
  };

  const handleDeleteCar = async (car: Car) => {
    if (!isOwner) {
      alert('Chỉ tài khoản cấp Owner mới có quyền xóa mẫu xe khỏi hệ thống.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu xe ${car.make} ${car.model} (${car.year}) khỏi cơ sở dữ liệu?`)) {
      await deleteCar(car.id);
    }
  };

  // Distinct makes for filters
  const distinctMakes = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((c) => {
      if (c.make) set.add(c.make);
    });
    return Array.from(set).sort();
  }, [cars]);

  // Filtered Cars
  const filteredCars = useMemo(() => {
    return cars.filter((c) => {
      const matchSearch =
        `${c.make || ''} ${c.model || ''} ${c.year || ''} ${c.metadata?.color || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchMake = filterMake === 'all' || c.make === filterMake;
      const matchFuel =
        filterFuel === 'all' ||
        (c.metadata?.engine_fuel_type &&
          c.metadata.engine_fuel_type.toLowerCase().includes(filterFuel.toLowerCase()));
      const matchShowroom = filterShowroom === 'all' || c.showroom_id === filterShowroom;
      return matchSearch && matchMake && matchFuel && matchShowroom;
    });
  }, [cars, searchTerm, filterMake, filterFuel, filterShowroom]);

  const totalPages = Math.ceil(filteredCars.length / pageSize);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản Lý Kho Xe & Thông Số Kỹ Thuật
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý {cars.length.toLocaleString('vi-VN')} mẫu xe sang và EV thế hệ mới trong cơ sở dữ liệu Supabase
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ bảng"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ lưới ảnh"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {can('CARS_CREATE') && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
              className="w-full sm:w-auto"
            >
              Nhập Xe Mới
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo hãng, model, năm sản xuất..."
              shortcutHint="/"
            />

            <Select
              value={filterMake}
              onChange={(e) => {
                setFilterMake(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả thương hiệu ({distinctMakes.length})</option>
              {distinctMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </Select>

            <Select
              value={filterFuel}
              onChange={(e) => {
                setFilterFuel(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả loại động cơ</option>
              <option value="Xăng">Động cơ Xăng (Gasoline)</option>
              <option value="Điện">Thuần Điện (EV)</option>
              <option value="Hybrid">Hybrid / PHEV</option>
            </Select>

            <Select
              value={filterShowroom}
              onChange={(e) => {
                setFilterShowroom(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả Showroom ({showrooms.length})</option>
              {showrooms.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area: Table or Grid */}
      {filteredCars.length === 0 ? (
        <EmptyState
          icon={<CarIcon className="w-8 h-8" />}
          title="Không tìm thấy mẫu xe nào"
          description="Thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc đang áp dụng."
          actionLabel="Xóa bộ lọc"
          onAction={() => {
            setSearchTerm('');
            setFilterMake('all');
            setFilterFuel('all');
            setFilterShowroom('all');
          }}
        />
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mẫu Xe / Hình Ảnh</TableHead>
                <TableHead>Năm SX</TableHead>
                <TableHead>Động Cơ / Mã Lực</TableHead>
                <TableHead>Giá Niêm Yết (VNĐ)</TableHead>
                <TableHead>Tồn Kho</TableHead>
                <TableHead>Showroom Trưng Bày</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCars.map((car) => {
                const showroom = showrooms.find((s) => s.id === car.showroom_id);
                return (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=200&q=80'}
                          alt={`${car.make} ${car.model}`}
                          className="w-14 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{car.make} {car.model}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{car.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-slate-700">{car.year}</span>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-slate-800 font-medium">
                        {car.metadata?.engine_fuel_type || 'Xăng'}
                      </div>
                      <div className="text-[11px] text-slate-500">{car.engine_hp || 0} HP</div>
                    </TableCell>

                    <TableCell>
                      <span className="font-extrabold text-blue-600 text-xs">
                        {formatVND(car.price)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        (car.stock_quantity || 0) > 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {car.stock_quantity || 0} chiếc
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 truncate max-w-40 block">
                        {showroom?.name?.split('-')[0] || 'Kho trung tâm'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={car.is_active ? 'success' : 'neutral'} size="sm">
                        {car.is_active ? 'Đang kinh doanh' : 'Tạm ẩn'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleCarActive(car.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={car.is_active ? 'Ẩn xe' : 'Hiện xe'}
                        >
                          {car.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => openEditModal(car)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {isOwner ? (
                          <button
                            onClick={() => handleDeleteCar(car)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa mẫu xe (Owner only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 text-slate-300 cursor-not-allowed opacity-50"
                            title="Chỉ Owner có quyền xóa xe"
                          >
                            <Trash2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
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
            totalItems={filteredCars.length}
            pageSize={pageSize}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedCars.map((car) => {
              const showroom = showrooms.find((s) => s.id === car.showroom_id);
              return (
                <Card key={car.id} className="overflow-hidden group hover:border-blue-300 transition-all">
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={car.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=500&q=80'}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <Badge variant={car.is_active ? 'success' : 'neutral'} size="sm">
                        {car.is_active ? 'Sẵn sàng' : 'Tạm ẩn'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span>{car.year}</span>
                        <span className="font-semibold">{car.metadata?.engine_fuel_type || 'Xăng'}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {car.make} {car.model}
                      </h4>
                      <p className="font-extrabold text-blue-600 text-sm mt-1">
                        {formatVND(car.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="truncate max-w-32">{showroom?.name?.split('-')[0] || 'Kho tổng'}</span>
                      <span className="font-bold text-slate-800">{car.stock_quantity || 0} xe</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => openEditModal(car)}
                      >
                        Sửa
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                          onClick={() => handleDeleteCar(car)}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredCars.length}
            pageSize={pageSize}
          />
        </div>
      )}

      {/* Modal Add / Edit Car */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCar ? `Chỉnh Sửa Xe: ${editingCar.make} ${editingCar.model}` : 'Nhập Mẫu Xe Mới Vào Kho'}
        description="Thông tin xe sẽ được đồng bộ trực tiếp lên cơ sở dữ liệu Supabase PostgreSQL"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCar} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hãng Sản Xuất (Make) *"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="VD: Porsche, BMW, Mercedes-Benz..."
              required
            />

            <Input
              label="Tên Dòng Xe (Model) *"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="VD: 911 Carrera GTS, Taycan..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Năm Sản Xuất *"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              min={1990}
              max={2030}
              required
            />

            <Input
              label="Công Suất Động Cơ (HP) *"
              type="number"
              value={formData.engine_hp || 0}
              onChange={(e) => setFormData({ ...formData, engine_hp: Number(e.target.value) })}
              min={50}
              max={2000}
              required
            />

            <Input
              label="Số Lượng Tồn Kho *"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
              min={0}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giá Niêm Yết (VNĐ) *"
              type="number"
              value={formData.price || 0}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              step={10000000}
              min={100000000}
              required
            />

            <Select
              label="Showroom Lưu Kho"
              value={formData.showroom_id || ''}
              onChange={(e) => setFormData({ ...formData, showroom_id: e.target.value || null })}
            >
              <option value="">-- Chưa phân bổ showroom --</option>
              {showrooms.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name} ({sr.city})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Link Hình Ảnh Xe (Image URL) *"
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Loại Nhiên Liệu"
              value={formData.metadata?.engine_fuel_type || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, engine_fuel_type: e.target.value },
                })
              }
              placeholder="VD: Xăng Cao Cấp, Thuần Điện"
            />

            <Input
              label="Gia Tốc 0-100 km/h"
              value={formData.metadata?.acceleration_0_100 || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, acceleration_0_100: e.target.value },
                })
              }
              placeholder="VD: 3.8 giây"
            />

            <Input
              label="Màu Ngoại Thất"
              value={formData.metadata?.color || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, color: e.target.value },
                })
              }
              placeholder="VD: Trắng Ngọc Trai, Đen Obsidian"
            />
          </div>

          <Textarea
            label="Trang Bị Nổi Bật (Phân cách bằng dấu phẩy)"
            rows={2}
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            placeholder="Màn hình HUD, Treo khí nén, Gói Sport Chrono..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingCar ? 'Lưu Thay Đổi' : 'Tạo Xe Mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

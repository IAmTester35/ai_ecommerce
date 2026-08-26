import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Fuel,
  Gauge,
  Building2,
  Package,
  Car as CarIcon,
} from 'lucide-react';
import { useData } from '../context/DataContext';
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
import { formatVND, formatVNDCompact } from '../lib/utils';

interface CarsInventoryProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const CarsInventory: React.FC<CarsInventoryProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { cars, showrooms, addCar, updateCar, deleteCar, toggleCarActive } = useData();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Form State
  const initialForm: Omit<Car, 'id' | 'created_at'> = {
    make: '',
    model: '',
    year: 2024,
    engine_hp: 400,
    price: 3000000000,
    stock_quantity: 5,
    showroom_id: showrooms[0]?.id || null,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    metadata: {
      engine_fuel_type: 'Xăng Cao Cấp',
      transmission_type: 'Tự động 8 cấp',
      driven_wheels: 'AWD',
      vehicle_style: 'Sedan Thể Thao',
      acceleration_0_100: '3.8 giây',
      top_speed: '280 km/h',
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
      stock_quantity: car.stock_quantity,
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

  // Distinct makes for filters
  const distinctMakes = useMemo(() => Array.from(new Set(cars.map((c) => c.make))), [cars]);

  // Filtered Cars
  const filteredCars = useMemo(() => {
    return cars.filter((c) => {
      const matchSearch =
        `${c.make} ${c.model} ${c.year} ${c.metadata?.color || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMake = filterMake === 'all' || c.make === filterMake;
      const matchFuel =
        filterFuel === 'all' ||
        (c.metadata?.engine_fuel_type && c.metadata.engine_fuel_type.toLowerCase().includes(filterFuel.toLowerCase()));
      const matchShowroom = filterShowroom === 'all' || c.showroom_id === filterShowroom;
      return matchSearch && matchMake && matchFuel && matchShowroom;
    });
  }, [cars, searchTerm, filterMake, filterFuel, filterShowroom]);

  const totalPages = Math.ceil(filteredCars.length / pageSize);
  const paginatedCars = filteredCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header Actions & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kho Xe & Thông Số Kỹ Thuật</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý {cars.length} mẫu xe ô tô, cấu hình RAG Vector embedding, giá bán và tồn kho theo Showroom
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
            className="flex-1 sm:flex-none"
          >
            Thêm Xe Mới
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-1">
              <SearchBar
                value={searchTerm}
                onChange={(val) => {
                  setSearchTerm(val);
                  setCurrentPage(1);
                }}
                placeholder="Tìm hãng, mẫu xe, đời..."
                shortcutHint="/"
              />
            </div>

            <Select
              value={filterMake}
              onChange={(e) => {
                setFilterMake(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả hãng xe</option>
              {distinctMakes.map((m) => (
                <option key={m} value={m}>
                  {m}
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
              <option value="all">Tất cả loại nhiên liệu</option>
              <option value="Xăng">Động cơ Xăng</option>
              <option value="Điện">Thuần Điện (EV)</option>
              <option value="Hybrid">Hybrid / Plug-in</option>
            </Select>

            <Select
              value={filterShowroom}
              onChange={(e) => {
                setFilterShowroom(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả Showroom</option>
              {showrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area: Table or Grid */}
      {paginatedCars.length === 0 ? (
        <EmptyState
          icon={<CarIcon className="w-8 h-8" />}
          title="Không tìm thấy mẫu xe nào"
          description="Không có mẫu xe nào khớp với bộ lọc tìm kiếm hiện tại của bạn."
          actionLabel="Đặt lại bộ lọc"
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
                <TableHead>Xe / Hình Ảnh</TableHead>
                <TableHead>Năm / Kiểu Dáng</TableHead>
                <TableHead>Công Suất & Động Cơ</TableHead>
                <TableHead>Giá Niêm Yết</TableHead>
                <TableHead>Showroom Lưu Kho</TableHead>
                <TableHead>Tồn Kho</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCars.map((car) => {
                const assignedShowroom = showrooms.find((s) => s.id === car.showroom_id);
                return (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80'}
                          alt={car.model}
                          className="w-14 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {car.make} {car.model}
                          </div>
                          <div className="text-xs text-slate-500">
                            {car.metadata?.color || 'Tiêu chuẩn'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">{car.year}</span>
                      <div className="text-[11px] text-slate-500">{car.metadata?.vehicle_style || 'Sedan'}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                        {car.engine_hp || '---'} HP
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        {car.metadata?.engine_fuel_type?.split(' ')[0] || 'Xăng'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-blue-600 text-xs">
                        {formatVND(car.price)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-700 font-medium">
                        {assignedShowroom?.name?.split('-')[0] || 'Chưa phân bổ'}
                      </span>
                      <div className="text-[10px] text-slate-400">{assignedShowroom?.city || ''}</div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          car.stock_quantity > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {car.stock_quantity > 0 ? `${car.stock_quantity} xe` : 'Hết hàng'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => toggleCarActive(car.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          car.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            car.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        {car.is_active ? 'Kinh doanh' : 'Tạm ẩn'}
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(car)}
                          title="Sửa thông số xe"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa ${car.make} ${car.model}?`)) {
                              deleteCar(car.id);
                            }
                          }}
                          title="Xóa xe"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
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
        /* Grid View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedCars.map((car) => {
              const assignedShowroom = showrooms.find((s) => s.id === car.showroom_id);
              return (
                <Card key={car.id} className="overflow-hidden flex flex-col justify-between group">
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={car.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=500&q=80'}
                        alt={car.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <Badge variant={car.is_active ? 'success' : 'neutral'} size="sm">
                          {car.is_active ? 'Đang bán' : 'Tạm ẩn'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-white text-[11px] font-semibold">
                        {car.year} • {car.metadata?.vehicle_style || 'Sport'}
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{car.make}</p>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{car.model}</h4>
                      </div>

                      <div className="text-base font-extrabold text-slate-900">
                        {formatVND(car.price)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{car.engine_hp || 0} HP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kho: {car.stock_quantity} xe</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{assignedShowroom?.name || 'Showroom trung tâm'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(car)}
                      className="flex-1"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleCarActive(car.id)}
                      title={car.is_active ? 'Ẩn khỏi web' : 'Hiển thị'}
                    >
                      {car.is_active ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-blue-600" />}
                    </Button>
                  </div>
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

      {/* Add / Edit Car Modal with Rich Specs */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCar ? `Chỉnh Sửa Xe: ${editingCar.make} ${editingCar.model}` : 'Thêm Xe Mới Vào Danh Mục'}
        description="Điền đầy đủ thông tin kỹ thuật để tối ưu hóa truy vấn tìm kiếm Vector và hiển thị RAG"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hãng Xe (Make) *"
              placeholder="VD: Porsche, Tesla, BMW, VinFast..."
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
            <Input
              label="Mẫu Xe (Model) *"
              placeholder="VD: 911 Carrera GTS, Model S Plaid..."
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Năm Sản Xuất *"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
              required
            />
            <Input
              label="Công Suất Động Cơ (HP)"
              type="number"
              placeholder="VD: 473"
              value={formData.engine_hp || ''}
              onChange={(e) => setFormData({ ...formData, engine_hp: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Số Lượng Tồn Kho *"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giá Niêm Yết MSRP (VNĐ) *"
              type="number"
              placeholder="VD: 9800000000"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              helperText={formData.price ? `Quy đổi: ${formatVNDCompact(formData.price)}` : ''}
              required
            />
            <Select
              label="Phân Bổ Showroom"
              value={formData.showroom_id || ''}
              onChange={(e) => setFormData({ ...formData, showroom_id: e.target.value || null })}
            >
              <option value="">Chưa phân bổ cụ thể</option>
              {showrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Link Hình Ảnh Xe (Image URL)"
            placeholder="https://images.unsplash.com/..."
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />

          {/* Detailed Metadata Accordion */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Thông Số Chi Tiết (Metadata AI RAG)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Loại Nhiên Liệu"
                placeholder="VD: Xăng Cao Cấp, Thuần Điện"
                value={formData.metadata?.engine_fuel_type || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, engine_fuel_type: e.target.value },
                  })
                }
              />
              <Input
                label="Hộp Số"
                placeholder="VD: PDK 8 cấp, Tự động"
                value={formData.metadata?.transmission_type || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, transmission_type: e.target.value },
                  })
                }
              />
              <Input
                label="Hệ Dẫn Động"
                placeholder="VD: AWD, RWD, Quattro"
                value={formData.metadata?.driven_wheels || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, driven_wheels: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Gia Tốc 0-100 km/h"
                placeholder="VD: 3.4 giây"
                value={formData.metadata?.acceleration_0_100 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, acceleration_0_100: e.target.value },
                  })
                }
              />
              <Input
                label="Màu Ngoại Thất"
                placeholder="VD: Chalk White, Đen Obsidian"
                value={formData.metadata?.color || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, color: e.target.value },
                  })
                }
              />
              <Input
                label="Màu Nội Thất"
                placeholder="VD: Da Nappa Nâu Cognac"
                value={formData.metadata?.interior_color || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, interior_color: e.target.value },
                  })
                }
              />
            </div>

            <Input
              label="Tính Năng Nổi Bật (Cách nhau bởi dấu phẩy)"
              placeholder="VD: Sport Chrono, Âm thanh Burmester, Phanh Gốm PCCB"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
            />

            <Textarea
              label="Mô Tả Cảm Giác Lái & Tổng Quan (AI Knowledge Context)"
              rows={2}
              placeholder="Mô tả cảm giác lái, ưu thế kỹ thuật phục vụ việc tạo Embedding Vector..."
              value={formData.metadata?.description || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, description: e.target.value },
                })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingCar ? 'Cập Nhật Xe' : 'Lưu Vào Kho'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

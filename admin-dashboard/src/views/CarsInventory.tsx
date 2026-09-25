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
  ArrowRightLeft,
  AlertTriangle,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { dataServices } from '../services/dataServices';
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
import { formatVND, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

interface CarsInventoryProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const CarsInventory: React.FC<CarsInventoryProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const {
    cars,
    showrooms,
    addCar,
    updateCar,
    deleteCar,
    toggleCarActive,
    quickAdjustStock,
    transferCarShowroom,
  } = useData();
  const { isOwner, can } = useAuth();
  const { success, error } = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Storage Uploading State
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferCar, setTransferCar] = useState<Car | null>(null);
  const [targetShowroomId, setTargetShowroomId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Form State
  const initialForm = useMemo<Omit<Car, 'id' | 'created_at'>>(() => ({
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
      gallery: [],
      view_360_url: '',
    },
  }), [showrooms]);

  const [formData, setFormData] = useState<Omit<Car, 'id' | 'created_at'>>(initialForm);
  const [featuresText, setFeaturesText] = useState('Màn hình giải trí cảm ứng, Hệ thống treo khí nén, Hỗ trợ lái thông minh ADAS');
  const [galleryText, setGalleryText] = useState('');
  const [view360Input, setView360Input] = useState('');

  const [prevAddProp, setPrevAddProp] = useState(isAddModalOpen);
  if (isAddModalOpen !== prevAddProp) {
    setPrevAddProp(isAddModalOpen);
    if (isAddModalOpen) {
      setEditingCar(null);
      setFormData(initialForm);
      setFeaturesText('Màn hình giải trí cảm ứng, Hệ thống treo khí nén, Hỗ trợ lái thông minh ADAS');
      setGalleryText('');
      setView360Input('');
      setIsModalOpen(true);
    }
  }

  const openCreateModal = () => {
    setEditingCar(null);
    setFormData(initialForm);
    setFeaturesText('Màn hình giải trí cảm ứng, Hệ thống treo khí nén, Hỗ trợ lái thông minh ADAS');
    setGalleryText('');
    setView360Input('');
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
    setGalleryText(car.metadata?.gallery?.join(', ') || '');
    setView360Input(car.metadata?.view_360_url || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCar(null);
    onCloseAddModal?.();
  };

  // Upload photo to Supabase Storage bucket car-images
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await dataServices.uploadCarImage(file);
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      success('Tải ảnh thành công!', 'Ảnh đã được lưu lên máy chủ và áp dụng cho mẫu xe.');
    } catch (err) {
      error('Lỗi tải ảnh', err instanceof Error ? err.message : 'Thao tác tải ảnh thất bại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFeatures = featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const updatedGallery = galleryText
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      metadata: {
        ...formData.metadata,
        features: updatedFeatures,
        gallery: updatedGallery,
        view_360_url: view360Input.trim(),
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

  // Inter-showroom Transfer Execution
  const handleOpenTransfer = (car: Car) => {
    setTransferCar(car);
    setTargetShowroomId(showrooms.find((s) => s.id !== car.showroom_id)?.id || '');
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferCar || !targetShowroomId) return;

    setIsTransferring(true);
    const ok = await transferCarShowroom(transferCar.id, targetShowroomId);
    setIsTransferring(false);

    if (ok) {
      setIsTransferModalOpen(false);
      setTransferCar(null);
    }
  };

  // Distinct Filter options
  const distinctMakes = useMemo(() => {
    const set = new Set(cars.map((c) => c.make).filter(Boolean));
    return Array.from(set).sort();
  }, [cars]);

  // Filtered Cars
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchSearch =
        `${car.make} ${car.model} ${car.year} ${car.metadata?.engine_fuel_type || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchMake = filterMake === 'all' || car.make.toLowerCase() === filterMake.toLowerCase();
      const matchFuel =
        filterFuel === 'all' ||
        (car.metadata?.engine_fuel_type || '').toLowerCase().includes(filterFuel.toLowerCase());
      const matchShowroom = filterShowroom === 'all' || car.showroom_id === filterShowroom;

      let matchStock = true;
      if (filterStock === 'low') {
        matchStock = car.stock_quantity > 0 && car.stock_quantity <= 2;
      } else if (filterStock === 'out_of_stock') {
        matchStock = car.stock_quantity === 0;
      } else if (filterStock === 'in_stock') {
        matchStock = car.stock_quantity > 2;
      }

      return matchSearch && matchMake && matchFuel && matchShowroom && matchStock;
    });
  }, [cars, searchTerm, filterMake, filterFuel, filterShowroom, filterStock]);

  const totalPages = Math.ceil(filteredCars.length / pageSize) || 1;
  const paginatedCars = filteredCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const lowStockCount = cars.filter((c) => c.stock_quantity <= 2 && c.stock_quantity > 0).length;
  const outOfStockCount = cars.filter((c) => c.stock_quantity === 0).length;

  const handleExportCSV = () => {
    const headers = ['ID', 'Hãng Xe', 'Dòng Xe', 'Năm', 'Công Suất (HP)', 'Giá Niêm Yết (VNĐ)', 'Tồn Kho', 'Trạng Thái', 'Showroom'];
    const rows = filteredCars.map((c) => [
      `"${c.id}"`,
      `"${c.make || ''}"`,
      `"${c.model || ''}"`,
      c.year || '',
      c.engine_hp || 0,
      c.price || 0,
      c.stock_quantity,
      c.is_active ? '"Đang mở bán"' : '"Tạm ẩn / Hết hàng"',
      `"${c.showroom?.name || 'Chưa phân bổ'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `automatch_cars_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Xuất file thành công', `Đã tải về danh sách ${filteredCars.length} mẫu xe.`);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kho Xe & Thông Số</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Tổng hợp danh mục xe thể thao & xe sang, số lượng tồn kho theo chi nhánh
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Chế độ bảng chi tiết"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Chế độ lưới ảnh"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
            onClick={handleExportCSV}
            className="hidden sm:inline-flex"
            title="Xuất dữ liệu xe sang file Excel CSV"
          >
            Xuất CSV
          </Button>

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

      {/* Low Stock Warning Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Cảnh báo tồn kho: Có <strong>{lowStockCount}</strong> mẫu xe sắp hết hàng (≤ 2 xe) và{' '}
              <strong>{outOfStockCount}</strong> mẫu xe đã hết hàng trong kho.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterStock('low');
                setCurrentPage(1);
              }}
              className="text-amber-800 font-bold underline hover:text-amber-900 cursor-pointer"
            >
              Xem xe sắp hết
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setFilterStock('out_of_stock');
                setCurrentPage(1);
              }}
              className="text-rose-700 font-bold underline hover:text-rose-900 cursor-pointer"
            >
              Xem xe hết hàng
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo hãng, model, năm SX..."
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
              <option value="all">Tất cả động cơ</option>
              <option value="Xăng">Động cơ Xăng</option>
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

            <Select
              value={filterStock}
              onChange={(e) => {
                setFilterStock(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="low">Sắp hết hàng (≤ 2 xe)</option>
              <option value="out_of_stock">Đã hết hàng (0 xe)</option>
              <option value="in_stock">Dồi dào (&gt; 2 xe)</option>
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
            setFilterStock('all');
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
                <TableHead>Tồn Kho (Điều chỉnh nhanh)</TableHead>
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
                          <div className="font-bold text-slate-900 text-xs">
                            {car.make} {car.model}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            #{car.id.slice(0, 8)}
                            {car.metadata?.gallery && car.metadata.gallery.length > 0 && (
                              <span className="ml-1 text-blue-600 font-sans">
                                • +{car.metadata.gallery.length} ảnh
                              </span>
                            )}
                          </div>
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

                    {/* Quick Stock Adjustment */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => quickAdjustStock(car.id, -1)}
                          disabled={car.stock_quantity <= 0}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Trừ 1 xe"
                        >
                          -
                        </button>
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-lg text-xs font-extrabold',
                            car.stock_quantity <= 2
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          )}
                        >
                          {car.stock_quantity || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdjustStock(car.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer transition-colors"
                          title="Cộng 1 xe"
                        >
                          +
                        </button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 truncate max-w-40 block">
                        {showroom?.name?.split('-')[0] || 'Kho trung tâm'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={car.is_active ? 'success' : 'neutral'} size="sm">
                        {car.is_active ? 'Đang bán' : 'Tạm ẩn'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Transfer Showroom Button */}
                        <button
                          onClick={() => handleOpenTransfer(car)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Điều chuyển sang Showroom khác"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

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
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {car.stock_quantity <= 2 && (
                        <Badge variant="warning" size="sm">
                          {car.stock_quantity === 0 ? 'Hết hàng' : `Còn ${car.stock_quantity}`}
                        </Badge>
                      )}
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

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{showroom?.name?.split('-')[0] || 'Kho tổng'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => quickAdjustStock(car.id, -1)}
                          disabled={car.stock_quantity <= 0}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="font-bold px-1">{car.stock_quantity}</span>
                        <button
                          onClick={() => quickAdjustStock(car.id, 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenTransfer(car)}
                      >
                        Chuyển SR
                      </Button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(car)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteCar(car)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
        description="Thông tin xe và tệp hình ảnh sẽ được đồng bộ trực tiếp lên cơ sở dữ liệu Supabase PostgreSQL & Storage"
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

          {/* Real Media Upload to Supabase Storage */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Ảnh Đại Diện Xe (Supabase Storage Bucket: car-images)
              </label>
              {isUploadingImage && <span className="text-[11px] text-blue-600 font-bold animate-pulse">Đang tải lên Supabase...</span>}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-20 h-14 object-cover rounded-xl border border-slate-300 bg-white shrink-0"
                />
              )}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                <Input
                  label=""
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Hoặc dán URL hình ảnh từ internet..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Media Gallery & 360 View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bộ Sưu Tập Ảnh Phụ (URLs phân cách bằng dấu phẩy)"
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              placeholder="https://images.unsplash.com/photo-1..., https://images.unsplash.com/photo-2..."
            />

            <Input
              label="Link Trải Nghiệm Xe 360 Độ (360 View URL)"
              value={view360Input}
              onChange={(e) => setView360Input(e.target.value)}
              placeholder="https://sketchfab.com/models/... hoặc link 360"
            />
          </div>

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
            <Button variant="primary" type="submit" disabled={isUploadingImage}>
              {editingCar ? 'Lưu Thay Đổi' : 'Tạo Xe Mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inter-Showroom Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Điều Chuyển Xe Giữa Các Showroom"
      >
        {transferCar && (
          <form onSubmit={handleConfirmTransfer} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-900">
                Mẫu xe: {transferCar.make} {transferCar.model} ({transferCar.year})
              </p>
              <p className="text-slate-500">
                Showroom hiện tại:{' '}
                <strong>
                  {showrooms.find((s) => s.id === transferCar.showroom_id)?.name || 'Kho tổng'}
                </strong>
              </p>
            </div>

            <Select
              label="Chọn Showroom Đích Nhận Xe *"
              required
              value={targetShowroomId}
              onChange={(e) => setTargetShowroomId(e.target.value)}
            >
              <option value="">-- Chọn Showroom đích --</option>
              {showrooms.map((sr) => (
                <option key={sr.id} value={sr.id} disabled={sr.id === transferCar.showroom_id}>
                  {sr.name} ({sr.city})
                </option>
              ))}
            </Select>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setIsTransferModalOpen(false)} type="button">
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                leftIcon={<ArrowRightLeft className="w-4 h-4" />}
                isLoading={isTransferring}
              >
                Xác Nhận Điều Chuyển
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

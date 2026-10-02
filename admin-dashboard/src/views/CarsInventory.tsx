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
  Building2,
  Download,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Car } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatUSD, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { ShowroomsView } from './ShowroomsView';
import { AddCarModal } from '../components/cars/AddCarModal';

interface CarsInventoryProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  initialTab?: 'cars' | 'showrooms';
}

export const CarsInventory: React.FC<CarsInventoryProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
  initialTab = 'cars',
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
  const { success } = useToast();

  const [inventoryTab, setInventoryTab] = useState<'cars' | 'showrooms'>(initialTab);
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

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferCar, setTransferCar] = useState<Car | null>(null);
  const [targetShowroomId, setTargetShowroomId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setInventoryTab(initialTab);
  }

  const [prevAddOpen, setPrevAddOpen] = useState(isAddModalOpen);
  if (isAddModalOpen !== prevAddOpen) {
    setPrevAddOpen(isAddModalOpen);
    if (isAddModalOpen) {
      setInventoryTab('cars');
      setEditingCar(null);
      setIsModalOpen(true);
    }
  }

  const openCreateModal = () => {
    setEditingCar(null);
    setIsModalOpen(true);
  };

  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCar(null);
    onCloseAddModal?.();
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
    const headers = ['ID', 'Hãng Xe', 'Dòng Xe', 'Năm', 'Công Suất (HP)', 'Giá Niêm Yết (USD)', 'Tồn Kho', 'Trạng Thái', 'Showroom'];
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
    <div className="space-y-6 text-left">
      {/* Subtab Switcher: Cars Inventory vs Showroom Network */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInventoryTab('cars')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              inventoryTab === 'cars'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <CarIcon className="w-4 h-4" />
            <span>Danh Mục Xe & Tồn Kho</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                inventoryTab === 'cars' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {cars.length} mẫu xe
            </span>
          </button>

          <button
            onClick={() => setInventoryTab('showrooms')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              inventoryTab === 'showrooms'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Mạng Lưới Showroom & Phân Bổ</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                inventoryTab === 'showrooms' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {showrooms.length} chi nhánh
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Quản lý toàn diện phương tiện và điều phối kho trưng bày
        </span>
      </div>

      {inventoryTab === 'showrooms' ? (
        <ShowroomsView />
      ) : (
        <>
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
              <Table bare>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mẫu Xe / Hình Ảnh</TableHead>
                    <TableHead>Năm SX</TableHead>
                    <TableHead>Động Cơ / Mã Lực</TableHead>
                    <TableHead>Giá Niêm Yết (USD)</TableHead>
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
                            {formatUSD(car.price)}
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
                            {formatUSD(car.price)}
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
        </>
      )}

      {/* Modal Add / Edit Car - Luxury Redesigned UI/UX */}
      <AddCarModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={async (carPayload) => {
          if (editingCar) {
            await updateCar(editingCar.id, carPayload);
          } else {
            await addCar(carPayload);
          }
        }}
        editingCar={editingCar}
        showrooms={showrooms}
      />

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

import React, { useState } from 'react';
import {
  Car as CarIcon,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  CheckCircle2,
  Gauge,
  Palette,
  Eye,
} from 'lucide-react';
import type { Car, Showroom } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { formatUSD, cn } from '../../lib/utils';
import { dataServices } from '../../services/dataServices';
import { useToast } from '../../context/ToastContext';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carData: Omit<Car, 'id' | 'created_at'>) => Promise<void>;
  editingCar?: Car | null;
  showrooms: Showroom[];
}

const POPULAR_MAKES = [
  'Porsche',
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Tesla',
  'Lexus',
  'Land Rover',
  'Ferrari',
  'Lamborghini',
  'Aston Martin',
];

const PRESET_COLORS = [
  { name: 'Đen Obsidian', hex: '#0F172A' },
  { name: 'Trắng Ngọc Trai', hex: '#F8FAFC', border: true },
  { name: 'Xám Kim Loại', hex: '#64748B' },
  { name: 'Đỏ Carmine', hex: '#DC2626' },
  { name: 'Xanh Sapphire', hex: '#2563EB' },
  { name: 'Xanh Rêu Aventurine', hex: '#166534' },
  { name: 'Vàng Racing', hex: '#EAB308' },
  { name: 'Bạc Dolomite', hex: '#CBD5E1' },
];

const POPULAR_FEATURES = [
  'Cửa sổ trời toàn cảnh Panorama',
  'Hệ thống treo khí nén chủ động PASM',
  'Âm thanh vòm Burmester 3D High-End',
  'Gói thể thao Sport Chrono',
  'Ghế bọc da Nappa chỉnh điện 18 hướng',
  'Ghế có sưởi, làm mát & Massage',
  'Hỗ trợ lái tự động ADAS Level 2',
  'Màn hình hiển thị kính lái HUD',
  'Đèn pha LED Matrix thông minh',
  'Camera toàn cảnh 360 độ 3D',
  'Apple CarPlay & Android Auto không dây',
  'Phanh gốm Carbon-Ceramic',
];

const FUEL_TYPES = [
  'Xăng cao cấp (Premium Petrol)',
  'Thuần điện (100% Electric EV)',
  'Plug-in Hybrid (PHEV)',
  'Mild Hybrid (MHEV)',
  'Diesel Turbo',
];

type ModalTab = 'basic' | 'specs' | 'media' | 'features';

interface AddCarFormContentProps {
  editingCar?: Car | null;
  showrooms: Showroom[];
  onSave: (carData: Omit<Car, 'id' | 'created_at'>) => Promise<void>;
  onClose: () => void;
}

const AddCarFormContent: React.FC<AddCarFormContentProps> = ({
  editingCar,
  showrooms,
  onSave,
  onClose,
}) => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ModalTab>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [make, setMake] = useState(editingCar ? editingCar.make : 'Porsche');
  const [model, setModel] = useState(editingCar ? editingCar.model : '');
  const [year, setYear] = useState<number>(editingCar ? editingCar.year : new Date().getFullYear());
  const [price, setPrice] = useState<number>(editingCar?.price ?? 125000);
  const [stockQuantity, setStockQuantity] = useState<number>(editingCar?.stock_quantity ?? 2);
  const [showroomId, setShowroomId] = useState<string>(editingCar?.showroom_id || showrooms[0]?.id || '');
  const [isActive, setIsActive] = useState<boolean>(editingCar?.is_active ?? true);

  // Specs
  const meta = editingCar?.metadata || {};
  const [engineHp, setEngineHp] = useState<number>(editingCar?.engine_hp ?? 450);
  const [acceleration, setAcceleration] = useState<string>(meta.acceleration_0_100 || '3.8s');
  const [topSpeed, setTopSpeed] = useState<string>(meta.top_speed || '295 km/h');
  const [fuelType, setFuelType] = useState<string>(meta.engine_fuel_type || 'Xăng cao cấp (Premium Petrol)');
  const [color, setColor] = useState<string>(meta.color || 'Đen Obsidian');
  const [interiorColor, setInteriorColor] = useState<string>(meta.interior_color || 'Đen Nappa Cao Cấp');
  const [batteryKwh, setBatteryKwh] = useState<number | undefined>(meta.battery_capacity_kwh);
  const [rangeKm, setRangeKm] = useState<number | undefined>(meta.range_km);

  // Media
  const [imageUrl, setImageUrl] = useState<string>(
    editingCar?.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80'
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    meta.gallery || [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
    ]
  );
  const [newGalleryInput, setNewGalleryInput] = useState<string>('');
  const [view360Url, setView360Url] = useState<string>(meta.view_360_url || '');

  // Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    meta.features && meta.features.length > 0
      ? meta.features
      : [
        'Cửa sổ trời toàn cảnh Panorama',
        'Hệ thống treo khí nén chủ động PASM',
        'Âm thanh vòm Burmester 3D High-End',
      ]
  );
  const [customFeatureInput, setCustomFeatureInput] = useState<string>('');
  const [description, setDescription] = useState<string>(meta.description || '');

  // Handle direct file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await dataServices.uploadCarImage(file);
      setImageUrl(publicUrl);
      success('Tải ảnh đại diện thành công!', 'Ảnh đã được lưu lên Supabase Storage.');
    } catch (err) {
      error('Lỗi tải ảnh', err instanceof Error ? err.message : 'Thao tác tải ảnh thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add gallery image
  const handleAddGalleryUrl = () => {
    if (!newGalleryInput.trim()) return;
    setGalleryUrls((prev) => [...prev, newGalleryInput.trim()]);
    setNewGalleryInput('');
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Feature tag toggle
  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures((prev) => prev.filter((f) => f !== feat));
    } else {
      setSelectedFeatures((prev) => [...prev, feat]);
    }
  };

  const handleAddCustomFeature = () => {
    if (!customFeatureInput.trim()) return;
    if (!selectedFeatures.includes(customFeatureInput.trim())) {
      setSelectedFeatures((prev) => [...prev, customFeatureInput.trim()]);
    }
    setCustomFeatureInput('');
  };

  // Save Car
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      error('Thiếu thông tin', 'Vui lòng nhập hãng sản xuất và tên dòng xe.');
      setActiveTab('basic');
      return;
    }

    setIsSaving(true);
    try {
      const carPayload: Omit<Car, 'id' | 'created_at'> = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        price: Number(price),
        stock_quantity: Number(stockQuantity),
        showroom_id: showroomId || null,
        is_active: Boolean(isActive),
        engine_hp: Number(engineHp),
        image_url: imageUrl.trim() || null,
        metadata: {
          engine_fuel_type: fuelType,
          acceleration_0_100: acceleration.trim(),
          top_speed: topSpeed.trim(),
          color: color.trim(),
          interior_color: interiorColor.trim(),
          battery_capacity_kwh: batteryKwh ? Number(batteryKwh) : undefined,
          range_km: rangeKm ? Number(rangeKm) : undefined,
          features: selectedFeatures,
          gallery: galleryUrls,
          view_360_url: view360Url.trim() || undefined,
          description: description.trim() || undefined,
        },
      };

      await onSave(carPayload);
      onClose();
    } catch (err) {
      error('Lỗi lưu mẫu xe', err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentShowroom = showrooms.find((s) => s.id === showroomId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Navigation Tabs for Form Sections */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        {[
          { id: 'basic', label: '1. Cơ Bản & Giá', icon: <Info className="w-3.5 h-3.5" /> },
          { id: 'specs', label: '2. Động Cơ & Vận Hành', icon: <Gauge className="w-3.5 h-3.5" /> },
          { id: 'media', label: '3. Hình Ảnh & 360°', icon: <ImageIcon className="w-3.5 h-3.5" /> },
          { id: 'features', label: '4. Tiện Nghi & Tag', icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map((tab) => {
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ModalTab)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0',
                isTabActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2-Column Split: Form Inputs (Left) & Real-time Live Vehicle Card Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB 1: BASIC & PRICING */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Popular Makes Quick Chips */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Hãng Xe Nhanh (Click để chọn nhanh)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_MAKES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMake(m)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer',
                        make === m
                          ? 'bg-blue-50 text-blue-700 font-bold border-blue-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Hãng Sản Xuất (Make) *"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="VD: Porsche, BMW..."
                  required
                />

                <Input
                  label="Tên Dòng Xe (Model) *"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="VD: 911 Carrera GTS, Taycan Turbo..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <Input
                  label="Năm Sản Xuất *"
                  type="number"
                  min={1990}
                  max={2030}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  required
                />

                <Input
                  label="Giá Niêm Yết (USD) *"
                  type="number"
                  min={1000}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />

                <Input
                  label="Số Lượng Tồn Kho *"
                  type="number"
                  min={0}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <Select
                  label="Showroom Lưu Kho"
                  value={showroomId}
                  onChange={(e) => setShowroomId(e.target.value)}
                >
                  <option value="">-- Chưa phân bổ showroom cụ thể --</option>
                  {showrooms.map((sr) => (
                    <option key={sr.id} value={sr.id}>
                      {sr.name} ({sr.city})
                    </option>
                  ))}
                </Select>

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="text-xs font-medium text-slate-700 mb-2">Trạng Thái Mở Bán</label>
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <Switch
                      checked={isActive}
                      onChange={(checked) => setIsActive(checked)}
                      label={isActive ? 'Đang mở bán trên sàn' : 'Tạm ẩn khỏi showroom'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPECS & PERFORMANCE */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <Input
                  label="Công Suất Cực Đại (HP) *"
                  type="number"
                  min={50}
                  max={2500}
                  value={engineHp}
                  onChange={(e) => setEngineHp(Number(e.target.value))}
                  required
                />

                <Input
                  label="Tăng Tốc 0-100 km/h"
                  value={acceleration}
                  onChange={(e) => setAcceleration(e.target.value)}
                  placeholder="VD: 3.2s hoặc 4.5s"
                />

                <Input
                  label="Vận Tốc Tối Đa"
                  value={topSpeed}
                  onChange={(e) => setTopSpeed(e.target.value)}
                  placeholder="VD: 295 km/h"
                />
              </div>

              <Select
                label="Loại Nhiên Liệu / Hệ Truyền Động"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>

              {/* Electric Specs (Conditional) */}
              {(fuelType.includes('Electric') || fuelType.includes('Hybrid')) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl">
                  <Input
                    label="Dung Lượng Pin (kWh)"
                    type="number"
                    value={batteryKwh || ''}
                    onChange={(e) => setBatteryKwh(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 93.4"
                  />
                  <Input
                    label="Quãng Đường 1 Lần Sạc (km)"
                    type="number"
                    value={rangeKm || ''}
                    onChange={(e) => setRangeKm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 450"
                  />
                </div>
              )}

              {/* Color Swatch Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Màu Ngoại Thất: <span className="text-blue-600 font-bold">{color}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      title={c.name}
                      className={cn(
                        'w-7 h-7 rounded-full transition-transform cursor-pointer relative shadow-xs flex items-center justify-center',
                        c.border ? 'border border-slate-300' : '',
                        color === c.name ? 'scale-115 ring-2 ring-blue-600 ring-offset-2' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      {color === c.name && (
                        <Check
                          className={cn('w-3.5 h-3.5', c.name === 'Trắng Ngọc Trai' ? 'text-slate-900' : 'text-white')}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Tên Màu Sơn Ngoại Thất Tùy Chọn"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="VD: Đen Ánh Kim, Xanh Miami..."
                  />

                  <Input
                    label="Màu Nội Thất & Chất Liệu"
                    value={interiorColor}
                    onChange={(e) => setInteriorColor(e.target.value)}
                    placeholder="VD: Đen Nappa, Nâu Saddle Leather..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & 360 */}
          {activeTab === 'media' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Primary Photo Uploader */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Ảnh Đại Diện Chính (Primary Cover) *
                  </label>
                  {isUploading && (
                    <span className="text-[11px] font-bold text-blue-600 animate-pulse flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Đang lưu Supabase Storage...
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-24 h-16 rounded-xl border border-slate-300 overflow-hidden bg-white shrink-0 shadow-inner">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <CarIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <Input
                      label=""
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Hoặc dán trực tiếp URL ảnh xe từ internet..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Gallery Photos */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Bộ Sưu Tập Hình Ảnh Chi Tiết (Gallery)
                </label>

                <div className="flex gap-2">
                  <Input
                    label=""
                    placeholder="Dán link ảnh URL bổ sung (Unsplash, CDN...)"
                    value={newGalleryInput}
                    onChange={(e) => setNewGalleryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleAddGalleryUrl}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Thêm
                  </Button>
                </div>

                {galleryUrls.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                    {galleryUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-white">
                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryUrl(idx)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa có ảnh phụ nào được thêm.</p>
                )}
              </div>

              {/* 360 View Experience */}
              <Input
                label="Liên Kết Trải Nghiệm Xe 360° (360 Interactive URL)"
                value={view360Url}
                onChange={(e) => setView360Url(e.target.value)}
                placeholder="https://sketchfab.com/models/... hoặc link 360 View iframe"
              />
            </div>
          )}

          {/* TAB 4: FEATURES & DESCRIPTION */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Gợi Ý Trang Bị Cao Cấp (Click để chọn nhanh)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_FEATURES.map((feat) => {
                    const isSelected = selectedFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => toggleFeature(feat)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1',
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-60" />}
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Feature */}
              <div className="flex gap-2">
                <Input
                  label="Thêm Trang Bị Khác"
                  placeholder="VD: Cánh gió thể thao chủ động, Mâm 22-inch đa chấu..."
                  value={customFeatureInput}
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomFeature();
                    }
                  }}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleAddCustomFeature}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Thêm
                  </Button>
                </div>
              </div>

              {/* Selected Features Pill Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Đã Chọn ({selectedFeatures.length} trang bị)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-h-16">
                  {selectedFeatures.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-md bg-white border border-slate-200 text-xs text-slate-800 font-medium shadow-2xs"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => toggleFeature(feat)}
                        className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {selectedFeatures.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Chưa chọn trang bị nào.</span>
                  )}
                </div>
              </div>

              <Textarea
                label="Mô Tả Tổng Quan Mẫu Xe (Tùy Chọn)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu điểm nhấn của phiên bản, tình trạng xe, bảo hành chính hãng..."
              />
            </div>
          )}
        </div>

        {/* Right Live Vehicle Preview Card Area (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3 sticky top-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Xem Trước Thời Gian Thực
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              )}
            >
              {isActive ? 'Mở Bán' : 'Tạm Ẩn'}
            </span>
          </div>

          {/* Live Card Graphic */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-1">
                  <CarIcon className="w-10 h-10" />
                  <span className="text-xs text-slate-400 font-medium">Chưa có ảnh xe</span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {year}
                </span>
                {currentShowroom && (
                  <span className="bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {currentShowroom.city}
                  </span>
                )}
              </div>

              <div className="absolute bottom-2.5 right-2.5">
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                  Tồn: {stockQuantity} xe
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{make || 'Hãng Xe'}</p>
                <h4 className="text-base font-extrabold text-slate-900 truncate">
                  {model || 'Tên Dòng Xe'}
                </h4>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {formatUSD(price || 0)}
                </p>
              </div>

              {/* Specs Chips */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                <div className="bg-slate-50 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Công Suất</span>
                  <span className="text-xs font-bold text-slate-800">{engineHp} HP</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">0-100 km/h</span>
                  <span className="text-xs font-bold text-slate-800">{acceleration || '--'}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Tối Đa</span>
                  <span className="text-xs font-bold text-slate-800">{topSpeed || '--'}</span>
                </div>
              </div>

              {/* Color & Fuel Info */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: PRESET_COLORS.find(c => c.name === color)?.hex || '#333' }} />
                  <span className="truncate max-w-30 font-medium">{color}</span>
                </span>
                <span className="text-[11px] text-slate-500 truncate max-w-35">{fuelType.split('(')[0]}</span>
              </div>

              {/* Features Snippet */}
              {selectedFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedFeatures.slice(0, 2).map((f) => (
                    <span key={f} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md truncate max-w-35">
                      ✓ {f}
                    </span>
                  ))}
                  {selectedFeatures.length > 2 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                      +{selectedFeatures.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {activeTab !== 'basic' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === 'features') setActiveTab('media');
                else if (activeTab === 'media') setActiveTab('specs');
                else if (activeTab === 'specs') setActiveTab('basic');
              }}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Bước Trước
            </Button>
          )}

          {activeTab !== 'features' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activeTab === 'basic') setActiveTab('specs');
                else if (activeTab === 'specs') setActiveTab('media');
                else if (activeTab === 'media') setActiveTab('features');
              }}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Tiếp Theo
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving || isUploading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {editingCar ? 'Lưu Thay Đổi' : 'Tạo Xe Mới'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export const AddCarModal: React.FC<AddCarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCar,
  showrooms,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {editingCar ? `Chỉnh Sửa: ${editingCar.make} ${editingCar.model}` : 'Thêm Mẫu Xe Mới Vào Danh Mục'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Supabase RLS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Thông tin mẫu xe, thông số kỹ thuật và bộ sưu tập đa phương tiện
            </p>
          </div>
        </div>
      }
      maxWidth="5xl"
    >
      <AddCarFormContent
        key={editingCar ? editingCar.id : 'new-car'}
        editingCar={editingCar}
        showrooms={showrooms}
        onSave={onSave}
        onClose={onClose}
      />
    </Modal>
  );
};

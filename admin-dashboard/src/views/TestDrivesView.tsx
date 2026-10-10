import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Car as CarIcon,
  List,
  LayoutGrid,
  Search,
  Check,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Car, TestDrive, TestDriveStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, formatVND, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';

const WEEKDAYS = [
  { key: 'mon', label: 'Thứ 2', short: 'T2' },
  { key: 'tue', label: 'Thứ 3', short: 'T3' },
  { key: 'wed', label: 'Thứ 4', short: 'T4' },
  { key: 'thu', label: 'Thứ 5', short: 'T5' },
  { key: 'fri', label: 'Thứ 6', short: 'T6' },
  { key: 'sat', label: 'Thứ 7', short: 'T7' },
  { key: 'sun', label: 'Chủ Nhật', short: 'CN' },
];

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const QUICK_TIME_SLOTS = ['08:30', '09:30', '10:30', '14:00', '15:30', '16:30'];

const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTimeOnly = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '--:--';
  }
};

const formatVietnameseFullDate = (dateKey: string): string => {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[dayOfWeek]}, ${d} tháng ${m}, ${y}`;
  } catch {
    return dateKey;
  }
};

const getCustomerDisplay = (td: TestDrive) => {
  if (td.profile?.full_name) {
    return {
      name: td.profile.full_name,
      phone: td.profile.phone || td.profile.email || 'Chưa cập nhật SĐT',
      isDirect: false,
    };
  }
  const match = td.notes?.match(/\[Khách:\s*([^\]-]+?)\s*-\s*SĐT:\s*([^\]]+?)\]/);
  if (match) {
    return {
      name: match[1].trim(),
      phone: match[2].trim(),
      isDirect: true,
    };
  }
  return {
    name: 'Khách Trực Tiếp',
    phone: 'Chưa cập nhật SĐT',
    isDirect: true,
  };
};

const cleanNotes = (notes?: string | null): string => {
  if (!notes) return '';
  return notes.replace(/\[Khách:\s*[^\]-]+?\s*-\s*SĐT:\s*[^\]]+?\]\s*/, '').trim();
};

export const TestDrivesView: React.FC = () => {
  const { cars, testDrives, showrooms, customers, addTestDrive, updateTestDriveStatus, assignTestDriveStaff } =
    useData();

  // View Mode: Calendar (default) vs List
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Calendar State
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Action Modal State (Confirm / Complete / Cancel)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTD, setSelectedTD] = useState<TestDrive | null>(null);
  const [targetStatus, setTargetStatus] = useState<TestDriveStatus>('confirmed');
  const [notes, setNotes] = useState('');

  // Create Test Drive Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isPickingCar, setIsPickingCar] = useState(false);
  const [carSearchTerm, setCarSearchTerm] = useState('');
  const [carFilterMake, setCarFilterMake] = useState('all');
  const [carFilterShowroom, setCarFilterShowroom] = useState('all');

  // Customer in Create Modal
  const [customerType, setCustomerType] = useState<'direct' | 'crm'>('direct');
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [crmUserId, setCrmUserId] = useState('');
  const [crmSearch, setCrmSearch] = useState('');

  // Appointment time & place
  const [createShowroomId, setCreateShowroomId] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createTime, setCreateTime] = useState('09:30');
  const [createNotes, setCreateNotes] = useState('');
  const [createStaffId, setCreateStaffId] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const staffMembers = useMemo(() => {
    return customers.filter((c) => c.role === 'owner' || c.role === 'manager');
  }, [customers]);

  // Popular makes from available cars
  const popularMakes = useMemo(() => {
    const list = Array.from(new Set(cars.map((c) => c.make).filter(Boolean)));
    return list.slice(0, 8);
  }, [cars]);

  // Filtered cars for smart car picker (capped at 24 results for ultra-fast rendering)
  const filteredCarsForPicker = useMemo(() => {
    const term = carSearchTerm.trim().toLowerCase();
    return cars
      .filter((c) => {
        const matchSearch =
          !term ||
          `${c.make} ${c.model} ${c.year} ${c.metadata?.color || ''}`.toLowerCase().includes(term);
        const matchMake = carFilterMake === 'all' || c.make.toLowerCase() === carFilterMake.toLowerCase();
        const matchShowroom =
          carFilterShowroom === 'all' || !c.showroom_id || c.showroom_id === carFilterShowroom;
        return matchSearch && matchMake && matchShowroom;
      })
      .slice(0, 24);
  }, [cars, carSearchTerm, carFilterMake, carFilterShowroom]);

  // Filtered CRM customers for search
  const filteredCrmCustomers = useMemo(() => {
    const term = crmSearch.trim().toLowerCase();
    if (!term) return customers.slice(0, 10);
    return customers
      .filter(
        (c) =>
          (c.full_name && c.full_name.toLowerCase().includes(term)) ||
          (c.phone && c.phone.includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [customers, crmSearch]);

  // Open Create modal pre-filled with selected date
  const openCreateModalForDate = (dateKey?: string) => {
    const defaultCar = cars.find((c) => c.stock_quantity > 0) || cars[0] || null;
    setSelectedCar(defaultCar);
    setIsPickingCar(!defaultCar);
    setCarSearchTerm('');
    setCarFilterMake('all');
    setCarFilterShowroom('all');

    setCustomerType('direct');
    setDirectName('');
    setDirectPhone('');
    setCrmUserId('');
    setCrmSearch('');

    setCreateShowroomId(defaultCar?.showroom_id || showrooms[0]?.id || '');
    setCreateStaffId('');
    setCreateNotes('');

    const targetDate = dateKey || selectedDateKey || todayKey;
    setCreateDate(targetDate);
    setCreateTime('09:30');
    setIsCreateModalOpen(true);
  };

  const handleCreateTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !createDate || !createTime) return;

    if (customerType === 'direct' && !directName.trim()) {
      alert('Vui lòng nhập họ tên khách hàng trải nghiệm xe.');
      return;
    }

    setIsSubmittingCreate(true);
    const scheduledDateTime = `${createDate}T${createTime}:00`;

    // Package walk-in customer into notes tag if direct
    let finalNotes = createNotes.trim();
    if (customerType === 'direct' && directName.trim()) {
      const tag = `[Khách: ${directName.trim()} - SĐT: ${directPhone.trim() || 'N/A'}]`;
      finalNotes = finalNotes ? `${tag} ${finalNotes}` : tag;
    }

    await addTestDrive({
      car_id: selectedCar.id,
      showroom_id: createShowroomId || selectedCar.showroom_id || null,
      user_id: customerType === 'crm' ? crmUserId || null : null,
      scheduled_date: new Date(scheduledDateTime).toISOString(),
      notes: finalNotes || null,
      assigned_staff_id: createStaffId || null,
    });

    setIsSubmittingCreate(false);
    setIsCreateModalOpen(false);
  };

  const openActionModal = (td: TestDrive, status: TestDriveStatus) => {
    setSelectedTD(td);
    setTargetStatus(status);
    setNotes(cleanNotes(td.notes) || '');
    setIsModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedTD) return;

    // Retain customer direct tag if present
    const match = selectedTD.notes?.match(/\[Khách:\s*[^\]-]+?\s*-\s*SĐT:\s*[^\]]+?\]/);
    const directTag = match ? match[0] : '';
    const updatedNotes = directTag ? `${directTag} ${notes.trim()}`.trim() : notes.trim();

    await updateTestDriveStatus(selectedTD.id, targetStatus, updatedNotes);
    setIsModalOpen(false);
  };

  // Filtered Test Drives
  const filteredTestDrives = useMemo(() => {
    return testDrives.filter((td) => {
      const cust = getCustomerDisplay(td);
      const matchSearch =
        `${cust.name} ${cust.phone} ${td.car?.make || ''} ${td.car?.model || ''} ${td.notes || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchShowroom = filterShowroom === 'all' || td.showroom_id === filterShowroom;
      const matchStatus = filterStatus === 'all' || td.status === filterStatus;
      return matchSearch && matchShowroom && matchStatus;
    });
  }, [testDrives, searchTerm, filterShowroom, filterStatus]);

  // Map test drives by date key (YYYY-MM-DD)
  const testDrivesByDate = useMemo(() => {
    const map = new Map<string, TestDrive[]>();
    filteredTestDrives.forEach((td) => {
      try {
        const d = new Date(td.scheduled_date);
        const key = toDateKey(d);
        const list = map.get(key) || [];
        list.push(td);
        map.set(key, list);
      } catch {
        // Ignore invalid dates
      }
    });

    // Sort appointments in each day by scheduled time
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
    });

    return map;
  }, [filteredTestDrives]);

  // Calendar Grid Days Calculation
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday is index 0
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Previous Month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevCells = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = toDateKey(d);
      prevCells.push({
        date: d,
        dateKey,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        testDrives: testDrivesByDate.get(dateKey) || [],
      });
    }

    // Current Month cells
    const currentCells = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateKey = toDateKey(d);
      currentCells.push({
        date: d,
        dateKey,
        dayNumber: i,
        isCurrentMonth: true,
        testDrives: testDrivesByDate.get(dateKey) || [],
      });
    }

    // Next Month padding to complete grid
    const totalFilled = prevCells.length + currentCells.length;
    const nextPadding = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    const nextCells = [];
    for (let i = 1; i <= nextPadding; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = toDateKey(d);
      nextCells.push({
        date: d,
        dateKey,
        dayNumber: i,
        isCurrentMonth: false,
        testDrives: testDrivesByDate.get(dateKey) || [],
      });
    }

    return [...prevCells, ...currentCells, ...nextCells];
  }, [currentMonth, testDrivesByDate]);

  // Appointments on currently selected date
  const selectedDateAppointments = useMemo(() => {
    return testDrivesByDate.get(selectedDateKey) || [];
  }, [testDrivesByDate, selectedDateKey]);

  // Quick stats
  const stats = useMemo(() => {
    const pending = testDrives.filter((t) => t.status === 'pending').length;
    const confirmed = testDrives.filter((t) => t.status === 'confirmed').length;
    const completed = testDrives.filter((t) => t.status === 'completed').length;
    const todayAppointments = (testDrivesByDate.get(todayKey) || []).length;
    return { pending, confirmed, completed, todayAppointments, total: testDrives.length };
  }, [testDrives, testDrivesByDate, todayKey]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(todayKey);
  };

  // Pagination for table view
  const totalPages = Math.ceil(filteredTestDrives.length / pageSize) || 1;
  const paginatedTestDrives = filteredTestDrives.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Lịch Hẹn Lái Thử Trực Quan</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Interactive Calendar
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Theo dõi, điều phối lịch hẹn trải nghiệm xe và chỉ định cố vấn bán hàng trực tiếp trên lịch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Giao Diện Lịch</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh Sách Bảng</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openCreateModalForDate()}
          >
            Đặt Lịch Mới
          </Button>
        </div>
      </div>

      {/* Quick Summary Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setFilterStatus('all');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer bg-white',
            filterStatus === 'all'
              ? 'border-blue-500/50 ring-2 ring-blue-500/10 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300'
          )}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Lịch Hẹn</div>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-baseline justify-between">
            <span>{stats.total}</span>
            <span className="text-[11px] font-medium text-slate-400">hệ thống</span>
          </div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('pending');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer bg-white',
            filterStatus === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-xs'
              : 'border-slate-200/80 hover:border-amber-300'
          )}
        >
          <div className="text-[11px] font-semibold text-amber-700 flex items-center justify-between uppercase tracking-wider">
            <span>Chờ Duyệt</span>
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <div className="text-xl font-black text-amber-900 mt-1 flex items-baseline justify-between">
            <span>{stats.pending}</span>
            <span className="text-[11px] font-semibold text-amber-600">cần xử lý</span>
          </div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('confirmed');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer bg-white',
            filterStatus === 'confirmed'
              ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-xs'
              : 'border-slate-200/80 hover:border-blue-300'
          )}
        >
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Đã Xác Nhận</div>
          <div className="text-xl font-black text-blue-900 mt-1 flex items-baseline justify-between">
            <span>{stats.confirmed}</span>
            <span className="text-[11px] font-semibold text-blue-600">sắp diễn ra</span>
          </div>
        </div>

        <div
          onClick={() => {
            handleJumpToToday();
          }}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer bg-white',
            selectedDateKey === todayKey
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs'
              : 'border-slate-200/80 hover:border-emerald-300'
          )}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Hôm Nay ({today.getDate()}/{today.getMonth() + 1})
          </div>
          <div className="text-xl font-black text-emerald-900 mt-1 flex items-baseline justify-between">
            <span>{stats.todayAppointments}</span>
            <span className="text-[11px] font-semibold text-emerald-600">lịch hẹn</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên khách, SĐT, dòng xe..."
              shortcutHint="/"
            />

            <Select
              value={filterShowroom}
              onChange={(e) => {
                setFilterShowroom(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả Showroom ({showrooms.length})</option>
              {showrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </Select>

            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái lịch</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã duyệt lịch hẹn</option>
              <option value="completed">Đã hoàn tất lái thử</option>
              <option value="cancelled">Đã hủy lịch</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main View: Calendar vs List */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Month Calendar (8 Cols on LG) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="overflow-hidden border border-slate-200/90 shadow-sm">
              {/* Calendar Month Header Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {MONTH_NAMES[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Nhấp vào ngày để xem chi tiết lịch hẹn hoặc ấn vào lịch để đổi trạng thái
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJumpToToday}
                    className="text-xs font-semibold"
                  >
                    Hôm Nay
                  </Button>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center">
                {WEEKDAYS.map((wd) => (
                  <div key={wd.key} className="py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span className="hidden sm:inline">{wd.label}</span>
                    <span className="sm:hidden">{wd.short}</span>
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-100">
                {calendarCells.map((cell) => {
                  const isTodayCell = cell.dateKey === todayKey;
                  const isSelectedCell = cell.dateKey === selectedDateKey;
                  const hasAppointments = cell.testDrives.length > 0;

                  return (
                    <div
                      key={cell.dateKey}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      className={cn(
                        'min-h-24 sm:min-h-29.5 p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between group relative select-none',
                        !cell.isCurrentMonth && 'bg-slate-50/40 text-slate-300',
                        cell.isCurrentMonth && 'bg-white',
                        isSelectedCell && 'ring-2 ring-inset ring-blue-600 bg-blue-50/30 z-10',
                        !isSelectedCell && 'hover:bg-slate-50/80'
                      )}
                    >
                      {/* Top Bar inside Cell */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            'text-xs font-semibold inline-flex items-center justify-center',
                            isTodayCell
                              ? 'w-6 h-6 rounded-full bg-blue-600 text-white font-bold shadow-xs'
                              : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                          )}
                        >
                          {cell.dayNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {hasAppointments && (
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                                cell.testDrives.some((t) => t.status === 'pending')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              )}
                            >
                              {cell.testDrives.length}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateKey(cell.dateKey);
                              openCreateModalForDate(cell.dateKey);
                            }}
                            className="w-5 h-5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title={`Đặt lịch ngày ${cell.dayNumber}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Appointment Badges on the Date Cell */}
                      <div className="mt-1 space-y-1 overflow-hidden flex-1">
                        {cell.testDrives.slice(0, 2).map((td) => {
                          const statusConfig = statusMap[td.status] || {
                            label: td.status,
                            color: '#475569',
                            bg: '#F1F5F9',
                            border: '#E2E8F0',
                            dotColor: 'bg-slate-500',
                          };
                          const cust = getCustomerDisplay(td);

                          return (
                            <div
                              key={td.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateKey(cell.dateKey);
                                openActionModal(td, td.status === 'pending' ? 'confirmed' : td.status);
                              }}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium flex items-center gap-1 transition-all border shadow-2xs hover:scale-[1.02]',
                                td.status === 'pending' &&
                                'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
                                td.status === 'confirmed' &&
                                'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
                                td.status === 'completed' &&
                                'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
                                td.status === 'cancelled' &&
                                'bg-slate-100 text-slate-500 border-slate-200 line-through'
                              )}
                              title={`${formatTimeOnly(td.scheduled_date)}: ${cust.name} - ${td.car?.make || ''} ${td.car?.model || ''}`}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dotColor)} />
                              <span className="font-bold text-[9px] shrink-0">
                                {formatTimeOnly(td.scheduled_date)}
                              </span>
                              <span className="truncate">
                                {td.car?.model || cust.name}
                              </span>
                            </div>
                          );
                        })}

                        {cell.testDrives.length > 2 && (
                          <div className="text-[9px] font-bold text-slate-500 pl-1">
                            +{cell.testDrives.length - 2} lịch khác...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Chú thích màu:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Chờ duyệt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Đã xác nhận</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Đã hoàn tất</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Đã hủy</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  * Nhấp đôi hoặc chọn ngày để xem lịch trình chi tiết
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Selected Day Agenda & Detail Inspector (4 Cols on LG) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-slate-200/90 shadow-sm sticky top-4">
              {/* Day Agenda Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Lịch Trình Chi Tiết
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {formatVietnameseFullDate(selectedDateKey)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDateAppointments.length > 0
                      ? `Có ${selectedDateAppointments.length} buổi trải nghiệm xe được lên lịch`
                      : 'Không có lịch hẹn nào vào ngày này'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => openCreateModalForDate(selectedDateKey)}
                >
                  Thêm
                </Button>
              </div>

              {/* Day Agenda Appointments List */}
              <div className="p-4 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                {selectedDateAppointments.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">Không Có Lịch Hẹn</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Chưa có khách hàng đăng ký lái thử vào ngày này. Bạn có thể chủ động lên lịch trực tiếp cho khách.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="mt-4"
                      onClick={() => openCreateModalForDate(selectedDateKey)}
                    >
                      Đặt Lịch Ngày Này
                    </Button>
                  </div>
                ) : (
                  selectedDateAppointments.map((td) => {
                    const statusConfig = statusMap[td.status] || {
                      label: td.status,
                      color: '#475569',
                      bg: '#F1F5F9',
                      border: '#E2E8F0',
                      dotColor: 'bg-slate-500',
                    };
                    const cust = getCustomerDisplay(td);
                    const noteText = cleanNotes(td.notes);

                    return (
                      <div
                        key={td.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all text-left space-y-3 bg-white',
                          td.status === 'pending'
                            ? 'border-amber-200 ring-1 ring-amber-100 shadow-2xs'
                            : 'border-slate-200/80 hover:border-slate-300'
                        )}
                      >
                        {/* Time & Status Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{formatTimeOnly(td.scheduled_date)}</span>
                          </div>

                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cust.name}</span>
                              {cust.isDirect && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  Trực tiếp
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <a
                                href={`tel:${cust.phone}`}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {cust.phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Car Preview */}
                        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {td.car?.image_url ? (
                            <img
                              src={td.car.image_url}
                              alt=""
                              className="w-12 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
                              <CarIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {td.car ? `${td.car.make} ${td.car.model}` : 'Mẫu xe lái thử'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{td.showroom?.name?.split('-')[0] || 'Showroom Trung Tâm'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Advisor Assignment */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Cố vấn bán hàng phụ trách:
                          </label>
                          <Select
                            value={td.assigned_staff_id || ''}
                            onChange={(e) => assignTestDriveStaff(td.id, e.target.value || null)}
                            className="text-xs py-1"
                          >
                            <option value="">-- Chưa chỉ định --</option>
                            {staffMembers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.full_name || s.email}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Notes */}
                        {noteText && (
                          <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900 italic">
                            <span className="font-semibold not-italic">Ghi chú:</span> {noteText}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          {td.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full justify-center"
                              onClick={() => openActionModal(td, 'confirmed')}
                            >
                              Duyệt Lịch Hẹn
                            </Button>
                          )}
                          {td.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-700 hover:bg-emerald-50 border-emerald-300 w-full justify-center"
                              onClick={() => openActionModal(td, 'completed')}
                            >
                              Hoàn Tất Lái Thử
                            </Button>
                          )}
                          {td.status !== 'cancelled' && td.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50 text-xs shrink-0"
                              onClick={() => openActionModal(td, 'cancelled')}
                            >
                              Hủy Lịch
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* List / Table View */
        paginatedTestDrives.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="w-8 h-8" />}
            title="Không có lịch hẹn lái thử nào"
            description="Không tìm thấy lịch hẹn phù hợp với bộ lọc hiện tại."
          />
        ) : (
          <Card className="overflow-hidden">
            <Table bare>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>Mẫu Xe Trải Nghiệm</TableHead>
                  <TableHead>Showroom Tiếp Đón</TableHead>
                  <TableHead>Cố Vấn Bán Hàng</TableHead>
                  <TableHead>Thời Gian Hẹn</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ghi Chú</TableHead>
                  <TableHead className="text-right">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTestDrives.map((td) => {
                  const statusInfo = statusMap[td.status] || {
                    label: td.status,
                    color: '#475569',
                    bg: '#F1F5F9',
                    border: '#E2E8F0',
                    dotColor: 'bg-slate-500',
                  };
                  const cust = getCustomerDisplay(td);
                  const noteText = cleanNotes(td.notes);

                  return (
                    <TableRow key={td.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          {cust.isDirect && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Trực tiếp
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {td.car?.image_url && (
                            <img
                              src={td.car.image_url}
                              alt=""
                              className="w-10 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <span className="font-bold text-slate-800 text-xs">
                            {td.car ? `${td.car.make} ${td.car.model}` : 'Xe thương mại'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-slate-800 font-semibold">
                          {td.showroom?.name?.split('-')[0] || 'Showroom Trung Tâm'}
                        </div>
                        <div className="text-[11px] text-slate-400">{td.showroom?.city || 'Hà Nội'}</div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={td.assigned_staff_id || ''}
                          onChange={(e) => assignTestDriveStaff(td.id, e.target.value || null)}
                          className="text-xs py-1"
                        >
                          <option value="">-- Chưa chỉ định --</option>
                          {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name || s.email}
                            </option>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{formatDateTime(td.scheduled_date)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dotColor)} />
                          {statusInfo.label}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="text-xs text-slate-500 line-clamp-1 italic">
                          {noteText || 'Không có ghi chú thêm'}
                        </p>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {td.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openActionModal(td, 'confirmed')}
                            >
                              Duyệt
                            </Button>
                          )}
                          {td.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(td, 'completed')}
                            >
                              Hoàn Tất
                            </Button>
                          )}
                          {td.status !== 'cancelled' && td.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => openActionModal(td, 'cancelled')}
                            >
                              Hủy Lịch
                            </Button>
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
              totalItems={filteredTestDrives.length}
              pageSize={pageSize}
            />
          </Card>
        )
      )}

      {/* Confirmation & Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          targetStatus === 'confirmed'
            ? 'Xác Nhận Duyệt Lịch Hẹn Lái Thử'
            : targetStatus === 'completed'
              ? 'Xác Nhận Hoàn Tất Buổi Lái Thử'
              : 'Hủy Lịch Hẹn Lái Thử'
        }
        description={
          targetStatus === 'confirmed'
            ? 'Hệ thống sẽ gửi thông báo tự động đến ứng dụng của khách hàng để nhắc lịch hẹn.'
            : undefined
        }
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          {selectedTD && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">
                {selectedTD.car ? `${selectedTD.car.make} ${selectedTD.car.model}` : 'Xe lái thử'}
              </div>
              <div className="text-slate-600">
                Khách hàng: <span className="font-semibold">{getCustomerDisplay(selectedTD).name}</span> - {getCustomerDisplay(selectedTD).phone}
              </div>
              <div className="text-slate-600">
                Thời gian: <span className="font-semibold text-blue-600">{formatDateTime(selectedTD.scheduled_date)}</span>
              </div>
            </div>
          )}

          <Textarea
            label="Ghi Chú Cho Buổi Trải Nghiệm Xe"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Xe đã sẵn sàng tại Showroom, pin sạc 100%, đón khách lúc 9:30..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Quay lại
            </Button>
            <Button
              variant={targetStatus === 'cancelled' ? 'danger' : 'primary'}
              onClick={handleConfirmStatus}
            >
              {targetStatus === 'confirmed'
                ? 'Duyệt Lịch Hẹn'
                : targetStatus === 'completed'
                  ? 'Ghi Nhận Hoàn Tất'
                  : 'Xác Nhận Hủy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Luxury Redesigned Create Test Drive Modal with Smart Car Finder */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Đặt Lịch Hẹn Lái Thử Trải Nghiệm Xe</h3>
              <p className="text-xs text-slate-500 font-normal">
                Bộ lọc tìm kiếm xe thông minh & điều phối cố vấn phục vụ khách hàng
              </p>
            </div>
          </div>
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateTestDrive} className="space-y-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Smart Car Selector (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>Mẫu Xe Trải Nghiệm *</span>
                </label>
                {selectedCar && (
                  <button
                    type="button"
                    onClick={() => setIsPickingCar(!isPickingCar)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isPickingCar ? 'Thu gọn' : 'Đổi xe khác'}
                  </button>
                )}
              </div>

              {/* Selected Car Highlight Card (When a car is selected and not in picker mode) */}
              {selectedCar && !isPickingCar && (
                <div className="p-3.5 rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50/50 to-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-3.5">
                    {selectedCar.image_url ? (
                      <img
                        src={selectedCar.image_url}
                        alt=""
                        className="w-20 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <CarIcon className="w-7 h-7 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {selectedCar.make} {selectedCar.model}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Năm sản xuất: <span className="font-semibold text-slate-700">{selectedCar.year}</span>
                      </div>
                      <div className="text-xs font-bold text-blue-700 mt-0.5">
                        {selectedCar.price ? formatVND(selectedCar.price) : 'Giá liên hệ'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-blue-100/80 text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-bold text-[10px]',
                        selectedCar.stock_quantity > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {selectedCar.stock_quantity > 0
                        ? `Sẵn sàng (${selectedCar.stock_quantity} xe trong kho)`
                        : 'Xe trưng bày lái thử'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsPickingCar(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Tìm mẫu xe khác →
                    </button>
                  </div>
                </div>
              )}

              {/* Smart Car Picker Search & Selection Grid (When no car selected or user clicks Change) */}
              {(isPickingCar || !selectedCar) && (
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50">
                  {/* Live Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={carSearchTerm}
                      onChange={(e) => setCarSearchTerm(e.target.value)}
                      placeholder="Gõ tên hãng hoặc model xe (VD: Porsche 911, VF9, BMW...)"
                      className="w-full pl-9 pr-8 py-2 bg-white text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {carSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCarSearchTerm('')}
                        className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Make Filter Chips - Wrapping naturally, zero horizontal scroll */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Lọc nhanh theo hãng xe:</span>
                      {carFilterMake !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setCarFilterMake('all')}
                          className="text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Xóa lọc
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCarFilterMake('all')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                          carFilterMake === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        Tất cả ({cars.length})
                      </button>
                      {popularMakes.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCarFilterMake(m)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                            carFilterMake.toLowerCase() === m.toLowerCase()
                              ? 'bg-blue-600 text-white shadow-2xs font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Results List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {filteredCarsForPicker.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy xe nào khớp với "{carSearchTerm}".
                      </div>
                    ) : (
                      filteredCarsForPicker.map((c) => {
                        const isSelected = selectedCar?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCar(c);
                              setIsPickingCar(false);
                              if (c.showroom_id) {
                                setCreateShowroomId(c.showroom_id);
                              }
                            }}
                            className={cn(
                              'p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 bg-white hover:scale-[1.01]',
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/40'
                                : 'border-slate-200 hover:border-slate-300'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {c.image_url ? (
                                <img
                                  src={c.image_url}
                                  alt=""
                                  className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <CarIcon className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {c.make} {c.model} ({c.year})
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span>{c.price ? formatVND(c.price) : 'Liên hệ'}</span>
                                  <span>•</span>
                                  <span
                                    className={
                                      c.stock_quantity > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                                    }
                                  >
                                    {c.stock_quantity > 0 ? `Còn ${c.stock_quantity} xe` : 'Trưng bày'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-blue-600 opacity-0 hover:opacity-100 shrink-0">
                                Chọn
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Showroom & Advisor Row */}
              <div className="space-y-3 pt-2">
                <Select
                  label="Chi Nhánh Showroom Tiếp Đón *"
                  value={createShowroomId}
                  onChange={(e) => setCreateShowroomId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn Showroom --</option>
                  {showrooms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Chỉ Định Cố Vấn Bán Hàng Phụ Trách"
                  value={createStaffId}
                  onChange={(e) => setCreateStaffId(e.target.value)}
                >
                  <option value="">-- Chỉ định sau / Tự động --</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.email} ({s.role.toUpperCase()})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Right Column: Customer Info & Appointment Schedule (6 Cols) */}
            <div className="lg:col-span-6 space-y-5">
              {/* Customer Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">
                      2
                    </span>
                    <span>Thông Tin Khách Hàng *</span>
                  </label>

                  {/* Customer Type Toggle */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setCustomerType('direct')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                        customerType === 'direct'
                          ? 'bg-white text-blue-600 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Trực tiếp / Vãng lai
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('crm')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                        customerType === 'crm'
                          ? 'bg-white text-blue-600 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Hồ Sơ CRM ({customers.length})
                    </button>
                  </div>
                </div>

                {customerType === 'direct' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50">
                    <Input
                      label="Họ & Tên Khách Hàng *"
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      placeholder="VD: Anh Tuấn Kiệt"
                      required
                    />
                    <Input
                      label="Số Điện Thoại Liên Hệ *"
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      placeholder="VD: 0988 123 456"
                      type="tel"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        placeholder="Tìm theo tên, email hoặc SĐT khách CRM..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <Select
                      value={crmUserId}
                      onChange={(e) => setCrmUserId(e.target.value)}
                      required={customerType === 'crm'}
                    >
                      <option value="">-- Chọn khách hàng từ CRM --</option>
                      {filteredCrmCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || 'Khách hàng'} - {c.phone || c.email}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              {/* Date & Time Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">
                    3
                  </span>
                  <span>Thời Gian Lái Thử *</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Ngày Lái Thử *"
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Giờ Hẹn *
                    </label>
                    <input
                      type="time"
                      value={createTime}
                      onChange={(e) => setCreateTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Quick Time Slots */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Khung giờ phổ biến:</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {QUICK_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setCreateTime(slot)}
                        className={cn(
                          'py-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                          createTime === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">
                    4
                  </span>
                  <span>Ghi Chú Lộ Trình / Yêu Cầu Riêng</span>
                </label>
                <Textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="VD: Khách muốn lái thử trên đại lộ Võ Nguyên Giáp, chuẩn bị xe rửa sạch và sạc 100% pin..."
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {selectedCar ? (
                <span>
                  Đã chọn: <strong className="text-slate-900">{selectedCar.make} {selectedCar.model}</strong> • {createDate} lúc {createTime}
                </span>
              ) : (
                <span className="text-rose-500 font-medium">* Vui lòng chọn mẫu xe trải nghiệm</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!selectedCar}
                isLoading={isSubmittingCreate}
                className="w-full sm:w-auto"
              >
                Xác Nhận Đặt Lịch Lái Thử
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

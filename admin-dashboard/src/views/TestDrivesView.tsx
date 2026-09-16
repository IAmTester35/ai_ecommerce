import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  Plus,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { TestDrive, TestDriveStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';

export const TestDrivesView: React.FC = () => {
  const { cars, testDrives, showrooms, customers, addTestDrive, updateTestDriveStatus, assignTestDriveStaff } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterShowroom, setFilterShowroom] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTD, setSelectedTD] = useState<TestDrive | null>(null);
  const [targetStatus, setTargetStatus] = useState<TestDriveStatus>('confirmed');
  const [notes, setNotes] = useState('');

  // Create Test Drive Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCarId, setCreateCarId] = useState('');
  const [createShowroomId, setCreateShowroomId] = useState('');
  const [createUserId, setCreateUserId] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createStaffId, setCreateStaffId] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const staffMembers = useMemo(() => {
    return customers.filter((c) => c.role === 'owner' || c.role === 'manager');
  }, [customers]);

  const handleCreateTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCarId || !createDate) return;
    setIsSubmittingCreate(true);
    await addTestDrive({
      car_id: createCarId,
      showroom_id: createShowroomId || null,
      user_id: createUserId || null,
      scheduled_date: new Date(createDate).toISOString(),
      notes: createNotes.trim() || null,
      assigned_staff_id: createStaffId || null,
    });
    setIsSubmittingCreate(false);
    setIsCreateModalOpen(false);
    setCreateCarId('');
    setCreateDate('');
    setCreateNotes('');
  };

  const openActionModal = (td: TestDrive, status: TestDriveStatus) => {
    setSelectedTD(td);
    setTargetStatus(status);
    setNotes(td.notes || '');
    setIsModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedTD) return;
    await updateTestDriveStatus(selectedTD.id, targetStatus, notes);
    setIsModalOpen(false);
  };

  // Filtered Test Drives
  const filteredTestDrives = useMemo(() => {
    return testDrives.filter((td) => {
      const matchSearch =
        `${td.profile?.full_name || ''} ${td.profile?.phone || ''} ${td.car?.make || ''} ${td.car?.model || ''} ${td.notes || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchShowroom = filterShowroom === 'all' || td.showroom_id === filterShowroom;
      const matchStatus = filterStatus === 'all' || td.status === filterStatus;
      return matchSearch && matchShowroom && matchStatus;
    });
  }, [testDrives, searchTerm, filterShowroom, filterStatus]);

  const totalPages = Math.ceil(filteredTestDrives.length / pageSize) || 1;
  const paginatedTestDrives = filteredTestDrives.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-8 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch Hẹn Lái Thử</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Điều phối lịch hẹn trải nghiệm xe và phân công cố vấn tại Showroom
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md">
            {testDrives.filter((t) => t.status === 'confirmed').length} đã duyệt
          </Badge>
          {testDrives.filter((t) => t.status === 'pending').length > 0 && (
            <Badge variant="warning" size="md">
              {testDrives.filter((t) => t.status === 'pending').length} chờ duyệt
            </Badge>
          )}
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setCreateCarId(cars[0]?.id || '');
              setCreateShowroomId(showrooms[0]?.id || '');
              setCreateDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
              setIsCreateModalOpen(true);
            }}
          >
            Đặt Lịch Mới
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên khách, SĐT, mẫu xe..."
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
                  {s.name}
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

      {/* Table */}
      {paginatedTestDrives.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="Không có lịch hẹn lái thử nào"
          description="Khách hàng đặt lịch lái thử trực tuyến qua trang chủ sẽ hiển thị tập trung tại đây."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
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

                return (
                  <TableRow key={td.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {td.profile?.full_name || 'Khách hàng VIP'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{td.profile?.phone || td.profile?.email || 'Chưa cập nhật SĐT'}</span>
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

                    {/* Sales Advisor Assignment */}
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
                        {td.notes || 'Không có ghi chú thêm'}
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
          <Textarea
            label="Ghi Chú Cho Buổi Trải Nghiệm Xe"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Xe Porsche 911 đã được rửa sạch và sạc đầy pin tại Showroom Tây Hồ..."
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

      {/* Create Test Drive Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Đặt Lịch Hẹn Lái Thử Cho Khách Hàng"
        description="Ghi nhận lịch hẹn trải nghiệm xe thể thao, chọn chi nhánh Showroom và chỉ định nhân viên tư vấn."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTestDrive} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Mẫu Xe Trải Nghiệm *"
              value={createCarId}
              onChange={(e) => setCreateCarId(e.target.value)}
              required
            >
              <option value="">-- Chọn xe --</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.make} {c.model} ({c.year}) - {c.stock_quantity > 0 ? `Còn ${c.stock_quantity} xe` : 'Hết xe'}
                </option>
              ))}
            </Select>

            <Select
              label="Chi Nhánh Showroom *"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Khách Hàng (CRM)"
              value={createUserId}
              onChange={(e) => setCreateUserId(e.target.value)}
            >
              <option value="">-- Khách vãng lai / Trực tiếp --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || 'Khách hàng'} ({c.email}) {c.phone ? `- ${c.phone}` : ''}
                </option>
              ))}
            </Select>

            <Input
              label="Ngày & Giờ Lái Thử *"
              type="datetime-local"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              required
            />
          </div>

          <Select
            label="Chỉ Định Cố Vấn Bán Hàng Phụ Trách"
            value={createStaffId}
            onChange={(e) => setCreateStaffId(e.target.value)}
          >
            <option value="">-- Chưa chỉ định (Phân công sau) --</option>
            {staffMembers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.email} ({s.role.toUpperCase()})
              </option>
            ))}
          </Select>

          <Textarea
            label="Ghi Chú Yêu Cầu / Cung Đường Lái Thử"
            rows={3}
            value={createNotes}
            onChange={(e) => setCreateNotes(e.target.value)}
            placeholder="VD: Khách muốn thử khả năng tăng tốc trên cao tốc, cần chuẩn bị pin sạc 100%..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingCreate}>
              Xác Nhận Đặt Lịch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

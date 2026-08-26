import React, { useState, useMemo } from 'react';
import {
  Clock,
  Phone,
  Calendar,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { TestDrive, TestDriveStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, cn } from '../lib/utils';
import { statusMap } from '../design-system/tokens';

export const TestDrivesView: React.FC = () => {
  const { testDrives, showrooms, updateTestDriveStatus } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterShowroom, setFilterShowroom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Edit / Action Modal State
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TestDriveStatus>('confirmed');

  const openActionModal = (td: TestDrive, status: TestDriveStatus) => {
    setSelectedTestDrive(td);
    setTargetStatus(status);
    setActionNotes(td.notes || '');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestDrive) return;
    await updateTestDriveStatus(selectedTestDrive.id, targetStatus, actionNotes);
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

  const totalPages = Math.ceil(filteredTestDrives.length / pageSize);
  const paginatedTestDrives = filteredTestDrives.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Hẹn Lái Thử Thực Tế</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý lịch hẹn trải nghiệm xe thể thao, chuẩn bị xe và phân công cố vấn kỹ thuật tại Showroom
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            {testDrives.filter((t) => t.status === 'confirmed').length} lịch đã xác nhận
          </Badge>
          <Badge variant="warning" size="md">
            {testDrives.filter((t) => t.status === 'pending').length} chờ duyệt
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
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
          title="Không tìm thấy lịch hẹn nào"
          description="Chưa có lịch lái thử nào trong cơ sở dữ liệu Supabase."
          actionLabel="Xóa bộ lọc"
          onAction={() => {
            setSearchTerm('');
            setFilterShowroom('all');
            setFilterStatus('all');
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Mẫu Xe Lái Thử</TableHead>
                <TableHead>Địa Điểm / Showroom</TableHead>
                <TableHead>Thời Gian Lịch Hẹn</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Ghi Chú</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTestDrives.map((td) => {
                const statusInfo = statusMap[td.status as keyof typeof statusMap] || {
                  label: td.status,
                  bg: '#F1F5F9',
                  color: '#475569',
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
                            onClick={() => openActionModal(td, 'cancelled')}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            Hủy
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

      {/* Action Modal */}
      {selectedTestDrive && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Cập Nhật Trạng Thái Lịch Lái Thử`}
          description={`Khách hàng: ${selectedTestDrive.profile?.full_name || 'Khách hàng'} — Mẫu xe: ${selectedTestDrive.car?.make} ${selectedTestDrive.car?.model}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 font-semibold">Chuyển sang trạng thái:</span>
              <div className="font-bold text-slate-900 text-sm capitalize">
                {targetStatus === 'confirmed'
                  ? 'ĐÃ DUYỆT & XÁC NHẬN LỊCH HẸN'
                  : targetStatus === 'completed'
                  ? 'ĐÃ HOÀN TẤT LÁI THỬ'
                  : 'HỦY LỊCH HẸN'}
              </div>
            </div>

            <Textarea
              label="Ghi Chú Cố Vấn Bán Hàng"
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="VD: Đã gọi điện xác nhận, chuẩn bị lộ trình lái thử 5km..."
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Đóng
              </Button>
              <Button variant="primary" type="submit">
                Xác Nhận Cập Nhật
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

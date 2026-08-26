import React, { useState, useMemo } from 'react';
import {
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  Check,
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
    <div className="space-y-6">
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
              placeholder="Tìm khách hàng, số điện thoại, xe..."
              shortcutHint="/"
            />

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

            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái lịch</option>
              <option value="pending">Chờ xác nhận (Pending)</option>
              <option value="confirmed">Đã xác nhận (Confirmed)</option>
              <option value="completed">Đã hoàn tất lái thử (Completed)</option>
              <option value="cancelled">Đã hủy hẹn (Cancelled)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {paginatedTestDrives.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title="Không có lịch lái thử nào"
          description="Không tìm thấy lịch hẹn lái thử nào khớp với bộ lọc hiện tại."
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
                <TableHead>Thời Gian Hẹn</TableHead>
                <TableHead>Địa Điểm Showroom</TableHead>
                <TableHead>Yêu Cầu & Ghi Chú</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác Duyệt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTestDrives.map((td) => {
                const statusInfo = (statusMap as any)[td.status] || {
                  label: td.status,
                  bg: '#F1F5F9',
                  color: '#475569',
                  dotColor: 'bg-slate-500',
                };

                return (
                  <TableRow key={td.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {td.profile?.full_name || 'Khách hàng'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${td.profile?.phone}`} className="hover:text-blue-600">
                          {td.profile?.phone || '0988 *** ***'}
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-400">{td.profile?.email}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {td.car?.image_url && (
                          <img
                            src={td.car.image_url}
                            alt=""
                            className="w-12 h-8 rounded object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {td.car ? `${td.car.make} ${td.car.model}` : 'Xe chỉ định'}
                          </div>
                          <div className="text-[10px] text-slate-400">{td.car?.year} • {td.car?.engine_hp} HP</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {formatDateTime(td.scheduled_date)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-slate-800">
                        {td.showroom?.name?.split('-')[0] || 'Showroom chính'}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate max-w-40">
                        {td.showroom?.address || td.showroom?.city}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-slate-600 max-w-xs line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        "{td.notes || 'Không có ghi chú thêm'}"
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

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {td.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => openActionModal(td, 'confirmed')}
                          >
                            Xác Nhận
                          </Button>
                        )}

                        {td.status === 'confirmed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => openActionModal(td, 'completed')}
                          >
                            Hoàn Tất Lái
                          </Button>
                        )}

                        {td.status !== 'cancelled' && td.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hủy lịch hẹn"
                            onClick={() => openActionModal(td, 'cancelled')}
                          >
                            <XCircle className="w-4 h-4 text-rose-500" />
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

      {/* Action Notes Modal */}
      {selectedTestDrive && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Cập Nhật Lịch Lái Thử - ${targetStatus.toUpperCase()}`}
          description={`Khách hàng: ${selectedTestDrive.profile?.full_name} (${selectedTestDrive.profile?.phone})`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmAction} className="space-y-4">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
              <p className="font-bold text-blue-950">
                Xe: {selectedTestDrive.car?.make} {selectedTestDrive.car?.model}
              </p>
              <p className="text-blue-800">
                Thời gian: {formatDateTime(selectedTestDrive.scheduled_date)} tại {selectedTestDrive.showroom?.name}
              </p>
            </div>

            <Textarea
              label="Ghi Chú Phản Hồi Khách Hàng / Đánh Giá Lái Thử"
              rows={3}
              placeholder="VD: Đã liên hệ khách hàng xác nhận, xe đã được nạp đầy pin và rửa sạch sẽ..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Lưu Trạng Thái
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

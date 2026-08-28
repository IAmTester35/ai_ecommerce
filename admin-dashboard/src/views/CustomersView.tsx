import React, { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Crown,
  UserCheck,
  UserMinus,
  Search,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, formatVND } from '../lib/utils';

export const CustomersView: React.FC = () => {
  const { customers, orders, testDrives, updateCustomerRole } = useData();
  const { isOwner } = useAuth();

  // Active Tab: 'customers' (CRM) or 'staff' (Internal Admin & Managers)
  const [activeTab, setActiveTab] = useState<'customers' | 'staff'>('customers');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected Profile for Dossier Modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Appoint Manager Modal
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<string>('');
  const [appointSearch, setAppointSearch] = useState('');

  // Segregation of Customers (role: user) vs Internal Staff (role: owner, manager)
  const customerList = useMemo(() => {
    return customers.filter((c) => c.role === 'user');
  }, [customers]);

  const staffList = useMemo(() => {
    return customers.filter((c) => c.role === 'owner' || c.role === 'manager');
  }, [customers]);

  // Filtered List based on Active Tab & Search
  const filteredData = useMemo(() => {
    const sourceList = activeTab === 'customers' ? customerList : staffList;
    return sourceList.filter((c) => {
      const matchSearch =
        `${c.full_name || ''} ${c.email} ${c.phone || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [activeTab, customerList, staffList, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openProfileDetails = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDetailModalOpen(true);
  };

  // Action: Promote Customer to Manager
  const handlePromoteToManager = async (userId: string) => {
    if (!isOwner) {
      alert('Chỉ tài khoản Chủ Sở Hữu (Owner) mới có quyền bổ nhiệm Quản lý Showroom.');
      return;
    }
    const success = await updateCustomerRole(userId, 'manager');
    if (success) {
      setIsAppointModalOpen(false);
      setSelectedUserToPromote('');
      setActiveTab('staff');
    }
  };

  // Action: Revoke Manager Role (Demote back to standard customer)
  const handleRevokeManager = async (staff: Profile) => {
    if (!isOwner) {
      alert('Chỉ tài khoản Chủ Sở Hữu (Owner) mới có quyền thu hồi quyền Quản lý.');
      return;
    }

    if (staff.role === 'owner') {
      alert('Không thể thu hồi quyền của Chủ Sở Hữu (Owner) duy nhất.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn thu hồi quyền Quản lý của ${staff.full_name || staff.email}? Tài khoản này sẽ chuyển về nhóm Khách hàng thông thường.`)) {
      await updateCustomerRole(staff.id, 'user');
    }
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Khách Hàng & Ban Quản Trị Nội Bộ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tách tường minh giữa Khách hàng giao dịch (CRM) và Ban Quản Trị Nội Bộ (Owner & Manager) bảo mật chuẩn Supabase RLS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && activeTab === 'staff' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAppointModalOpen(true)}
            >
              Bổ Nhiệm Manager
            </Button>
          )}

          <Badge variant="primary" size="md">
            {customerList.length} Khách hàng
          </Badge>
          <Badge variant="secondary" size="md">
            {staffList.length} Quản trị viên
          </Badge>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('customers');
            setCurrentPage(1);
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Khách Hàng (Customer CRM)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-extrabold">
            {customerList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('staff');
            setCurrentPage(1);
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Ban Quản Trị Nội Bộ (Staff & Roles)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200/60">
            {staffList.length}
          </span>
        </button>
      </div>

      {/* Staff Management Guidance Banner (When on Staff Tab) */}
      {activeTab === 'staff' && (
        <Card className="border-indigo-100 bg-linear-to-r from-indigo-50/50 via-blue-50/30 to-white">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-sm">
                  Cơ Chế Phân Quyền Quản Trị Nội Bộ: DUY NHẤT 01 Chủ Sở Hữu (Owner)
                </p>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  Hệ thống bảo vệ nghiêm ngặt tài khoản <strong>Owner (Super Admin)</strong> duy nhất, ngăn chặn việc tạo thêm Owner thứ hai hoặc tự hạ cấp. Các thành viên ban điều hành khác được bổ nhiệm vai trò <strong>Manager (Quản lý Showroom)</strong> để điều phối đơn hàng và kho xe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder={
              activeTab === 'customers'
                ? 'Tìm khách hàng theo tên, email, số điện thoại...'
                : 'Tìm nhân sự quản trị theo tên, email...'
            }
            shortcutHint="/"
          />
        </CardContent>
      </Card>

      {/* Main Table */}
      {paginatedData.length === 0 ? (
        <EmptyState
          icon={activeTab === 'customers' ? <Users className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          title={activeTab === 'customers' ? 'Không tìm thấy khách hàng nào' : 'Không tìm thấy nhân sự quản trị nào'}
          description="Chưa có dữ liệu nào khớp với từ khóa tìm kiếm trong cơ sở dữ liệu Supabase."
          actionLabel="Xóa bộ lọc"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{activeTab === 'customers' ? 'Khách Hàng / Avatar' : 'Nhân Sự Quản Trị'}</TableHead>
                <TableHead>Liên Hệ</TableHead>
                <TableHead>{activeTab === 'customers' ? 'Tổng Đặt Cọc' : 'Vai Trò / Cấp Bậc'}</TableHead>
                <TableHead>{activeTab === 'customers' ? 'Số Đơn Hàng' : 'Quyền Hạn Vận Hành'}</TableHead>
                <TableHead>{activeTab === 'customers' ? 'Lịch Lái Thử' : 'Trạng Thái RLS'}</TableHead>
                <TableHead>Ngày Tham Gia</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => {
                const userOrders = orders.filter((o) => o.user_id === item.id);
                const userTestDrives = testDrives.filter((t) => t.user_id === item.id);
                const totalDepositPaid = userOrders
                  .filter((o) => o.deposit_status === 'paid')
                  .reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

                const isItemOwner = item.role === 'owner';
                const isItemManager = item.role === 'manager';

                return (
                  <TableRow key={item.id}>
                    {/* User / Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.full_name || (activeTab === 'customers' ? 'Khách hàng' : 'Quản trị viên')}
                            </span>
                            {isItemOwner && (
                              <span title="Chủ Sở Hữu Duy Nhất">
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-800">
                        {item.phone || 'Chưa cập nhật'}
                      </span>
                    </TableCell>

                    {/* CRM Total Deposit OR Role Badge */}
                    <TableCell>
                      {activeTab === 'customers' ? (
                        <span className="text-xs font-extrabold text-blue-600">
                          {totalDepositPaid > 0 ? formatVND(totalDepositPaid) : '0 ₫'}
                        </span>
                      ) : isItemOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                          <Crown className="w-3 h-3 text-amber-500" />
                          CHỦ SỞ HỮU DUY NHẤT (OWNER)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                          <Shield className="w-3 h-3 text-blue-600" />
                          QUẢN LÝ SHOWROOM (MANAGER)
                        </span>
                      )}
                    </TableCell>

                    {/* CRM Orders Count OR Staff Authority Summary */}
                    <TableCell>
                      {activeTab === 'customers' ? (
                        <span className="font-bold text-slate-900 text-xs">
                          {userOrders.length} đơn hàng
                        </span>
                      ) : isItemOwner ? (
                        <span className="text-xs font-semibold text-slate-700">
                          Toàn quyền hệ thống & phân quyền
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-600">
                          Duyệt cọc, kho xe & lịch lái thử
                        </span>
                      )}
                    </TableCell>

                    {/* CRM Test Drives OR Security Status */}
                    <TableCell>
                      {activeTab === 'customers' ? (
                        <span className="font-semibold text-slate-700 text-xs">
                          {userTestDrives.length} lịch hẹn
                        </span>
                      ) : (
                        <Badge variant="success" size="sm">
                          Authenticated RLS
                        </Badge>
                      )}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(item.created_at)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProfileDetails(item)}
                        >
                          Hồ Sơ
                        </Button>

                        {/* Customer Tab: Promote to Manager CTA */}
                        {activeTab === 'customers' && isOwner && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                            onClick={() => handlePromoteToManager(item.id)}
                            title="Bổ nhiệm làm Quản lý Showroom"
                          >
                            Bổ Nhiệm
                          </Button>
                        )}

                        {/* Staff Tab: Revoke Manager Role */}
                        {activeTab === 'staff' && isOwner && isItemManager && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                            onClick={() => handleRevokeManager(item)}
                            title="Thu hồi quyền quản lý"
                          >
                            Thu Hồi
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
            totalItems={filteredData.length}
            pageSize={pageSize}
          />
        </Card>
      )}

      {/* Modal: Appoint New Showroom Manager */}
      <Modal
        isOpen={isAppointModalOpen}
        onClose={() => {
          setIsAppointModalOpen(false);
          setSelectedUserToPromote('');
        }}
        title="Bổ Nhiệm Quản Lý Showroom Mới"
        description="Chọn một tài khoản khách hàng để phân quyền Quản Lý Showroom (Manager) phụ trách vận hành kho xe và duyệt cọc."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Tìm & Chọn Người Dùng Để Bổ Nhiệm *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appointSearch}
                onChange={(e) => setAppointSearch(e.target.value)}
                placeholder="Nhập email hoặc tên khách hàng..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {customerList
              .filter(
                (c) =>
                  `${c.full_name || ''} ${c.email}`
                    .toLowerCase()
                    .includes(appointSearch.toLowerCase())
              )
              .slice(0, 10)
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedUserToPromote(c.id)}
                  className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    selectedUserToPromote === c.id
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        c.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{c.full_name || 'Khách hàng'}</p>
                      <p className="text-[11px] text-slate-500">{c.email}</p>
                    </div>
                  </div>

                  <Badge variant={selectedUserToPromote === c.id ? 'secondary' : 'neutral'} size="sm">
                    {selectedUserToPromote === c.id ? 'Đã Chọn' : 'Chọn'}
                  </Badge>
                </div>
              ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Tài khoản sau khi được bổ nhiệm thành <strong>Manager</strong> sẽ có quyền đăng nhập vào cổng quản trị để quản lý xe, duyệt lịch hẹn và xử lý đơn đặt cọc.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsAppointModalOpen(false);
                setSelectedUserToPromote('');
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedUserToPromote}
              onClick={() => handlePromoteToManager(selectedUserToPromote)}
            >
              Xác Nhận Bổ Nhiệm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer / Staff Detail Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Hồ Sơ: ${selectedProfile.full_name || 'Người Dùng'}`}
          description={`Email: ${selectedProfile.email}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={
                  selectedProfile.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt=""
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">
                    {selectedProfile.full_name || 'Chưa cập nhật tên'}
                  </h4>
                  {selectedProfile.role === 'owner' ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      CHỦ SỞ HỮU DUY NHẤT
                    </span>
                  ) : selectedProfile.role === 'manager' ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      QUẢN LÝ SHOWROOM
                    </span>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      KHÁCH HÀNG
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedProfile.phone || 'Chưa có SĐT'}</span>
                </div>
              </div>
            </div>

            {/* Transaction & Activity Dossier */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lịch Sử Đặt Cọc & Giao Dịch
              </h5>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {orders.filter((o) => o.user_id === selectedProfile.id).length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Chưa có giao dịch đặt cọc nào</div>
                ) : (
                  orders
                    .filter((o) => o.user_id === selectedProfile.id)
                    .map((o) => (
                      <div key={o.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">Hợp đồng #{o.id.slice(0, 8)}</p>
                          <p className="text-[11px] text-slate-400">{formatDateTime(o.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-blue-600">{formatVND(o.deposit_amount)}</p>
                          <Badge variant={o.deposit_status === 'paid' ? 'success' : 'warning'} size="sm">
                            {o.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

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
  Building2,
  Calendar,
  Heart,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { dataServices } from '../services/dataServices';
import type { Profile, Order, TestDrive, Car as CarType } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, formatVND, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const CustomersView: React.FC = () => {
  const {
    customers,
    showrooms,
    updateCustomerRole,
    toggleProfileActive,
    updateProfileShowroom,
  } = useData();
  const { isOwner } = useAuth();
  const { error } = useToast();

  // Active Tab: 'customers' (CRM) or 'staff' (Internal Admin & Managers)
  const [activeTab, setActiveTab] = useState<'customers' | 'staff'>('customers');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected Profile for Dossier Modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dossierData, setDossierData] = useState<{
    orders: Order[];
    testDrives: TestDrive[];
    savedCars: CarType[];
  }>({ orders: [], testDrives: [], savedCars: [] });
  const [isLoadingDossier, setIsLoadingDossier] = useState(false);

  // Appoint Manager Modal
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<string>('');
  const [appointedShowroomId, setAppointedShowroomId] = useState<string>('');
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

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Open 360 Dossier Modal
  const openProfileDetails = async (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDetailModalOpen(true);
    setIsLoadingDossier(true);
    try {
      const d = await dataServices.fetchCustomer360(profile.id);
      setDossierData(d);
    } catch (e) {
      console.warn('Could not fetch 360 dossier:', e);
    } finally {
      setIsLoadingDossier(false);
    }
  };

  // Toggle Active/Suspend Customer
  const handleToggleActive = async (profile: Profile) => {
    if (!isOwner) {
      error('Từ chối', 'Chỉ Owner mới có quyền khóa hoặc kích hoạt tài khoản.');
      return;
    }
    if (profile.role === 'owner') {
      error('Từ chối', 'Không thể khóa tài khoản Chủ Sở Hữu.');
      return;
    }

    const newStatus = profile.is_active === false ? true : false;
    const actionName = newStatus ? 'kích hoạt' : 'khóa';
    if (window.confirm(`Bạn có chắc muốn ${actionName} tài khoản ${profile.email}?`)) {
      await toggleProfileActive(profile.id, newStatus);
    }
  };

  // Action: Promote Customer to Manager with Showroom Assignment
  const handlePromoteToManager = async () => {
    if (!isOwner) {
      alert('Chỉ tài khoản Chủ Sở Hữu (Owner) mới có quyền bổ nhiệm Quản lý Showroom.');
      return;
    }
    if (!selectedUserToPromote) return;

    const okRole = await updateCustomerRole(selectedUserToPromote, 'manager');
    if (okRole) {
      if (appointedShowroomId) {
        await updateProfileShowroom(selectedUserToPromote, appointedShowroomId);
      }
      setIsAppointModalOpen(false);
      setSelectedUserToPromote('');
      setAppointedShowroomId('');
      setActiveTab('staff');
    }
  };

  // Action: Revoke Manager Role
  const handleRevokeManager = async (staff: Profile) => {
    if (!isOwner) {
      alert('Chỉ tài khoản Chủ Sở Hữu (Owner) mới có quyền thu hồi quyền Quản lý.');
      return;
    }

    if (staff.role === 'owner') {
      alert('Không thể thu hồi quyền của Chủ Sở Hữu (Owner) duy nhất.');
      return;
    }

    if (
      window.confirm(
        `Bạn có chắc chắn muốn thu hồi quyền Quản lý của ${staff.full_name || staff.email}? Tài khoản này sẽ chuyển về nhóm Khách hàng thông thường.`
      )
    ) {
      await updateCustomerRole(staff.id, 'user');
      await updateProfileShowroom(staff.id, null);
    }
  };

  // Handle Manager Showroom Change in Table
  const handleManagerShowroomChange = async (staffId: string, newShowroomId: string) => {
    if (!isOwner) {
      error('Từ chối', 'Chỉ Owner mới có quyền đổi Showroom trực thuộc của Manager.');
      return;
    }
    await updateProfileShowroom(staffId, newShowroomId || null);
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Khách Hàng & Phân Quyền CRM
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ 360 độ khách hàng, kiểm soát khóa tài khoản và phân quyền Quản lý trực thuộc Showroom
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAppointModalOpen(true)}
          >
            Bổ Nhiệm Quản Lý Mới
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('customers');
            setCurrentPage(1);
          }}
          className={cn(
            'pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer',
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Khách Hàng ({customerList.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('staff');
            setCurrentPage(1);
          }}
          className={cn(
            'pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer',
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ban Quản Lý & Showroom ({staffList.length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchBar
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Content */}
      {filteredData.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-slate-300" />}
          title="Không tìm thấy người dùng nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc chuyển tab xem."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tài Khoản / Người Dùng</TableHead>
                <TableHead>Liên Hệ</TableHead>
                <TableHead>Vai Trò (Role)</TableHead>
                {activeTab === 'staff' && <TableHead>Showroom Trực Thuộc</TableHead>}
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Ngày Đăng Ký</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((user) => {
                const isActive = user.is_active !== false;
                const assignedShowroom = showrooms.find((s) => s.id === user.showroom_id);

                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900">
                            {user.full_name || 'Khách hàng'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{user.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.role === 'owner' ? (
                        <Badge variant="primary" size="sm" className="font-bold">
                          <Crown className="w-3 h-3 mr-1 text-amber-500" />
                          Owner (Chủ Sở Hữu)
                        </Badge>
                      ) : user.role === 'manager' ? (
                        <Badge variant="secondary" size="sm" className="font-bold">
                          <Shield className="w-3 h-3 mr-1 text-indigo-600" />
                          Showroom Manager
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Khách Hàng
                        </Badge>
                      )}
                    </TableCell>

                    {activeTab === 'staff' && (
                      <TableCell>
                        {user.role === 'manager' && isOwner ? (
                          <Select
                            value={user.showroom_id || ''}
                            onChange={(e) => handleManagerShowroomChange(user.id, e.target.value)}
                            className="text-xs py-1"
                          >
                            <option value="">-- Toàn hệ thống --</option>
                            {showrooms.map((sr) => (
                              <option key={sr.id} value={sr.id}>
                                {sr.name}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700">
                            {assignedShowroom?.name || 'Quản lý toàn quốc'}
                          </span>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                        {isActive ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(user.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openProfileDetails(user)}
                        >
                          Hồ Sơ 360
                        </Button>

                        {/* Account active/suspend toggle */}
                        {user.role !== 'owner' && isOwner && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            )}
                            title={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}

                        {activeTab === 'staff' && user.role === 'manager' && isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleRevokeManager(user)}
                          >
                            Hạ Cấp
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
          setAppointedShowroomId('');
        }}
        title="Bổ Nhiệm Quản Lý Showroom Mới"
        description="Chọn một tài khoản khách hàng để phân quyền Quản Lý Showroom (Manager) phụ trách kho xe và đối soát cọc."
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

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
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

          {/* Manager Showroom Assignment */}
          <Select
            label="Gán Showroom Trực Thuộc Phụ Trách"
            value={appointedShowroomId}
            onChange={(e) => setAppointedShowroomId(e.target.value)}
          >
            <option value="">-- Quản lý toàn quốc (Không giới hạn) --</option>
            {showrooms.map((sr) => (
              <option key={sr.id} value={sr.id}>
                {sr.name} ({sr.city})
              </option>
            ))}
          </Select>

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
                setAppointedShowroomId('');
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedUserToPromote}
              onClick={handlePromoteToManager}
            >
              Xác Nhận Bổ Nhiệm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer 360 Dossier Modal */}
      {selectedProfile && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Hồ Sơ 360 Độ: ${selectedProfile.full_name || 'Khách Hàng'}`}
          description={`Email: ${selectedProfile.email}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-left">
            {/* User Profile Header Card */}
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
                    <Badge variant="primary" size="sm">
                      <Crown className="w-3 h-3 mr-1 text-amber-500" />
                      OWNER
                    </Badge>
                  ) : selectedProfile.role === 'manager' ? (
                    <Badge variant="secondary" size="sm">
                      MANAGER
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      KHÁCH HÀNG
                    </Badge>
                  )}
                  <Badge variant={selectedProfile.is_active !== false ? 'success' : 'danger'} size="sm">
                    {selectedProfile.is_active !== false ? 'Hoạt động' : 'Tài khoản đã khóa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedProfile.email}</span>
                  {selectedProfile.phone && (
                    <>
                      <span>•</span>
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedProfile.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isLoadingDossier ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang đồng bộ hồ sơ 360 độ từ Supabase...</div>
            ) : (
              <div className="space-y-4">
                {/* 1. Orders & Deposits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Lịch Sử Đặt Cọc Xe ({dossierData.orders.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {dossierData.orders.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">Chưa có giao dịch đặt cọc nào</div>
                    ) : (
                      dossierData.orders.map((o) => (
                        <div key={o.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">
                              HĐ #{o.id.slice(0, 8)} • {o.items?.[0]?.car?.model || 'Xe sang'}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatDateTime(o.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-600">{formatVND(o.deposit_amount)}</span>
                            <Badge variant={o.deposit_status === 'paid' ? 'success' : 'warning'} size="sm" className="ml-2">
                              {o.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Test Drives History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Lịch Lái Thử Tại Showroom ({dossierData.testDrives.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {dossierData.testDrives.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">Chưa đặt lịch hẹn lái thử nào</div>
                    ) : (
                      dossierData.testDrives.map((td) => (
                        <div key={td.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">
                              {td.car ? `${td.car.make} ${td.car.model}` : 'Mẫu xe trải nghiệm'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDateTime(td.scheduled_date)} • {td.showroom?.name || 'Showroom Trung Tâm'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              td.status === 'confirmed'
                                ? 'success'
                                : td.status === 'cancelled'
                                  ? 'danger'
                                  : 'neutral'
                            }
                            size="sm"
                          >
                            {td.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Wishlist / Saved Cars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                      Mẫu Xe Đang Trong Wishlist ({dossierData.savedCars.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dossierData.savedCars.length === 0 ? (
                      <div className="col-span-2 p-3 text-xs text-slate-400 text-center border border-slate-200 rounded-xl">
                        Khách hàng chưa lưu xe vào Wishlist
                      </div>
                    ) : (
                      dossierData.savedCars.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <img
                            src={c.image_url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=150&q=80'}
                            alt=""
                            className="w-10 h-8 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {c.make} {c.model}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold">{formatVND(c.price)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Đóng Hồ Sơ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

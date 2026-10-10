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
  AlertCircle,
  Building2,
  Calendar,
  Heart,
  Copy,
  Check,
  Send,
  UserPlus,
  Trash2,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { dataServices } from '../services/dataServices';
import type { Profile, Order, TestDrive, Car as CarType, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
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
    addCustomer,
    inviteMember,
    cancelInvite,
    deleteCustomer,
    resetCustomerPassword,
    updateCustomerRole,
    toggleProfileActive,
    updateProfileShowroom,
  } = useData();
  const { isOwner } = useAuth();
  const { success, error } = useToast();

  // Invite Member Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('manager');
  const [inviteShowroomId, setInviteShowroomId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    link: string;
    email: string;
    emailSent: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset Password Modal State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState<Profile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete User Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetUserForDelete, setTargetUserForDelete] = useState<Profile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Add Customer Modal State (Legacy / Fast Creation)
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerRole, setNewCustomerRole] = useState<UserRole>('user');
  const [newCustomerShowroomId, setNewCustomerShowroomId] = useState('');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

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

  // Paginated Sliced Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Open Dossier Modal
  const openProfileDetails = async (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDetailModalOpen(true);
    setIsLoadingDossier(true);
    try {
      const data = await dataServices.fetchCustomer360(profile.id);
      setDossierData(data);
    } catch (err) {
      console.warn('Failed to fetch user dossier:', err);
      setDossierData({ orders: [], testDrives: [], savedCars: [] });
    } finally {
      setIsLoadingDossier(false);
    }
  };

  // Open Invite Modal Helper
  const openInviteModal = (defaultRole: UserRole = 'manager') => {
    setInviteRole(defaultRole);
    setInviteEmail('');
    setInviteName('');
    setInvitePhone('');
    setInviteShowroomId('');
    setInviteResult(null);
    setCopiedLink(false);
    setIsInviteModalOpen(true);
  };

  // Reset Password Handlers
  const openResetPasswordModal = (user: Profile) => {
    setTargetUserForReset(user);
    setNewPasswordInput('AutoMatch@' + Math.floor(1000 + Math.random() * 9000));
    setIsResetPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!targetUserForReset) return;
    setIsResettingPassword(true);
    await resetCustomerPassword(targetUserForReset.id, targetUserForReset.email, newPasswordInput);
    setIsResettingPassword(false);
    setIsResetPasswordModalOpen(false);
  };

  const handleSendResetEmail = async () => {
    if (!targetUserForReset) return;
    setIsResettingPassword(true);
    await resetCustomerPassword(targetUserForReset.id, targetUserForReset.email);
    setIsResettingPassword(false);
    setIsResetPasswordModalOpen(false);
  };

  // Delete User Handlers
  const openDeleteModal = (user: Profile) => {
    setTargetUserForDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetUserForDelete) return;
    setIsDeletingUser(true);
    await deleteCustomer(targetUserForDelete.id);
    setIsDeletingUser(false);
    setIsDeleteModalOpen(false);
    setTargetUserForDelete(null);
  };

  // Handle Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      error('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và họ tên người nhận.');
      return;
    }
    setIsInviting(true);
    const res = await inviteMember({
      email: inviteEmail.trim(),
      full_name: inviteName.trim(),
      phone: invitePhone.trim() || null,
      role: inviteRole,
      showroom_id: inviteShowroomId || null,
    });
    setIsInviting(false);

    if (res.success) {
      setInviteResult({
        link: res.inviteLink,
        email: inviteEmail.trim(),
        emailSent: res.emailSent,
      });
    }
  };

  // Handle Promote to Manager
  const handlePromoteToManager = async () => {
    if (!selectedUserToPromote) return;
    if (!isOwner) {
      error('Từ chối quyền', 'Chỉ Chủ sở hữu (Owner) mới có quyền phân bổ quản trị.');
      return;
    }

    const targetUser = customers.find((c) => c.id === selectedUserToPromote);
    const successResult = await updateCustomerRole(selectedUserToPromote, 'manager');
    if (successResult) {
      if (appointedShowroomId) {
        await updateProfileShowroom(selectedUserToPromote, appointedShowroomId);
      }
      setIsAppointModalOpen(false);
      setSelectedUserToPromote('');
      setAppointedShowroomId('');
      success('Bổ nhiệm thành công', `${targetUser?.full_name || targetUser?.email} đã trở thành Showroom Manager.`);
    }
  };

  // Handle Account Activation Toggle
  const handleToggleActive = async (profile: Profile) => {
    if (!isOwner) {
      error('Từ chối quyền', 'Chỉ Chủ sở hữu mới có quyền khóa/mở khóa tài khoản.');
      return;
    }
    const nextStatus = profile.is_active === false;
    await toggleProfileActive(profile.id, nextStatus);
  };

  // Handle Revoke Manager Role
  const handleRevokeManager = async (staff: Profile) => {
    if (!isOwner) {
      error('Từ chối quyền', 'Chỉ Chủ sở hữu mới có quyền thu hồi vai trò Quản lý.');
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerEmail.trim() || !newCustomerName.trim()) return;
    setIsSubmittingCustomer(true);
    await addCustomer({
      email: newCustomerEmail.trim(),
      full_name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || null,
      role: newCustomerRole,
      showroom_id: newCustomerShowroomId || null,
    });
    setIsSubmittingCustomer(false);
    setIsAddCustomerModalOpen(false);
    setNewCustomerEmail('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerRole('user');
    setNewCustomerShowroomId('');
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
    <div className="space-y-8 text-left select-none">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Khách Hàng & Ban Điều Hành
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Hồ sơ CRM khách hàng, phân quyền điều hành Showroom và gửi liên kết mời nhân sự mới
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => openInviteModal(activeTab === 'staff' ? 'manager' : 'user')}
            className="cursor-pointer font-bold shadow-xs"
          >
            {activeTab === 'staff' ? 'Mời Quản Trị / Nhân Sự Mới' : 'Mời / Thêm Khách Hàng'}
          </Button>

          {isOwner && activeTab === 'staff' && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<ShieldCheck className="w-4 h-4 text-indigo-600" />}
              onClick={() => setIsAppointModalOpen(true)}
              className="cursor-pointer"
            >
              Bổ Nhiệm Từ CRM
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200/80">
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
          <span>Khách Hàng CRM ({customerList.length})</span>
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
          <Shield className="w-4 h-4" />
          <span>Ban Điều Hành & Quản Lý ({staffList.length})</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder={
              activeTab === 'customers'
                ? 'Tìm theo tên, email hoặc số điện thoại khách hàng...'
                : 'Tìm theo tên hoặc email Quản trị viên...'
            }
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị {paginatedData.length} trên tổng số {filteredData.length}{' '}
          {activeTab === 'customers' ? 'khách hàng' : 'nhân sự'}
        </div>
      </div>

      {/* Profiles Table */}
      <Card className="overflow-hidden border-slate-200/90 shadow-xs">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={activeTab === 'customers' ? <Users className="w-10 h-10 text-slate-400" /> : <Shield className="w-10 h-10 text-slate-400" />}
            title={activeTab === 'customers' ? 'Chưa tìm thấy khách hàng' : 'Chưa có nhân sự quản trị'}
            description={
              searchTerm
                ? 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.'
                : activeTab === 'customers'
                  ? 'Bấm nút "Mời / Thêm Khách Hàng" ở trên để gửi link đăng ký hoặc tạo hồ sơ.'
                  : 'Bấm nút "Mời Quản Trị / Nhân Sự Mới" để tạo link mời và cấp quyền điều hành.'
            }
            actionLabel={activeTab === 'staff' ? 'Gửi Link Mời Nhân Sự' : 'Mời Khách Hàng Mới'}
            onAction={() => openInviteModal(activeTab === 'staff' ? 'manager' : 'user')}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75">
                  <TableHead className="w-72">Họ & Tên</TableHead>
                  <TableHead>Email / Liên Hệ</TableHead>
                  <TableHead>Vai Trò Cấp Quyền</TableHead>
                  {activeTab === 'staff' && <TableHead>Showroom Phụ Trách</TableHead>}
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ngày Khởi Tạo</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
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
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
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
                        {user.is_pending_invite ? (
                          <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                            Chờ kích hoạt
                          </Badge>
                        ) : (
                          <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                            {isActive ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {formatDateTime(user.created_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Invite Link Action for Pending Invites */}
                          {user.is_pending_invite && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const link =
                                    user.invite_link ||
                                    `${window.location.origin}/login?invite_token=${btoa(
                                      JSON.stringify({ email: user.email, role: user.role })
                                    )}&email=${encodeURIComponent(user.email)}&role=${user.role}`;
                                  navigator.clipboard.writeText(link);
                                  success('Đã sao chép link mời', `Link mời cho ${user.email} đã được lưu vào bộ nhớ tạm.`);
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Sao chép lại liên kết mời"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Bạn có chắc muốn hủy lời mời cho ${user.email}?`)) {
                                    cancelInvite(user.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hủy lời mời"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openProfileDetails(user)}
                          >
                            Hồ Sơ
                          </Button>

                          {/* Reset Password Action */}
                          {!user.is_pending_invite && (isOwner || user.role === 'user') && (
                            <button
                              type="button"
                              onClick={() => openResetPasswordModal(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {/* Account active/suspend toggle */}
                          {!user.is_pending_invite && user.role !== 'owner' && isOwner && (
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

                          {/* Delete User Action */}
                          {!user.is_pending_invite && user.role !== 'owner' && (isOwner || user.role === 'user') && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
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
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Invite Member & Grant Access Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteResult(null);
        }}
        title={inviteResult ? 'Tạo Lời Mời Thành Công' : 'Mời Thành Viên Mới & Cấp Quyền'}
        description={
          inviteResult
            ? 'Liên kết mời và thông tin kích hoạt tài khoản đã sẵn sàng.'
            : 'Nhập địa chỉ email để tạo và gửi link mời tham gia ban quản trị hoặc khách hàng VIP.'
        }
        maxWidth="lg"
      >
        {inviteResult ? (
          <div className="space-y-5 text-left py-1">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-900">
                  Lời mời đã được khởi tạo thành công!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {inviteResult.emailSent
                    ? `Hệ thống đã tự động gửi email kích hoạt tới hòm thư ${inviteResult.email}. Ngoài ra bạn có thể sao chép đường link bên dưới để gửi trực tiếp qua Zalo / Telegram / Slack.`
                    : `Hệ thống đã bảo mật liên kết kích hoạt cho ${inviteResult.email}. Bạn có thể sao chép liên kết bên dưới để gửi trực tiếp cho người nhận qua Zalo, Telegram hoặc Email.`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Đường Dẫn Mời Kích Hoạt (Invite Link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.link}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono text-slate-700 select-all focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteResult.link);
                    setCopiedLink(true);
                    success('Đã sao chép!', 'Đường link mời đã được lưu vào bộ nhớ tạm.');
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  leftIcon={copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className="shrink-0 cursor-pointer font-bold"
                >
                  {copiedLink ? 'Đã Sao Chép' : 'Sao Chép'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Người nhận chỉ cần nhấp vào liên kết trên để xác thực tài khoản và thiết lập mật khẩu đăng nhập.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInviteResult(null);
                  setInviteEmail('');
                  setInviteName('');
                  setInvitePhone('');
                }}
              >
                Mời Thêm Người Khác
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteResult(null);
                }}
              >
                Hoàn Tất
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Địa Chỉ Email Người Nhận *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nhansu@automatch.vn hoặc customer@gmail.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Link kích hoạt bảo mật sẽ được tạo riêng tương ứng với địa chỉ email này.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Họ & Tên Người Được Mời *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="VD: Trần Hoàng Long"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Số Điện Thoại Liên Hệ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="0987 654 321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Vai Trò & Quyền Hạn Cấp Phát *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInviteRole('manager')}
                  className={cn(
                    'p-3 rounded-2xl border text-left cursor-pointer transition-all',
                    inviteRole === 'manager'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Quản Lý Showroom</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Duyệt lái thử, cập nhật xe & đối soát hợp đồng
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInviteRole('user')}
                  className={cn(
                    'p-3 rounded-2xl border text-left cursor-pointer transition-all',
                    inviteRole === 'user'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Khách Hàng (User)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Hồ sơ CRM khách hàng VIP trải nghiệm xe
                  </p>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setInviteRole('owner')}
                    className={cn(
                      'p-3 rounded-2xl border text-left cursor-pointer transition-all',
                      inviteRole === 'owner'
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 mb-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Đồng Sở Hữu (Owner)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Toàn quyền tối cao điều hành toàn hệ thống
                    </p>
                  </button>
                )}
              </div>
            </div>

            {inviteRole === 'manager' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-xs font-bold text-slate-700 block">
                  Showroom Trực Thuộc Phụ Trách
                </label>
                <Select
                  value={inviteShowroomId}
                  onChange={(e) => setInviteShowroomId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="">-- Quản lý toàn quốc (Tất cả Showroom) --</option>
                  {showrooms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2.5">
              <Send className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold">Cơ chế gửi lời mời:</span>
                <p>
                  Hệ thống sẽ gửi email kích hoạt và tạo sẵn link mời bảo mật để bạn có thể sao chép gửi trực tiếp qua Zalo, Telegram hoặc Email cho người nhận.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isInviting}
                leftIcon={<Send className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                Tạo Link Mời & Gửi Lời Mời
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Appoint Manager Modal */}
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
                  className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${selectedUserToPromote === c.id
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
          title={`Hồ Sơ: ${selectedProfile.full_name || 'Khách Hàng'}`}
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

      {/* Legacy Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Thêm Khách Hàng Mới Vào CRM"
        description="Khởi tạo hồ sơ khách hàng hoặc nhân sự Showroom trong hệ thống cơ sở dữ liệu."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-left">
          <Input
            label="Họ & Tên *"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="VD: Nguyễn Thành Nam"
            required
          />

          <Input
            label="Địa Chỉ Email *"
            type="email"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            placeholder="khachhang@gmail.com"
            required
          />

          <Input
            label="Số Điện Thoại Liên Hệ"
            type="tel"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
            placeholder="0912 345 678"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Vai Trò Tài Khoản"
              value={newCustomerRole}
              onChange={(e) => setNewCustomerRole(e.target.value as UserRole)}
            >
              <option value="user">Khách Hàng (User)</option>
              {isOwner && <option value="manager">Quản Lý Showroom (Manager)</option>}
            </Select>

            {newCustomerRole === 'manager' && (
              <Select
                label="Showroom Trực Thuộc"
                value={newCustomerShowroomId}
                onChange={(e) => setNewCustomerShowroomId(e.target.value)}
              >
                <option value="">-- Chưa phân bổ --</option>
                {showrooms.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddCustomerModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingCustomer}>
              Lưu Hồ Sơ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {targetUserForReset && (
        <Modal
          isOpen={isResetPasswordModalOpen}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setTargetUserForReset(null);
          }}
          title={`Đặt Lại Mật Khẩu: ${targetUserForReset.full_name || targetUserForReset.email}`}
          description={`Email: ${targetUserForReset.email} • Vai trò: ${targetUserForReset.role.toUpperCase()}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Cấp mật khẩu mới cho người dùng
              </span>
              <p className="leading-relaxed text-[11px]">
                Bạn có thể tự cấp một mật khẩu mới trực tiếp (sau đó sao chép gửi cho người dùng) hoặc gửi email yêu cầu đặt lại mật khẩu.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Mật Khẩu Mới Cấp Phát *
                </label>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('AutoMatch@' + Math.floor(1000 + Math.random() * 9000))}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sinh mật khẩu khác</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPasswordInput);
                    success('Đã sao chép mật khẩu', `Mật khẩu ${newPasswordInput} đã được lưu vào clipboard.`);
                  }}
                  leftIcon={<Copy className="w-4 h-4" />}
                  title="Sao chép mật khẩu"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={handleSendResetEmail}
                isLoading={isResettingPassword}
              >
                Gửi Email Reset
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setTargetUserForReset(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  size="sm"
                  onClick={handleConfirmResetPassword}
                  isLoading={isResettingPassword}
                >
                  Xác Nhận Đổi Mật Khẩu
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Confirm Modal */}
      {targetUserForDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setTargetUserForDelete(null);
          }}
          title="Xác Nhận Xóa Vĩnh Viễn Tài Khoản"
          description={`Tài khoản: ${targetUserForDelete.email}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo hành động không thể hoàn tác</span>
              </div>
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản{' '}
                <strong className="text-slate-900">{targetUserForDelete.full_name || targetUserForDelete.email}</strong>{' '}
                ({targetUserForDelete.role === 'manager' ? 'Quản lý Showroom' : 'Khách hàng CRM'})?
              </p>
              <p className="text-[11px] text-rose-700">
                Hồ sơ tài khoản sẽ bị gỡ bỏ vĩnh viễn khỏi danh sách quản lý.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTargetUserForDelete(null);
                }}
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeletingUser}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Xác Nhận Xóa Tài Khoản
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

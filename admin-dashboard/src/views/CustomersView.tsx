import React, { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Profile, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, formatVND } from '../lib/utils';
import { ROLE_INFO } from '../lib/permissions';

export const CustomersView: React.FC = () => {
  const { customers, orders, testDrives, updateCustomerRole } = useData();
  const { isOwner, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        `${c.full_name || ''} ${c.email} ${c.phone || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchRole = filterRole === 'all' || c.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [customers, searchTerm, filterRole]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openCustomerDetails = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDetailModalOpen(true);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isOwner) {
      alert('Chỉ tài khoản cấp Owner mới có quyền thay đổi phân quyền người dùng.');
      return;
    }
    if (userId === currentUser?.id && newRole !== 'owner') {
      if (!window.confirm('Bạn đang tự hạ cấp quyền của chính mình. Bạn có chắc chắn?')) {
        return;
      }
    }
    await updateCustomerRole(userId, newRole);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Khách Hàng & Phân Quyền Hệ Thống</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ người dùng và ma trận phân quyền (Owner, Manager, User) tuân thủ RLS Policy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            {customers.length} người dùng
          </Badge>
          <Badge variant="secondary" size="md">
            {customers.filter((c) => c.role !== 'user').length} quản trị viên
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, email, số điện thoại..."
              shortcutHint="/"
            />

            <Select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả vai trò (Roles)</option>
              <option value="owner">Chủ sở hữu hệ thống (Owner)</option>
              <option value="manager">Quản lý Showroom (Manager)</option>
              <option value="user">Khách hàng thông thường (User)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {paginatedCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Không tìm thấy người dùng nào"
          description="Chưa có tài khoản nào khớp với từ khóa tìm kiếm trong cơ sở dữ liệu Supabase."
          actionLabel="Xóa bộ lọc"
          onAction={() => {
            setSearchTerm('');
            setFilterRole('all');
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người Dùng / Avatar</TableHead>
                <TableHead>Liên Hệ</TableHead>
                <TableHead>Vai Trò / Phân Quyền</TableHead>
                <TableHead>Số Đơn Hàng</TableHead>
                <TableHead>Lịch Lái Thử</TableHead>
                <TableHead>Ngày Đăng Ký</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((cust) => {
                const userOrders = orders.filter((o) => o.user_id === cust.id);
                const userTestDrives = testDrives.filter((t) => t.user_id === cust.id);
                const roleMeta = ROLE_INFO[cust.role] || ROLE_INFO.user;

                return (
                  <TableRow key={cust.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={cust.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {cust.full_name || 'Khách hàng'}
                          </div>
                          <div className="text-[11px] text-slate-500">{cust.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-slate-800">
                        {cust.phone || 'Chưa cập nhật'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {isOwner ? (
                        <select
                          value={cust.role}
                          onChange={(e) => handleRoleChange(cust.id, e.target.value as UserRole)}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer outline-none transition-all"
                          style={{
                            backgroundColor: roleMeta.bg,
                            color: roleMeta.color,
                            borderColor: `${roleMeta.color}40`,
                          }}
                        >
                          <option value="owner">OWNER (Toàn quyền)</option>
                          <option value="manager">MANAGER (Quản lý)</option>
                          <option value="user">USER (Khách hàng)</option>
                        </select>
                      ) : (
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                          style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}
                        >
                          <Shield className="w-3 h-3" />
                          {roleMeta.tag}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-900 text-xs">
                        {userOrders.length} đơn
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-700 text-xs">
                        {userTestDrives.length} lịch hẹn
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(cust.created_at)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerDetails(cust)}
                      >
                        Hồ Sơ
                      </Button>
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
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
          />
        </Card>
      )}

      {/* Customer Detail Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Hồ Sơ: ${selectedProfile.full_name || 'Khách Hàng'}`}
          description={`Email: ${selectedProfile.email}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={selectedProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">
                    {selectedProfile.full_name || 'Chưa cập nhật tên'}
                  </h4>
                  <Badge
                    variant={selectedProfile.role === 'owner' ? 'secondary' : selectedProfile.role === 'manager' ? 'primary' : 'neutral'}
                    size="sm"
                  >
                    {selectedProfile.role.toUpperCase()}
                  </Badge>
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

            {/* History Summary */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Giao Dịch Đã Phát Sinh
              </h5>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {orders.filter((o) => o.user_id === selectedProfile.id).length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Chưa có giao dịch đặt cọc nào</div>
                ) : (
                  orders
                    .filter((o) => o.user_id === selectedProfile.id)
                    .map((o) => (
                      <div key={o.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">Đơn #{o.id.slice(0, 8)}</p>
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

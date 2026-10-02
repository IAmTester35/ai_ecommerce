import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Car,
  Order,
  Showroom,
  TestDrive,
  Voucher,
  Profile,
  Review,
  CarQA,
  AppNotification,
  OrderStatus,
  PaymentStatus,
  TestDriveStatus,
  UserRole,
  DashboardMetrics,
} from '../types';
import { dataServices } from '../services/dataServices';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { formatUSD } from '../lib/utils';

interface DataContextType {
  cars: Car[];
  orders: Order[];
  showrooms: Showroom[];
  vouchers: Voucher[];
  testDrives: TestDrive[];
  reviews: Review[];
  carQAs: CarQA[];
  notifications: AppNotification[];
  customers: Profile[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  isLiveSupabase: boolean;

  // Car Actions
  addCar: (car: Omit<Car, 'id' | 'created_at'>) => Promise<boolean>;
  updateCar: (id: string, car: Partial<Car>) => Promise<boolean>;
  deleteCar: (id: string) => Promise<boolean>;
  toggleCarActive: (id: string) => Promise<boolean>;
  quickAdjustStock: (id: string, delta: number) => Promise<boolean>;
  transferCarShowroom: (carId: string, targetShowroomId: string) => Promise<boolean>;

  // Order Actions
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    depositStatus?: PaymentStatus
  ) => Promise<boolean>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  refundOrder: (orderId: string, amount: number, reason: string) => Promise<boolean>;
  updateOrderShowroom: (orderId: string, showroomId: string) => Promise<boolean>;
  updateOrderContract: (orderId: string, contractUrl: string) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;

  // Showroom Actions
  addShowroom: (sr: Omit<Showroom, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateShowroom: (id: string, sr: Partial<Showroom>) => Promise<boolean>;
  distributeCarsToShowrooms: () => Promise<boolean>;

  // Voucher Actions
  addVoucher: (v: Omit<Voucher, 'id' | 'created_at' | 'used_count'>) => Promise<boolean>;
  updateVoucher: (id: string, v: Partial<Voucher>) => Promise<boolean>;
  deleteVoucher: (id: string) => Promise<boolean>;

  // Test Drive Actions
  addTestDrive: (tdData: {
    user_id?: string | null;
    car_id: string;
    showroom_id?: string | null;
    scheduled_date: string;
    notes?: string | null;
    assigned_staff_id?: string | null;
  }) => Promise<boolean>;
  updateTestDriveStatus: (id: string, status: TestDriveStatus, notes?: string) => Promise<boolean>;
  assignTestDriveStaff: (id: string, staffId: string | null) => Promise<boolean>;

  // Review & QA Actions
  toggleReviewApproval: (id: string, isApproved: boolean) => Promise<boolean>;
  deleteReview: (id: string) => Promise<boolean>;
  answerCarQA: (id: string, answer: string) => Promise<boolean>;

  // Notification Actions
  createNotification: (title: string, content: string, userId?: string | null, type?: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<boolean>;

  // Customer Actions
  addCustomer: (customerData: {
    email: string;
    full_name: string;
    phone?: string | null;
    role?: UserRole;
    showroom_id?: string | null;
  }) => Promise<boolean>;
  updateCustomerRole: (id: string, role: UserRole) => Promise<boolean>;
  toggleProfileActive: (id: string, isActive: boolean) => Promise<boolean>;
  updateProfileShowroom: (id: string, showroomId: string | null) => Promise<boolean>;

  // System Refresh
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const { currentUser, isOwner } = useAuth();

  // Live Database State (Zero Mock Data)
  const [cars, setCars] = useState<Car[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [carQAs, setCarQAs] = useState<CarQA[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(true);

  // Standardized Metrics
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalContractValue = activeOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalDeposit = orders
    .filter((o) => o.deposit_status === 'paid')
    .reduce((sum, o) => sum + (Number(o.deposit_amount) || 0), 0);
  const remainingDue = activeOrders
    .filter((o) => o.status !== 'completed')
    .reduce((sum, o) => sum + (Number(o.remaining_amount) || 0), 0);

  const activeCars = cars.filter((c) => c.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const testDrivesThisWeek = testDrives.filter(
    (td) => td.status === 'confirmed' || td.status === 'pending'
  ).length;
  const completedDeliveries = orders.filter((o) => o.status === 'completed').length;
  const approvedReviews = reviews.filter((r) => r.is_approved !== false);
  const averageRating = approvedReviews.length
    ? Number((approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length).toFixed(1))
    : 5.0;

  const conversionRate = testDrives.length > 0
    ? Number(((orders.length / testDrives.length) * 100).toFixed(1))
    : 0;

  const metrics: DashboardMetrics = {
    totalRevenue: totalDeposit, // Tiền cọc thực thu online
    totalDeposit,
    totalContractValue,
    remainingDue,
    activeCars,
    totalOrders: orders.length,
    pendingOrders,
    testDrivesThisWeek,
    completedDeliveries,
    averageRating,
    totalCustomers: customers.length,
    conversionRate,
  };

  // Load all real data from Supabase using Promise.allSettled for fault tolerance
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        dataServices.fetchCars(2000),
        dataServices.fetchShowrooms(),
        dataServices.fetchOrders(),
        dataServices.fetchVouchers(),
        dataServices.fetchTestDrives(),
        dataServices.fetchReviews(500),
        dataServices.fetchCarQAs(),
        dataServices.fetchProfiles(),
        dataServices.fetchNotifications(),
      ]);

      if (results[0].status === 'fulfilled') setCars(results[0].value);
      if (results[1].status === 'fulfilled') setShowrooms(results[1].value);
      if (results[2].status === 'fulfilled') setOrders(results[2].value);
      if (results[3].status === 'fulfilled') setVouchers(results[3].value);
      if (results[4].status === 'fulfilled') setTestDrives(results[4].value);
      if (results[5].status === 'fulfilled') setReviews(results[5].value);
      if (results[6].status === 'fulfilled') setCarQAs(results[6].value);
      if (results[7].status === 'fulfilled') setCustomers(results[7].value);
      if (results[8].status === 'fulfilled') setNotifications(results[8].value);

      const failedQueries = results.filter((r) => r.status === 'rejected');
      if (failedQueries.length === 0) {
        setIsLiveSupabase(true);
      } else {
        console.warn(`[DataContext] ${failedQueries.length} query failed:`, failedQueries);
        setIsLiveSupabase(failedQueries.length < results.length);
      }
    } catch (e) {
      console.error('[DataContext] Critical error fetching Supabase data:', e);
      setIsLiveSupabase(false);
      error('Lỗi tải dữ liệu Supabase', e instanceof Error ? e.message : 'Không thể đồng bộ dữ liệu từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await loadData();
      }
    })();
    return () => {
      active = false;
    };
  }, [loadData]);

  // ==========================================
  // Car Actions
  // ==========================================
  const addCar = async (newCarData: Omit<Car, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      const createdCar = await dataServices.addCar(newCarData);
      setCars((prev) => [createdCar, ...prev]);
      success('Thêm xe mới thành công', `${createdCar.make} ${createdCar.model} đã được lưu vào Supabase.`);
      return true;
    } catch (err) {
      error('Lỗi thêm xe', err instanceof Error ? err.message : 'Không thể thêm xe vào cơ sở dữ liệu');
      return false;
    }
  };

  const updateCar = async (id: string, updateData: Partial<Car>): Promise<boolean> => {
    try {
      const updatedCar = await dataServices.updateCar(id, updateData);
      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedCar } : c)));
      success('Cập nhật thông tin xe thành công');
      return true;
    } catch (err) {
      error('Lỗi cập nhật', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const deleteCar = async (id: string): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản cấp Owner mới có quyền xóa mẫu xe khỏi hệ thống.');
      return false;
    }
    try {
      await dataServices.deleteCar(id);
      setCars((prev) => prev.filter((c) => c.id !== id));
      success('Đã xóa mẫu xe khỏi danh mục Supabase');
      return true;
    } catch (err) {
      error('Lỗi xóa xe', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const toggleCarActive = async (id: string): Promise<boolean> => {
    const target = cars.find((c) => c.id === id);
    if (!target) return false;
    const newStatus = !target.is_active;
    return updateCar(id, { is_active: newStatus });
  };

  const quickAdjustStock = async (id: string, delta: number): Promise<boolean> => {
    try {
      const updated = await dataServices.quickAdjustStock(id, delta);
      setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
      info('Cập nhật tồn kho', `Tồn kho mới: ${updated.stock_quantity} xe`);
      return true;
    } catch (err) {
      error('Lỗi điều chỉnh tồn kho', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const transferCarShowroom = async (carId: string, targetShowroomId: string): Promise<boolean> => {
    try {
      const updated = await dataServices.transferCarShowroom(carId, targetShowroomId);
      setCars((prev) => prev.map((c) => (c.id === carId ? updated : c)));
      success('Điều chuyển Showroom thành công!');
      return true;
    } catch (err) {
      error('Lỗi điều chuyển xe', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  // ==========================================
  // Order Actions
  // ==========================================
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    depositStatus?: PaymentStatus
  ): Promise<boolean> => {
    try {
      const updatedOrder = await dataServices.updateOrderStatus(orderId, status, paymentStatus, depositStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      success('Cập nhật trạng thái đơn hàng thành công', `Đơn #${orderId.slice(0, 8)} chuyển sang "${status}".`);
      return true;
    } catch (err) {
      error('Lỗi cập nhật đơn hàng', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const cancelOrder = async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const updated = await dataServices.cancelOrder(orderId, reason, currentUser?.id);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      // Re-sync cars and vouchers because trigger restored them
      await loadData();
      success('Hủy đơn hàng thành công', 'Tồn kho xe và lượt dùng voucher đã được tự động hoàn trả.');
      return true;
    } catch (err) {
      error('Lỗi hủy đơn', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const refundOrder = async (orderId: string, amount: number, reason: string): Promise<boolean> => {
    try {
      const updated = await dataServices.refundOrder(orderId, amount, reason);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      success('Xử lý hoàn cọc thành công', `Đã ghi nhận hoàn ${formatUSD(amount)}.`);
      return true;
    } catch (err) {
      error('Lỗi hoàn tiền cọc', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const updateOrderShowroom = async (orderId: string, showroomId: string): Promise<boolean> => {
    try {
      const updated = await dataServices.updateOrderShowroom(orderId, showroomId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      success('Đổi showroom nhận xe thành công!');
      return true;
    } catch (err) {
      error('Lỗi điều phối Showroom', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const updateOrderContract = async (orderId: string, contractUrl: string): Promise<boolean> => {
    try {
      const updated = await dataServices.updateOrderContract(orderId, contractUrl);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      success('Cập nhật hợp đồng điện tử thành công!');
      return true;
    } catch (err) {
      error('Lỗi lưu hợp đồng', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản Owner mới có quyền xóa đơn hàng.');
      return false;
    }
    try {
      await dataServices.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      await loadData();
      success('Đã xóa đơn hàng và phục hồi tài nguyên liên quan.');
      return true;
    } catch (err) {
      error('Lỗi xóa đơn hàng', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  // ==========================================
  // Showroom Actions
  // ==========================================
  const addShowroom = async (srData: Omit<Showroom, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const newSr = await dataServices.addShowroom(srData);
      setShowrooms((prev) => [...prev, newSr]);
      success('Thêm showroom mới thành công', newSr.name);
      return true;
    } catch (err) {
      error('Lỗi thêm showroom', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const updateShowroom = async (id: string, srData: Partial<Showroom>): Promise<boolean> => {
    try {
      const updatedSr = await dataServices.updateShowroom(id, srData);
      setShowrooms((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedSr } : s)));
      success('Cập nhật showroom thành công');
      return true;
    } catch (err) {
      error('Lỗi cập nhật showroom', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const distributeCarsToShowrooms = async (): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản Owner mới có quyền kích hoạt phân bổ kho xe tự động.');
      return false;
    }
    try {
      const updatedCount = await dataServices.distributeCarsToShowrooms();
      await loadData();
      success(
        'Phân bổ xe vào các Showroom thành công!',
        `Đã phân bố đồng đều ${updatedCount || cars.length} xe vào ${showrooms.length} chi nhánh.`
      );
      return true;
    } catch (err) {
      error('Lỗi phân bổ kho xe', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  // ==========================================
  // Voucher Actions
  // ==========================================
  const addVoucher = async (vData: Omit<Voucher, 'id' | 'created_at' | 'used_count'>): Promise<boolean> => {
    try {
      const newVoucher = await dataServices.addVoucher(vData);
      setVouchers((prev) => [newVoucher, ...prev]);
      success('Tạo mã khuyến mãi thành công', `Mã ${newVoucher.code} đã sẵn sàng sử dụng.`);
      return true;
    } catch (err) {
      error('Lỗi tạo mã giảm giá', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const updateVoucher = async (id: string, vData: Partial<Voucher>): Promise<boolean> => {
    try {
      const updatedVoucher = await dataServices.updateVoucher(id, vData);
      setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, ...updatedVoucher } : v)));
      success('Cập nhật mã voucher thành công');
      return true;
    } catch (err) {
      error('Lỗi cập nhật voucher', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const deleteVoucher = async (id: string): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản Owner mới có quyền xóa chiến dịch voucher.');
      return false;
    }
    try {
      await dataServices.deleteVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
      success('Đã xóa mã voucher');
      return true;
    } catch (err) {
      error('Lỗi xóa voucher', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  // ==========================================
  // Test Drive Actions
  // ==========================================
  const addTestDrive = async (tdData: {
    user_id?: string | null;
    car_id: string;
    showroom_id?: string | null;
    scheduled_date: string;
    notes?: string | null;
    assigned_staff_id?: string | null;
  }): Promise<boolean> => {
    try {
      const created = await dataServices.addTestDrive(tdData);
      setTestDrives((prev) => [created, ...prev]);
      success('Đặt lịch lái thử thành công', `Đã lên lịch lái thử ngày ${new Date(created.scheduled_date).toLocaleDateString('vi-VN')}`);
      return true;
    } catch (err) {
      error('Lỗi đặt lịch lái thử', err instanceof Error ? err.message : 'Không thể lưu lịch hẹn');
      return false;
    }
  };

  const updateTestDriveStatus = async (
    id: string,
    status: TestDriveStatus,
    notes?: string
  ): Promise<boolean> => {
    try {
      const updated = await dataServices.updateTestDriveStatus(id, status, notes);
      setTestDrives((prev) => prev.map((t) => (t.id === id ? updated : t)));

      // Send automated notification to the user if assigned
      if (updated.user_id) {
        const title = status === 'confirmed' ? 'Lịch hẹn lái thử đã được duyệt!' : status === 'cancelled' ? 'Lịch hẹn lái thử đã bị hủy' : 'Cập nhật lịch lái thử';
        const content = `Lịch hẹn lái thử xe tại showroom của bạn đã chuyển sang trạng thái: ${status.toUpperCase()}.`;
        await dataServices.createNotification(title, content, updated.user_id, 'test_drive');
      }

      success('Cập nhật lịch lái thử thành công', `Lịch hẹn chuyển sang: ${status}`);
      return true;
    } catch (err) {
      error('Lỗi cập nhật lịch lái thử', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const assignTestDriveStaff = async (id: string, staffId: string | null): Promise<boolean> => {
    try {
      const updated = await dataServices.assignTestDriveStaff(id, staffId);
      setTestDrives((prev) => prev.map((t) => (t.id === id ? updated : t)));
      success('Đã chỉ định cố vấn bán hàng phụ trách lái thử!');
      return true;
    } catch (err) {
      error('Lỗi chỉ định nhân viên', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  // ==========================================
  // Review & QA Actions
  // ==========================================
  const toggleReviewApproval = async (id: string, isApproved: boolean): Promise<boolean> => {
    try {
      const updated = await dataServices.updateReviewApproval(id, isApproved);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: updated.is_approved } : r)));
      info('Cập nhật kiểm duyệt', isApproved ? 'Đã duyệt hiển thị bài đánh giá' : 'Đã chuyển về chờ duyệt');
      return true;
    } catch (err) {
      error('Lỗi kiểm duyệt', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const deleteReview = async (id: string): Promise<boolean> => {
    try {
      await dataServices.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      success('Đã xóa đánh giá');
      return true;
    } catch (err) {
      error('Lỗi xóa đánh giá', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const answerCarQA = async (id: string, answer: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const updated = await dataServices.answerCarQA(id, answer, currentUser.id);
      setCarQAs((prev) => prev.map((q) => (q.id === id ? updated : q)));

      // Auto notify customer
      if (updated.user_id) {
        await dataServices.createNotification(
          'Chuyên viên đã phản hồi câu hỏi của bạn',
          `Câu hỏi về xe đã được chuyên viên AutoMatch giải đáp: "${answer.slice(0, 100)}..."`,
          updated.user_id,
          'qa'
        );
      }

      success('Đã gửi phản hồi Q&A thành công!');
      return true;
    } catch (err) {
      error('Lỗi phản hồi Q&A', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  // ==========================================
  // Notification Actions
  // ==========================================
  const createNotification = async (
    title: string,
    content: string,
    userId: string | null = null,
    type: string = 'broadcast'
  ): Promise<boolean> => {
    try {
      const newNotif = await dataServices.createNotification(title, content, userId, type);
      setNotifications((prev) => [newNotif, ...prev]);
      info('Đã lưu thông báo hệ thống', title);
      return true;
    } catch (err) {
      error('Lỗi gửi thông báo', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const markNotificationRead = async (id: string): Promise<boolean> => {
    try {
      await dataServices.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      return true;
    } catch (err) {
      console.warn('markNotificationRead err:', err);
      return false;
    }
  };

  // ==========================================
  // Customer & Staff Actions (CRM)
  // ==========================================
  const updateCustomerRole = async (id: string, role: UserRole): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản cấp Owner mới có quyền thay đổi phân quyền nhân sự.');
      return false;
    }

    if (role === 'owner') {
      const existingOwner = customers.find((c) => c.role === 'owner' && c.id !== id);
      if (existingOwner) {
        error(
          'Thao tác không hợp lệ',
          `Hệ thống chỉ cho phép DUY NHẤT 01 tài khoản Chủ Sở Hữu (Owner: ${existingOwner.email}).`
        );
        return false;
      }
    }

    const target = customers.find((c) => c.id === id);
    if (target?.role === 'owner' && role !== 'owner') {
      const ownerCount = customers.filter((c) => c.role === 'owner').length;
      if (ownerCount <= 1) {
        error('Thao tác bị từ chối', 'Không thể hạ cấp tài khoản Chủ Sở Hữu (Owner) duy nhất của hệ thống.');
        return false;
      }
    }

    try {
      const updatedProfile = await dataServices.updateProfileRole(id, role);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, role: updatedProfile.role } : c)));
      success('Cập nhật phân quyền thành công', `Tài khoản ${updatedProfile.email} gán vai trò: ${role.toUpperCase()}`);
      return true;
    } catch (err) {
      error('Lỗi phân quyền', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  const toggleProfileActive = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const updated = await dataServices.toggleProfileActive(id, isActive);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: updated.is_active } : c)));
      success(isActive ? 'Đã kích hoạt lại tài khoản' : 'Đã khóa/tạm ngừng tài khoản');
      return true;
    } catch (err) {
      error('Lỗi cập nhật trạng thái', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const updateProfileShowroom = async (id: string, showroomId: string | null): Promise<boolean> => {
    try {
      const updated = await dataServices.updateProfileShowroom(id, showroomId);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, showroom_id: updated.showroom_id } : c)));
      success('Gán Showroom trực thuộc cho Quản lý thành công!');
      return true;
    } catch (err) {
      error('Lỗi gán Showroom', err instanceof Error ? err.message : 'Thao tác thất bại');
      return false;
    }
  };

  const addCustomer = async (customerData: {
    email: string;
    full_name: string;
    phone?: string | null;
    role?: UserRole;
    showroom_id?: string | null;
  }): Promise<boolean> => {
    try {
      const created = await dataServices.addCustomer(customerData);
      setCustomers((prev) => [created, ...prev]);
      success('Thêm khách hàng thành công', `${created.full_name || created.email} đã được thêm vào CRM.`);
      return true;
    } catch (err) {
      error('Lỗi thêm khách hàng', err instanceof Error ? err.message : 'Không thể tạo hồ sơ khách hàng');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        cars,
        orders,
        showrooms,
        vouchers,
        testDrives,
        reviews,
        carQAs,
        notifications,
        customers,
        metrics,
        isLoading,
        isLiveSupabase,
        addCar,
        updateCar,
        deleteCar,
        toggleCarActive,
        quickAdjustStock,
        transferCarShowroom,
        updateOrderStatus,
        cancelOrder,
        refundOrder,
        updateOrderShowroom,
        updateOrderContract,
        deleteOrder,
        addShowroom,
        updateShowroom,
        distributeCarsToShowrooms,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        addTestDrive,
        updateTestDriveStatus,
        assignTestDriveStaff,
        toggleReviewApproval,
        deleteReview,
        answerCarQA,
        createNotification,
        markNotificationRead,
        addCustomer,
        updateCustomerRole,
        toggleProfileActive,
        updateProfileShowroom,
        refreshData: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

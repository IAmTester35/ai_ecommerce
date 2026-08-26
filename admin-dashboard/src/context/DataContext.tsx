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
  SearchHistoryItem,
  OrderStatus,
  PaymentStatus,
  TestDriveStatus,
  UserRole,
  DashboardMetrics,
} from '../types';
import { dataServices } from '../services/dataServices';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

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
  searchHistory: SearchHistoryItem[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  isLiveSupabase: boolean;

  // Car Actions
  addCar: (car: Omit<Car, 'id' | 'created_at'>) => Promise<boolean>;
  updateCar: (id: string, car: Partial<Car>) => Promise<boolean>;
  deleteCar: (id: string) => Promise<boolean>;
  toggleCarActive: (id: string) => Promise<boolean>;

  // Order Actions
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    depositStatus?: PaymentStatus
  ) => Promise<boolean>;
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
  updateTestDriveStatus: (id: string, status: TestDriveStatus, notes?: string) => Promise<boolean>;

  // Review & QA Actions
  deleteReview: (id: string) => Promise<boolean>;
  answerCarQA: (id: string, answer: string) => Promise<boolean>;

  // Notification Actions
  createNotification: (title: string, content: string, userId?: string | null, type?: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<boolean>;

  // Customer Actions
  updateCustomerRole: (id: string, role: UserRole) => Promise<boolean>;

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
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(true);

  // Dynamic Live Metrics computed directly from database tables
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.deposit_status === 'paid')
    .reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

  const totalDeposit = orders
    .filter((o) => o.deposit_status === 'paid')
    .reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

  const activeCars = cars.filter((c) => c.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const testDrivesThisWeek = testDrives.filter(
    (td) => td.status === 'confirmed' || td.status === 'pending'
  ).length;
  const completedDeliveries = orders.filter((o) => o.status === 'completed').length;
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
    : 5.0;

  const metrics: DashboardMetrics = {
    totalRevenue,
    totalDeposit,
    activeCars,
    totalOrders: orders.length,
    pendingOrders,
    testDrivesThisWeek,
    completedDeliveries,
    averageRating,
    totalCustomers: customers.length,
  };

  // Load all real data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dbCars,
        dbShowrooms,
        dbOrders,
        dbVouchers,
        dbTestDrives,
        dbReviews,
        dbQA,
        dbProfiles,
        dbNotifications,
        dbHistory,
      ] = await Promise.all([
        dataServices.fetchCars(2000),
        dataServices.fetchShowrooms(),
        dataServices.fetchOrders(),
        dataServices.fetchVouchers(),
        dataServices.fetchTestDrives(),
        dataServices.fetchReviews(500),
        dataServices.fetchCarQAs(),
        dataServices.fetchProfiles(),
        dataServices.fetchNotifications(),
        dataServices.fetchSearchHistory(),
      ]);

      setCars(dbCars);
      setShowrooms(dbShowrooms);
      setOrders(dbOrders);
      setVouchers(dbVouchers);
      setTestDrives(dbTestDrives);
      setReviews(dbReviews);
      setCarQAs(dbQA);
      setCustomers(dbProfiles);
      setNotifications(dbNotifications);
      setSearchHistory(dbHistory);
      setIsLiveSupabase(true);
    } catch (e) {
      console.error('[DataContext] Error fetching live Supabase data:', e);
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

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản Owner mới có quyền hủy hợp đồng đơn hàng.');
      return false;
    }
    try {
      await dataServices.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      success('Đã xóa đơn đặt cọc');
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
  const updateTestDriveStatus = async (
    id: string,
    status: TestDriveStatus,
    notes?: string
  ): Promise<boolean> => {
    try {
      const updated = await dataServices.updateTestDriveStatus(id, status, notes);
      setTestDrives((prev) => prev.map((t) => (t.id === id ? updated : t)));
      success('Cập nhật lịch lái thử thành công', `Lịch hẹn chuyển sang: ${status}`);
      return true;
    } catch (err) {
      error('Lỗi cập nhật lịch lái thử', err instanceof Error ? err.message : 'Lỗi không xác định');
      return false;
    }
  };

  // ==========================================
  // Review & QA Actions
  // ==========================================
  const deleteReview = async (id: string): Promise<boolean> => {
    try {
      await dataServices.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      success('Đã xóa đánh giá vi phạm');
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
  // Customer Actions (Role Management)
  // ==========================================
  const updateCustomerRole = async (id: string, role: UserRole): Promise<boolean> => {
    if (!isOwner) {
      error('Quyền hạn bị từ chối', 'Chỉ tài khoản cấp Owner mới có quyền thay đổi phân quyền người dùng.');
      return false;
    }
    try {
      const updatedProfile = await dataServices.updateProfileRole(id, role);
      setCustomers((prev) => prev.map((c) => (c.id === id ? updatedProfile : c)));
      success('Cập nhật phân quyền thành công', `Người dùng được gán quyền: ${role.toUpperCase()}`);
      return true;
    } catch (err) {
      error('Lỗi phân quyền', err instanceof Error ? err.message : 'Lỗi không xác định');
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
        searchHistory,
        metrics,
        isLoading,
        isLiveSupabase,
        addCar,
        updateCar,
        deleteCar,
        toggleCarActive,
        updateOrderStatus,
        deleteOrder,
        addShowroom,
        updateShowroom,
        distributeCarsToShowrooms,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        updateTestDriveStatus,
        deleteReview,
        answerCarQA,
        createNotification,
        markNotificationRead,
        updateCustomerRole,
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

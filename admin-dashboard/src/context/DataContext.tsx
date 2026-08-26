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
import {
  mockCars,
  mockOrders,
  mockShowrooms,
  mockTestDrives,
  mockVouchers,
  mockProfiles,
  mockReviews,
  mockCarQA,
  mockNotifications,
  mockSearchHistory,
} from '../lib/mockData';
import { supabase } from '../lib/supabase';
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
  const { currentUser } = useAuth();

  const [cars, setCars] = useState<Car[]>(mockCars);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [showrooms, setShowrooms] = useState<Showroom[]>(mockShowrooms);
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [testDrives, setTestDrives] = useState<TestDrive[]>(mockTestDrives);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [carQAs, setCarQAs] = useState<CarQA[]>(mockCarQA);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [customers, setCustomers] = useState<Profile[]>(mockProfiles);
  const [searchHistory] = useState<SearchHistoryItem[]>(mockSearchHistory);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);

  // Calculate live metrics
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.deposit_status === 'paid')
    .reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

  const totalDeposit = orders
    .filter((o) => o.deposit_status === 'paid')
    .reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

  const activeCars = cars.filter((c) => c.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const testDrivesThisWeek = testDrives.filter((td) => td.status === 'confirmed' || td.status === 'pending').length;
  const completedDeliveries = orders.filter((o) => o.status === 'completed').length;
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
    : 4.9;

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase
      const { data: dbCars, error: carErr } = await supabase.from('cars').select('*, showrooms(*)');
      const { data: dbShowrooms } = await supabase.from('showrooms').select('*');
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*, profiles(*), showrooms(*), vouchers(*), order_items(*, cars(*))')
        .order('created_at', { ascending: false });
      const { data: dbVouchers } = await supabase.from('vouchers').select('*');
      const { data: dbTestDrives } = await supabase
        .from('test_drives')
        .select('*, cars(*), showrooms(*), profiles(*)')
        .order('scheduled_date', { ascending: true });
      const { data: dbReviews } = await supabase.from('reviews').select('*, profiles(*), cars(*)');
      const { data: dbQA } = await supabase.from('car_qa').select('*, profiles(*), cars(*)');
      const { data: dbProfiles } = await supabase.from('profiles').select('*');

      if (dbCars && dbCars.length > 0 && !carErr) {
        setCars(dbCars);
        setIsLiveSupabase(true);
        if (dbShowrooms?.length) setShowrooms(dbShowrooms);
        if (dbOrders?.length) setOrders(dbOrders);
        if (dbVouchers?.length) setVouchers(dbVouchers);
        if (dbTestDrives?.length) setTestDrives(dbTestDrives);
        if (dbReviews?.length) setReviews(dbReviews);
        if (dbQA?.length) setCarQAs(dbQA);
        if (dbProfiles?.length) setCustomers(dbProfiles);
      } else {
        // Use rich offline/demo state
        setIsLiveSupabase(false);
      }
    } catch (e) {
      console.info('Supabase initial fetch fallback to curated mock data:', e);
      setIsLiveSupabase(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Car Actions
  const addCar = async (newCarData: Omit<Car, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      const id = 'car-' + Date.now().toString(36);
      const newCar: Car = {
        ...newCarData,
        id,
        created_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('cars').insert([newCarData]);
        if (dbErr) throw dbErr;
      }

      setCars((prev) => [newCar, ...prev]);
      success('Thêm xe mới thành công', `${newCar.make} ${newCar.model} đã được đưa vào hệ thống kho.`);
      return true;
    } catch (err: any) {
      error('Lỗi thêm xe', err.message || 'Không thể thêm xe vào cơ sở dữ liệu');
      return false;
    }
  };

  const updateCar = async (id: string, updateData: Partial<Car>): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('cars').update(updateData).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...updateData } : c)));
      success('Cập nhật thông tin xe thành công');
      return true;
    } catch (err: any) {
      error('Lỗi cập nhật', err.message);
      return false;
    }
  };

  const deleteCar = async (id: string): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('cars').delete().eq('id', id);
        if (dbErr) throw dbErr;
      }

      setCars((prev) => prev.filter((c) => c.id !== id));
      success('Đã xóa mẫu xe khỏi danh mục');
      return true;
    } catch (err: any) {
      error('Lỗi xóa xe', err.message);
      return false;
    }
  };

  const toggleCarActive = async (id: string): Promise<boolean> => {
    const target = cars.find((c) => c.id === id);
    if (!target) return false;
    const newStatus = !target.is_active;
    return updateCar(id, { is_active: newStatus });
  };

  // Order Actions
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    depositStatus?: PaymentStatus
  ): Promise<boolean> => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (paymentStatus) updates.payment_status = paymentStatus;
      if (depositStatus) updates.deposit_status = depositStatus;

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (dbErr) throw dbErr;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );
      success('Cập nhật trạng thái đơn hàng thành công', `Đơn #${orderId} chuyển sang "${status}".`);
      return true;
    } catch (err: any) {
      error('Lỗi cập nhật đơn hàng', err.message);
      return false;
    }
  };

  // Showroom Actions
  const addShowroom = async (srData: Omit<Showroom, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const id = 'sr-' + Date.now().toString(36);
      const newSr: Showroom = {
        ...srData,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        car_count: 0,
      };

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('showrooms').insert([srData]);
        if (dbErr) throw dbErr;
      }

      setShowrooms((prev) => [...prev, newSr]);
      success('Thêm showroom mới thành công', newSr.name);
      return true;
    } catch (err: any) {
      error('Lỗi thêm showroom', err.message);
      return false;
    }
  };

  const updateShowroom = async (id: string, srData: Partial<Showroom>): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('showrooms').update(srData).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setShowrooms((prev) => prev.map((s) => (s.id === id ? { ...s, ...srData } : s)));
      success('Cập nhật showroom thành công');
      return true;
    } catch (err: any) {
      error('Lỗi cập nhật showroom', err.message);
      return false;
    }
  };

  const distributeCarsToShowrooms = async (): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: rpcErr } = await supabase.rpc('distribute_cars_to_showrooms');
        if (rpcErr) throw rpcErr;
      }

      // Local shuffle & evenly distribute
      setCars((prev) =>
        prev.map((car, idx) => ({
          ...car,
          showroom_id: showrooms[idx % showrooms.length]?.id || null,
        }))
      );
      success('Phân bổ xe vào các Showroom thành công!', 'Toàn bộ danh mục xe đã được phân bố đồng đều.');
      return true;
    } catch (err: any) {
      error('Lỗi phân bổ kho xe', err.message);
      return false;
    }
  };

  // Voucher Actions
  const addVoucher = async (vData: Omit<Voucher, 'id' | 'created_at' | 'used_count'>): Promise<boolean> => {
    try {
      const id = 'vc-' + Date.now().toString(36);
      const newVoucher: Voucher = {
        ...vData,
        id,
        used_count: 0,
        created_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('vouchers').insert([vData]);
        if (dbErr) throw dbErr;
      }

      setVouchers((prev) => [newVoucher, ...prev]);
      success('Tạo mã khuyến mãi thành công', `Mã ${newVoucher.code} đã sẵn sàng sử dụng.`);
      return true;
    } catch (err: any) {
      error('Lỗi tạo mã giảm giá', err.message);
      return false;
    }
  };

  const updateVoucher = async (id: string, vData: Partial<Voucher>): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('vouchers').update(vData).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, ...vData } : v)));
      success('Cập nhật mã voucher thành công');
      return true;
    } catch (err: any) {
      error('Lỗi cập nhật voucher', err.message);
      return false;
    }
  };

  const deleteVoucher = async (id: string): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('vouchers').delete().eq('id', id);
        if (dbErr) throw dbErr;
      }

      setVouchers((prev) => prev.filter((v) => v.id !== id));
      success('Đã xóa mã voucher');
      return true;
    } catch (err: any) {
      error('Lỗi xóa voucher', err.message);
      return false;
    }
  };

  // Test Drive Actions
  const updateTestDriveStatus = async (id: string, status: TestDriveStatus, notes?: string): Promise<boolean> => {
    try {
      const updates: Partial<TestDrive> = { status };
      if (notes !== undefined) updates.notes = notes;

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('test_drives').update(updates).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setTestDrives((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      success('Cập nhật lịch lái thử thành công', `Lịch hẹn chuyển sang trạng thái: ${status}`);
      return true;
    } catch (err: any) {
      error('Lỗi cập nhật lịch lái thử', err.message);
      return false;
    }
  };

  // Review & QA Actions
  const deleteReview = async (id: string): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('reviews').delete().eq('id', id);
        if (dbErr) throw dbErr;
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
      success('Đã xóa đánh giá');
      return true;
    } catch (err: any) {
      error('Lỗi xóa đánh giá', err.message);
      return false;
    }
  };

  const answerCarQA = async (id: string, answer: string): Promise<boolean> => {
    try {
      const updates = {
        answer,
        answered_by: currentUser.id,
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('car_qa').update(updates).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setCarQAs((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updates, answerer: currentUser } : q))
      );
      success('Đã trả lời câu hỏi khách hàng thành công!');
      return true;
    } catch (err: any) {
      error('Lỗi phản hồi Q&A', err.message);
      return false;
    }
  };

  // Notification Actions
  const createNotification = async (
    title: string,
    content: string,
    userId: string | null = null,
    type: string = 'broadcast'
  ): Promise<boolean> => {
    try {
      const newNotif: AppNotification = {
        id: 'notif-' + Date.now().toString(36),
        user_id: userId,
        title,
        content,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        await supabase.from('notifications').insert([newNotif]);
      }

      setNotifications((prev) => [newNotif, ...prev]);
      info('Đã gửi thông báo hệ thống', title);
      return true;
    } catch (err: any) {
      error('Lỗi gửi thông báo', err.message);
      return false;
    }
  };

  const markNotificationRead = async (id: string): Promise<boolean> => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    return true;
  };

  // Customer Actions
  const updateCustomerRole = async (id: string, role: UserRole): Promise<boolean> => {
    try {
      if (isLiveSupabase) {
        const { error: dbErr } = await supabase.from('profiles').update({ role }).eq('id', id);
        if (dbErr) throw dbErr;
      }

      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, role } : c)));
      success('Cập nhật phân quyền người dùng thành công', `Người dùng được gán quyền: ${role.toUpperCase()}`);
      return true;
    } catch (err: any) {
      error('Lỗi phân quyền', err.message);
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

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

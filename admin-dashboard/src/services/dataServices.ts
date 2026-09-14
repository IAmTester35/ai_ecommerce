import { supabase } from '../lib/supabase';
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
  ChatSessionMessage,
  OrderStatus,
  PaymentStatus,
  TestDriveStatus,
  UserRole,
} from '../types';

export const dataServices = {
  // ==========================================
  // CARS INVENTORY
  // ==========================================
  async fetchCars(limit: number = 2000): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*, showroom:showrooms(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Car[];
  },

  async addCar(carData: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .insert([carData])
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Car;
  },

  async updateCar(id: string, carData: Partial<Car>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .update(carData)
      .eq('id', id)
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Car;
  },

  async deleteCar(id: string): Promise<void> {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async quickAdjustStock(id: string, delta: number): Promise<Car> {
    const { data: current, error: getErr } = await supabase
      .from('cars')
      .select('stock_quantity, is_active')
      .eq('id', id)
      .single();

    if (getErr) throw getErr;

    const newStock = Math.max(0, (current?.stock_quantity || 0) + delta);
    const isActive = newStock > 0;

    const { data, error } = await supabase
      .from('cars')
      .update({ stock_quantity: newStock, is_active: isActive })
      .eq('id', id)
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Car;
  },

  async transferCarShowroom(carId: string, targetShowroomId: string): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .update({ showroom_id: targetShowroomId })
      .eq('id', carId)
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Car;
  },

  async uploadCarImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `cars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.warn('Storage upload error, falling back to local object URL:', uploadError);
        return URL.createObjectURL(file);
      }

      const { data } = supabase.storage.from('car-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch {
      return URL.createObjectURL(file);
    }
  },

  // ==========================================
  // SHOWROOMS & DISTRIBUTION
  // ==========================================
  async fetchShowrooms(): Promise<Showroom[]> {
    const { data, error } = await supabase
      .from('showrooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Showroom[];
  },

  async addShowroom(srData: Omit<Showroom, 'id' | 'created_at' | 'updated_at'>): Promise<Showroom> {
    const { data, error } = await supabase
      .from('showrooms')
      .insert([srData])
      .select('*')
      .single();

    if (error) throw error;
    return data as Showroom;
  },

  async updateShowroom(id: string, srData: Partial<Showroom>): Promise<Showroom> {
    const { data, error } = await supabase
      .from('showrooms')
      .update(srData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Showroom;
  },

  async distributeCarsToShowrooms(): Promise<number> {
    const { data, error } = await supabase.rpc('distribute_cars_to_showrooms');
    if (error) throw error;
    return (data as number) || 0;
  },

  // ==========================================
  // VOUCHERS & PROMOTIONS
  // ==========================================
  async fetchVouchers(): Promise<Voucher[]> {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Voucher[];
  },

  async addVoucher(vData: Omit<Voucher, 'id' | 'created_at' | 'used_count'>): Promise<Voucher> {
    const { data, error } = await supabase
      .from('vouchers')
      .insert([vData])
      .select('*')
      .single();

    if (error) throw error;
    return data as Voucher;
  },

  async updateVoucher(id: string, vData: Partial<Voucher>): Promise<Voucher> {
    const { data, error } = await supabase
      .from('vouchers')
      .update(vData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Voucher;
  },

  async deleteVoucher(id: string): Promise<void> {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // ORDERS & CONTRACTS
  // ==========================================
  async fetchOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Order[];
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    depositStatus?: PaymentStatus
  ): Promise<Order> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (paymentStatus) updates.payment_status = paymentStatus;
    if (depositStatus) updates.deposit_status = depositStatus;

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .single();

    if (error) throw error;
    return data as Order;
  },

  async cancelOrder(orderId: string, reason: string, cancelledBy?: string): Promise<Order> {
    const updates: Record<string, unknown> = {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by: cancelledBy || null,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .single();

    if (error) throw error;
    return data as Order;
  },

  async refundOrder(
    orderId: string,
    refundAmount: number,
    reason: string,
    refundTransId?: string
  ): Promise<Order> {
    const updates: Record<string, unknown> = {
      payment_status: 'refunded',
      deposit_status: 'refunded',
      refund_amount: refundAmount,
      refund_reason: reason,
      refund_trans_id: refundTransId || `REF_${Date.now()}`,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .single();

    if (error) throw error;
    return data as Order;
  },

  async updateOrderShowroom(orderId: string, showroomId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ showroom_id: showroomId, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .single();

    if (error) throw error;
    return data as Order;
  },

  async updateOrderContract(orderId: string, contractUrl: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ contract_url: contractUrl, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
      .single();

    if (error) throw error;
    return data as Order;
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
  },

  // ==========================================
  // TEST DRIVES
  // ==========================================
  async fetchTestDrives(): Promise<TestDrive[]> {
    const { data, error } = await supabase
      .from('test_drives')
      .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*), assigned_staff:profiles!test_drives_assigned_staff_id_fkey(*)')
      .order('scheduled_date', { ascending: true });

    if (error) {
      // Fallback query if assigned_staff join fails
      const { data: fallback, error: fbErr } = await supabase
        .from('test_drives')
        .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*)')
        .order('scheduled_date', { ascending: true });
      if (fbErr) throw fbErr;
      return (fallback || []) as TestDrive[];
    }
    return (data || []) as TestDrive[];
  },

  async addTestDrive(tdData: {
    user_id?: string | null;
    car_id: string;
    showroom_id?: string | null;
    scheduled_date: string;
    notes?: string | null;
    assigned_staff_id?: string | null;
  }): Promise<TestDrive> {
    const { data, error } = await supabase
      .from('test_drives')
      .insert([{
        user_id: tdData.user_id || null,
        car_id: tdData.car_id,
        showroom_id: tdData.showroom_id || null,
        scheduled_date: tdData.scheduled_date,
        status: 'pending',
        notes: tdData.notes || null,
        assigned_staff_id: tdData.assigned_staff_id || null,
      }])
      .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*), assigned_staff:profiles!test_drives_assigned_staff_id_fkey(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },

  async updateTestDriveStatus(id: string, status: TestDriveStatus, notes?: string): Promise<TestDrive> {
    const updates: Record<string, unknown> = { status };
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('test_drives')
      .update(updates)
      .eq('id', id)
      .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*), assigned_staff:profiles!test_drives_assigned_staff_id_fkey(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },

  async assignTestDriveStaff(id: string, staffId: string | null): Promise<TestDrive> {
    const { data, error } = await supabase
      .from('test_drives')
      .update({ assigned_staff_id: staffId })
      .eq('id', id)
      .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*), assigned_staff:profiles!test_drives_assigned_staff_id_fkey(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },

  // ==========================================
  // REVIEWS & Q&A
  // ==========================================
  async fetchReviews(limit: number = 500): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, car:cars(*), profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Review[];
  },

  async updateReviewApproval(id: string, isApproved: boolean): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', id)
      .select('*, car:cars(*), profile:profiles(*)')
      .single();

    if (error) throw error;
    return data as Review;
  },

  async deleteReview(id: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async fetchCarQAs(): Promise<CarQA[]> {
    const { data, error } = await supabase
      .from('car_qa')
      .select('*, car:cars(*), profile:profiles!car_qa_user_id_fkey(*), answerer:profiles!car_qa_answered_by_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('car_qa')
        .select('*, car:cars(*), profile:profiles!car_qa_user_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (fallbackErr) throw fallbackErr;
      return (fallbackData || []) as CarQA[];
    }
    return (data || []) as CarQA[];
  },

  async answerCarQA(id: string, answer: string, currentUserId: string): Promise<CarQA> {
    const updates = {
      answer,
      answered_by: currentUserId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('car_qa')
      .update(updates)
      .eq('id', id)
      .select('*, car:cars(*), profile:profiles!car_qa_user_id_fkey(*), answerer:profiles!car_qa_answered_by_fkey(*)')
      .single();

    if (error) throw error;
    return data as CarQA;
  },

  async deleteCarQA(id: string): Promise<void> {
    const { error } = await supabase
      .from('car_qa')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // CUSTOMERS / PROFILES & CRM
  // ==========================================
  async fetchProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, showroom:showrooms(*)')
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return (fb || []) as Profile[];
    }
    return (data || []) as Profile[];
  },

  async updateProfileRole(id: string, role: UserRole): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async toggleProfileActive(id: string, isActive: boolean): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async updateProfileShowroom(id: string, showroomId: string | null): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ showroom_id: showroomId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async addCustomer(customerData: {
    email: string;
    full_name: string;
    phone?: string | null;
    role?: UserRole;
    showroom_id?: string | null;
  }): Promise<Profile> {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id,
          email: customerData.email.trim(),
          full_name: customerData.full_name.trim(),
          phone: customerData.phone?.trim() || null,
          role: customerData.role || 'user',
          showroom_id: customerData.showroom_id || null,
          is_active: true,
        },
      ])
      .select('*, showroom:showrooms(*)')
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async fetchCustomer360(userId: string): Promise<{
    orders: Order[];
    testDrives: TestDrive[];
    savedCars: Car[];
  }> {
    const [ordersRes, tdRes, savedRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, profile:profiles!orders_user_id_fkey(*), showroom:showrooms(*), voucher:vouchers(*), items:order_items(*, car:cars(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('test_drives')
        .select('*, car:cars(*), showroom:showrooms(*), profile:profiles!test_drives_user_id_fkey(*)')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: false }),
      supabase
        .from('saved_cars')
        .select('*, car:cars(*, showroom:showrooms(*))')
        .eq('user_id', userId),
    ]);

    return {
      orders: (ordersRes.data || []) as Order[],
      testDrives: (tdRes.data || []) as TestDrive[],
      savedCars: (savedRes.data || []).map((s: any) => s.car || s.cars).filter(Boolean) as Car[],
    };
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async fetchNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as AppNotification[];
  },

  async createNotification(
    title: string,
    content: string,
    userId?: string | null,
    type: string = 'broadcast'
  ): Promise<AppNotification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId || null,
          title,
          content,
          type,
          is_read: false,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data as AppNotification;
  },

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // SEARCH HISTORY
  // ==========================================
  async fetchSearchHistory(): Promise<SearchHistoryItem[]> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as SearchHistoryItem[];
  },

  // ==========================================
  // AI CHAT SESSIONS INSPECTOR
  // ==========================================
  async fetchChatSessions(): Promise<ChatSessionMessage[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      // Fallback without alias
      const { data: fb, error: fbErr } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (fbErr) throw fbErr;
      return (fb || []) as ChatSessionMessage[];
    }
    return (data || []) as ChatSessionMessage[];
  },
};

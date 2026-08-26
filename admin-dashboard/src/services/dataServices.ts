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
  OrderStatus,
  PaymentStatus,
  TestDriveStatus,
  UserRole,
} from '../types';

export const dataServices = {
  // ==========================================
  // CARS INVENTORY (1,800+ Cars in DB)
  // ==========================================
  async fetchCars(limit: number = 2000): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*, showrooms(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Car[];
  },

  async addCar(carData: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .insert([carData])
      .select('*, showrooms(*)')
      .single();

    if (error) throw error;
    return data as Car;
  },

  async updateCar(id: string, carData: Partial<Car>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .update(carData)
      .eq('id', id)
      .select('*, showrooms(*)')
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
  // ==========================
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
      .select('*, profiles(*), showrooms(*), vouchers(*), order_items(*, cars(*))')
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
      .select('*, profiles(*), showrooms(*), vouchers(*), order_items(*, cars(*))')
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
      .select('*, cars(*), showrooms(*), profiles(*)')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []) as TestDrive[];
  },

  async updateTestDriveStatus(id: string, status: TestDriveStatus, notes?: string): Promise<TestDrive> {
    const updates: Record<string, unknown> = { status };
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('test_drives')
      .update(updates)
      .eq('id', id)
      .select('*, cars(*), showrooms(*), profiles(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },

  // ==========================================
  // REVIEWS & Q&A
  // ==========================================
  async fetchReviews(limit: number = 200): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(*), cars(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Review[];
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
      .select('*, profiles(*), cars(*), answerer:profiles!car_qa_answered_by_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback query if foreign key alias fails
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('car_qa')
        .select('*, profiles(*), cars(*)')
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
      .select('*, profiles(*), cars(*)')
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
  // CUSTOMERS / PROFILES & ROLES
  // ==========================================
  async fetchProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
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
      .limit(50);

    if (error) throw error;
    return (data || []) as SearchHistoryItem[];
  },
};

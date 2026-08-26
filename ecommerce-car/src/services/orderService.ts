import { supabase } from '../api/supabaseClient';
import { Order } from '../types';

export const orderService = {
  getOrders: async (userId?: string): Promise<Order[]> => {
    let query = supabase
      .from('orders')
      .select('*, showroom:showrooms(*), voucher:vouchers(*), order_items(*, car:cars(*, showroom:showrooms(*)))')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[orderService] Error fetching orders:', error.message);
      return [];
    }
    return (data || []) as Order[];
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    if (!orderId) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('*, showroom:showrooms(*), voucher:vouchers(*), order_items(*, car:cars(*, showroom:showrooms(*)))')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('[orderService] Error fetching order detail:', error.message);
      return null;
    }
    return data as Order | null;
  },
};

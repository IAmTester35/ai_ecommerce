import { supabase } from '../api/supabaseClient';
import { Order } from '../types';

export const orderService = {
  getOrders: async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, car:cars(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, car:cars(*))')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data as Order;
  },
};

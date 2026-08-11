import { supabase } from '../api/supabaseClient';
import { CartItem } from '../types';

export const cartService = {
  getCartItems: async (): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, car:cars(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CartItem[];
  },

  addToCart: async (_userId: string | undefined, carId: string, quantity = 1): Promise<CartItem> => {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({ car_id: carId, quantity })
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  updateCartQuantity: async (cartItemId: string, quantity: number): Promise<CartItem> => {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  },

  clearCart: async (): Promise<void> => {
    const { error } = await supabase
      .from('cart_items')
      .delete();

    if (error) throw error;
  },

  checkoutCart: async (paymentMethod: string): Promise<string> => {
    const { data, error } = await supabase.rpc('checkout_cart', {
      p_payment_method: paymentMethod,
    });

    if (error) throw error;
    return data as string;
  },
};

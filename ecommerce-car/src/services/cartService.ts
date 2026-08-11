import { supabase } from '../api/supabaseClient';
import { CartItem } from '../types';

export const cartService = {
  getCartItems: async (userId: string): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, car:cars(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CartItem[];
  },

  addToCart: async (userId: string, carId: string, quantity = 1): Promise<CartItem> => {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: userId, car_id: carId, quantity },
        { onConflict: 'user_id,car_id' }
      )
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

  clearCart: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  checkoutCart: async (userId: string, paymentMethod: string): Promise<string> => {
    const { data, error } = await supabase.rpc('checkout_cart', {
      p_user_id: userId,
      p_payment_method: paymentMethod,
    });

    if (error) throw error;
    return data as string; // returns created order_id UUID
  },
};

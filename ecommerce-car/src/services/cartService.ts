import { supabase } from '../api/supabaseClient';
import { CartItem } from '../types';

export const cartService = {
  getCartItems: async (): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, car:cars(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[cartService] Error fetching cart items:', error.message);
      return [];
    }
    return (data || []) as CartItem[];
  },

  addToCart: async (userId: string | undefined, carId: string, quantity = 1): Promise<CartItem> => {
    const record: Record<string, any> = { car_id: carId, quantity };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .upsert(record)
      .select('*, car:cars(*)')
      .single();

    if (error) {
      console.error('[cartService] Error adding to cart:', error.message);
      throw error;
    }
    return data as CartItem;
  },

  updateCartQuantity: async (cartItemId: string, quantity: number): Promise<CartItem> => {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select('*, car:cars(*)')
      .single();

    if (error) {
      console.error('[cartService] Error updating cart quantity:', error.message);
      throw error;
    }
    return data as CartItem;
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) {
      console.error('[cartService] Error removing from cart:', error.message);
      throw error;
    }
  },

  clearCart: async (): Promise<void> => {
    const { error } = await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error('[cartService] Error clearing cart:', error.message);
    }
  },

  checkoutCart: async (paymentMethod: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc('checkout_cart', {
      p_user_id: user?.id,
      p_payment_method: paymentMethod,
    });

    if (error) {
      console.error('[cartService] Error during checkout RPC:', error.message);
      throw error;
    }
    return data as string;
  },
};

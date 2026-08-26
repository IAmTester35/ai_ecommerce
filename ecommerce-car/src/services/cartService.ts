import { supabase } from '../api/supabaseClient';
import { authService } from './authService';
import { CartItem } from '../types';

export const formatCartError = (err: any): string => {
  if (!err) return 'Đã xảy ra lỗi không xác định.';
  const msg = typeof err === 'string' ? err : err.message || '';

  if (msg.includes('out of stock') || msg.includes('not enough stock')) {
    return 'Xe bạn chọn hiện đã hết hàng hoặc không đủ số lượng để đặt cọc.';
  }
  if (msg.includes('violates foreign key constraint') && msg.includes('cart_items_user_id_fkey')) {
    return 'Thông tin tài khoản chưa hoàn tất. Vui lòng đăng nhập lại.';
  }
  if (msg.includes('violates foreign key constraint')) {
    return 'Dữ liệu xe hoặc tài khoản không hợp lệ.';
  }
  if (msg.includes('Vui lòng đăng nhập')) {
    return msg;
  }
  if (msg.includes('Network request failed') || msg.includes('fetch failed') || msg.includes('Failed to fetch')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại Internet.';
  }
  return msg || 'Có lỗi xảy ra trong quá trình xử lý đơn đặt cọc.';
};

export const cartService = {
  getCartItems: async (): Promise<CartItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, car:cars(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[cartService] Error fetching cart items:', error.message);
      return [];
    }
    return (data || []) as CartItem[];
  },

  addToCart: async (userId: string | undefined, carId: string, quantity = 1): Promise<CartItem> => {
    let uid = userId;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      uid = user.id;
      await authService.ensureProfile(user);
    }

    if (!uid) {
      throw new Error('Vui lòng đăng nhập để thêm xe vào danh sách đặt cọc.');
    }

    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: uid, car_id: carId, quantity },
        { onConflict: 'user_id,car_id' }
      )
      .select('*, car:cars(*)')
      .single();

    if (error) {
      console.error('[cartService] Error adding to cart:', error.message);
      throw new Error(formatCartError(error));
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
      throw new Error(formatCartError(error));
    }
    return data as CartItem;
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) {
      console.error('[cartService] Error removing from cart:', error.message);
      throw new Error(formatCartError(error));
    }
  },

  clearCart: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) {
      console.error('[cartService] Error clearing cart:', error.message);
    }
  },

  checkoutCart: async (
    paymentMethod: string,
    showroomId?: string,
    voucherCode?: string,
    depositRate = 0.10
  ): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vui lòng đăng nhập để thực hiện đặt cọc.');
    }

    const rpcParams: Record<string, any> = {
      p_user_id: user.id,
      p_payment_method: paymentMethod,
      p_deposit_rate: depositRate,
    };

    if (showroomId) {
      rpcParams.p_showroom_id = showroomId;
    }
    if (voucherCode && voucherCode.trim()) {
      rpcParams.p_voucher_code = voucherCode.trim().toUpperCase();
    }

    const { data, error } = await supabase.rpc('checkout_cart', rpcParams);

    if (error) {
      console.error('[cartService] Error during checkout RPC:', error.message);
      throw new Error(formatCartError(error));
    }
    return data as string;
  },
};

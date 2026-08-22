import { create } from 'zustand';
import { cartService } from '../services/cartService';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isCheckingOut: boolean;
  error: string | null;
  lastCreatedOrderId: string | null;

  fetchCart: (userId?: string) => Promise<void>;
  addToCart: (userId: string | undefined, carId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  checkout: (userId: string | undefined, paymentMethod: string) => Promise<string>;
  clearCartState: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  isCheckingOut: false,
  error: null,
  lastCreatedOrderId: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await cartService.getCartItems();
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải giỏ hàng', isLoading: false });
    }
  },

  addToCart: async (userId, carId, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await cartService.addToCart(userId, carId, quantity);
      const { items } = get();
      const existingIdx = items.findIndex((i) => i.car_id === carId);
      if (existingIdx >= 0) {
        const updated = [...items];
        updated[existingIdx] = newItem;
        set({ items: updated, isLoading: false });
      } else {
        set({ items: [newItem, ...items], isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi thêm vào giỏ hàng', isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    if (quantity <= 0) {
      return get().removeFromCart(cartItemId);
    }
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await cartService.updateCartQuantity(cartItemId, quantity);
      set((state) => ({
        items: state.items.map((item) => (item.id === cartItemId ? updatedItem : item)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật số lượng', isLoading: false });
    }
  },

  removeFromCart: async (cartItemId) => {
    set({ isLoading: true, error: null });
    try {
      await cartService.removeFromCart(cartItemId);
      set((state) => ({
        items: state.items.filter((item) => item.id !== cartItemId),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi xóa khỏi giỏ hàng', isLoading: false });
    }
  },

  checkout: async (_userId, paymentMethod) => {
    if (get().isCheckingOut) {
      throw new Error('Đang xử lý thanh toán, vui lòng không gửi lại yêu cầu.');
    }
    set({ isCheckingOut: true, error: null });
    try {
      const orderId = await cartService.checkoutCart(paymentMethod);
      set({ items: [], lastCreatedOrderId: orderId, isCheckingOut: false });
      return orderId;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi thanh toán giỏ hàng', isCheckingOut: false });
      throw err;
    }
  },

  clearCartState: () => set({ items: [], error: null, lastCreatedOrderId: null }),

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => {
      const price = item.car?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

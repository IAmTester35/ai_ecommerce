import { create } from 'zustand';
import { orderService } from '../services/orderService';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  fetchOrders: (userId: string) => Promise<void>;
  fetchOrderDetails: (orderId: string) => Promise<void>;
  clearSelectedOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await orderService.getOrders(userId);
      set({ orders, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách đơn hàng', isLoading: false });
    }
  },

  fetchOrderDetails: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.getOrderById(orderId);
      set({ selectedOrder: order, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải chi tiết đơn hàng', isLoading: false });
    }
  },

  clearSelectedOrder: () => set({ selectedOrder: null }),
}));

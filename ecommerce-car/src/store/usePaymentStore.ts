import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { paymentService } from '../services/paymentService';
import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentStatusResponse,
} from '../types';

interface PaymentState {
  isProcessing: boolean;
  paymentResponse: PaymentCreateResponse | null;
  statusResult: PaymentStatusResponse | null;
  error: string | null;

  createZaloPayOrder: (payload: PaymentCreateRequest) => Promise<PaymentCreateResponse>;
  openZaloPayUrl: (url: string) => Promise<void>;
  checkPaymentStatus: (appTransId: string) => Promise<PaymentStatusResponse>;
  resetPaymentState: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  isProcessing: false,
  paymentResponse: null,
  statusResult: null,
  error: null,

  createZaloPayOrder: async (payload) => {
    if (usePaymentStore.getState().isProcessing) {
      throw new Error('Đang khởi tạo giao dịch, vui lòng không nhấn nhiều lần.');
    }
    set({ isProcessing: true, error: null });
    try {
      const res = await paymentService.createPayment(payload);
      set({ paymentResponse: res, isProcessing: false });
      return res;
    } catch (err: any) {
      const msg = err.message || 'Khởi tạo thanh toán ZaloPay thất bại';
      set({ error: msg, isProcessing: false });
      throw new Error(msg);
    }
  },

  openZaloPayUrl: async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (err: any) {
      console.warn('[WebBrowser] Failed to open ZaloPay URL:', err);
    }
  },

  checkPaymentStatus: async (appTransId: string) => {
    set({ isProcessing: true, error: null });
    try {
      const statusRes = await paymentService.checkStatus(appTransId);
      set({ statusResult: statusRes, isProcessing: false });
      return statusRes;
    } catch (err: any) {
      const msg = err.message || 'Lỗi kiểm tra trạng thái ZaloPay';
      set({ error: msg, isProcessing: false });
      throw new Error(msg);
    }
  },

  resetPaymentState: () =>
    set({
      isProcessing: false,
      paymentResponse: null,
      statusResult: null,
      error: null,
    }),
}));

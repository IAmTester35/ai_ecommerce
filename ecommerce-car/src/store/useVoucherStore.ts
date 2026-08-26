import { create } from 'zustand';
import { voucherService } from '../services/voucherService';
import { Voucher } from '../types';

interface VoucherState {
  vouchers: Voucher[];
  appliedVoucher: Voucher | null;
  discountAmount: number;
  isLoading: boolean;
  error: string | null;

  fetchVouchers: () => Promise<Voucher[]>;
  applyVoucherByCode: (code: string, totalAmount: number) => Promise<{ success: boolean; message?: string }>;
  applyVoucherDirectly: (voucher: Voucher, totalAmount: number) => { success: boolean; message?: string };
  removeVoucher: () => void;
  recalculateDiscount: (totalAmount: number) => void;
}

export const useVoucherStore = create<VoucherState>((set, get) => ({
  vouchers: [],
  appliedVoucher: null,
  discountAmount: 0,
  isLoading: false,
  error: null,

  fetchVouchers: async () => {
    set({ isLoading: true, error: null });
    try {
      const vouchers = await voucherService.getActiveVouchers();
      set({ vouchers, isLoading: false });
      return vouchers;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách mã ưu đãi', isLoading: false });
      return [];
    }
  },

  applyVoucherByCode: async (code: string, totalAmount: number) => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Vui lòng nhập mã ưu đãi.' };
    }

    set({ isLoading: true, error: null });
    try {
      const voucher = await voucherService.getVoucherByCode(code);
      const validation = voucherService.validateVoucher(voucher, totalAmount);

      if (!validation.isValid || !validation.voucher) {
        set({ isLoading: false });
        return {
          success: false,
          message: validation.errorMessage || 'Mã ưu đãi không hợp lệ.',
        };
      }

      set({
        appliedVoucher: validation.voucher,
        discountAmount: validation.discountAmount,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: `Đã áp dụng mã ưu đãi ${validation.voucher.code}!`,
      };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return { success: false, message: err.message || 'Lỗi kiểm tra mã ưu đãi.' };
    }
  },

  applyVoucherDirectly: (voucher: Voucher, totalAmount: number) => {
    const validation = voucherService.validateVoucher(voucher, totalAmount);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errorMessage || 'Mã ưu đãi không hợp lệ.',
      };
    }

    set({
      appliedVoucher: voucher,
      discountAmount: validation.discountAmount,
      error: null,
    });

    return {
      success: true,
      message: `Đã áp dụng mã ưu đãi ${voucher.code}!`,
    };
  },

  removeVoucher: () => {
    set({ appliedVoucher: null, discountAmount: 0, error: null });
  },

  recalculateDiscount: (totalAmount: number) => {
    const { appliedVoucher } = get();
    if (!appliedVoucher) return;

    const validation = voucherService.validateVoucher(appliedVoucher, totalAmount);
    if (validation.isValid) {
      set({ discountAmount: validation.discountAmount });
    } else {
      // Auto-remove voucher if order total amount falls below threshold
      set({ appliedVoucher: null, discountAmount: 0 });
    }
  },
}));

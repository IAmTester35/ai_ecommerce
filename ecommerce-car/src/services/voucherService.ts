import { supabase } from '../api/supabaseClient';
import { Voucher } from '../types';

export interface VoucherValidationResult {
  isValid: boolean;
  voucher?: Voucher;
  discountAmount: number;
  errorMessage?: string;
}

export const voucherService = {
  getActiveVouchers: async (): Promise<Voucher[]> => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[voucherService] Error fetching vouchers:', error.message);
      return [];
    }

    const now = new Date();
    const validVouchers = (data || []).filter((v: Voucher) => {
      if (v.end_date && new Date(v.end_date) < now) return false;
      if (v.start_date && new Date(v.start_date) > now) return false;
      if (v.usage_limit && v.used_count >= v.usage_limit) return false;
      return true;
    });

    return validVouchers as Voucher[];
  },

  getVoucherByCode: async (code: string): Promise<Voucher | null> => {
    if (!code || !code.trim()) return null;
    const cleanCode = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .ilike('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Voucher;
  },

  validateVoucher: (voucher: Voucher | null, totalAmount: number): VoucherValidationResult => {
    if (!voucher) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: 'Mã ưu đãi không tồn tại hoặc đã hết hiệu lực.',
      };
    }

    if (!voucher.is_active) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: 'Mã ưu đãi hiện đang bị tạm khóa.',
      };
    }

    const now = new Date();
    if (voucher.start_date && new Date(voucher.start_date) > now) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: 'Chương trình ưu đãi này chưa bắt đầu.',
      };
    }

    if (voucher.end_date && new Date(voucher.end_date) < now) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: 'Mã ưu đãi đã hết hạn sử dụng.',
      };
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: 'Mã ưu đãi đã đạt giới hạn lượt sử dụng tối đa.',
      };
    }

    if (voucher.min_order_value && totalAmount < voucher.min_order_value) {
      return {
        isValid: false,
        discountAmount: 0,
        errorMessage: `Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')} đ để áp dụng mã này.`,
      };
    }

    let discount = 0;
    if (voucher.discount_type === 'fixed') {
      discount = voucher.discount_value;
    } else if (voucher.discount_type === 'percentage') {
      discount = Math.round((totalAmount * voucher.discount_value) / 100);
      if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
        discount = voucher.max_discount_amount;
      }
    }

    discount = Math.min(discount, totalAmount);

    return {
      isValid: true,
      voucher,
      discountAmount: discount,
    };
  },
};

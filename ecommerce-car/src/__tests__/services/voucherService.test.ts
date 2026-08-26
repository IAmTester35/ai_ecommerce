import { voucherService } from '../../services/voucherService';
import { supabase } from '../../api/supabaseClient';
import { Voucher } from '../../types';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('VoucherService Suite - Voucher Queries & Validation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockVoucherFixed: Voucher = {
    id: 'v-1',
    code: 'WELCOME10M',
    title: 'Ưu đãi chào mừng',
    discount_type: 'fixed',
    discount_value: 10000000,
    min_order_value: 100000000,
    applies_to: 'deposit',
    usage_limit: 100,
    used_count: 5,
    is_active: true,
  };

  const mockVoucherPercent: Voucher = {
    id: 'v-2',
    code: 'VIP5',
    title: 'VIP 5%',
    discount_type: 'percentage',
    discount_value: 5,
    max_discount_amount: 30000000,
    min_order_value: 500000000,
    applies_to: 'total',
    usage_limit: 100,
    used_count: 10,
    is_active: true,
  };

  it('validateVoucher calculates fixed discount properly', () => {
    const res = voucherService.validateVoucher(mockVoucherFixed, 500000000);
    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(10000000);
  });

  it('validateVoucher enforces min_order_value', () => {
    const res = voucherService.validateVoucher(mockVoucherFixed, 50000000);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('tối thiểu');
  });

  it('validateVoucher calculates percentage discount with max cap', () => {
    // 5% of 1,000,000,000 is 50,000,000 capped at 30,000,000
    const res = voucherService.validateVoucher(mockVoucherPercent, 1000000000);
    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(30000000);
  });

  it('validateVoucher rejects inactive voucher', () => {
    const inactive = { ...mockVoucherFixed, is_active: false };
    const res = voucherService.validateVoucher(inactive, 500000000);
    expect(res.isValid).toBe(false);
  });

  it('validateVoucher rejects exhausted usage limit', () => {
    const exhausted = { ...mockVoucherFixed, used_count: 100, usage_limit: 100 };
    const res = voucherService.validateVoucher(exhausted, 500000000);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('giới hạn lượt sử dụng');
  });
});

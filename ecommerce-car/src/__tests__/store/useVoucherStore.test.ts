import { useVoucherStore } from '../../store/useVoucherStore';
import { voucherService } from '../../services/voucherService';
import { Voucher } from '../../types';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../services/voucherService');

describe('useVoucherStore Suite - Voucher Discounts State Management', () => {
  const mockVouchers: Voucher[] = [
    {
      id: 'v-1',
      code: 'WELCOME10M',
      title: 'Chào mừng',
      discount_type: 'fixed',
      discount_value: 10000000,
      min_order_value: 100000000,
      applies_to: 'deposit',
      usage_limit: 100,
      used_count: 0,
      is_active: true,
    },
  ];

  beforeEach(() => {
    useVoucherStore.setState({
      vouchers: [],
      appliedVoucher: null,
      discountAmount: 0,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchVouchers loads active vouchers', async () => {
    (voucherService.getActiveVouchers as jest.Mock).mockResolvedValueOnce(mockVouchers);

    await useVoucherStore.getState().fetchVouchers();

    const state = useVoucherStore.getState();
    expect(state.vouchers).toEqual(mockVouchers);
  });

  it('applyVoucherByCode applies valid voucher and sets discountAmount', async () => {
    (voucherService.getVoucherByCode as jest.Mock).mockResolvedValueOnce(mockVouchers[0]);
    (voucherService.validateVoucher as jest.Mock).mockReturnValueOnce({
      isValid: true,
      voucher: mockVouchers[0],
      discountAmount: 10000000,
    });

    const res = await useVoucherStore.getState().applyVoucherByCode('WELCOME10M', 500000000);

    expect(res.success).toBe(true);
    const state = useVoucherStore.getState();
    expect(state.appliedVoucher).toEqual(mockVouchers[0]);
    expect(state.discountAmount).toBe(10000000);
  });

  it('removeVoucher resets applied voucher and discountAmount', () => {
    useVoucherStore.setState({
      appliedVoucher: mockVouchers[0],
      discountAmount: 10000000,
    });

    useVoucherStore.getState().removeVoucher();

    const state = useVoucherStore.getState();
    expect(state.appliedVoucher).toBeNull();
    expect(state.discountAmount).toBe(0);
  });
});

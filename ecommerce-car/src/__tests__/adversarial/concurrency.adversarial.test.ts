import { useCartStore } from '../../store/useCartStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { cartService } from '../../services/cartService';
import { paymentService } from '../../services/paymentService';

jest.mock('../../services/cartService', () => ({
  cartService: {
    checkoutCart: jest.fn(),
  },
}));

jest.mock('../../services/paymentService', () => ({
  paymentService: {
    createPayment: jest.fn(),
  },
}));

describe('Adversarial & Concurrency Suite - Race Conditions & Double Submissions', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [{ id: 'item-1', car_id: 'car-1', quantity: 1, user_id: 'u1', created_at: '2024-01-01' }],
      isCheckingOut: false,
      error: null,
      lastCreatedOrderId: null,
    });

    usePaymentStore.setState({
      isProcessing: false,
      paymentResponse: null,
      error: null,
    });

    jest.clearAllMocks();
  });

  it('blocks parallel duplicate checkout requests (debounce / race condition lock)', async () => {
    let resolveCheckout: (val: string) => void;
    const checkoutPromise = new Promise<string>((resolve) => {
      resolveCheckout = resolve;
    });

    (cartService.checkoutCart as jest.Mock).mockReturnValue(checkoutPromise);

    // Trigger 1st checkout
    const firstCallPromise = useCartStore.getState().checkout('u1', 'zalopay');

    // Trigger 2nd concurrent checkout immediately while first is in-flight
    await expect(
      useCartStore.getState().checkout('u1', 'zalopay')
    ).rejects.toThrow('Đang xử lý thanh toán');

    // Resolve first
    resolveCheckout!('ord-001');
    const firstResult = await firstCallPromise;

    expect(firstResult).toBe('ord-001');
    // Ensure cartService.checkoutCart was called EXACTLY ONCE
    expect(cartService.checkoutCart).toHaveBeenCalledTimes(1);
  });

  it('blocks parallel duplicate ZaloPay payment initiation requests', async () => {
    let resolvePayment: (val: any) => void;
    const paymentPromise = new Promise((resolve) => {
      resolvePayment = resolve;
    });

    (paymentService.createPayment as jest.Mock).mockReturnValue(paymentPromise);

    const payload = {
      amount: 1000000,
      email: 'a@test.com',
      address: 'HN',
      name: 'Nguyen',
      phone: '090',
      userid: 'u1',
      items: [],
    };

    const firstCall = usePaymentStore.getState().createZaloPayOrder(payload);

    await expect(
      usePaymentStore.getState().createZaloPayOrder(payload)
    ).rejects.toThrow('Đang khởi tạo giao dịch');

    resolvePayment!({
      return_code: 1,
      return_message: 'Success',
      order_url: 'https://zalopay.vn',
      zp_trans_token: '123',
      app_trans_id: 'trans_1',
    });

    const res = await firstCall;
    expect(res.return_code).toBe(1);
    expect(paymentService.createPayment).toHaveBeenCalledTimes(1);
  });
});

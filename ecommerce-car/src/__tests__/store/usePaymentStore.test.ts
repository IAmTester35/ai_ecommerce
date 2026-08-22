import { usePaymentStore } from '../../store/usePaymentStore';
import { paymentService } from '../../services/paymentService';
import * as WebBrowser from 'expo-web-browser';

jest.mock('../../services/paymentService', () => ({
  paymentService: {
    createPayment: jest.fn(),
    checkStatus: jest.fn(),
  },
}));

describe('usePaymentStore Suite - Payment Processing & WebBrowser Integration', () => {
  beforeEach(() => {
    usePaymentStore.setState({
      isProcessing: false,
      paymentResponse: null,
      statusResult: null,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('createZaloPayOrder initializes payment and updates paymentResponse in state', async () => {
    const mockRes = {
      return_code: 1,
      return_message: 'Success',
      order_url: 'https://zalopay.vn/pay?token=xyz',
      zp_trans_token: 'xyz',
      app_trans_id: 'trans-123',
    };

    (paymentService.createPayment as jest.Mock).mockResolvedValueOnce(mockRes);

    const payload = {
      amount: 100000000,
      email: 'a@test.com',
      address: 'HN',
      name: 'Nguyen',
      phone: '090',
      userid: 'u1',
      items: [],
    };

    const res = await usePaymentStore.getState().createZaloPayOrder(payload);

    expect(res).toEqual(mockRes);
    expect(usePaymentStore.getState().paymentResponse).toEqual(mockRes);
    expect(usePaymentStore.getState().isProcessing).toBe(false);
  });

  it('createZaloPayOrder sets error state on failure', async () => {
    (paymentService.createPayment as jest.Mock).mockRejectedValueOnce(
      new Error('Gateway timeout')
    );

    await expect(
      usePaymentStore.getState().createZaloPayOrder({} as any)
    ).rejects.toThrow('Gateway timeout');

    expect(usePaymentStore.getState().error).toBe('Gateway timeout');
    expect(usePaymentStore.getState().isProcessing).toBe(false);
  });

  it('openZaloPayUrl invokes WebBrowser.openBrowserAsync', async () => {
    await usePaymentStore.getState().openZaloPayUrl('https://zalopay.vn/pay');
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://zalopay.vn/pay');
  });

  it('checkPaymentStatus checks status and stores statusResult', async () => {
    const mockStatus = {
      return_code: 1,
      return_message: 'Thành công',
      amount: 100000000,
    };
    (paymentService.checkStatus as jest.Mock).mockResolvedValueOnce(mockStatus);

    const res = await usePaymentStore.getState().checkPaymentStatus('trans-123');

    expect(paymentService.checkStatus).toHaveBeenCalledWith('trans-123');
    expect(res).toEqual(mockStatus);
    expect(usePaymentStore.getState().statusResult).toEqual(mockStatus);
  });

  it('resetPaymentState clears all payment state', () => {
    usePaymentStore.setState({
      isProcessing: true,
      paymentResponse: { return_code: 1, return_message: 'ok' },
      statusResult: { return_code: 1, return_message: 'ok' },
      error: 'Some error',
    });

    usePaymentStore.getState().resetPaymentState();

    const state = usePaymentStore.getState();
    expect(state.isProcessing).toBe(false);
    expect(state.paymentResponse).toBeNull();
    expect(state.statusResult).toBeNull();
    expect(state.error).toBeNull();
  });
});

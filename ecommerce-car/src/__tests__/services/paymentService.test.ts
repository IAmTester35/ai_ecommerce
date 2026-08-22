import { paymentService } from '../../services/paymentService';
import { PaymentCreateRequest, PaymentCreateResponse, PaymentStatusResponse } from '../../types';

describe('PaymentService Suite - FastAPI ZaloPay Integration', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const paymentReq: PaymentCreateRequest = {
      amount: 150000000,
      email: 'customer@test.com',
      address: '123 Le Loi, Hanoi',
      name: 'Nguyen Van A',
      phone: '0912345678',
      userid: 'u1',
      items: [{ id: 'car-1', name: 'Porsche 911', price: 150000000, itemCount: 1 }],
    };

    it('successfully initiates payment order and returns payment URL', async () => {
      const mockResponse: PaymentCreateResponse = {
        return_code: 1,
        return_message: 'Success',
        order_url: 'https://gateway.zalopay.vn/pay?token=xyz',
        zp_trans_token: 'xyz-token',
        app_trans_id: '240101_12345',
      };

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const res = await paymentService.createPayment(paymentReq);
      expect(res.return_code).toBe(1);
      expect(res.order_url).toBe('https://gateway.zalopay.vn/pay?token=xyz');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment/create'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentReq),
        })
      );
    });

    it('throws error when gateway response is not ok', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ detail: 'Khởi tạo thanh toán thất bại' }),
      });

      await expect(paymentService.createPayment(paymentReq)).rejects.toThrow(
        'Khởi tạo thanh toán thất bại'
      );
    });
  });

  describe('checkStatus', () => {
    it('queries and returns payment transaction status from gateway', async () => {
      const mockStatus: PaymentStatusResponse = {
        return_code: 1,
        return_message: 'Giao dịch thành công',
        amount: 150000000,
        zp_trans_id: '123456789',
      };

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockStatus),
      });

      const res = await paymentService.checkStatus('240101_12345');
      expect(res.return_code).toBe(1);
      expect(res.return_message).toBe('Giao dịch thành công');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment/status'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_trans_id: '240101_12345' }),
        })
      );
    });

    it('throws error when status query endpoint fails', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: 'Kiểm tra trạng thái thanh toán thất bại' }),
      });

      await expect(paymentService.checkStatus('bad-id')).rejects.toThrow(
        'Kiểm tra trạng thái thanh toán thất bại'
      );
    });
  });
});

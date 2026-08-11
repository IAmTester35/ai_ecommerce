import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentStatusRequest,
  PaymentStatusResponse,
} from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const paymentService = {
  createPayment: async (payload: PaymentCreateRequest): Promise<PaymentCreateResponse> => {
    const response = await fetch(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Khởi tạo thanh toán thất bại');
    }

    const data: PaymentCreateResponse = await response.json();
    return data;
  },

  checkStatus: async (appTransId: string): Promise<PaymentStatusResponse> => {
    const payload: PaymentStatusRequest = { app_trans_id: appTransId };
    const response = await fetch(`${BASE_URL}/api/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Kiểm tra trạng thái thanh toán thất bại');
    }

    const data: PaymentStatusResponse = await response.json();
    return data;
  },
};

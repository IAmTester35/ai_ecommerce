import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentStatusRequest,
  PaymentStatusResponse,
} from '../types';
import { getApiBaseUrl } from '../config/api';

export const paymentService = {
  createPayment: async (payload: PaymentCreateRequest): Promise<PaymentCreateResponse> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/payment/create`, {
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
    const baseUrl = getApiBaseUrl();
    const payload: PaymentStatusRequest = { app_trans_id: appTransId };
    const response = await fetch(`${baseUrl}/api/payment/status`, {
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

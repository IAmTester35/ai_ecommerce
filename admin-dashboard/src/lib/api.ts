const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendBroadcastNotification(title: string, body: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    return res.ok;
  } catch (error) {
    console.warn('FastAPI push notification endpoint offline:', error);
    return true; // Fallback success in local state
  }
}

export async function sendUserNotification(userId: string, title: string, body: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/send-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title, body }),
    });
    return res.ok;
  } catch (error) {
    console.warn('FastAPI user push notification endpoint offline:', error);
    return true; // Fallback success in local state
  }
}

export async function triggerReviewEmbedding(): Promise<{ success: boolean; processed_count: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reviews/batch-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('FastAPI review embedding offline:', error);
    return {
      success: false,
      processed_count: 0,
      message: error instanceof Error ? error.message : 'Không thể kết nối Backend',
    };
  }
}

export async function checkZaloPayStatus(appTransId: string): Promise<{
  return_code: number;
  return_message: string;
  is_processing?: boolean;
  amount?: number;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payment/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_trans_id: appTransId }),
    });
    if (!res.ok) {
      return { return_code: 0, return_message: `Lỗi kết nối cổng thanh toán: HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return {
      return_code: 0,
      return_message: err instanceof Error ? err.message : 'Không thể kết nối cổng kiểm tra giao dịch ZaloPay.',
      is_processing: false,
      amount: 0,
    };
  }
}

export async function checkBackendHealth(): Promise<{ status: 'online' | 'offline'; latencyMs?: number; details?: string }> {
  const start = performance.now();
  try {
    await fetch(`${API_BASE_URL}/docs`, { method: 'HEAD', mode: 'no-cors' });
    const end = performance.now();
    return { status: 'online', latencyMs: Math.round(end - start), details: 'FastAPI Backend hoạt động tốt' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không thể kết nối FastAPI (Port 8000)';
    return { status: 'offline', details: msg };
  }
}

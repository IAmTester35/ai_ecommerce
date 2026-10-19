import { Order, OrderStatus } from '../types';

export const ORDER_EXPIRATION_MINUTES = 15;

/**
 * Checks if an unpaid order has exceeded the 15-minute ZaloPay payment window.
 */
export const isOrderExpired = (order?: Order | null): boolean => {
  if (!order) return false;
  // If already paid, it is completed/valid
  if (order.deposit_status === 'paid' || order.payment_status === 'paid') {
    return false;
  }
  // If already explicitly cancelled
  if (order.status === 'cancelled') {
    return true;
  }
  // If status is not pending and deposit not unpaid, not expired pending
  if (order.status !== 'pending' && order.deposit_status !== 'unpaid') {
    return false;
  }
  if (!order.created_at) return false;

  const createdAt = new Date(order.created_at).getTime();
  if (isNaN(createdAt)) return false;

  const now = Date.now();
  const diffMinutes = (now - createdAt) / (1000 * 60);

  return diffMinutes > ORDER_EXPIRATION_MINUTES;
};

/**
 * Returns remaining seconds until 15-minute expiration, or 0 if expired.
 */
export const getRemainingPaymentSeconds = (order?: Order | null): number => {
  if (!order || !order.created_at) return 0;
  if (order.deposit_status === 'paid' || order.payment_status === 'paid') return 0;
  if (order.status !== 'pending') return 0;

  const createdAt = new Date(order.created_at).getTime();
  if (isNaN(createdAt)) return 0;

  const expireAt = createdAt + ORDER_EXPIRATION_MINUTES * 60 * 1000;
  const remainingMs = expireAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Formats seconds into mm:ss string
 */
export const formatCountdown = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

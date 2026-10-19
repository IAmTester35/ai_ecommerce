import { isOrderExpired, getRemainingPaymentSeconds, formatCountdown, ORDER_EXPIRATION_MINUTES } from '../../utils/orderUtils';
import { Order } from '../../types';

describe('orderUtils Suite - 15-Minute Expiration Logic', () => {
  const baseOrder: Order = {
    id: 'ord-123',
    user_id: 'usr-1',
    total_amount: 900000000,
    deposit_amount: 90000000,
    remaining_amount: 810000000,
    discount_amount: 0,
    status: 'pending',
    payment_status: 'unpaid',
    deposit_status: 'unpaid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('marks order as NOT expired when created 5 minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const order = { ...baseOrder, created_at: fiveMinutesAgo };

    expect(isOrderExpired(order)).toBe(false);
    expect(getRemainingPaymentSeconds(order)).toBeGreaterThan(0);
    expect(getRemainingPaymentSeconds(order)).toBeLessThanOrEqual(10 * 60);
  });

  it('marks order as expired when created 16 minutes ago', () => {
    const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    const order = { ...baseOrder, created_at: sixteenMinutesAgo };

    expect(isOrderExpired(order)).toBe(true);
    expect(getRemainingPaymentSeconds(order)).toBe(0);
  });

  it('does NOT mark order as expired if deposit is already paid', () => {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const order: Order = {
      ...baseOrder,
      deposit_status: 'paid',
      status: 'deposit_paid',
      created_at: twentyMinutesAgo,
    };

    expect(isOrderExpired(order)).toBe(false);
    expect(getRemainingPaymentSeconds(order)).toBe(0);
  });

  it('marks order as expired if explicitly cancelled', () => {
    const order: Order = {
      ...baseOrder,
      status: 'cancelled',
    };
    expect(isOrderExpired(order)).toBe(true);
  });

  it('formats countdown seconds properly (mm:ss)', () => {
    expect(formatCountdown(900)).toBe('15:00');
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(9)).toBe('00:09');
    expect(formatCountdown(0)).toBe('00:00');
  });
});

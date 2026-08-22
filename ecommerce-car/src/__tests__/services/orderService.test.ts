import { orderService } from '../../services/orderService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('OrderService Suite - Order Tracking & Detail Querying', () => {
  const sampleOrder = {
    id: 'ord-1',
    user_id: 'u1',
    total_amount: 2500000000,
    status: 'pending',
    payment_status: 'unpaid',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order_items: [
      {
        id: 'oi-1',
        order_id: 'ord-1',
        car_id: 'car-1',
        price: 2500000000,
        quantity: 1,
        car: { make: 'Porsche', model: 'Taycan' },
      },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('fetches list of orders for a user ordered by created_at desc', async () => {
      const mockQuery: any = {
        eq: jest.fn().mockResolvedValueOnce({ data: [sampleOrder], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce(mockQuery),
        }),
      });

      const orders = await orderService.getOrders('u1');
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('ord-1');
      expect(orders[0].order_items).toHaveLength(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('returns empty array if database query fails gracefully', async () => {
      const mockQuery: any = {
        eq: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Query error') }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce(mockQuery),
        }),
      });

      const orders = await orderService.getOrders('u1');
      expect(orders).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    it('returns null immediately when orderId is empty', async () => {
      const res = await orderService.getOrderById('');
      expect(res).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches single order by order ID with maybeSingle', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: sampleOrder, error: null }),
          }),
        }),
      });

      const order = await orderService.getOrderById('ord-1');
      expect(order).toEqual(sampleOrder);
    });

    it('returns null when query encounters error or order not found', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      const order = await orderService.getOrderById('invalid-order');
      expect(order).toBeNull();
    });
  });
});

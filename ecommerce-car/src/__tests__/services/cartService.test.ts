import { cartService, formatCartError } from '../../services/cartService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../../services/authService', () => ({
  authService: {
    ensureProfile: jest.fn().mockResolvedValue({ id: 'u1' }),
  },
}));

describe('CartService Suite - Cart Operations & Checkout RPC', () => {
  const mockUser = { id: 'u1', email: 'test@example.com' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatCartError', () => {
    it('translates out-of-stock messages to user-friendly Vietnamese', () => {
      expect(formatCartError('out of stock')).toContain('hết hàng');
      expect(formatCartError('not enough stock')).toContain('hết hàng');
      expect(formatCartError('violates foreign key constraint cart_items_user_id_fkey')).toContain('chưa hoàn tất');
      expect(formatCartError('random database error')).toBe('random database error');
      expect(formatCartError(null)).toBe('Đã xảy ra lỗi không xác định.');
    });
  });

  describe('getCartItems', () => {
    it('returns empty array when user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });
      const items = await cartService.getCartItems();
      expect(items).toEqual([]);
    });

    it('fetches cart items for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });
      const mockItems = [{ id: 'cart-1', user_id: 'u1', car_id: 'car-1', quantity: 1 }];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: mockItems, error: null }),
          }),
        }),
      });

      const items = await cartService.getCartItems();
      expect(items).toEqual(mockItems);
    });
  });

  describe('addToCart', () => {
    it('throws error when user is not logged in and no userId passed', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });

      await expect(cartService.addToCart(undefined, 'car-1', 1)).rejects.toThrow(
        'Vui lòng đăng nhập để thêm xe vào danh sách đặt cọc.'
      );
    });

    it('upserts item into cart_items table', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });
      const createdItem = { id: 'c-1', user_id: 'u1', car_id: 'car-1', quantity: 2 };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        upsert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: createdItem, error: null }),
          }),
        }),
      });

      const res = await cartService.addToCart('u1', 'car-1', 2);
      expect(res).toEqual(createdItem);
    });
  });

  describe('updateCartQuantity & removeFromCart & clearCart', () => {
    it('updates quantity in database', async () => {
      const updated = { id: 'c-1', quantity: 3 };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: updated, error: null }),
            }),
          }),
        }),
      });

      const res = await cartService.updateCartQuantity('c-1', 3);
      expect(res.quantity).toBe(3);
    });

    it('removeFromCart deletes item by cart ID', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ error: null }),
        }),
      });

      await expect(cartService.removeFromCart('c-1')).resolves.toBeUndefined();
    });

    it('clearCart removes all items for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ error: null }),
        }),
      });

      await expect(cartService.clearCart()).resolves.toBeUndefined();
    });
  });

  describe('checkoutCart', () => {
    it('executes atomic checkout via database RPC procedure with showroom, voucher, deposit rate', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 'order-12345',
        error: null,
      });

      const orderId = await cartService.checkoutCart('zalopay', 'sr-1', 'WELCOME10M', 0.10);
      expect(supabase.rpc).toHaveBeenCalledWith('checkout_cart', {
        p_user_id: 'u1',
        p_payment_method: 'zalopay',
        p_showroom_id: 'sr-1',
        p_voucher_code: 'WELCOME10M',
        p_deposit_rate: 0.10,
      });
      expect(orderId).toBe('order-12345');
    });

    it('throws formatted error if checkout RPC fails', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: new Error('out of stock'),
      });

      await expect(cartService.checkoutCart('zalopay')).rejects.toThrow('hết hàng');
    });
  });
});

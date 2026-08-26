import { useCartStore } from '../../store/useCartStore';
import { cartService } from '../../services/cartService';

jest.mock('../../services/cartService', () => ({
  cartService: {
    getCartItems: jest.fn(),
    addToCart: jest.fn(),
    updateCartQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    checkoutCart: jest.fn(),
  },
}));

describe('useCartStore Suite - Shopping Cart State & Calculations', () => {
  const sampleItem = {
    id: 'ci-1',
    user_id: 'u1',
    car_id: 'car-1',
    quantity: 2,
    created_at: '2024-01-01',
    car: {
      id: 'car-1',
      make: 'Porsche',
      model: 'Taycan',
      year: 2024,
      price: 100000,
      stock_quantity: 5,
      is_active: true,
      created_at: '2024-01-01',
    },
  };

  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isLoading: false,
      isCheckingOut: false,
      error: null,
      lastCreatedOrderId: null,
    });
    jest.clearAllMocks();
  });

  it('fetchCart loads items into store', async () => {
    (cartService.getCartItems as jest.Mock).mockResolvedValueOnce([sampleItem]);

    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState().items).toEqual([sampleItem]);
  });

  it('addToCart adds new item when not present', async () => {
    (cartService.addToCart as jest.Mock).mockResolvedValueOnce(sampleItem);

    await useCartStore.getState().addToCart('u1', 'car-1', 2);
    expect(useCartStore.getState().items).toEqual([sampleItem]);
  });

  it('addToCart updates existing item when already present', async () => {
    useCartStore.setState({ items: [sampleItem] });
    const updated = { ...sampleItem, quantity: 3 };
    (cartService.addToCart as jest.Mock).mockResolvedValueOnce(updated);

    await useCartStore.getState().addToCart('u1', 'car-1', 1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('updateQuantity delegates to removeFromCart if quantity <= 0', async () => {
    useCartStore.setState({ items: [sampleItem] });
    (cartService.removeFromCart as jest.Mock).mockResolvedValueOnce(undefined);

    await useCartStore.getState().updateQuantity('ci-1', 0);
    expect(cartService.removeFromCart).toHaveBeenCalledWith('ci-1');
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('updateQuantity updates item quantity in state when positive', async () => {
    useCartStore.setState({ items: [sampleItem] });
    const updated = { ...sampleItem, quantity: 5 };
    (cartService.updateCartQuantity as jest.Mock).mockResolvedValueOnce(updated);

    await useCartStore.getState().updateQuantity('ci-1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('removeFromCart removes item from cart state', async () => {
    useCartStore.setState({ items: [sampleItem] });
    (cartService.removeFromCart as jest.Mock).mockResolvedValueOnce(undefined);

    await useCartStore.getState().removeFromCart('ci-1');
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('checkout creates order, clears items, and sets lastCreatedOrderId', async () => {
    useCartStore.setState({ items: [sampleItem] });
    (cartService.checkoutCart as jest.Mock).mockResolvedValueOnce('ord-999');

    const orderId = await useCartStore.getState().checkout('u1', 'zalopay', 'sr-1', 'WELCOME10M', 0.10);

    expect(cartService.checkoutCart).toHaveBeenCalledWith('zalopay', 'sr-1', 'WELCOME10M', 0.10);
    expect(orderId).toBe('ord-999');
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().lastCreatedOrderId).toBe('ord-999');
  });

  it('getTotalPrice calculates sum of item price * quantity', () => {
    useCartStore.setState({
      items: [
        sampleItem, // 100000 * 2 = 200000
        {
          id: 'ci-2',
          user_id: 'u1',
          car_id: 'car-2',
          quantity: 1,
          created_at: '2024-01-01',
          car: { id: 'car-2', price: 50000 } as any,
        },
      ],
    });

    expect(useCartStore.getState().getTotalPrice()).toBe(250000);
  });

  it('getItemCount calculates total count of all car quantities in cart', () => {
    useCartStore.setState({
      items: [
        sampleItem, // quantity 2
        { id: 'ci-2', quantity: 3 } as any,
      ],
    });

    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it('clearCartState resets items and error', () => {
    useCartStore.setState({
      items: [sampleItem],
      error: 'Error',
      lastCreatedOrderId: '123',
    });

    useCartStore.getState().clearCartState();
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().error).toBeNull();
    expect(useCartStore.getState().lastCreatedOrderId).toBeNull();
  });
});

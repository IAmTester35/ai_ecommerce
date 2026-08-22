import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/orderService';

jest.mock('../../services/orderService', () => ({
  orderService: {
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
  },
}));

describe('useOrderStore Suite - Order List & Details State', () => {
  const sampleOrder = {
    id: 'ord-100',
    user_id: 'u1',
    total_amount: 3000000000,
    status: 'processing' as const,
    payment_status: 'paid' as const,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    useOrderStore.setState({
      orders: [],
      selectedOrder: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchOrders populates orders list', async () => {
    (orderService.getOrders as jest.Mock).mockResolvedValueOnce([sampleOrder]);

    await useOrderStore.getState().fetchOrders('u1');

    expect(useOrderStore.getState().orders).toEqual([sampleOrder]);
    expect(useOrderStore.getState().isLoading).toBe(false);
  });

  it('fetchOrderDetails populates selectedOrder', async () => {
    (orderService.getOrderById as jest.Mock).mockResolvedValueOnce(sampleOrder);

    await useOrderStore.getState().fetchOrderDetails('ord-100');

    expect(useOrderStore.getState().selectedOrder).toEqual(sampleOrder);
  });

  it('clearSelectedOrder resets selectedOrder to null', () => {
    useOrderStore.setState({ selectedOrder: sampleOrder });
    useOrderStore.getState().clearSelectedOrder();
    expect(useOrderStore.getState().selectedOrder).toBeNull();
  });
});

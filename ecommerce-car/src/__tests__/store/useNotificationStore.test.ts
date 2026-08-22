import { useNotificationStore } from '../../store/useNotificationStore';
import { notificationService } from '../../services/notificationService';

jest.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));

describe('useNotificationStore Suite - Notifications State Management', () => {
  const notif1 = { id: 'n1', title: 'T1', content: 'C1', is_read: false, user_id: 'u1', created_at: '2024-01-01' };
  const notif2 = { id: 'n2', title: 'T2', content: 'C2', is_read: true, user_id: 'u1', created_at: '2024-01-01' };

  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchNotifications populates notifications', async () => {
    (notificationService.getNotifications as jest.Mock).mockResolvedValueOnce([notif1, notif2]);

    await useNotificationStore.getState().fetchNotifications('u1');

    expect(useNotificationStore.getState().notifications).toEqual([notif1, notif2]);
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('markAsRead updates specific notification is_read to true', async () => {
    useNotificationStore.setState({ notifications: [notif1, notif2] });
    (notificationService.markAsRead as jest.Mock).mockResolvedValueOnce(undefined);

    await useNotificationStore.getState().markAsRead('n1');

    const updated = useNotificationStore.getState().notifications.find((n) => n.id === 'n1');
    expect(updated?.is_read).toBe(true);
  });

  it('markAllAsRead updates all notifications is_read to true', async () => {
    useNotificationStore.setState({ notifications: [notif1, notif2] });
    (notificationService.markAllAsRead as jest.Mock).mockResolvedValueOnce(undefined);

    await useNotificationStore.getState().markAllAsRead('u1');

    expect(useNotificationStore.getState().notifications.every((n) => n.is_read)).toBe(true);
  });

  it('getUnreadCount returns correct count of unread items', () => {
    useNotificationStore.setState({ notifications: [notif1, notif2] });
    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
  });
});

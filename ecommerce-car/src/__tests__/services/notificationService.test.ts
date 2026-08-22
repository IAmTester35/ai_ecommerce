import { notificationService } from '../../services/notificationService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('NotificationService Suite - Push & In-App Notification Center', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches notifications for given user or system-wide', async () => {
      const mockNotifs = [
        { id: 'notif-1', title: 'Đặt cọc thành công', content: 'Đơn #123 đã được xác nhận', is_read: false },
      ];
      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: mockNotifs, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await notificationService.getNotifications();
      expect(res).toEqual(mockNotifs);
    });

    it('returns empty array when error occurs gracefully', async () => {
      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Error') }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await notificationService.getNotifications();
      expect(res).toEqual([]);
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('markAsRead updates is_read to true for specific notification ID', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ error: null }),
        }),
      });

      await expect(notificationService.markAsRead('notif-1')).resolves.toBeUndefined();
    });

    it('markAllAsRead updates all unread notifications to read', async () => {
      const mockQuery: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ error: null }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      await expect(notificationService.markAllAsRead('u1')).resolves.toBeUndefined();
    });
  });
});

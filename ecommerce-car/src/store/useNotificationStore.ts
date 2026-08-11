import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationService.getNotifications();
      set({ notifications: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải thông báo', isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const updated = await notificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === notificationId ? updated : n)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật trạng thái thông báo' });
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.is_read).length;
  },
}));

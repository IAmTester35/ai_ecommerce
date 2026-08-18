import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (userId?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId?: string) => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationService.getNotifications(userId);
      set({ notifications: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải thông báo', isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật trạng thái thông báo' });
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await notificationService.markAllAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đánh dấu tất cả đã đọc' });
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.is_read).length;
  },
}));

import { supabase } from '../api/supabaseClient';
import { NotificationItem, BroadcastNotificationRequest, UserNotificationRequest } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as NotificationItem[];
  },

  markAsRead: async (notificationId: string): Promise<NotificationItem> => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationItem;
  },

  sendBroadcastNotification: async (payload: BroadcastNotificationRequest): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Gửi thông báo thất bại');
    }
    return await response.json();
  },

  sendUserNotification: async (payload: UserNotificationRequest): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/notifications/send-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Gửi thông báo cá nhân thất bại');
    }
    return await response.json();
  },
};

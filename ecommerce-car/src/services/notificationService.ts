import { supabase } from '../api/supabaseClient';
import { NotificationItem } from '../types';

export const notificationService = {
  getNotifications: async (userId?: string): Promise<NotificationItem[]> => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[notificationService] Error fetching notifications:', error.message);
      return [];
    }
    return (data || []) as NotificationItem[];
  },

  markAsRead: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('[notificationService] Error marking notification read:', error.message);
    }
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) {
      console.error('[notificationService] Error marking all notifications read:', error.message);
    }
  },
};

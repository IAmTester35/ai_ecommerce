import { supabase } from '../api/supabaseClient';
import { NotificationItem } from '../types';

export const notificationService = {
  getNotifications: async (userId: string): Promise<NotificationItem[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as NotificationItem[];
  },

  markAsRead: async (notificationId: string, userId: string): Promise<NotificationItem> => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationItem;
  },
};

import { supabase } from '../api/supabaseClient';
import { NotificationItem } from '../types';

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
};

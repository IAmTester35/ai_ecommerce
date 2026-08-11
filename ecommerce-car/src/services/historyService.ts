import { supabase } from '../api/supabaseClient';
import { ChatSessionMessage, SearchHistoryItem, ViewedCar } from '../types';

export const historyService = {
  logViewedCar: async (userId: string | undefined, carId: string): Promise<ViewedCar> => {
    const record: Record<string, any> = { car_id: carId };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('viewed_cars')
      .insert([record])
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as ViewedCar;
  },

  getRecentlyViewed: async (userId?: string, limit = 10): Promise<ViewedCar[]> => {
    let query = supabase
      .from('viewed_cars')
      .select('*, car:cars(*)')
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ViewedCar[];
  },

  saveSearchQuery: async (userId: string | undefined, queryText: string): Promise<SearchHistoryItem> => {
    const record: Record<string, any> = { query_text: queryText };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('search_history')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data as SearchHistoryItem;
  },

  getSearchHistory: async (userId?: string, limit = 10): Promise<SearchHistoryItem[]> => {
    let query = supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SearchHistoryItem[];
  },

  getChatHistory: async (sessionId: string): Promise<ChatSessionMessage[]> => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ChatSessionMessage[];
  },
};

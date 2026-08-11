import { supabase } from '../api/supabaseClient';
import { ChatSessionMessage, SearchHistoryItem, ViewedCar } from '../types';

export const historyService = {
  logViewedCar: async (userId: string, carId: string): Promise<ViewedCar> => {
    const { data, error } = await supabase
      .from('viewed_cars')
      .insert([{ user_id: userId, car_id: carId }])
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as ViewedCar;
  },

  getRecentlyViewed: async (userId: string, limit = 10): Promise<ViewedCar[]> => {
    const { data, error } = await supabase
      .from('viewed_cars')
      .select('*, car:cars(*)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ViewedCar[];
  },

  saveSearchQuery: async (userId: string, queryText: string): Promise<SearchHistoryItem> => {
    const { data, error } = await supabase
      .from('search_history')
      .insert([{ user_id: userId, query_text: queryText }])
      .select()
      .single();

    if (error) throw error;
    return data as SearchHistoryItem;
  },

  getSearchHistory: async (userId: string, limit = 10): Promise<SearchHistoryItem[]> => {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

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

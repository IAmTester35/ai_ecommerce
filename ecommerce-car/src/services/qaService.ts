import { supabase } from '../api/supabaseClient';
import { CarQA } from '../types';

export const qaService = {
  getCarQA: async (carId: string): Promise<CarQA[]> => {
    const { data, error } = await supabase
      .from('car_qa')
      .select('*, profiles(full_name, avatar_url)')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[qaService] Error fetching car QA:', error.message);
      return [];
    }
    return (data || []) as CarQA[];
  },

  askQuestion: async (
    carId: string,
    userId: string | undefined,
    question: string
  ): Promise<CarQA> => {
    const record: Record<string, any> = {
      car_id: carId,
      question,
    };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('car_qa')
      .insert([record])
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (error) {
      console.error('[qaService] Error asking question:', error.message);
      throw error;
    }
    return data as CarQA;
  },
};

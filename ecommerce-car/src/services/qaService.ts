import { supabase } from '../api/supabaseClient';
import { CarQA } from '../types';

export const qaService = {
  getCarQA: async (carId: string): Promise<CarQA[]> => {
    const { data, error } = await supabase
      .from('car_qa')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CarQA[];
  },

  askQuestion: async (carId: string, userId: string, question: string): Promise<CarQA> => {
    const { data, error } = await supabase
      .from('car_qa')
      .insert([
        {
          car_id: carId,
          user_id: userId,
          question,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as CarQA;
  },
};

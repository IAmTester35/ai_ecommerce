import { supabase } from '../api/supabaseClient';
import { Showroom } from '../types';

export const showroomService = {
  getShowrooms: async (): Promise<Showroom[]> => {
    const { data, error } = await supabase
      .from('showrooms')
      .select('*')
      .eq('is_active', true)
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[showroomService] Error fetching showrooms:', error.message);
      return [];
    }
    return (data || []) as Showroom[];
  },

  getShowroomById: async (id: string): Promise<Showroom | null> => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('showrooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[showroomService] Error fetching showroom by ID:', error.message);
      return null;
    }
    return data as Showroom | null;
  },
};

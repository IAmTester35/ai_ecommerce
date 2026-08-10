import { supabase } from '../api/supabaseClient';

export const carService = {
  getTopCars: async (limit = 20) => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data;
  },

  getSavedCars: async () => {
    const { data, error } = await supabase
      .from('saved_cars')
      .select('*, cars(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  saveCar: async (carId: string) => {
    const { data, error } = await supabase
      .from('saved_cars')
      .insert([{ car_id: carId }]);

    if (error) throw error;
    return data;
  },
};

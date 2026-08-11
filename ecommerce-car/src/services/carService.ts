import { supabase } from '../api/supabaseClient';
import { Car, CarFilterParams, SavedCar } from '../types';

export const carService = {
  getTopCars: async (limit = 20): Promise<Car[]> => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Car[];
  },

  getCarById: async (carId: string): Promise<Car | null> => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) throw error;
    return data as Car;
  },

  getCarsWithFilter: async (params: CarFilterParams): Promise<Car[]> => {
    let query = supabase.from('cars').select('*').eq('is_active', true);

    if (params.make) {
      query = query.ilike('make', `%${params.make}%`);
    }
    if (params.maxPrice) {
      query = query.lte('price', params.maxPrice);
    }
    if (params.targetYear) {
      query = query.gte('year', params.targetYear);
    }
    if (params.minHp) {
      query = query.gte('engine_hp', params.minHp);
    }
    if (params.fuelType) {
      query = query.ilike('metadata->>engine_fuel_type', `%${params.fuelType}%`);
    }

    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data as Car[];
  },

  getSavedCars: async (userId: string): Promise<SavedCar[]> => {
    const { data, error } = await supabase
      .from('saved_cars')
      .select('*, car:cars(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavedCar[];
  },

  saveCar: async (carId: string, userId: string): Promise<SavedCar> => {
    const { data, error } = await supabase
      .from('saved_cars')
      .insert([{ user_id: userId, car_id: carId }])
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as SavedCar;
  },

  unsaveCar: async (carId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('saved_cars')
      .delete()
      .eq('user_id', userId)
      .eq('car_id', carId);

    if (error) throw error;
  },

  matchCars: async (
    queryEmbedding: number[],
    matchThreshold = 0.3,
    matchCount = 5,
    filters?: CarFilterParams
  ) => {
    const { data, error } = await supabase.rpc('match_cars', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_make: filters?.make || null,
      filter_max_price: filters?.maxPrice || null,
      filter_target_year: filters?.targetYear || null,
      filter_min_hp: filters?.minHp || null,
      filter_fuel_type: filters?.fuelType || null,
    });

    if (error) throw error;
    return data;
  },
};

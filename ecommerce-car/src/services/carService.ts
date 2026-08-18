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

    if (error) {
      console.error('[carService] Error fetching top cars:', error.message);
      throw error;
    }
    return (data || []) as Car[];
  },

  getCarById: async (carId: string): Promise<Car | null> => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) {
      console.error('[carService] Error fetching car details:', error.message);
      return null;
    }
    return data as Car;
  },

  getCarsWithFilter: async (params: CarFilterParams): Promise<Car[]> => {
    let query = supabase.from('cars').select('*').eq('is_active', true);

    if (params.query) {
      query = query.or(`make.ilike.%${params.query}%,model.ilike.%${params.query}%`);
    }
    if (params.make && params.make !== 'all') {
      query = query.ilike('make', `%${params.make}%`);
    }
    if (params.minPrice) {
      query = query.gte('price', params.minPrice);
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
    if (params.fuelType && params.fuelType !== 'all') {
      query = query.ilike('metadata->>fuel_type', `%${params.fuelType}%`);
    }
    if (params.bodyType && params.bodyType !== 'all') {
      query = query.ilike('metadata->>body_type', `%${params.bodyType}%`);
    }

    if (params.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (params.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (params.sortBy === 'hp_desc') {
      query = query.order('engine_hp', { ascending: false });
    } else if (params.sortBy === 'year_desc') {
      query = query.order('year', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error('[carService] Error filtering cars:', error.message);
      throw error;
    }
    return (data || []) as Car[];
  },

  getSavedCars: async (userId?: string): Promise<SavedCar[]> => {
    let query = supabase
      .from('saved_cars')
      .select('*, car:cars(*)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[carService] Error fetching saved cars:', error.message);
      return [];
    }
    return (data || []) as SavedCar[];
  },

  saveCar: async (carId: string, userId?: string): Promise<SavedCar> => {
    const record: Record<string, any> = { car_id: carId };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('saved_cars')
      .insert([record])
      .select('*, car:cars(*)')
      .single();

    if (error) {
      console.error('[carService] Error saving car:', error.message);
      throw error;
    }
    return data as SavedCar;
  },

  unsaveCar: async (carId: string, userId?: string): Promise<void> => {
    let query = supabase.from('saved_cars').delete().eq('car_id', carId);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('[carService] Error unsaving car:', error.message);
    }
  },
};

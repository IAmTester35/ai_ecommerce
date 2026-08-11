import { supabase } from '../api/supabaseClient';
import { Review } from '../types';

export const reviewService = {
  getCarReviews: async (carId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles:profiles(*)')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  addReview: async (
    carId: string,
    userId: string | undefined,
    rating: number,
    comment: string
  ): Promise<Review> => {
    const record: Record<string, any> = {
      car_id: carId,
      rating,
      comment,
      source: 'user',
    };
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([record])
      .select('*, profiles:profiles(*)')
      .single();

    if (error) throw error;
    return data as Review;
  },
};

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
    userId: string,
    rating: number,
    comment: string
  ): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          car_id: carId,
          user_id: userId,
          rating,
          comment,
          source: 'user',
        },
      ])
      .select('*, profiles:profiles(*)')
      .single();

    if (error) throw error;
    return data as Review;
  },
};

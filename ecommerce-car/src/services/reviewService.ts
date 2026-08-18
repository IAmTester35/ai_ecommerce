import { supabase } from '../api/supabaseClient';
import { Review } from '../types';

export const reviewService = {
  getCarReviews: async (carId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[reviewService] Error fetching car reviews:', error.message);
      return [];
    }
    return (data || []) as Review[];
  },

  addReview: async (
    carId: string,
    userId: string | undefined,
    rating: number,
    comment: string,
    authorName?: string
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
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (error) {
      console.error('[reviewService] Error adding review:', error.message);
      throw error;
    }
    return data as Review;
  },
};

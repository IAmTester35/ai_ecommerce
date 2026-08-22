import { reviewService } from '../../services/reviewService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ReviewService Suite - Vehicle Reviews Management', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCarReviews', () => {
    it('fetches reviews for car sorted by created_at desc', async () => {
      const mockReviews = [
        { id: 'r1', car_id: 'car-1', rating: 5, comment: 'Great car!', profiles: { full_name: 'Bob' } },
      ];
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: mockReviews, error: null }),
          }),
        }),
      });

      const res = await reviewService.getCarReviews('car-1');
      expect(res).toEqual(mockReviews);
    });

    it('returns empty array when error occurs gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('DB Error') }),
          }),
        }),
      });

      const res = await reviewService.getCarReviews('car-1');
      expect(res).toEqual([]);
    });
  });

  describe('addReview', () => {
    it('inserts a review and returns the created record', async () => {
      const createdReview = { id: 'r2', car_id: 'car-1', user_id: 'u1', rating: 5, comment: 'Awesome ride' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: createdReview, error: null }),
          }),
        }),
      });

      const res = await reviewService.addReview('car-1', 'u1', 5, 'Awesome ride');
      expect(res).toEqual(createdReview);
    });

    it('throws when insertion fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      });

      await expect(reviewService.addReview('car-1', undefined, 4, 'Nice')).rejects.toThrow('Insert failed');
    });
  });
});

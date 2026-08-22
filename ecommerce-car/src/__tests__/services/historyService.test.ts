import { historyService } from '../../services/historyService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('HistoryService Suite - User Activities & Search History', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logViewedCar & getRecentlyViewed', () => {
    it('logViewedCar records viewed car event in database', async () => {
      const mockView = { id: 'vc-1', user_id: 'u1', car_id: 'car-1', viewed_at: '2024-01-01' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: mockView, error: null }),
          }),
        }),
      });

      const res = await historyService.logViewedCar('u1', 'car-1');
      expect(res).toEqual(mockView);
    });

    it('getRecentlyViewed fetches viewed car history', async () => {
      const mockList = [{ id: 'vc-1', car_id: 'car-1', car: { make: 'Porsche' } }];
      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ data: mockList, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await historyService.getRecentlyViewed('u1', 5);
      expect(res).toEqual(mockList);
    });
  });

  describe('saveSearchQuery & getSearchHistory & getChatHistory', () => {
    it('saveSearchQuery stores search query keyword', async () => {
      const mockSearch = { id: 'sh-1', user_id: 'u1', query_text: 'SUV gầm cao' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: mockSearch, error: null }),
          }),
        }),
      });

      const res = await historyService.saveSearchQuery('u1', 'SUV gầm cao');
      expect(res).toEqual(mockSearch);
    });

    it('getSearchHistory retrieves user search queries', async () => {
      const mockList = [{ id: 'sh-1', query_text: 'Porsche 911' }];
      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({ data: mockList, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await historyService.getSearchHistory();
      expect(res).toEqual(mockList);
    });

    it('getChatHistory retrieves messages for a chat session', async () => {
      const mockMessages = [
        { id: 'm1', session_id: 's1', role: 'user', content: 'Tư vấn xe' },
        { id: 'm2', session_id: 's1', role: 'assistant', content: 'Dạ chào bạn' },
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: mockMessages, error: null }),
          }),
        }),
      });

      const res = await historyService.getChatHistory('s1');
      expect(res).toEqual(mockMessages);
    });
  });
});

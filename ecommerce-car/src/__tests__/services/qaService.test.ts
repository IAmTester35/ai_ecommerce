import { qaService } from '../../services/qaService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('QAService Suite - Vehicle Q&A Discussion Forum', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCarQA', () => {
    it('fetches QA list for a car with responder and asker relations', async () => {
      const mockQA = [
        {
          id: 'qa-1',
          car_id: 'car-1',
          question: 'Xe có sẵn màu đen không?',
          answer: 'Dạ sẵn xe giao ngay ạ.',
          responder: { full_name: 'Admin' },
          asker: { full_name: 'Khách hàng' },
        },
      ];

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: mockQA, error: null }),
          }),
        }),
      });

      const res = await qaService.getCarQA('car-1');
      expect(res).toEqual(mockQA);
    });

    it('returns empty array when error occurs gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('DB Error') }),
          }),
        }),
      });

      const res = await qaService.getCarQA('car-1');
      expect(res).toEqual([]);
    });
  });

  describe('askQuestion', () => {
    it('submits a new question successfully', async () => {
      const createdQA = {
        id: 'qa-2',
        car_id: 'car-1',
        user_id: 'u1',
        question: 'Bảo hành bao lâu?',
      };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: createdQA, error: null }),
          }),
        }),
      });

      const res = await qaService.askQuestion('car-1', 'u1', 'Bảo hành bao lâu?');
      expect(res).toEqual(createdQA);
    });

    it('throws error when submission fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Network error') }),
          }),
        }),
      });

      await expect(qaService.askQuestion('car-1', 'u1', 'Test')).rejects.toThrow('Network error');
    });
  });
});

import { testDriveService } from '../../services/testDriveService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('TestDriveService Suite - Test Drive Booking & Cancellation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTestDrives', () => {
    it('fetches test drives for specific user', async () => {
      const mockList = [
        {
          id: 'td-1',
          user_id: 'u1',
          car_id: 'car-1',
          scheduled_date: '2024-05-01',
          status: 'pending',
          car: { make: 'Porsche', model: '911' },
        },
      ];

      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ data: mockList, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await testDriveService.getTestDrives('u1');
      expect(res).toEqual(mockList);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('returns empty array on query failure', async () => {
      const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Failed') }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const res = await testDriveService.getTestDrives();
      expect(res).toEqual([]);
    });
  });

  describe('bookTestDrive', () => {
    it('creates test drive appointment successfully', async () => {
      const newBooking = {
        id: 'td-2',
        user_id: 'u1',
        car_id: 'car-1',
        scheduled_date: '2024-06-01',
        status: 'pending',
        notes: 'Please prepare morning test drive',
      };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: newBooking, error: null }),
          }),
        }),
      });

      const res = await testDriveService.bookTestDrive('u1', 'car-1', '2024-06-01', 'Please prepare morning test drive');
      expect(res).toEqual(newBooking);
    });

    it('throws error when booking fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Booking error') }),
          }),
        }),
      });

      await expect(
        testDriveService.bookTestDrive('u1', 'car-1', '2024-06-01')
      ).rejects.toThrow('Booking error');
    });
  });

  describe('cancelTestDrive', () => {
    it('updates status to cancelled for given test drive ID', async () => {
      const cancelledBooking = {
        id: 'td-1',
        status: 'cancelled',
      };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: cancelledBooking, error: null }),
            }),
          }),
        }),
      });

      const res = await testDriveService.cancelTestDrive('td-1');
      expect(res.status).toBe('cancelled');
    });

    it('throws error when cancellation fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Cancel failed') }),
            }),
          }),
        }),
      });

      await expect(testDriveService.cancelTestDrive('td-1')).rejects.toThrow('Cancel failed');
    });
  });
});

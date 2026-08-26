import { showroomService } from '../../services/showroomService';
import { supabase } from '../../api/supabaseClient';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ShowroomService Suite - Showroom Queries', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getShowrooms returns list of active showrooms', async () => {
    const mockShowrooms = [
      { id: 'sr-1', name: 'AutoMatch Hanoi', city: 'Hà Nội', is_active: true },
      { id: 'sr-2', name: 'AutoMatch HCM', city: 'TP. Hồ Chí Minh', is_active: true },
    ];

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: mockShowrooms, error: null }),
          }),
        }),
      }),
    });

    const res = await showroomService.getShowrooms();
    expect(res).toEqual(mockShowrooms);
  });

  it('getShowrooms returns empty array on error', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } }),
          }),
        }),
      }),
    });

    const res = await showroomService.getShowrooms();
    expect(res).toEqual([]);
  });

  it('getShowroomById returns single showroom', async () => {
    const mockShowroom = { id: 'sr-1', name: 'AutoMatch Hanoi', city: 'Hà Nội' };

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          maybeSingle: jest.fn().mockResolvedValueOnce({ data: mockShowroom, error: null }),
        }),
      }),
    });

    const res = await showroomService.getShowroomById('sr-1');
    expect(res).toEqual(mockShowroom);
  });
});

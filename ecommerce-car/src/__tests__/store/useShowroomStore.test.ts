import { useShowroomStore } from '../../store/useShowroomStore';
import { showroomService } from '../../services/showroomService';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../services/showroomService');

describe('useShowroomStore Suite - Showrooms State Management', () => {
  const mockShowrooms = [
    { id: 'sr-1', name: 'AutoMatch HN', city: 'Hà Nội', code: 'HN', address: 'HN', is_active: true, created_at: '' },
    { id: 'sr-2', name: 'AutoMatch HCM', city: 'TP.HCM', code: 'HCM', address: 'HCM', is_active: true, created_at: '' },
  ];

  beforeEach(() => {
    useShowroomStore.setState({
      showrooms: [],
      selectedShowroom: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchShowrooms populates list and auto-selects first showroom', async () => {
    (showroomService.getShowrooms as jest.Mock).mockResolvedValueOnce(mockShowrooms);

    await useShowroomStore.getState().fetchShowrooms();

    const state = useShowroomStore.getState();
    expect(state.showrooms).toEqual(mockShowrooms);
    expect(state.selectedShowroom).toEqual(mockShowrooms[0]);
    expect(state.isLoading).toBe(false);
  });

  it('selectShowroomById selects targeted showroom', async () => {
    useShowroomStore.setState({ showrooms: mockShowrooms });

    useShowroomStore.getState().selectShowroomById('sr-2');
    expect(useShowroomStore.getState().selectedShowroom).toEqual(mockShowrooms[1]);
  });
});

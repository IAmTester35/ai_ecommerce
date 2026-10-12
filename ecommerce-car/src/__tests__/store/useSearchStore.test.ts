import { useSearchStore } from '../../store/useSearchStore';
import { aiSearchService } from '../../services/aiSearchService';

jest.mock('../../services/aiSearchService', () => ({
  aiSearchService: {
    searchCars: jest.fn(),
  },
}));

describe('useSearchStore Suite - AI Search State Management', () => {
  beforeEach(() => {
    useSearchStore.setState({
      query: '',
      results: null,
      aiMessage: '',
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('setQuery updates search query', () => {
    useSearchStore.getState().setQuery('SUV dưới 1 tỷ');
    expect(useSearchStore.getState().query).toBe('SUV dưới 1 tỷ');
  });

  it('executeSearch calls aiSearchService and saves results and aiMessage', async () => {
    useSearchStore.setState({ query: 'Xe điện sedan' });

    const searchResponse = {
      original_query: 'Xe điện sedan',
      constraints: { is_out_of_scope: false, soft_intent: 'EV' },
      results: [{ id: 'car-1', make: 'Porsche', model: 'Taycan' }],
      conflict_detected: false,
      relaxed_terms: [],
      ai_message: 'Tôi xin giới thiệu Porsche Taycan.',
    };

    (aiSearchService.searchCars as jest.Mock).mockResolvedValueOnce(searchResponse);

    await useSearchStore.getState().executeSearch();

    expect(useSearchStore.getState().isLoading).toBe(false);
    expect(aiSearchService.searchCars).toHaveBeenCalledWith('Xe điện sedan', expect.any(String));
    expect(useSearchStore.getState().results).toEqual({
      original_query: searchResponse.original_query,
      constraints: searchResponse.constraints,
      results: searchResponse.results,
      conflict_detected: false,
      relaxed_terms: [],
    });
    expect(useSearchStore.getState().aiMessage).toBe('Tôi xin giới thiệu Porsche Taycan.');
    expect(useSearchStore.getState().error).toBeNull();
  });

  it('executeSearch handles error gracefully', async () => {
    useSearchStore.setState({ query: 'Invalid search' });
    (aiSearchService.searchCars as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await useSearchStore.getState().executeSearch();

    expect(useSearchStore.getState().error).toBe('Network error');
    expect(useSearchStore.getState().isLoading).toBe(false);
  });

  it('clearSearch resets all search state and generates new session ID', () => {
    const oldSession = useSearchStore.getState().sessionId;
    useSearchStore.setState({
      query: 'Query',
      aiMessage: 'Message',
      results: {} as any,
    });

    useSearchStore.getState().clearSearch();

    expect(useSearchStore.getState().sessionId).not.toBe(oldSession);
    expect(useSearchStore.getState().query).toBe('');
    expect(useSearchStore.getState().results).toBeNull();
    expect(useSearchStore.getState().aiMessage).toBe('');
  });
});


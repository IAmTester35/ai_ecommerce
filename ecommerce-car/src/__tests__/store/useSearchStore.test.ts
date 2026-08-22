import { useSearchStore } from '../../store/useSearchStore';
import { aiSseService, SseEventTypes } from '../../services/aiSseService';

jest.mock('../../services/aiSseService', () => {
  const callbacks = new Map<string, Function>();
  return {
    SseEventTypes: {
      OPEN: 'open',
      PROGRESS: 'progress',
      SEARCH_DATA: 'search_data',
      MESSAGE: 'message',
      DONE: 'done',
      ERROR: 'error',
      CLOSE: 'close',
    },
    aiSseService: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      cleanup: jest.fn(),
      on: jest.fn((event: string, cb: Function) => {
        callbacks.set(event, cb);
      }),
      off: jest.fn((event: string) => {
        callbacks.delete(event);
      }),
      _trigger: (event: string, data: any) => {
        const cb = callbacks.get(event);
        if (cb) cb(data);
      },
    },
  };
});

describe('useSearchStore Suite - AI Search Streaming State Management', () => {
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

  it('executeSearch connects to aiSseService and collects streaming search data and messages', () => {
    useSearchStore.setState({ query: 'Xe điện sedan' });

    useSearchStore.getState().executeSearch();

    expect(useSearchStore.getState().isLoading).toBe(true);
    expect(aiSseService.connect).toHaveBeenCalledWith('Xe điện sedan', expect.any(String));

    // Simulate SEARCH_DATA event
    const searchData = {
      original_query: 'Xe điện sedan',
      constraints: { is_out_of_scope: false, soft_intent: 'EV' },
      results: [{ id: 'car-1', make: 'Porsche', model: 'Taycan' }],
      conflict_detected: false,
    };
    (aiSseService as any)._trigger(SseEventTypes.SEARCH_DATA, searchData);
    expect(useSearchStore.getState().results).toEqual(searchData);

    // Simulate streaming text chunks
    (aiSseService as any)._trigger(SseEventTypes.MESSAGE, { text: 'Tôi xin ' });
    (aiSseService as any)._trigger(SseEventTypes.MESSAGE, { text: 'giới thiệu xe.' });
    expect(useSearchStore.getState().aiMessage).toBe('Tôi xin giới thiệu xe.');

    // Simulate CLOSE
    (aiSseService as any)._trigger(SseEventTypes.CLOSE, {});
    expect(useSearchStore.getState().isLoading).toBe(false);
  });

  it('executeSearch handles error event', () => {
    useSearchStore.setState({ query: 'Invalid search' });
    useSearchStore.getState().executeSearch();

    (aiSseService as any)._trigger(SseEventTypes.ERROR, { message: 'Timeout' });
    expect(useSearchStore.getState().error).toBe('Timeout');
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
    expect(aiSseService.cleanup).toHaveBeenCalled();
  });
});

import { AISseService, SseEventTypes } from '../../services/aiSseService';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
      }),
    },
  },
}));

jest.mock('../../config/api', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.automatch.test'),
}));

describe('Adversarial & Stream Anomalies Suite - SSE Robustness & Fragmentation', () => {
  let service: AISseService;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    service = new AISseService();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    service.cleanup();
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('handles multi-line and fragmented SSE data blocks without dropping content', () => {
    const messageCallback = jest.fn();
    service.on(SseEventTypes.MESSAGE, messageCallback);

    // Multi-line data in single SSE event block
    const multiLineBlock =
      'event: message\n' +
      'data: Line 1 of automotive summary\n' +
      'data: Line 2 with details on horsepower and battery\n';

    (service as any).parseAndDispatchSSEBlock(multiLineBlock);

    expect(messageCallback).toHaveBeenCalledWith(
      'Line 1 of automotive summary\nLine 2 with details on horsepower and battery'
    );
  });

  it('safely handles non-JSON raw strings, corrupted JSON payloads and HTML error pages in SSE', () => {
    const errorCallback = jest.fn();
    service.on(SseEventTypes.ERROR, errorCallback);

    // Stream returns HTML 502 page inside SSE data line
    const htmlPayloadBlock = 'event: error\ndata: <html><body>502 Bad Gateway Nginx</body></html>\n';
    (service as any).parseAndDispatchSSEBlock(htmlPayloadBlock);

    expect(errorCallback).toHaveBeenCalledWith('<html><body>502 Bad Gateway Nginx</body></html>');
  });

  it('handles abrupt connection drops mid-stream with graceful state cleanup', async () => {
    const errorCallback = jest.fn();
    const closeCallback = jest.fn();

    service.on(SseEventTypes.ERROR, errorCallback);
    service.on(SseEventTypes.CLOSE, closeCallback);

    // Mock network abort / drop mid-stream
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network connection was lost.')
    );

    service.connect('Xe Sedan 2 tỷ', 'session-drop-1');
    await new Promise((r) => setTimeout(r, 20));

    expect(errorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Network connection was lost.' })
    );
    expect(closeCallback).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'error' })
    );
    expect(service.shouldBeConnected).toBe(false);
  });
});

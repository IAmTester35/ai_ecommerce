import { AISseService, SseEventTypes } from '../../services/aiSseService';

// Mock supabaseClient
jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
      }),
    },
  },
}));

// Mock config
jest.mock('../../config/api', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.automatch.test'),
}));

describe('AISseService Suite - Realtime SSE Streaming & Event Dispatcher', () => {
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

  describe('Event Registration & Emitter (on, off, cleanup)', () => {
    it('registers and triggers event listeners', () => {
      const progressCb = jest.fn();
      service.on(SseEventTypes.PROGRESS, progressCb);

      // Access private emit via prototype or testing block dispatch
      (service as any).emit(SseEventTypes.PROGRESS, { stage: 'analyzing', step: 1 });
      expect(progressCb).toHaveBeenCalledWith({ stage: 'analyzing', step: 1 });
    });

    it('unregisters specific listener with off', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      service.on(SseEventTypes.MESSAGE, cb1);
      service.on(SseEventTypes.MESSAGE, cb2);

      service.off(SseEventTypes.MESSAGE, cb1);
      (service as any).emit(SseEventTypes.MESSAGE, { text: 'Hello' });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledWith({ text: 'Hello' });
    });

    it('unregisters all listeners for an event when callback is omitted', () => {
      const cb = jest.fn();
      service.on(SseEventTypes.DONE, cb);
      service.off(SseEventTypes.DONE);
      (service as any).emit(SseEventTypes.DONE, {});
      expect(cb).not.toHaveBeenCalled();
    });

    it('cleans up all listeners on cleanup()', () => {
      const cb = jest.fn();
      service.on(SseEventTypes.OPEN, cb);
      service.cleanup();
      (service as any).emit(SseEventTypes.OPEN, {});
      expect(cb).not.toHaveBeenCalled();
    });

    it('handles exceptions inside event listener callbacks gracefully without breaking loop', () => {
      const faultyCb = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodCb = jest.fn();

      service.on(SseEventTypes.MESSAGE, faultyCb);
      service.on(SseEventTypes.MESSAGE, goodCb);

      expect(() => {
        (service as any).emit(SseEventTypes.MESSAGE, { text: 'Test' });
      }).not.toThrow();

      expect(goodCb).toHaveBeenCalledWith({ text: 'Test' });
    });
  });

  describe('SSE Block Parser (parseAndDispatchSSEBlock)', () => {
    it('parses JSON data blocks correctly and emits event', () => {
      const progressCb = jest.fn();
      service.on(SseEventTypes.PROGRESS, progressCb);

      const block = 'event: progress\ndata: {"stage":"searching","step":2,"total_steps":4}\n';
      (service as any).parseAndDispatchSSEBlock(block);

      expect(progressCb).toHaveBeenCalledWith({
        stage: 'searching',
        step: 2,
        total_steps: 4,
      });
    });

    it('parses raw text data when data is not valid JSON', () => {
      const msgCb = jest.fn();
      service.on(SseEventTypes.MESSAGE, msgCb);

      const block = 'event: message\ndata: plain text chunk\n';
      (service as any).parseAndDispatchSSEBlock(block);

      expect(msgCb).toHaveBeenCalledWith('plain text chunk');
    });

    it('ignores empty blocks without error', () => {
      expect(() => {
        (service as any).parseAndDispatchSSEBlock('');
        (service as any).parseAndDispatchSSEBlock('   \n  ');
      }).not.toThrow();
    });

    it('emits CLOSE event when done block is received', () => {
      const closeCb = jest.fn();
      service.on(SseEventTypes.CLOSE, closeCb);

      const block = 'event: done\ndata: {"status":"complete"}\n';
      (service as any).parseAndDispatchSSEBlock(block);

      expect(closeCb).toHaveBeenCalledWith({ reason: 'done' });
    });
  });

  describe('Fetch Streaming & Connection Management', () => {
    it('handles fetch streaming and dispatches events sequentially', async () => {
      const openCb = jest.fn();
      const msgCb = jest.fn();
      const doneCb = jest.fn();

      service.on(SseEventTypes.OPEN, openCb);
      service.on(SseEventTypes.MESSAGE, msgCb);
      service.on(SseEventTypes.DONE, doneCb);

      const sampleSseStream =
        'event: message\ndata: {"text":"Chào bạn"}\n\n' +
        'event: done\ndata: {"status":"finished"}\n\n';

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(sampleSseStream),
      });

      service.connect('SUV dưới 1 tỷ', 'session-123');

      // Wait tick for async connect
      await new Promise((r) => setTimeout(r, 20));

      expect(openCb).toHaveBeenCalled();
      expect(msgCb).toHaveBeenCalledWith({ text: 'Chào bạn' });
      expect(doneCb).toHaveBeenCalled();
    });

    it('handles HTTP error responses by emitting ERROR and CLOSE', async () => {
      const errorCb = jest.fn();
      const closeCb = jest.fn();

      service.on(SseEventTypes.ERROR, errorCb);
      service.on(SseEventTypes.CLOSE, closeCb);

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      service.connect('Xe mui trần', 'session-456');
      await new Promise((r) => setTimeout(r, 20));

      expect(errorCb).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('503') })
      );
      expect(closeCb).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'error' })
      );
    });

    it('disconnect aborts active request and resets connection state', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

      service.connect('Xe dien', 'session-789');
      expect(service.shouldBeConnected).toBe(true);

      service.disconnect();
      expect(service.shouldBeConnected).toBe(false);
    });
  });
});

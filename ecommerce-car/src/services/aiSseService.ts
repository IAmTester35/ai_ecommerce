import { Platform } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { getApiBaseUrl } from '../config/api';

const ENDPOINT = '/api/search';

export const SseEventTypes = {
  OPEN: 'open',
  PROGRESS: 'progress',
  SEARCH_DATA: 'search_data',
  MESSAGE: 'message',
  DONE: 'done',
  ERROR: 'error',
  CLOSE: 'close',
} as const;

type EventCallback<T = any> = (data: T) => void;

export class AISseService {
  private nitroSse: any = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private abortController: AbortController | null = null;
  public shouldBeConnected: boolean = false;

  private initNitroSse(): boolean {
    if (Platform.OS === 'web') return false;
    if (!this.nitroSse) {
      try {
        const { createNitroSse } = require('react-native-nitro-sse');
        this.nitroSse = createNitroSse();
        return true;
      } catch (err) {
        console.warn('[AISseService] Native NitroSse not available, falling back to fetch stream:', err);
        this.nitroSse = null;
        return false;
      }
    }
    return true;
  }

  public connect(query: string, sessionId: string): void {
    this.disconnect();
    this.shouldBeConnected = true;

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${ENDPOINT}`;

    // Try NitroSse for native platforms
    if (this.initNitroSse() && this.nitroSse) {
      try {
        this.connectWithNitro(url, query, sessionId);
        return;
      } catch (err) {
        console.warn('[AISseService] NitroSse connect error, falling back to stream:', err);
      }
    }

    // Fallback: Fetch streaming with ReadableStream / TextDecoder
    this.connectWithFetch(url, query, sessionId);
  }

  private async connectWithNitro(url: string, query: string, sessionId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    this.nitroSse.setup({
      url,
      method: 'post',
      body: JSON.stringify({ query, session_id: sessionId }),
      onBeforeRequest: async () => headers,
      batchingIntervalMs: 20,
      autoParseJSON: true,
    }, (events: any[]) => {
      for (const event of events) {
        const eventType = event.event || event.type || 'message';
        let parsed = event.parsedData;
        if (parsed === undefined && event.data) {
          try {
            parsed = JSON.parse(event.data);
          } catch {
            parsed = event.data;
          }
        }
        this.emit(eventType, parsed);
        if (eventType === 'done') {
          this.emit(SseEventTypes.CLOSE, { reason: 'done' });
        }
      }
    });

    // Also register event listeners directly
    Object.values(SseEventTypes).forEach((type) => {
      this.nitroSse.addEventListener(type, (event: any) => {
        let parsed = event.parsedData;
        if (parsed === undefined && event.data) {
          try {
            parsed = JSON.parse(event.data);
          } catch {
            parsed = event.data;
          }
        }
        this.emit(type, parsed);
        if (type === SseEventTypes.DONE) {
          this.emit(SseEventTypes.CLOSE, { reason: 'done' });
        }
      });
    });

    if (!this.nitroSse.isConnected()) {
      this.nitroSse.start();
      this.emit(SseEventTypes.OPEN, {});
    }
  }

  private async connectWithFetch(url: string, query: string, sessionId: string): Promise<void> {
    this.abortController = new AbortController();
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
      this.emit(SseEventTypes.OPEN, {});
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, session_id: sessionId }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      if (response.body && typeof (response.body as any).getReader === 'function') {
        const reader = (response.body as any).getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (this.shouldBeConnected) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const block of parts) {
            this.parseAndDispatchSSEBlock(block);
          }
        }

        if (buffer.trim()) {
          this.parseAndDispatchSSEBlock(buffer);
        }
      } else {
        // Fallback for runtimes where response.body is a string
        const text = await response.text();
        const blocks = text.split('\n\n');
        for (const block of blocks) {
          this.parseAndDispatchSSEBlock(block);
        }
      }

      this.emit(SseEventTypes.DONE, { status: 'completed' });
      this.emit(SseEventTypes.CLOSE, { reason: 'stream_end' });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Normal disconnect
        return;
      }
      console.error('[AISseService] Stream error:', err);
      this.emit(SseEventTypes.ERROR, { message: err.message || 'Lỗi kết nối AI Search' });
      this.emit(SseEventTypes.CLOSE, { reason: 'error', error: err });
    } finally {
      this.shouldBeConnected = false;
    }
  }

  private parseAndDispatchSSEBlock(block: string): void {
    if (!block.trim()) return;
    const lines = block.split('\n');
    let currentEvent = 'message';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        currentData += (currentData ? '\n' : '') + line.slice(6);
      }
    }

    if (currentData) {
      let parsedData: any = currentData;
      try {
        parsedData = JSON.parse(currentData);
      } catch {
        parsedData = currentData;
      }
      this.emit(currentEvent, parsedData);
      if (currentEvent === 'done') {
        this.emit(SseEventTypes.CLOSE, { reason: 'done' });
      }
    }
  }

  public on<T = any>(eventName: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  public off(eventName: string, callback?: EventCallback): void {
    if (callback) {
      this.listeners.get(eventName)?.delete(callback);
    } else {
      this.listeners.delete(eventName);
    }
  }

  private emit(eventName: string, data: any): void {
    const set = this.listeners.get(eventName);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.warn(`[AISseService] Error in listener for ${eventName}:`, e);
        }
      });
    }
  }

  public disconnect(): void {
    this.shouldBeConnected = false;
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {}
      this.abortController = null;
    }
    if (this.nitroSse) {
      try {
        this.nitroSse.stop();
      } catch {}
    }
  }

  public cleanup(): void {
    this.disconnect();
    this.listeners.clear();
    this.nitroSse = null;
  }
}

export const aiSseService = new AISseService();

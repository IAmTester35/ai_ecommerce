import {
  createNitroSse,
  type SseClient,
  type SseListener,
} from 'react-native-nitro-sse';
import { supabase } from '../api/supabaseClient';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const ENDPOINT = '/api/search';

export const SseEventTypes = {
  OPEN: 'open',
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
  SEARCH_DATA: 'search_data',
} as const;

export class AISseService {
  private nitroSse: SseClient | null = null;
  private wrapperMap = new Map<Function, SseListener>();
  public shouldBeConnected: boolean = false;

  private getOrCreateNitroSse(): SseClient {
    if (!this.nitroSse) {
      this.nitroSse = createNitroSse();
    }
    return this.nitroSse;
  }

  public connect(query: string, sessionId: string): void {
    this.shouldBeConnected = true;
    const nitro = this.getOrCreateNitroSse();

    nitro.setup({
      url: `${BASE_URL}${ENDPOINT}`,
      method: 'post',
      body: JSON.stringify({ query, session_id: sessionId }),
      onBeforeRequest: async () => {
        // Nếu cần gửi Token Auth từ Supabase
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
        return headers;
      },
      batchingIntervalMs: 50,
      autoParseJSON: true,
    });

    if (!nitro.isConnected()) {
      nitro.start();
    }
  }

  public on<T>(eventName: string, callback: (data: T) => void): void {
    const nitro = this.getOrCreateNitroSse();
    const listener: SseListener = (event) => {
      try {
        let rawData: unknown = event.parsedData;
        if (rawData === undefined && event.data) {
          try {
            rawData = JSON.parse(event.data);
          } catch {
            rawData = event.data;
          }
        }
        callback(rawData as T);
      } catch (err) {
        console.warn(`[SSE] Listener error for ${eventName}:`, err);
      }
    };
    this.wrapperMap.set(callback, listener);
    nitro.addEventListener(eventName, listener);
  }

  public off(eventName: string, callback?: Function): void {
    if (!this.nitroSse) return;
    if (callback) {
      const listener = this.wrapperMap.get(callback);
      if (listener) {
        this.nitroSse.removeEventListener(eventName, listener);
        this.wrapperMap.delete(callback);
      }
    }
  }

  public disconnect(): void {
    this.shouldBeConnected = false;
    if (this.nitroSse) {
      try {
        this.nitroSse.stop();
      } catch (e) {
        console.warn('[SSE] Error stopping NitroSse:', e);
      }
    }
  }

  public cleanup(): void {
    this.disconnect();
    this.wrapperMap.clear();
    this.nitroSse = null;
  }
}

// Export singleton instance
export const aiSseService = new AISseService();

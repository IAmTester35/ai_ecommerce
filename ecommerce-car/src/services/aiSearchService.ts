import { supabase } from '../api/supabaseClient';
import { getApiBaseUrl } from '../config/api';
import { SearchResponse } from '../types';

export const aiSearchService = {
  searchCars: async (query: string, sessionId: string): Promise<SearchResponse> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/search`;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, session_id: sessionId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `Lỗi AI Search: ${response.status}`);
    }

    const data: SearchResponse = await response.json();
    return data;
  },
};

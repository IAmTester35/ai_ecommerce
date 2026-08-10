import { aiClient } from '../api/aiClient';
import { SearchResponse } from '../types';

export const aiSearchService = {
  searchCars: async (query: string): Promise<SearchResponse> => {
    try {
      const response = await aiClient.post<SearchResponse>('/api/search', { query });
      return response.data;
    } catch (error) {
      console.error('Error in aiSearchService:', error);
      throw error;
    }
  },
};

export interface ExtractedConstraints {
  max_price?: number;
  min_hp?: number;
  make?: string;
  target_year?: number;
  fuel_type?: string;
  is_out_of_scope: boolean;
  soft_intent: string;
}

export interface CarResponse {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  engine_hp?: number;
  price?: number;
  metadata?: Record<string, any>;
  review?: string;
  similarity?: number;
  rerank_score?: number;
  image_url?: string;
}

export interface SearchDataEvent {
  original_query: string;
  constraints: ExtractedConstraints;
  results: CarResponse[];
  conflict_detected: boolean;
  relaxed_terms?: string[];
}

export interface SearchResponse extends SearchDataEvent {
  ai_message: string;
}

export interface QueryRequest {
  query: string;
  session_id: string;
}

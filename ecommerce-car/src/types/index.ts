export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'manager' | 'owner';
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  engine_hp?: number | null;
  price?: number | null;
  metadata?: Record<string, any> | null;
  image_url?: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface SavedCar {
  id: string;
  user_id: string;
  car_id: string;
  created_at: string;
  car?: Car;
}

export type TestDriveStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TestDrive {
  id: string;
  user_id: string;
  car_id: string;
  scheduled_date: string;
  status: TestDriveStatus;
  notes?: string | null;
  created_at: string;
  car?: Car;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method?: string | null;
  payment_status: PaymentStatus;
  contract_url?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  car_id?: string | null;
  price: number;
  quantity: number;
  created_at: string;
  car?: Car;
}

export interface Review {
  id: string;
  user_id?: string | null;
  car_id: string;
  rating?: number | null;
  comment?: string | null;
  source?: string | null;
  embedding?: number[] | null;
  created_at: string;
  profiles?: Profile;
}

export interface CarQA {
  id: string;
  car_id: string;
  user_id: string;
  question: string;
  answer?: string | null;
  answered_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewedCar {
  id: string;
  user_id: string;
  car_id: string;
  viewed_at: string;
  car?: Car;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  query_text: string;
  created_at: string;
}

export interface ChatSessionMessage {
  id: string;
  session_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  car_id: string;
  quantity: number;
  created_at: string;
  car?: Car;
}

export interface CarFilterParams {
  make?: string;
  maxPrice?: number;
  targetYear?: number;
  minHp?: number;
  fuelType?: string;
  limit?: number;
  offset?: number;
}

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

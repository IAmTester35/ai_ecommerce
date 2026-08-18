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
  metadata?: {
    transmission?: string;
    fuel_type?: string;
    engine_fuel_type?: string;
    body_type?: string;
    seating_capacity?: number;
    acceleration_0_100?: string;
    top_speed?: string;
    torque?: string;
    fuel_economy?: string;
    color_options?: string[];
    features?: string[];
    gallery?: string[];
    dimensions?: string;
    airbags?: number;
    warranty?: string;
    review?: string;
    [key: string]: any;
  } | null;
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

export interface PaymentItem {
  id: string;
  name: string;
  price: number;
  itemCount: number;
}

export interface PaymentCreateRequest {
  order_id?: string;
  amount: number;
  items: PaymentItem[];
  email: string;
  address: string;
  name: string;
  phone: string;
  note?: string;
  userid: string;
}

export interface PaymentCreateResponse {
  return_code: number;
  return_message: string;
  order_url?: string;
  zp_trans_token?: string;
  app_trans_id?: string;
}

export interface PaymentStatusRequest {
  app_trans_id: string;
}

export interface PaymentStatusResponse {
  return_code: number;
  return_message: string;
  is_processing?: boolean;
  amount?: number;
  zp_trans_id?: string;
}

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
}

export interface UserNotificationRequest {
  user_id: string;
  token?: string;
  title: string;
  body: string;
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
  responder?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  asker?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
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
  type?: 'order' | 'promo' | 'system' | 'test_drive' | null;
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

export type CarSortOption = 'recommended' | 'price_asc' | 'price_desc' | 'hp_desc' | 'year_desc';

export interface CarFilterParams {
  query?: string;
  make?: string;
  bodyType?: string;
  minPrice?: number;
  maxPrice?: number;
  targetYear?: number;
  minHp?: number;
  fuelType?: string;
  transmission?: string;
  sortBy?: CarSortOption;
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
  engine_hp?: number | null;
  price?: number | null;
  metadata?: Record<string, any> | null;
  review?: string | null;
  similarity?: number | null;
  rerank_score?: number | null;
  image_url?: string | null;
  stock_quantity?: number;
  is_active?: boolean;
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

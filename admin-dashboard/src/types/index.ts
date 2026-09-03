export type UserRole = 'user' | 'manager' | 'owner';

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  showroom_id?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  showroom?: Showroom | null;
}

export interface Showroom {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  image_url?: string | null;
  opening_hours: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  car_count?: number;
}

export type DiscountType = 'fixed' | 'percentage';
export type VoucherAppliesTo = 'deposit' | 'total';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_value: number;
  applies_to: VoucherAppliesTo;
  usage_limit: number;
  used_count: number;
  max_uses_per_user?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CarMetadata {
  engine_fuel_type?: string;
  engine_cylinders?: number;
  transmission_type?: string;
  driven_wheels?: string;
  number_of_doors?: number;
  market_category?: string;
  vehicle_size?: string;
  vehicle_style?: string;
  highway_mpg?: number;
  city_mpg?: number;
  popularity?: number;
  color?: string;
  interior_color?: string;
  features?: string[];
  description?: string;
  acceleration_0_100?: string;
  top_speed?: string;
  battery_capacity_kwh?: number;
  range_km?: number;
  gallery?: string[];
  view_360_url?: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  engine_hp?: number | null;
  price?: number | null;
  showroom_id?: string | null;
  metadata?: CarMetadata | null;
  image_url?: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  showroom?: Showroom | null;
}

export type OrderStatus =
  | 'pending'
  | 'deposit_paid'
  | 'preparing_car'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  car_id?: string | null;
  price: number;
  quantity: number;
  created_at: string;
  car?: Car | null;
}

export interface Order {
  id: string;
  user_id?: string | null;
  showroom_id?: string | null;
  voucher_id?: string | null;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  discount_amount: number;
  status: OrderStatus;
  payment_method?: string | null;
  payment_status: PaymentStatus;
  deposit_status: PaymentStatus;
  contract_url?: string | null;
  app_trans_id?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  refund_amount?: number;
  refund_reason?: string | null;
  refund_trans_id?: string | null;
  refunded_at?: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  showroom?: Showroom | null;
  voucher?: Voucher | null;
  items?: OrderItem[];
}

export type TestDriveStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TestDrive {
  id: string;
  user_id?: string | null;
  car_id?: string | null;
  showroom_id?: string | null;
  scheduled_date: string;
  status: TestDriveStatus;
  notes?: string | null;
  assigned_staff_id?: string | null;
  created_at: string;
  car?: Car | null;
  showroom?: Showroom | null;
  profile?: Profile | null;
  assigned_staff?: Profile | null;
}

export interface Review {
  id: string;
  user_id?: string | null;
  car_id?: string | null;
  rating?: number | null;
  comment?: string | null;
  source: string;
  is_approved?: boolean;
  embedding?: number[] | null;
  created_at: string;
  profile?: Profile | null;
  car?: Car | null;
}

export interface CarQA {
  id: string;
  car_id?: string | null;
  user_id?: string | null;
  question: string;
  answer?: string | null;
  answered_by?: string | null;
  created_at: string;
  updated_at: string;
  car?: Car | null;
  profile?: Profile | null;
  answerer?: Profile | null;
}

export interface AppNotification {
  id: string;
  user_id?: string | null;
  title: string;
  content: string;
  type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SearchHistoryItem {
  id: string;
  user_id?: string | null;
  query_text: string;
  created_at: string;
  profile?: Profile | null;
}

export interface ChatSessionMessage {
  id: string;
  session_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  profile?: Profile | null;
}

export interface AISearchResponse {
  original_query: string;
  constraints: {
    max_price?: number | null;
    min_hp?: number | null;
    make?: string | null;
    target_year?: number | null;
    fuel_type?: string | null;
    is_out_of_scope: boolean;
    soft_intent?: string | null;
  };
  results: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    review: string;
    similarity: number;
    image_url?: string;
  }>;
  conflict_detected: boolean;
  relaxed_terms: string[];
  ai_message: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalDeposit: number;
  totalContractValue: number;
  remainingDue: number;
  activeCars: number;
  totalOrders: number;
  pendingOrders: number;
  testDrivesThisWeek: number;
  completedDeliveries: number;
  averageRating: number;
  totalCustomers: number;
  conversionRate: number;
}

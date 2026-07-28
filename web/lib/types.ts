export interface DatabaseCar {
  id: string;
  make: string;
  model: string;
  year: number;
  engine_hp: number | null;
  price: number | null;
  metadata: {
    engine_fuel_type?: string;
    transmission?: string;
    body_style?: string;
    [key: string]: any;
  } | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export const getCarImage = (id: string) => {
  return `https://placehold.co/600x400/png?text=Car+Image+${id.substring(0, 4)}`;
};

import { create } from 'zustand';
import { Car } from './mockData';

interface CartItem {
  car: Car;
  quantity: number;
}

interface AppState {
  cart: CartItem[];
  wishlist: Car[];
  addToCart: (car: Car) => void;
  removeFromCart: (carId: string) => void;
  toggleWishlist: (car: Car) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  wishlist: [],
  addToCart: (car) => set((state) => {
    const existing = state.cart.find(item => item.car.id === car.id);
    if (existing) {
      return state; // Just booking 1 car of a type
    }
    return { cart: [...state.cart, { car, quantity: 1 }] };
  }),
  removeFromCart: (carId) => set((state) => ({
    cart: state.cart.filter(item => item.car.id !== carId)
  })),
  toggleWishlist: (car) => set((state) => {
    const exists = state.wishlist.some(c => c.id === car.id);
    if (exists) {
      return { wishlist: state.wishlist.filter(c => c.id !== car.id) };
    }
    return { wishlist: [...state.wishlist, car] };
  }),
  clearCart: () => set({ cart: [] })
}));

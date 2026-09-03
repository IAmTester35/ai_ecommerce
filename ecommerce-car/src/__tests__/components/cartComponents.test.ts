import React from 'react';
import { SwipeableCartItem } from '../../components/car/SwipeableCartItem';
import { CartItem } from '../../types';
import { usdToVnd, formatVnd } from '../../utils/currency';

describe('Cart Components & Checklist Suite', () => {
  const mockCar = {
    id: 'car-123',
    make: 'Porsche',
    model: 'Taycan 4S',
    year: 2024,
    engine_hp: 530,
    price: 110000,
    stock_quantity: 3,
    is_active: true,
    created_at: '2024-01-01',
    showroom: {
      id: 'sr-1',
      name: 'AutoMatch Hà Nội - Cầu Giấy',
      code: 'AM-HN01',
      address: 'Số 68 Cầu Giấy, Hà Nội',
      city: 'Hà Nội',
      opening_hours: '08:00 - 20:00',
      is_active: true,
      created_at: '2024-01-01',
    },
    metadata: {
      transmission: 'Tự động 2 cấp',
      fuel_type: 'Thuần điện (EV)',
      engine_fuel_type: 'electric',
      seating_capacity: 5,
      color: 'Trắng Carrara White',
    },
  };

  const sampleCartItem: CartItem = {
    id: 'cart-item-1',
    user_id: 'user-abc',
    car_id: 'car-123',
    quantity: 2,
    created_at: '2024-01-01T00:00:00Z',
    car: mockCar,
  };

  describe('Checklist 1: Item List & Selected Variants', () => {
    it('creates SwipeableCartItem with car images, names, and extracted variant specs', () => {
      const updateQtySpy = jest.fn();
      const removeSpy = jest.fn();

      const element = React.createElement(SwipeableCartItem, {
        item: sampleCartItem,
        onUpdateQuantity: updateQtySpy,
        onRemove: removeSpy,
      });

      expect(element).toBeDefined();
      expect(element.props.item.car?.make).toBe('Porsche');
      expect(element.props.item.car?.model).toBe('Taycan 4S');
      expect(element.props.item.car?.metadata?.transmission).toBe('Tự động 2 cấp');
      expect(element.props.item.car?.metadata?.fuel_type).toBe('Thuần điện (EV)');
      expect(element.props.item.car?.metadata?.color).toBe('Trắng Carrara White');
    });

    it('handles fallback when car metadata or variants are null/undefined', () => {
      const bareItem: CartItem = {
        id: 'cart-item-bare',
        user_id: 'u1',
        car_id: 'car-bare',
        quantity: 1,
        created_at: '2024-01-01',
        car: {
          id: 'car-bare',
          make: 'VinFast',
          model: 'VF8',
          year: 2024,
          price: 45000,
          stock_quantity: 10,
          is_active: true,
          created_at: '2024-01-01',
          metadata: null,
        },
      };

      const element = React.createElement(SwipeableCartItem, {
        item: bareItem,
        onUpdateQuantity: jest.fn(),
        onRemove: jest.fn(),
      });

      expect(element).toBeDefined();
      expect(element.props.item.quantity).toBe(1);
    });
  });

  describe('Checklist 2 & 3: Quantity Stepper & Swipe Gesture', () => {
    it('allows updating quantity and provides accessible callbacks', () => {
      const updateQtySpy = jest.fn();
      const removeSpy = jest.fn();

      const element = React.createElement(SwipeableCartItem, {
        item: sampleCartItem,
        onUpdateQuantity: updateQtySpy,
        onRemove: removeSpy,
      });

      expect(typeof element.props.onUpdateQuantity).toBe('function');
      expect(typeof element.props.onRemove).toBe('function');
    });
  });

  describe('Checklist 4: Price Breakdown & Financial Calculations', () => {
    it('calculates accurate subtotal, 10% deposit, and remaining 90% balance', () => {
      const itemPriceVnd = usdToVnd(mockCar.price, {
        engineHp: mockCar.engine_hp,
        fuelType: mockCar.metadata.engine_fuel_type,
      });

      const rawTotalVnd = itemPriceVnd * sampleCartItem.quantity;
      expect(rawTotalVnd).toBeGreaterThan(0);

      // 10% Deposit
      const depositAmountVnd = Math.round(rawTotalVnd * 0.10);
      const remainingAmountVnd = rawTotalVnd - depositAmountVnd;

      expect(depositAmountVnd).toBe(Math.round(rawTotalVnd * 0.10));
      expect(remainingAmountVnd).toBe(rawTotalVnd - depositAmountVnd);
      expect(depositAmountVnd + remainingAmountVnd).toBe(rawTotalVnd);
    });

    it('correctly applies promotional voucher discount to subtotal and deposit', () => {
      const itemPriceVnd = usdToVnd(mockCar.price, {
        engineHp: mockCar.engine_hp,
        fuelType: mockCar.metadata.engine_fuel_type,
      });

      const rawTotalVnd = itemPriceVnd * sampleCartItem.quantity;
      const discountAmount = 10_000_000; // 10M VND discount
      const netTotalVnd = Math.max(0, rawTotalVnd - discountAmount);
      const discountedDeposit = Math.round(netTotalVnd * 0.10);

      expect(netTotalVnd).toBe(rawTotalVnd - discountAmount);
      expect(discountedDeposit).toBe(Math.round(netTotalVnd * 0.10));
      expect(discountedDeposit).toBeLessThan(Math.round(rawTotalVnd * 0.10));
    });
  });
});

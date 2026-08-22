import { carService } from '../../services/carService';
import { supabase } from '../../api/supabaseClient';
import { Car } from '../../types';

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('CarService Suite - Vehicle Catalog & Filter Querying', () => {
  const sampleCar: Car = {
    id: 'car-1',
    make: 'Porsche',
    model: '911 Carrera',
    year: 2024,
    engine_hp: 385,
    price: 114000,
    metadata: { body_type: 'Coupe', fuel_type: 'Xăng' },
    stock_quantity: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopCars', () => {
    it('fetches top cars ordered by created_at desc', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce({ data: [sampleCar], error: null }),
            }),
          }),
        }),
      });

      const cars = await carService.getTopCars(5);
      expect(cars).toHaveLength(1);
      expect(cars[0].model).toBe('911 Carrera');
    });

    it('throws error if database query fails', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Network error') }),
            }),
          }),
        }),
      });

      await expect(carService.getTopCars()).rejects.toThrow('Network error');
    });
  });

  describe('getCarById', () => {
    it('returns null immediately when carId is empty', async () => {
      const res = await carService.getCarById('');
      expect(res).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches car by UUID', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: sampleCar, error: null }),
          }),
        }),
      });

      const car = await carService.getCarById('car-1');
      expect(car).toEqual(sampleCar);
    });

    it('returns null when car not found or error returned', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('DB Error') }),
          }),
        }),
      });

      const res = await carService.getCarById('invalid-id');
      expect(res).toBeNull();
    });
  });

  describe('getCarsByIds', () => {
    it('returns empty array immediately when ids array is empty', async () => {
      const cars = await carService.getCarsByIds([]);
      expect(cars).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches cars matching given array of IDs', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockResolvedValueOnce({ data: [sampleCar], error: null }),
        }),
      });

      const cars = await carService.getCarsByIds(['car-1']);
      expect(cars).toHaveLength(1);
      expect(cars[0].id).toBe('car-1');
    });
  });

  describe('getCarsWithFilter', () => {
    it('applies make, price, bodyType, hp, sorting, and pagination filters', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValueOnce({ data: [sampleCar], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryBuilder);

      const cars = await carService.getCarsWithFilter({
        query: '911',
        make: 'Porsche',
        minPrice: 500000000,
        maxPrice: 3000000000,
        minHp: 300,
        fuelType: 'Xăng',
        bodyType: 'Coupe',
        sortBy: 'hp_desc',
        limit: 10,
        offset: 0,
      });

      expect(cars).toHaveLength(1);
      expect(mockQueryBuilder.or).toHaveBeenCalled();
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('make', '%Porsche%');
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('price', expect.any(Number));
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('price', expect.any(Number));
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('engine_hp', { ascending: false });
    });
  });

  describe('savedCars (Bookmark / Wishlist)', () => {
    it('getSavedCars fetches user saved cars with car relations', async () => {
      const mockSaved = [{ id: 'sc-1', user_id: 'u1', car_id: 'car-1', car: sampleCar }];
      const mockQuery: any = {
        eq: jest.fn().mockResolvedValueOnce({ data: mockSaved, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce(mockQuery),
        }),
      });

      const saved = await carService.getSavedCars('u1');
      expect(saved).toEqual(mockSaved);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('saveCar inserts into saved_cars table', async () => {
      const inserted = { id: 'sc-1', user_id: 'u1', car_id: 'car-1' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: inserted, error: null }),
          }),
        }),
      });

      const res = await carService.saveCar('car-1', 'u1');
      expect(res).toEqual(inserted);
    });

    it('unsaveCar deletes record from saved_cars table', async () => {
      const mockQuery: any = {
        eq: jest.fn(),
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery); // first eq('car_id', ...)
      mockQuery.eq.mockResolvedValueOnce({ error: null }); // second eq('user_id', ...)

      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce(mockQuery),
      });

      await expect(carService.unsaveCar('car-1', 'u1')).resolves.toBeUndefined();
    });
  });
});

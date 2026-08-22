import { useCarStore } from '../../store/useCarStore';
import { carService } from '../../services/carService';

jest.mock('../../services/carService', () => ({
  carService: {
    getTopCars: jest.fn(),
    getCarById: jest.fn(),
    getSavedCars: jest.fn(),
    saveCar: jest.fn(),
    unsaveCar: jest.fn(),
    getCarsWithFilter: jest.fn(),
  },
}));

describe('useCarStore Suite - Vehicle Catalog State Management', () => {
  const mockCar = {
    id: 'car-1',
    make: 'Porsche',
    model: '911 Carrera',
    year: 2024,
    price: 120000,
    stock_quantity: 2,
    is_active: true,
    created_at: '2024-01-01',
  };

  beforeEach(() => {
    useCarStore.setState({
      topCars: [],
      filteredCars: [],
      savedCars: [],
      selectedCar: null,
      filters: {},
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchTopCars loads top cars list into store', async () => {
    (carService.getTopCars as jest.Mock).mockResolvedValueOnce([mockCar]);

    await useCarStore.getState().fetchTopCars();

    const state = useCarStore.getState();
    expect(state.topCars).toEqual([mockCar]);
    expect(state.isLoading).toBe(false);
  });

  it('fetchCarDetails loads details of selected car', async () => {
    (carService.getCarById as jest.Mock).mockResolvedValueOnce(mockCar);

    await useCarStore.getState().fetchCarDetails('car-1');

    expect(useCarStore.getState().selectedCar).toEqual(mockCar);
  });

  it('fetchSavedCars loads saved wishlist cars', async () => {
    const saved = [{ id: 'sc-1', user_id: 'u1', car_id: 'car-1', car: mockCar }];
    (carService.getSavedCars as jest.Mock).mockResolvedValueOnce(saved);

    await useCarStore.getState().fetchSavedCars('u1');

    expect(useCarStore.getState().savedCars).toEqual(saved);
  });

  it('toggleSaveCar adds car to saved list when unsaved, and removes when already saved', async () => {
    // 1. Save car
    const savedItem = { id: 'sc-1', user_id: 'u1', car_id: 'car-1', car: mockCar };
    (carService.saveCar as jest.Mock).mockResolvedValueOnce(savedItem);

    await useCarStore.getState().toggleSaveCar('car-1', 'u1');
    expect(useCarStore.getState().savedCars).toEqual([savedItem]);
    expect(carService.saveCar).toHaveBeenCalledWith('car-1', 'u1');

    // 2. Unsave car
    (carService.unsaveCar as jest.Mock).mockResolvedValueOnce(undefined);

    await useCarStore.getState().toggleSaveCar('car-1', 'u1');
    expect(useCarStore.getState().savedCars).toEqual([]);
    expect(carService.unsaveCar).toHaveBeenCalledWith('car-1', 'u1');
  });

  it('setFilters updates filter parameters in store', () => {
    useCarStore.getState().setFilters({ make: 'Porsche', minPrice: 50000 });
    expect(useCarStore.getState().filters).toEqual({ make: 'Porsche', minPrice: 50000 });

    useCarStore.getState().setFilters({ maxPrice: 150000 });
    expect(useCarStore.getState().filters).toEqual({
      make: 'Porsche',
      minPrice: 50000,
      maxPrice: 150000,
    });
  });

  it('applyFilters queries cars using current active filters', async () => {
    useCarStore.getState().setFilters({ make: 'Porsche' });
    (carService.getCarsWithFilter as jest.Mock).mockResolvedValueOnce([mockCar]);

    await useCarStore.getState().applyFilters();

    expect(carService.getCarsWithFilter).toHaveBeenCalledWith({ make: 'Porsche' });
    expect(useCarStore.getState().filteredCars).toEqual([mockCar]);
  });

  it('resetFilters clears all filters and filtered cars list', () => {
    useCarStore.setState({
      filters: { make: 'Ferrari' },
      filteredCars: [mockCar],
    });

    useCarStore.getState().resetFilters();

    expect(useCarStore.getState().filters).toEqual({});
    expect(useCarStore.getState().filteredCars).toEqual([]);
  });
});

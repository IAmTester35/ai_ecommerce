import React from 'react';
import { Filter } from 'lucide-react';

export interface FilterState {
  makes: string[];
  priceRange: string | null;
  fuelTypes: string[];
}

interface CatalogFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  const POPULAR_MAKES = ['Honda', 'Toyota', 'Mercedes-Benz', 'Porsche', 'Ford', 'BMW'];
  const PRICE_RANGES = [
    { label: 'Dưới 1 tỷ', value: '0-1000000000' },
    { label: '1 tỷ - 3 tỷ', value: '1000000000-3000000000' },
    { label: 'Trên 3 tỷ', value: '3000000000-max' }
  ];
  const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

  const toggleMake = (make: string) => {
    const newMakes = filters.makes.includes(make)
      ? filters.makes.filter(m => m !== make)
      : [...filters.makes, make];
    onChange({ ...filters, makes: newMakes });
  };

  const toggleFuel = (fuel: string) => {
    const newFuels = filters.fuelTypes.includes(fuel)
      ? filters.fuelTypes.filter(f => f !== fuel)
      : [...filters.fuelTypes, fuel];
    onChange({ ...filters, fuelTypes: newFuels });
  };

  const setPrice = (val: string) => {
    onChange({ ...filters, priceRange: filters.priceRange === val ? null : val });
  };

  return (
    <div className="bg-card border rounded-2xl p-6 sticky top-24 shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b">
        <Filter className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Bộ lọc tìm kiếm</h2>
      </div>
      
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Thương hiệu</h3>
          <div className="space-y-3">
            {POPULAR_MAKES.map(brand => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.makes.includes(brand)}
                  onChange={() => toggleMake(brand)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-all group-hover:border-primary" 
                />
                <span className="text-sm font-medium transition-colors group-hover:text-primary">{brand}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Mức giá</h3>
          <div className="space-y-3">
            {PRICE_RANGES.map(range => (
              <label key={range.value} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="price" 
                  checked={filters.priceRange === range.value}
                  onChange={() => setPrice(range.value)}
                  className="w-4 h-4 text-primary focus:ring-primary transition-all group-hover:border-primary" 
                />
                <span className="text-sm font-medium transition-colors group-hover:text-primary">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Nhiên liệu</h3>
          <div className="space-y-3">
            {FUEL_TYPES.map(fuel => (
              <label key={fuel} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.fuelTypes.includes(fuel)}
                  onChange={() => toggleFuel(fuel)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-all group-hover:border-primary" 
                />
                <span className="text-sm font-medium transition-colors group-hover:text-primary">{fuel}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

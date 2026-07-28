'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DatabaseCar } from '@/lib/types';
import { CatalogFilters, FilterState } from './CatalogFilters';
import { CarGridView } from './CarGridView';
import { CarListView } from './CarListView';
import { LayoutGrid, List } from 'lucide-react';

interface CatalogClientProps {
  initialCars: DatabaseCar[];
}

export function CatalogClient({ initialCars }: CatalogClientProps) {
  const supabase = createClient();
  const [cars, setCars] = useState<DatabaseCar[]>(initialCars);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [filters, setFilters] = useState<FilterState>({
    makes: [],
    priceRange: null,
    fuelTypes: [],
  });

  useEffect(() => {
    // Skip initial fetch since we have initialCars and no filters applied initially
    // But if filters change, we fetch.
    const fetchFilteredCars = async () => {
      setLoading(true);
      try {
        let query = supabase.from('cars').select('*').eq('is_active', true);

        if (filters.makes.length > 0) {
          query = query.in('make', filters.makes);
        }

        if (filters.priceRange) {
          const [min, max] = filters.priceRange.split('-');
          query = query.gte('price', parseInt(min));
          if (max !== 'max') {
            query = query.lte('price', parseInt(max));
          }
        }

        const { data, error } = await query;
        
        if (error) throw error;

        // Note: Supabase JSONB filtering is tricky via JS client natively without `.contains()`.
        // We do client-side filtering for fuelType for simplicity if array length > 0
        let filteredData = (data as DatabaseCar[]) || [];
        
        if (filters.fuelTypes.length > 0) {
          filteredData = filteredData.filter(car => {
            const carFuel = car.metadata?.engine_fuel_type || 'Gasoline';
            return filters.fuelTypes.some(fuel => carFuel.toLowerCase().includes(fuel.toLowerCase()));
          });
        }

        setCars(filteredData);
      } catch (err) {
        console.error('Error fetching cars:', err);
      } finally {
        setLoading(false);
      }
    };

    // Determine if we need to fetch
    const hasFilters = filters.makes.length > 0 || filters.priceRange !== null || filters.fuelTypes.length > 0;
    if (hasFilters || initialCars.length === 0) {
      fetchFilteredCars();
    } else {
      // Revert to initial
      setCars(initialCars);
    }
  }, [filters, initialCars, supabase]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-72 shrink-0">
        <CatalogFilters filters={filters} onChange={setFilters} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Danh Mục Xe</h1>
            <p className="text-muted-foreground mt-1">{cars.length} kết quả được tìm thấy</p>
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-background shadow text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-background shadow text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Không tìm thấy xe nào</h3>
            <p className="text-muted-foreground max-w-sm">
              Rất tiếc, không có mẫu xe nào phù hợp với bộ lọc hiện tại. Vui lòng thử thay đổi tiêu chí tìm kiếm.
            </p>
            <button 
              onClick={() => setFilters({ makes: [], priceRange: null, fuelTypes: [] })}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-full hover:opacity-90"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          viewMode === 'grid' 
            ? <CarGridView cars={cars} /> 
            : <CarListView cars={cars} />
        )}
      </div>
    </div>
  );
}

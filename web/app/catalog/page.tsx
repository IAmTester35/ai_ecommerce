import React from 'react';
import Link from 'next/link';
import { MOCK_CARS, formatCurrency } from '@/lib/mockData';
import { Filter } from 'lucide-react';

export default function Catalog() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-card border rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <Filter className="w-5 h-5" />
              <h2 className="font-bold text-lg">Bộ lọc</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Thương hiệu</h3>
                <div className="space-y-2">
                  {['VinFast', 'Honda', 'Mercedes', 'Toyota', 'Porsche'].map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Mức giá</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" className="text-primary focus:ring-primary" />
                    <span className="text-sm">Dưới 1 tỷ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" className="text-primary focus:ring-primary" />
                    <span className="text-sm">1 tỷ - 3 tỷ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" className="text-primary focus:ring-primary" />
                    <span className="text-sm">Trên 3 tỷ</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Danh Mục Xe</h1>
            <span className="text-muted-foreground">{MOCK_CARS.length} kết quả</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {MOCK_CARS.map(car => (
              <Link href={`/car/${car.id}`} key={car.id} className="group flex flex-col bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img 
                    src={car.imageUrl} 
                    alt={car.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{car.brand}</p>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{car.name}</h3>
                  <div className="mt-auto pt-4 flex justify-between items-end border-t">
                    <span className="text-lg font-bold text-primary">{formatCurrency(car.price)}</span>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">{car.fuelType}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { DatabaseCar, getCarImage } from '@/lib/types';
import { Car, Settings, Calendar } from 'lucide-react';
import Link from 'next/link';

interface CarGridViewProps {
  cars: DatabaseCar[];
}

export function CarGridView({ cars }: CarGridViewProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map(car => (
        <Link href={`/car/${car.id}`} key={car.id} className="group flex flex-col bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img 
              src={getCarImage(car.id)} 
              alt={car.model} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{car.make}</p>
            <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">{car.model}</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Settings className="w-3.5 h-3.5" />
                <span className="truncate">{car.metadata?.transmission || 'Tự động'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{car.year}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 flex justify-between items-end border-t">
              <span className="text-lg font-bold text-primary">{formatPrice(car.price)}</span>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                {car.metadata?.engine_fuel_type || 'Xăng'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import React from 'react';
import { DatabaseCar, getCarImage } from '@/lib/types';
import { Car, Settings, Calendar } from 'lucide-react';
import Link from 'next/link';

interface CarListViewProps {
  cars: DatabaseCar[];
}

export function CarListView({ cars }: CarListViewProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="flex flex-col gap-6">
      {cars.map(car => (
        <Link href={`/car/${car.id}`} key={car.id} className="group flex flex-col md:flex-row gap-6 p-4 md:p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
          <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shrink-0">
            <img 
              src={getCarImage(car.id)} 
              alt={car.model} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          <div className="flex flex-col flex-1 justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{car.make}</p>
                  <h3 className="text-2xl font-bold tracking-tight mt-1 group-hover:text-primary transition-colors">{car.model}</h3>
                </div>
                <div className="sm:text-right mt-2 sm:mt-0">
                  <p className="text-2xl font-bold text-primary">{formatPrice(car.price)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Settings className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{car.metadata?.transmission || 'Tự động'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{car.year}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{car.metadata?.engine_fuel_type || 'Xăng'}</span>
                </div>
              </div>

              <p className="text-muted-foreground line-clamp-2 text-sm">
                Mẫu xe {car.model} thuộc thương hiệu {car.make}, trang bị công suất {car.engine_hp || 'tiêu chuẩn'} HP sản xuất năm {car.year}. Một lựa chọn hoàn hảo trong tầm giá.
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity">
                Đặt Lịch
              </button>
              <button className="flex-1 bg-secondary text-secondary-foreground font-semibold py-2.5 px-4 rounded-xl hover:bg-secondary/80 transition-colors">
                Xem Chi Tiết
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

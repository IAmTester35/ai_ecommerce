import React from 'react';
import { CarResponse } from '@/lib/api';
import { Car, DollarSign, Settings, Calendar } from 'lucide-react';

interface CarCardProps {
  car: CarResponse;
}

export function CarCard({ car }: CarCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shrink-0">
        <img 
          src={car.image_url} 
          alt={car.car_name} 
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{car.manufacturer}</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">{car.car_name}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatPrice(car.price)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="p-2 rounded-lg bg-secondary">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{car.engine_type}</span>
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
              <span className="font-medium">Chính hãng</span>
            </div>
          </div>

          <p className="text-muted-foreground line-clamp-2">
            {car.description || `Mẫu xe ${car.car_name} thuộc thương hiệu ${car.manufacturer}, trang bị động cơ ${car.engine_type} sản xuất năm ${car.year}. Một lựa chọn hoàn hảo trong tầm giá.`}
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-6">
          <button className="flex-1 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity">
            Đặt Lịch Lái Thử
          </button>
          <button className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 px-4 rounded-xl hover:bg-secondary/80 transition-colors">
            Xem Chi Tiết
          </button>
        </div>
      </div>
    </div>
  );
}

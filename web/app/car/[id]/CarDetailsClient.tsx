"use client";

import React from 'react';
import { DatabaseCar, getCarImage } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Check, Settings, Calendar, Fuel, Heart, ShieldCheck } from 'lucide-react';

export function CarDetailsClient({ car }: { car: DatabaseCar }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [added, setAdded] = React.useState(false);

  const isWishlisted = wishlist.some(c => c.id === car.id);

  const handleAddToCart = () => {
    // Add logic later for cart items if needed, using the store
    // Currently store expects Car type which has different fields. 
    // This is just UI placeholder.
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  
  const formatPrice = (price: number | null) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-muted relative">
            <img 
              src={getCarImage(car.id)} 
              alt={car.model} 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => toggleWishlist(car as any)}
              className="absolute top-4 right-4 p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white transition-colors"
            >
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-black'}`} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">{car.make}</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{car.model}</h1>
          <p className="text-3xl font-bold text-primary mb-8">{formatPrice(car.price)}</p>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-b pb-8">
            Mẫu xe {car.model} thuộc thương hiệu {car.make}. Một lựa chọn hoàn hảo trong tầm giá.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Động cơ</span>
              </div>
              <p className="font-semibold">{car.engine_hp || 'N/A'} HP</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Fuel className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Nhiên liệu</span>
              </div>
              <p className="font-semibold">{car.metadata?.engine_fuel_type || 'Gasoline'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Sản xuất</span>
              </div>
              <p className="font-semibold">{car.year}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <button 
              onClick={handleAddToCart}
              disabled={added}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 px-8 rounded-full font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> Đã lưu thông tin
                </>
              ) : (
                'Đặt cọc ngay'
              )}
            </button>
          </div>
          
          <div className="mt-6 flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Bảo hành chính hãng 3 năm hoặc 100.000km
          </div>
        </div>
      </div>
    </div>
  );
}

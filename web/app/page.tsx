import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { DatabaseCar, getCarImage } from '@/lib/types';

async function FeaturedCars() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true)
    .limit(3);
    
  const featuredCars = (data as DatabaseCar[]) || [];

  const formatPrice = (price: number | null) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {featuredCars.map(car => (
        <Link href={`/car/${car.id}`} key={car.id} className="group flex flex-col bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img 
              src={getCarImage(car.id)} 
              alt={car.model} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-6 flex flex-col flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{car.make}</p>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{car.model}</h3>
            <div className="flex items-center justify-between mt-auto pt-4 border-t">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Giá từ</span>
                <span className="text-lg font-bold text-primary">{formatPrice(car.price)}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-black text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2066&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Tìm Chiếc Xe Trong Mơ Của Bạn
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Trải nghiệm nền tảng mua bán ô tô thông minh thế hệ mới, hỗ trợ bởi trí tuệ nhân tạo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/ai-chat" 
              className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              Chat với AI Tư Vấn
            </Link>
            <Link 
              href="/catalog" 
              className="flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all w-full sm:w-auto justify-center"
            >
              Xem Tất Cả Xe
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Xe Nổi Bật</h2>
              <p className="text-muted-foreground">Những mẫu xe được yêu thích nhất trong tuần</p>
            </div>
            <Link href="/catalog" className="hidden sm:flex items-center gap-2 text-primary hover:underline font-medium">
              Xem thêm <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Đang tải...</div>}>
            <FeaturedCars />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

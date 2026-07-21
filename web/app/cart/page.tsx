"use client";

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/mockData';
import { Trash2, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart } = useStore();

  const total = cart.reduce((sum, item) => sum + item.car.price, 0);
  const deposit = total * 0.1; // 10% deposit

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
        <p className="text-muted-foreground mb-8 text-center">Bạn chưa chọn mẫu xe nào để đặt cọc.</p>
        <Link href="/catalog" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90">
          Xem Danh Mục Xe
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.car.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-card border rounded-3xl">
              <div className="w-full sm:w-48 aspect-[4/3] rounded-2xl overflow-hidden shrink-0">
                <img src={item.car.imageUrl} alt={item.car.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">{item.car.brand}</p>
                  <h3 className="text-xl font-bold mt-1 mb-2">{item.car.name}</h3>
                  <p className="text-primary font-bold">{formatCurrency(item.car.price)}</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Phí cọc (10%): <strong className="text-foreground">{formatCurrency(item.car.price * 0.1)}</strong></span>
                  <button 
                    onClick={() => removeFromCart(item.car.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-card border rounded-3xl p-8 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Tổng kết</h2>
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng giá trị xe</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí cọc dự kiến (10%)</span>
                <span className="font-semibold">{formatCurrency(deposit)}</span>
              </div>
              <div className="flex justify-between border-t pt-4 mt-4">
                <span className="font-bold text-lg">Cần thanh toán</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(deposit)}</span>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity">
              Tiến hành Thanh toán <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Bằng việc thanh toán, bạn đồng ý với Điều khoản dịch vụ của AutoMatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

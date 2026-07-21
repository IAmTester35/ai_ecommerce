"use client";

import React from 'react';
import { Sparkles, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary text-primary-foreground rounded-2xl mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
          <p className="text-muted-foreground mt-2">Đăng nhập để lưu lịch sử và trải nghiệm tốt nhất</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Mật khẩu</label>
              <span className="text-xs text-primary hover:underline cursor-pointer">Quên mật khẩu?</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mt-6">
            Đăng nhập
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có tài khoản? <span className="text-primary hover:underline cursor-pointer font-medium">Đăng ký ngay</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, User, Sparkles, Car } from 'lucide-react';
import { useStore } from '@/lib/store';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { cart, wishlist } = useStore();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Danh mục xe', path: '/catalog' },
    { name: 'Tư vấn AI', path: '/ai-chat' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AutoMatch</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.path ? 'text-primary border-b-2 border-primary py-1' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <Link href="/wishlist" className="relative group">
              <Heart className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative group">
              <ShoppingCart className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link href="/auth" className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/80 transition-colors">
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline-block">Đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

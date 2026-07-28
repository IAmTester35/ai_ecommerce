import React from 'react';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export const metadata = {
  title: 'Danh mục xe | AutoMatch AI',
  description: 'Khám phá danh sách các mẫu xe đa dạng với nhiều tùy chọn bộ lọc thông minh từ AutoMatch AI.',
};

export default function CatalogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CatalogClient initialCars={[]} />
    </div>
  );
}

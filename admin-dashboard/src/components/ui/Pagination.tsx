import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  className,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 border-t border-slate-100 bg-white rounded-b-2xl text-xs text-slate-500', className)}>
      <div>
        {totalItems !== undefined ? (
          <span>
            Hiển thị <strong className="text-slate-800 font-semibold">{startItem}</strong> -{' '}
            <strong className="text-slate-800 font-semibold">{endItem}</strong> trong tổng số{' '}
            <strong className="text-slate-800 font-semibold">{totalItems}</strong> mục
          </span>
        ) : (
          <span>
            Trang <strong className="text-slate-800 font-semibold">{currentPage}</strong> / {totalPages}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 3 + i;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                pageNum === currentPage
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

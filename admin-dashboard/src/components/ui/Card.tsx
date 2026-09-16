import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/70 rounded-2xl sm:rounded-3xl shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300/80 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-5 sm:px-7 sm:py-5 border-b border-slate-100/80 flex items-center justify-between gap-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-base sm:text-lg font-semibold text-slate-900 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 sm:p-7', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4 sm:px-7 sm:py-4 border-t border-slate-100/80 bg-slate-50/40 rounded-b-2xl sm:rounded-b-3xl flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
};


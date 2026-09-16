import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g., +12.5% or -3.2%
  changePeriod?: string; // e.g., 'so với tháng trước'
  icon: React.ReactNode;
  iconBgColor?: string; // e.g. 'bg-blue-50 text-blue-600'
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changePeriod = 'so với tháng trước',
  icon,
  iconBgColor = 'bg-blue-50 text-blue-600 border border-blue-100/60',
  subtitle,
  className,
  onClick,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isZero = change !== undefined && change === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200/70 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300/80 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between',
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : '',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">{title}</p>
          <div className={cn('w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105', iconBgColor)}>
            {icon}
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {value}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-1.5 font-normal leading-relaxed">{subtitle}</p>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-5 pt-3.5 border-t border-slate-100/80 flex items-center gap-2 text-xs">
          {isPositive && (
            <span className="inline-flex items-center font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />+{change}%
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[11px]">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />{change}%
            </span>
          )}
          {isZero && (
            <span className="inline-flex items-center font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
              <Minus className="w-3.5 h-3.5 mr-0.5" />0%
            </span>
          )}
          <span className="text-slate-400 text-xs truncate">{changePeriod}</span>
        </div>
      )}
    </div>
  );
};

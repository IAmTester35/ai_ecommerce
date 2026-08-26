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
  iconBgColor = 'bg-blue-50 text-blue-600 border border-blue-100',
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
        'bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm',
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : '',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className={cn('p-3 rounded-xl shrink-0 flex items-center justify-center', iconBgColor)}>
          {icon}
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          {isPositive && (
            <span className="inline-flex items-center font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />+{change}%
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />{change}%
            </span>
          )}
          {isZero && (
            <span className="inline-flex items-center font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
              <Minus className="w-3 h-3 mr-0.5" />0%
            </span>
          )}
          <span className="text-slate-400 truncate">{changePeriod}</span>
        </div>
      )}
    </div>
  );
};

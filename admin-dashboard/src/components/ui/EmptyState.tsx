import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

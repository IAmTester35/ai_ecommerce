import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  if (variant === 'underline') {
    return (
      <div className={cn('border-b border-slate-200 flex items-center gap-6 overflow-x-auto', className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'pb-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium',
                    isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[11px] rounded-full font-medium',
                  isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  shortcutHint?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm dữ liệu...',
  className,
  onClear,
  shortcutHint,
}) => {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all hover:border-slate-300 shadow-2xs"
      />

      <div className="absolute right-3 flex items-center gap-1.5">
        {value && (
          <button
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcutHint && !value && (
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            {shortcutHint}
          </kbd>
        )}
      </div>
    </div>
  );
};

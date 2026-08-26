import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', disabled ? 'opacity-50 cursor-not-allowed' : '', className)}>
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors'
          )}
        />
      </div>

      {(label || description) && (
        <div className="text-left">
          {label && <p className="text-sm font-medium text-slate-900">{label}</p>}
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      )}
    </label>
  );
};

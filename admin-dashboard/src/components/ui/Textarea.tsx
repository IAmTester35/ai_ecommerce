import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full bg-white border rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

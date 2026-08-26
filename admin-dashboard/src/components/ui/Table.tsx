import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <table className={cn('w-full text-left border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => {
  return (
    <thead className={cn('bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => {
  return (
    <tr className={cn('transition-colors duration-100 hover:bg-slate-50/70 group', className)} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => {
  return (
    <th className={cn('py-3.5 px-4 font-semibold text-slate-700 select-none whitespace-nowrap', className)} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => {
  return (
    <td className={cn('py-3.5 px-4 text-slate-800 align-middle', className)} {...props}>
      {children}
    </td>
  );
};

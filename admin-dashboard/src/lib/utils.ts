import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to USD Standard ($)
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact USD currency notation (e.g., $2.5M, $850K)
 */
export function formatUSDCompact(amount: number | null | undefined): string {
  if (!amount || isNaN(amount)) return '$0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const b = abs / 1_000_000_000;
    return `${sign}$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return formatUSD(amount);
}

// Aliases for backwards compatibility
export const formatVND = formatUSD;
export const formatVNDCompact = formatUSDCompact;

/**
 * Format date time to Vietnamese locale
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '---';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '---';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function truncateText(text: string | null | undefined, length = 60): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

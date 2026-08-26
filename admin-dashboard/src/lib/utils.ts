import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Vietnamese Standard (VNĐ / Tỷ / Triệu)
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact Vietnamese currency notation (e.g., 2.5 tỷ, 850 triệu)
 */
export function formatVNDCompact(amount: number | null | undefined): string {
  if (!amount || isNaN(amount)) return '0 ₫';
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(2)} Tỷ ₫`;
  }
  if (amount >= 1_000_000) {
    const tr = amount / 1_000_000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)} Triệu ₫`;
  }
  return formatVND(amount);
}

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

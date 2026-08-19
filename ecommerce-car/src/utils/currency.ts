/**
 * Currency Conversion and Formatting Utilities
 * Handles USD (Database default) to VND (UI default) conversion.
 */

export const DEFAULT_USD_TO_VND_RATE = 25400;

/**
 * Converts USD price to VND.
 * @param usd Amount in USD
 * @param rate Optional exchange rate (defaults to 25,400)
 */
export const usdToVnd = (
  usd?: number | null,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (usd === null || usd === undefined || isNaN(usd) || usd <= 0) return 0;
  return Math.round(usd * rate);
};

/**
 * Converts VND price to USD.
 * @param vnd Amount in VND
 * @param rate Optional exchange rate (defaults to 25,400)
 */
export const vndToUsd = (
  vnd?: number | null,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (vnd === null || vnd === undefined || isNaN(vnd) || vnd <= 0) return 0;
  return Math.round(vnd / rate);
};

/**
 * Formats a VND amount into human-readable Vietnamese currency string.
 * @param amountInVnd Amount in Vietnamese Dong
 */
export const formatVnd = (amountInVnd?: number | null): string => {
  if (!amountInVnd || amountInVnd <= 0) return 'Liên hệ giá';

  if (amountInVnd >= 1_000_000_000) {
    const billions = (amountInVnd / 1_000_000_000).toFixed(2).replace(/\.00$/, '');
    return `${billions} tỷ VNĐ`;
  }

  if (amountInVnd >= 1_000_000) {
    const millions = (amountInVnd / 1_000_000).toFixed(0);
    return `${millions} triệu VNĐ`;
  }

  return `${amountInVnd.toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Formats a USD amount into USD currency string.
 * @param amountInUsd Amount in USD
 */
export const formatUsd = (amountInUsd?: number | null): string => {
  if (!amountInUsd || amountInUsd <= 0) return 'Contact for price';
  return `$${amountInUsd.toLocaleString('en-US')}`;
};

/**
 * Formats a car's price (stored in USD in DB) into VND for UI display.
 * @param price Raw price value from database (USD) or already converted VND
 * @param unit The unit of the input price parameter ('usd' | 'vnd'). Defaults to 'usd'.
 */
export const formatVndPrice = (
  price?: number | null,
  unit: 'usd' | 'vnd' = 'usd'
): string => {
  if (!price || price <= 0) return 'Liên hệ giá';
  const vndAmount = unit === 'usd' ? usdToVnd(price) : price;
  return formatVnd(vndAmount);
};

/**
 * Formats a car price showing both VND and USD for clarity.
 * Example: "533 triệu VNĐ (~$20,990)"
 */
export const formatCarPrice = (
  priceInUsd?: number | null,
  options?: { showUsd?: boolean }
): string => {
  if (!priceInUsd || priceInUsd <= 0) return 'Liên hệ giá';
  const vndStr = formatVnd(usdToVnd(priceInUsd));
  if (options?.showUsd) {
    return `${vndStr} (~${formatUsd(priceInUsd)})`;
  }
  return vndStr;
};

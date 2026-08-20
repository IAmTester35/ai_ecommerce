/**
 * Currency Conversion and Formatting Utilities
 * Presentation & Formatting Layer - reuses pricingEngine for automotive domain math.
 */

import {
  DEFAULT_USD_TO_VND_RATE,
  DEFAULT_PRICE_MULTIPLIER,
  CarSpecInput,
  CarPricingBreakdown,
  OnTheRoadFees,
  InstallmentPlan,
  calculateCarPriceBreakdown,
  usdToEstimatedVnd,
  vndToUsd as engineVndToUsd,
  calculateOnTheRoadPrice,
  calculateInstallmentPlan,
  getCarTaxRates,
} from './pricingEngine';

export {
  DEFAULT_USD_TO_VND_RATE,
  DEFAULT_PRICE_MULTIPLIER,
  calculateCarPriceBreakdown,
  calculateOnTheRoadPrice,
  calculateInstallmentPlan,
  getCarTaxRates,
};
export type { CarSpecInput, CarPricingBreakdown, OnTheRoadFees, InstallmentPlan };

/**
 * Converts USD price to realistic Vietnam Showroom Listed VND.
 * Takes into account import duties, special consumption tax, VAT and dealer margins.
 */
export const usdToVnd = (
  usd?: number | null,
  specOrRate?: CarSpecInput | number,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (usd === null || usd === undefined || isNaN(usd) || usd <= 0) return 0;
  
  if (typeof specOrRate === 'number') {
    return usdToEstimatedVnd(usd, undefined, specOrRate);
  }
  return usdToEstimatedVnd(usd, specOrRate, rate);
};

/**
 * Converts VND price back to raw USD MSRP.
 * Inverse conversion for filters and search queries.
 */
export const vndToUsd = (
  vnd?: number | null,
  specOrRate?: CarSpecInput | number,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (vnd === null || vnd === undefined || isNaN(vnd) || vnd <= 0) return 0;
  
  if (typeof specOrRate === 'number') {
    return engineVndToUsd(vnd, undefined, specOrRate);
  }
  return engineVndToUsd(vnd, specOrRate, rate);
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
 * @param spec Optional car technical spec for exact tax calculation.
 */
export const formatVndPrice = (
  price?: number | null,
  unit: 'usd' | 'vnd' = 'usd',
  spec?: CarSpecInput
): string => {
  if (!price || price <= 0) return 'Liên hệ giá';
  const vndAmount = unit === 'usd' ? usdToVnd(price, spec) : price;
  return formatVnd(vndAmount);
};

/**
 * Formats a car price showing both VND and USD for clarity.
 * Example: "1.93 tỷ VNĐ (~$30,000)"
 */
export const formatCarPrice = (
  priceInUsd?: number | null,
  options?: { showUsd?: boolean; spec?: CarSpecInput }
): string => {
  if (!priceInUsd || priceInUsd <= 0) return 'Liên hệ giá';
  const vndStr = formatVnd(usdToVnd(priceInUsd, options?.spec));
  if (options?.showUsd) {
    return `${vndStr} (~${formatUsd(priceInUsd)})`;
  }
  return vndStr;
};

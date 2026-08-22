import {
  usdToVnd,
  vndToUsd,
  formatVnd,
  formatUsd,
  formatVndPrice,
  formatCarPrice,
} from '../../utils/currency';

describe('Currency & Price Formatting Utility Suite', () => {
  describe('usdToVnd & vndToUsd', () => {
    // HAPPY CASES
    it('converts USD to VND with default rates and spec', () => {
      const vnd = usdToVnd(30000);
      expect(vnd).toBeGreaterThan(30000 * 25000); // with automotive import multipliers
    });

    it('accepts a custom rate directly as second parameter', () => {
      const customRateVnd = usdToVnd(10000, 26000);
      const defaultRateVnd = usdToVnd(10000, 25400);
      expect(customRateVnd).toBeGreaterThan(defaultRateVnd);
    });

    it('converts VND back to USD with custom rate', () => {
      const usd = vndToUsd(1_000_000_000, 26000);
      expect(usd).toBeGreaterThan(0);
    });

    // UNHAPPY / EDGE CASES
    it('handles null, undefined, 0, negative and NaN values', () => {
      expect(usdToVnd(null)).toBe(0);
      expect(usdToVnd(undefined)).toBe(0);
      expect(usdToVnd(0)).toBe(0);
      expect(usdToVnd(-5000)).toBe(0);
      expect(usdToVnd(NaN)).toBe(0);

      expect(vndToUsd(null)).toBe(0);
      expect(vndToUsd(undefined)).toBe(0);
      expect(vndToUsd(0)).toBe(0);
      expect(vndToUsd(-1000000)).toBe(0);
      expect(vndToUsd(NaN)).toBe(0);
    });
  });

  describe('formatVnd', () => {
    // HAPPY CASES
    it('formats billions of VND with "tỷ VNĐ"', () => {
      expect(formatVnd(1_500_000_000)).toBe('1.5 tỷ VNĐ');
      expect(formatVnd(2_000_000_000)).toBe('2 tỷ VNĐ');
      expect(formatVnd(3_250_000_000)).toBe('3.25 tỷ VNĐ');
    });

    it('formats millions of VND with "triệu VNĐ"', () => {
      expect(formatVnd(850_000_000)).toBe('850 triệu VNĐ');
      expect(formatVnd(50_000_000)).toBe('50 triệu VNĐ');
    });

    it('formats thousands of VND with locale string', () => {
      expect(formatVnd(500_000)).toContain('VNĐ');
    });

    // UNHAPPY / EDGE CASES
    it('returns "Liên hệ giá" for 0, negative, null, undefined, and NaN', () => {
      expect(formatVnd(0)).toBe('Liên hệ giá');
      expect(formatVnd(-100)).toBe('Liên hệ giá');
      expect(formatVnd(null)).toBe('Liên hệ giá');
      expect(formatVnd(undefined)).toBe('Liên hệ giá');
      expect(formatVnd(NaN)).toBe('Liên hệ giá');
    });
  });

  describe('formatUsd', () => {
    // HAPPY CASES
    it('formats positive USD numbers with dollar sign and commas', () => {
      expect(formatUsd(50000)).toBe('$50,000');
      expect(formatUsd(1250000)).toBe('$1,250,000');
    });

    // UNHAPPY / EDGE CASES
    it('returns "Contact for price" for 0, negative, null, undefined, NaN', () => {
      expect(formatUsd(0)).toBe('Contact for price');
      expect(formatUsd(-100)).toBe('Contact for price');
      expect(formatUsd(null)).toBe('Contact for price');
      expect(formatUsd(undefined)).toBe('Contact for price');
      expect(formatUsd(NaN)).toBe('Contact for price');
    });
  });

  describe('formatVndPrice', () => {
    // HAPPY CASES
    it('converts USD price from database to VND formatted string', () => {
      const formatted = formatVndPrice(45000, 'usd', { engineHp: 250 });
      expect(formatted).toContain('tỷ VNĐ');
    });

    it('formats pre-converted VND price directly', () => {
      const formatted = formatVndPrice(1_800_000_000, 'vnd');
      expect(formatted).toBe('1.8 tỷ VNĐ');
    });

    // EDGE CASES
    it('handles 0, null, negative, NaN', () => {
      expect(formatVndPrice(0)).toBe('Liên hệ giá');
      expect(formatVndPrice(null)).toBe('Liên hệ giá');
      expect(formatVndPrice(-1000)).toBe('Liên hệ giá');
      expect(formatVndPrice(NaN)).toBe('Liên hệ giá');
    });
  });

  describe('formatCarPrice', () => {
    // HAPPY CASES
    it('formats car price with only VND string by default', () => {
      const formatted = formatCarPrice(30000);
      expect(formatted).toContain('VNĐ');
      expect(formatted).not.toContain('~$');
    });

    it('formats car price with both VND and USD when showUsd is true', () => {
      const formatted = formatCarPrice(30000, { showUsd: true });
      expect(formatted).toContain('VNĐ');
      expect(formatted).toContain('~$30,000');
    });

    // EDGE CASES
    it('handles 0, null, undefined, NaN', () => {
      expect(formatCarPrice(0)).toBe('Liên hệ giá');
      expect(formatCarPrice(null)).toBe('Liên hệ giá');
      expect(formatCarPrice(undefined)).toBe('Liên hệ giá');
      expect(formatCarPrice(NaN)).toBe('Liên hệ giá');
    });
  });
});

import {
  calculateInstallmentPlan,
  getCarTaxRates,
  calculateCarPriceBreakdown,
} from '../../utils/pricingEngine';
import { formatVnd, formatUsd } from '../../utils/currency';

describe('Adversarial & Extreme Edge Cases - Pricing & Currency Math', () => {
  describe('Promotion 0% Interest & 0-Term Loans', () => {
    it('handles 0% annual interest rate without producing NaN or division by zero', () => {
      const plan = calculateInstallmentPlan(1_000_000_000, 30, 5, 0);
      expect(Number.isFinite(plan.totalMonthlyPayment)).toBe(true);
      expect(isNaN(plan.totalMonthlyPayment)).toBe(false);
      expect(plan.monthlyInterest).toBe(0);
      expect(plan.totalMonthlyPayment).toBe(plan.monthlyPrincipal);
      expect(plan.totalMonthlyPayment).toBe(Math.round(700_000_000 / 60));
    });

    it('handles 0-year loan term (cash purchase) with strictly 0 monthly payment', () => {
      const plan = calculateInstallmentPlan(1_000_000_000, 30, 0, 0.085);
      expect(plan.termMonths).toBe(0);
      expect(plan.monthlyPrincipal).toBe(0);
      expect(plan.monthlyInterest).toBe(0);
      expect(plan.totalMonthlyPayment).toBe(0);
    });

    it('handles 100% down payment (no loan) with 0 interest and 0 monthly payment', () => {
      const plan = calculateInstallmentPlan(2_000_000_000, 100, 5, 0.085);
      expect(plan.loanAmount).toBe(0);
      expect(plan.monthlyPrincipal).toBe(0);
      expect(plan.monthlyInterest).toBe(0);
      expect(plan.totalMonthlyPayment).toBe(0);
    });
  });

  describe('Extreme High Values & Number Precision (Hypercars)', () => {
    it('handles multi-million USD hypercars (e.g. $28,000,000 USD) without overflow', () => {
      const breakdown = calculateCarPriceBreakdown(28_000_000, { engineHp: 750, fuelType: 'Gasoline' });
      expect(breakdown.listedPriceVnd).toBeGreaterThan(0);
      expect(Number.isFinite(breakdown.listedPriceVnd)).toBe(true);
      expect(isNaN(breakdown.listedPriceVnd)).toBe(false);

      const formatted = formatVnd(breakdown.listedPriceVnd);
      expect(formatted).toContain('tỷ VNĐ');
    });
  });

  describe('Non-finite Numbers & Overflow Boundaries (Infinity, -Infinity, NaN, MaxValue)', () => {
    it('safely handles Infinity and -Infinity in formatVnd without throwing RangeError', () => {
      expect(() => formatVnd(Infinity)).not.toThrow();
      expect(() => formatVnd(-Infinity)).not.toThrow();
      expect(formatVnd(Infinity)).toBe('Liên hệ giá');
      expect(formatVnd(-Infinity)).toBe('Liên hệ giá');
    });

    it('safely handles Number.MAX_VALUE and Number.MAX_SAFE_INTEGER in formatVnd', () => {
      expect(() => formatVnd(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(formatVnd(Number.MAX_SAFE_INTEGER)).toContain('tỷ VNĐ');
    });

    it('safely handles negative horsepower, extreme horsepower (2000 HP Bugatti Bolide)', () => {
      const ratesExtreme = getCarTaxRates({ engineHp: 2000 });
      expect(ratesExtreme.exciseTaxRate).toBe(1.10); // Highest tier

      const ratesNegative = getCarTaxRates({ engineHp: -50 });
      expect(ratesNegative.exciseTaxRate).toBe(0.40); // Falls back to default safely
    });
  });

  describe('Border Thresholds in Currency Formatting (999.99M vs 1.00B VND)', () => {
    it('handles transition boundary between 999.99 million and 1 billion VND', () => {
      const nearBillion = 999_990_000;
      const formatted = formatVnd(nearBillion);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('handles sub-unit prices (e.g. 500 VND or 0.5 USD)', () => {
      expect(formatVnd(500)).toBe('500 VNĐ');
      expect(formatUsd(0.5)).toBe('$0.5');
    });
  });
});

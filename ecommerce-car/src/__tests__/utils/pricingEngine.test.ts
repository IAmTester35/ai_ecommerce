import {
  getCarTaxRates,
  calculateCarPriceBreakdown,
  usdToEstimatedVnd,
  vndToUsd,
  calculateOnTheRoadPrice,
  calculateInstallmentPlan,
} from '../../utils/pricingEngine';

describe('Pricing Engine - Automotive Tax & Financing Calculation Suite', () => {
  describe('getCarTaxRates', () => {
    // HAPPY CASES
    it('returns default tax rates for undefined spec', () => {
      const rates = getCarTaxRates();
      expect(rates.importDutyRate).toBe(0.5);
      expect(rates.exciseTaxRate).toBe(0.4);
      expect(rates.vatRate).toBe(0.10);
      expect(rates.dealerMarginRate).toBe(0.10);
    });

    it('applies 5% excise tax and 25% preferential import duty for electric vehicles (EV)', () => {
      const ratesEv = getCarTaxRates({ fuelType: 'Điện' });
      expect(ratesEv.exciseTaxRate).toBe(0.05);
      expect(ratesEv.importDutyRate).toBe(0.25);

      const ratesElectric = getCarTaxRates({ fuelType: 'electric' });
      expect(ratesElectric.exciseTaxRate).toBe(0.05);
      expect(ratesElectric.importDutyRate).toBe(0.25);
    });

    it('calculates tiered excise tax based on horsepower (engine_hp)', () => {
      // < 160 HP -> 35%
      expect(getCarTaxRates({ engineHp: 120 }).exciseTaxRate).toBe(0.35);
      // 160 - 220 HP -> 40%
      expect(getCarTaxRates({ engineHp: 200 }).exciseTaxRate).toBe(0.40);
      // 221 - 300 HP -> 55%
      expect(getCarTaxRates({ engineHp: 300 }).exciseTaxRate).toBe(0.55);
      // 301 - 420 HP -> 90%
      expect(getCarTaxRates({ engineHp: 400 }).exciseTaxRate).toBe(0.90);
      // > 420 HP -> 110%
      expect(getCarTaxRates({ engineHp: 550 }).exciseTaxRate).toBe(1.10);
    });

    it('applies 30% preferential excise tax for Hybrid vehicles', () => {
      const hybridRates = getCarTaxRates({ engineHp: 200, fuelType: 'Hybrid xăng điện' });
      expect(hybridRates.exciseTaxRate).toBe(0.30);
    });

    // EDGE & CORNER CASES
    it('handles boundary values for horsepower tiers exactly', () => {
      expect(getCarTaxRates({ engineHp: 159 }).exciseTaxRate).toBe(0.35);
      expect(getCarTaxRates({ engineHp: 220 }).exciseTaxRate).toBe(0.40);
      expect(getCarTaxRates({ engineHp: 300 }).exciseTaxRate).toBe(0.55);
      expect(getCarTaxRates({ engineHp: 420 }).exciseTaxRate).toBe(0.90);
      expect(getCarTaxRates({ engineHp: 421 }).exciseTaxRate).toBe(1.10);
    });

    it('handles null, undefined, negative, or NaN horsepower safely', () => {
      expect(getCarTaxRates({ engineHp: null as any }).exciseTaxRate).toBe(0.40);
      expect(getCarTaxRates({ engineHp: -50 }).exciseTaxRate).toBe(0.40);
      expect(getCarTaxRates({ engineHp: NaN }).exciseTaxRate).toBe(0.40);
    });
  });

  describe('calculateCarPriceBreakdown', () => {
    // HAPPY CASES
    it('calculates full cascaded tax breakdown accurately for ICE car', () => {
      const usdPrice = 50000;
      const rate = 25000;
      const spec = { engineHp: 200 }; // excise = 40%, import = 50%, vat = 10%, margin = 10%
      const result = calculateCarPriceBreakdown(usdPrice, spec, rate);

      expect(result.rawUsd).toBe(50000);
      expect(result.baseCifVnd).toBe(50000 * 25000); // 1,250,000,000
      expect(result.importDutyAmount).toBe(Math.round(1250000000 * 0.5)); // 625,000,000
      const priceAfterImport = 1250000000 + 625000000; // 1,875,000,000
      expect(result.exciseTaxAmount).toBe(Math.round(priceAfterImport * 0.4)); // 750,000,000
      const priceAfterExcise = priceAfterImport + 750000000; // 2,625,000,000
      expect(result.vatAmount).toBe(Math.round(priceAfterExcise * 0.1)); // 262,500,000
      const priceAfterVat = priceAfterExcise + 262500000; // 2,887,500,000
      expect(result.dealerMarginAmount).toBe(Math.round(priceAfterVat * 0.1)); // 288,750,000
      expect(result.listedPriceVnd).toBe(priceAfterVat + 288750000); // 3,176,250,000
      expect(result.effectiveMultiplier).toBeCloseTo(3176250000 / 1250000000, 4);
    });

    it('calculates lower effective multiplier for Electric Vehicle', () => {
      const usdPrice = 40000;
      const evBreakdown = calculateCarPriceBreakdown(usdPrice, { fuelType: 'Điện' });
      const iceBreakdown = calculateCarPriceBreakdown(usdPrice, { fuelType: 'Xăng', engineHp: 300 });

      expect(evBreakdown.effectiveMultiplier).toBeLessThan(iceBreakdown.effectiveMultiplier);
      expect(evBreakdown.importDutyRate).toBe(0.25);
    });

    // UNHAPPY / EDGE CASES
    it('returns zeroes for zero, negative, null or undefined USD price', () => {
      const resZero = calculateCarPriceBreakdown(0);
      expect(resZero.rawUsd).toBe(0);
      expect(resZero.listedPriceVnd).toBe(0);
      expect(resZero.effectiveMultiplier).toBe(0);

      const resNeg = calculateCarPriceBreakdown(-10000);
      expect(resNeg.rawUsd).toBe(0);
      expect(resNeg.listedPriceVnd).toBe(0);

      const resNull = calculateCarPriceBreakdown(null);
      expect(resNull.rawUsd).toBe(0);
      expect(resNull.listedPriceVnd).toBe(0);

      const resNaN = calculateCarPriceBreakdown(NaN);
      expect(resNaN.rawUsd).toBe(0);
      expect(resNaN.listedPriceVnd).toBe(0);
    });
  });

  describe('usdToEstimatedVnd & vndToUsd', () => {
    // HAPPY CASES
    it('converts USD to estimated VND and converts back to near original USD', () => {
      const originalUsd = 60000;
      const spec = { engineHp: 200, fuelType: 'Xăng' };
      const vnd = usdToEstimatedVnd(originalUsd, spec);
      expect(vnd).toBeGreaterThan(0);

      const backUsd = vndToUsd(vnd, spec);
      // Because of rounding at multiple steps, back conversion should be within 1% of original USD
      expect(Math.abs(backUsd - originalUsd) / originalUsd).toBeLessThan(0.01);
    });

    // UNHAPPY & EDGE CASES
    it('usdToEstimatedVnd handles 0, negative, null, undefined', () => {
      expect(usdToEstimatedVnd(0)).toBe(0);
      expect(usdToEstimatedVnd(-500)).toBe(0);
      expect(usdToEstimatedVnd(null)).toBe(0);
      expect(usdToEstimatedVnd(undefined)).toBe(0);
      expect(usdToEstimatedVnd(NaN)).toBe(0);
    });

    it('vndToUsd handles 0, negative, null, undefined, invalid rate', () => {
      expect(vndToUsd(0)).toBe(0);
      expect(vndToUsd(-100000000)).toBe(0);
      expect(vndToUsd(null)).toBe(0);
      expect(vndToUsd(undefined)).toBe(0);
      expect(vndToUsd(NaN)).toBe(0);
      expect(vndToUsd(1000000000, undefined, 0)).toBe(0);
      expect(vndToUsd(1000000000, undefined, -25000)).toBe(0);
    });
  });

  describe('calculateOnTheRoadPrice', () => {
    // HAPPY CASES
    it('calculates Hanoi/HCM on-the-road price with 12% registration fee & 20M plate', () => {
      const listedPrice = 1_000_000_000;
      const result = calculateOnTheRoadPrice(listedPrice, { location: 'hanoi_hcm', seatingCapacity: 5 });

      expect(result.listedPriceVnd).toBe(1_000_000_000);
      expect(result.registrationFeeRate).toBe(0.12);
      expect(result.registrationFee).toBe(120_000_000);
      expect(result.plateFee).toBe(20_000_000);
      expect(result.inspectionFee).toBe(340_000);
      expect(result.roadMaintenanceFee).toBe(1_560_000);
      expect(result.mandatoryInsuranceFee).toBe(480_700);
      expect(result.totalOnTheRoadPrice).toBe(
        1_000_000_000 + 120_000_000 + 20_000_000 + 340_000 + 1_560_000 + 480_700
      );
    });

    it('calculates Province on-the-road price with 10% registration fee & 1M plate', () => {
      const listedPrice = 800_000_000;
      const result = calculateOnTheRoadPrice(listedPrice, { location: 'province', seatingCapacity: 7 });

      expect(result.registrationFeeRate).toBe(0.10);
      expect(result.registrationFee).toBe(80_000_000);
      expect(result.plateFee).toBe(1_000_000);
      expect(result.mandatoryInsuranceFee).toBe(873_400); // 7 seats
    });

    it('exempts registration fee (0%) for EV', () => {
      const listedPrice = 1_500_000_000;
      const result = calculateOnTheRoadPrice(listedPrice, { isEV: true, location: 'hanoi_hcm' });
      expect(result.registrationFeeRate).toBe(0);
      expect(result.registrationFee).toBe(0);
      expect(result.totalOnTheRoadPrice).toBe(
        1_500_000_000 + 0 + 20_000_000 + 340_000 + 1_560_000 + 480_700
      );
    });

    // EDGE CASES
    it('returns zeroes when listedPrice is 0, negative, or NaN', () => {
      const resZero = calculateOnTheRoadPrice(0);
      expect(resZero.totalOnTheRoadPrice).toBe(0);
      expect(resZero.registrationFee).toBe(0);

      const resNeg = calculateOnTheRoadPrice(-500000);
      expect(resNeg.totalOnTheRoadPrice).toBe(0);

      const resNaN = calculateOnTheRoadPrice(NaN);
      expect(resNaN.totalOnTheRoadPrice).toBe(0);
    });
  });

  describe('calculateInstallmentPlan', () => {
    // HAPPY CASES
    it('computes 5-year loan installment plan with 30% down payment and 8.5% interest', () => {
      const totalVnd = 1_000_000_000;
      const plan = calculateInstallmentPlan(totalVnd, 30, 5, 0.085);

      expect(plan.totalPriceVnd).toBe(1_000_000_000);
      expect(plan.downPaymentPercent).toBe(30);
      expect(plan.downPaymentAmount).toBe(300_000_000);
      expect(plan.loanAmount).toBe(700_000_000);
      expect(plan.termMonths).toBe(60);
      expect(plan.monthlyPrincipal).toBe(Math.round(700_000_000 / 60));
      expect(plan.monthlyInterest).toBe(Math.round((700_000_000 * 0.085) / 12));
      expect(plan.totalMonthlyPayment).toBe(plan.monthlyPrincipal + plan.monthlyInterest);
    });

    // CORNER & EDGE CASES
    it('handles 100% down payment (zero loan)', () => {
      const plan = calculateInstallmentPlan(1_000_000_000, 100, 3, 0.08);
      expect(plan.downPaymentAmount).toBe(1_000_000_000);
      expect(plan.loanAmount).toBe(0);
      expect(plan.monthlyPrincipal).toBe(0);
      expect(plan.monthlyInterest).toBe(0);
      expect(plan.totalMonthlyPayment).toBe(0);
    });

    it('handles 0% down payment (full loan)', () => {
      const plan = calculateInstallmentPlan(500_000_000, 0, 4, 0.10);
      expect(plan.downPaymentAmount).toBe(0);
      expect(plan.loanAmount).toBe(500_000_000);
      expect(plan.monthlyPrincipal).toBe(Math.round(500_000_000 / 48));
    });

    it('clamps negative or >100 down payment percentages', () => {
      const planNeg = calculateInstallmentPlan(1_000_000_000, -20, 5, 0.085);
      expect(planNeg.downPaymentPercent).toBe(0);

      const planExcess = calculateInstallmentPlan(1_000_000_000, 150, 5, 0.085);
      expect(planExcess.downPaymentPercent).toBe(100);
    });

    it('safely handles 0 or negative price, 0 term, or NaN inputs', () => {
      const res0 = calculateInstallmentPlan(0);
      expect(res0.totalMonthlyPayment).toBe(0);

      const resNegPrice = calculateInstallmentPlan(-1000);
      expect(resNegPrice.totalMonthlyPayment).toBe(0);

      const res0Term = calculateInstallmentPlan(100_000_000, 30, 0, 0.08);
      expect(res0Term.monthlyPrincipal).toBe(0);
      expect(res0Term.totalMonthlyPayment).toBe(res0Term.monthlyInterest);
    });
  });
});

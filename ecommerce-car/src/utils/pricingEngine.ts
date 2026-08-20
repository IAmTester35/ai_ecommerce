/**
 * Automotive Pricing & Tax Calculation Engine (Vietnam Market)
 * Single Source of Truth for car pricing, taxes, on-the-road costs, and financing.
 * Follows Separation of Concerns (SoC) - Pure business logic with zero UI coupling.
 */

export const DEFAULT_USD_TO_VND_RATE = 25400;

// Standard general multiplier when car specifications are unspecified (1.5 * 1.4 * 1.1 * 1.1 ≈ 2.54)
export const DEFAULT_PRICE_MULTIPLIER = 2.54;

export interface CarSpecInput {
  engineHp?: number | null;
  fuelType?: string | null;
  seatingCapacity?: number | null;
}

export interface TaxRates {
  importDutyRate: number;    // e.g. 0.50 (50%)
  exciseTaxRate: number;     // e.g. 0.40 (40%)
  vatRate: number;           // e.g. 0.10 (10%)
  dealerMarginRate: number;  // e.g. 0.10 (10%)
}

export interface CarPricingBreakdown {
  rawUsd: number;
  baseCifVnd: number;
  
  // Taxes & margins
  importDutyRate: number;
  importDutyAmount: number;
  
  exciseTaxRate: number;
  exciseTaxAmount: number;
  
  vatRate: number;
  vatAmount: number;
  
  dealerMarginRate: number;
  dealerMarginAmount: number;
  
  // Final Showroom Listed Price
  listedPriceVnd: number;
  effectiveMultiplier: number;
}

export interface OnTheRoadFees {
  listedPriceVnd: number;
  registrationFeeRate: number;
  registrationFee: number;
  plateFee: number;
  inspectionFee: number;
  roadMaintenanceFee: number;
  mandatoryInsuranceFee: number;
  totalOnTheRoadPrice: number;
}

export interface InstallmentPlan {
  totalPriceVnd: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  termYears: number;
  termMonths: number;
  annualInterestRate: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  totalMonthlyPayment: number;
}

/**
 * Determines tax rates based on car technical specifications.
 */
export const getCarTaxRates = (spec?: CarSpecInput): TaxRates => {
  const fuel = (spec?.fuelType || '').toLowerCase();
  const hp = spec?.engineHp || 0;
  const isEV = fuel.includes('electric') || fuel.includes('điện') || fuel.includes('ev');
  const isHybrid = fuel.includes('hybrid');

  // 1. Import Duty Rate (Thuế nhập khẩu)
  // EV gets preferential import duty (~25%), standard CBU import (~50%)
  const importDutyRate = isEV ? 0.25 : 0.50;

  // 2. Special Consumption Tax Rate (Thuế TTĐB theo Luật sửa đổi)
  let exciseTaxRate = 0.40; // Default gasoline ~150-200 HP

  if (isEV) {
    exciseTaxRate = 0.05; // 3 - 5% for electric vehicles
  } else if (isHybrid) {
    exciseTaxRate = 0.30; // ~70% of standard gasoline tax
  } else if (hp > 0) {
    if (hp < 160) {
      exciseTaxRate = 0.35; // < 1.5L
    } else if (hp <= 220) {
      exciseTaxRate = 0.40; // 1.5L - 2.0L
    } else if (hp <= 300) {
      exciseTaxRate = 0.55; // 2.0L - 3.0L
    } else if (hp <= 420) {
      exciseTaxRate = 0.90; // 3.0L - 4.0L (sports / high performance)
    } else {
      exciseTaxRate = 1.10; // > 4.0L (supercars)
    }
  }

  // 3. VAT Rate (10%)
  const vatRate = 0.10;

  // 4. Dealer & Logistics Margin Rate (10%)
  const dealerMarginRate = 0.10;

  return {
    importDutyRate,
    exciseTaxRate,
    vatRate,
    dealerMarginRate,
  };
};

/**
 * Calculates complete pricing & tax breakdown from raw USD base price.
 */
export const calculateCarPriceBreakdown = (
  rawUsd?: number | null,
  spec?: CarSpecInput,
  rate = DEFAULT_USD_TO_VND_RATE
): CarPricingBreakdown => {
  if (!rawUsd || rawUsd <= 0 || isNaN(rawUsd)) {
    return {
      rawUsd: 0,
      baseCifVnd: 0,
      importDutyRate: 0,
      importDutyAmount: 0,
      exciseTaxRate: 0,
      exciseTaxAmount: 0,
      vatRate: 0,
      vatAmount: 0,
      dealerMarginRate: 0,
      dealerMarginAmount: 0,
      listedPriceVnd: 0,
      effectiveMultiplier: 0,
    };
  }

  const { importDutyRate, exciseTaxRate, vatRate, dealerMarginRate } = getCarTaxRates(spec);

  // Step 1: Base CIF in VND
  const baseCifVnd = Math.round(rawUsd * rate);

  // Step 2: Import Duty = Base CIF * Import Rate
  const importDutyAmount = Math.round(baseCifVnd * importDutyRate);
  const priceAfterImport = baseCifVnd + importDutyAmount;

  // Step 3: Special Consumption Tax = Price After Import * Excise Rate
  const exciseTaxAmount = Math.round(priceAfterImport * exciseTaxRate);
  const priceAfterExcise = priceAfterImport + exciseTaxAmount;

  // Step 4: VAT = Price After Excise * VAT Rate (10%)
  const vatAmount = Math.round(priceAfterExcise * vatRate);
  const priceAfterVat = priceAfterExcise + vatAmount;

  // Step 5: Dealer & Logistics Margin
  const dealerMarginAmount = Math.round(priceAfterVat * dealerMarginRate);
  const listedPriceVnd = priceAfterVat + dealerMarginAmount;

  const effectiveMultiplier = baseCifVnd > 0 ? listedPriceVnd / baseCifVnd : DEFAULT_PRICE_MULTIPLIER;

  return {
    rawUsd,
    baseCifVnd,
    importDutyRate,
    importDutyAmount,
    exciseTaxRate,
    exciseTaxAmount,
    vatRate,
    vatAmount,
    dealerMarginRate,
    dealerMarginAmount,
    listedPriceVnd,
    effectiveMultiplier,
  };
};

/**
 * Converts raw USD price to estimated Vietnam Showroom Listed Price (VND).
 */
export const usdToEstimatedVnd = (
  usd?: number | null,
  spec?: CarSpecInput,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (usd === null || usd === undefined || isNaN(usd) || usd <= 0) return 0;
  const breakdown = calculateCarPriceBreakdown(usd, spec, rate);
  return breakdown.listedPriceVnd;
};

/**
 * Inverse conversion: Converts Vietnam Showroom Listed Price (VND) back to raw USD MSRP.
 * Used for database search filters and budget constraint mapping.
 */
export const vndToUsd = (
  vnd?: number | null,
  spec?: CarSpecInput,
  rate = DEFAULT_USD_TO_VND_RATE
): number => {
  if (vnd === null || vnd === undefined || isNaN(vnd) || vnd <= 0) return 0;
  const { importDutyRate, exciseTaxRate, vatRate, dealerMarginRate } = getCarTaxRates(spec);
  const multiplier = (1 + importDutyRate) * (1 + exciseTaxRate) * (1 + vatRate) * (1 + dealerMarginRate);
  const rawUsd = vnd / (rate * multiplier);
  return Math.round(rawUsd);
};

/**
 * Calculates on-the-road (lăn bánh) registration and statutory fees in Vietnam.
 */
export const calculateOnTheRoadPrice = (
  listedPriceVnd: number,
  options?: {
    location?: 'hanoi_hcm' | 'province';
    isEV?: boolean;
    seatingCapacity?: number;
  }
): OnTheRoadFees => {
  if (!listedPriceVnd || listedPriceVnd <= 0) {
    return {
      listedPriceVnd: 0,
      registrationFeeRate: 0,
      registrationFee: 0,
      plateFee: 0,
      inspectionFee: 0,
      roadMaintenanceFee: 0,
      mandatoryInsuranceFee: 0,
      totalOnTheRoadPrice: 0,
    };
  }

  const isHanoiOrHcm = (options?.location || 'hanoi_hcm') === 'hanoi_hcm';
  const isEV = !!options?.isEV;
  const seating = options?.seatingCapacity || 5;

  // Registration fee: 12% in HN, 10% in HCM/provinces. 0% for EVs under current decree.
  const registrationFeeRate = isEV ? 0 : isHanoiOrHcm ? 0.12 : 0.10;
  const registrationFee = Math.round(listedPriceVnd * registrationFeeRate);

  // License plate: 20M in HN/HCM, 1M in provinces
  const plateFee = isHanoiOrHcm ? 20_000_000 : 1_000_000;

  // Technical inspection
  const inspectionFee = 340_000;

  // Annual Road Maintenance fee (standard passenger car)
  const roadMaintenanceFee = 1_560_000;

  // Compulsory Civil Liability Insurance (~480k for <= 5 seats, ~873k for 6-11 seats)
  const mandatoryInsuranceFee = seating > 5 ? 873_400 : 480_700;

  const totalOnTheRoadPrice =
    listedPriceVnd +
    registrationFee +
    plateFee +
    inspectionFee +
    roadMaintenanceFee +
    mandatoryInsuranceFee;

  return {
    listedPriceVnd,
    registrationFeeRate,
    registrationFee,
    plateFee,
    inspectionFee,
    roadMaintenanceFee,
    mandatoryInsuranceFee,
    totalOnTheRoadPrice,
  };
};

/**
 * Calculates bank installment financing loan breakdown.
 */
export const calculateInstallmentPlan = (
  totalPriceVnd: number,
  downPaymentPercent = 30,
  termYears = 5,
  annualInterestRate = 0.085
): InstallmentPlan => {
  if (!totalPriceVnd || totalPriceVnd <= 0) {
    return {
      totalPriceVnd: 0,
      downPaymentPercent,
      downPaymentAmount: 0,
      loanAmount: 0,
      termYears,
      termMonths: termYears * 12,
      annualInterestRate,
      monthlyPrincipal: 0,
      monthlyInterest: 0,
      totalMonthlyPayment: 0,
    };
  }

  const downPaymentAmount = Math.round((totalPriceVnd * downPaymentPercent) / 100);
  const loanAmount = Math.max(0, totalPriceVnd - downPaymentAmount);
  const termMonths = termYears * 12;

  const monthlyPrincipal = termMonths > 0 ? loanAmount / termMonths : 0;
  const monthlyInterest = (loanAmount * annualInterestRate) / 12;
  const totalMonthlyPayment = Math.round(monthlyPrincipal + monthlyInterest);

  return {
    totalPriceVnd,
    downPaymentPercent,
    downPaymentAmount,
    loanAmount,
    termYears,
    termMonths,
    annualInterestRate,
    monthlyPrincipal: Math.round(monthlyPrincipal),
    monthlyInterest: Math.round(monthlyInterest),
    totalMonthlyPayment,
  };
};

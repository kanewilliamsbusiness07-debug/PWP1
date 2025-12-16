/**
 * Australian Income Tax Calculator
 * Tax year: 2024-2025
 * Source: Australian Taxation Office (ATO)
 */

export interface TaxBracket {
  min: number;
  max: number | null; // null for highest bracket
  rate: number;
  baseTax: number;
  description: string;
}

// Official ATO tax brackets for 2024-25
export const ATO_TAX_BRACKETS_2024_25: TaxBracket[] = [
  {
    min: 0,
    max: 18200,
    rate: 0,
    baseTax: 0,
    description: 'Tax-free threshold',
  },
  {
    min: 18201,
    max: 45000,
    rate: 0.16,
    baseTax: 0,
    description: '16% rate',
  },
  {
    min: 45001,
    max: 135000,
    rate: 0.30,
    baseTax: 4288,
    description: '30% rate',
  },
  {
    min: 135001,
    max: 190000,
    rate: 0.37,
    baseTax: 31288,
    description: '37% rate',
  },
  {
    min: 190001,
    max: null,
    rate: 0.45,
    baseTax: 51638,
    description: '45% rate',
  },
];

/**
 * Calculate income tax based on taxable income
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Tax payable in AUD
 */
export const calculateIncomeTax = (taxableIncome: number): number => {
  // Validate input
  if (taxableIncome < 0) {
    throw new Error('Taxable income cannot be negative');
  }

  // Round to 2 decimal places
  taxableIncome = Math.round(taxableIncome * 100) / 100;

  // Tax-free threshold
  if (taxableIncome <= 18200) {
    return 0;
  }

  // $18,201 – $45,000: 16c for each $1 over $18,200
  if (taxableIncome <= 45000) {
    const taxableAmount = taxableIncome - 18200;
    return Math.round(taxableAmount * 0.16 * 100) / 100;
  }

  // $45,001 – $135,000: $4,288 plus 30c for each $1 over $45,000
  if (taxableIncome <= 135000) {
    const taxableAmount = taxableIncome - 45000;
    const tax = 4288 + (taxableAmount * 0.30);
    return Math.round(tax * 100) / 100;
  }

  // $135,001 – $190,000: $31,288 plus 37c for each $1 over $135,000
  if (taxableIncome <= 190000) {
    const taxableAmount = taxableIncome - 135000;
    const tax = 31288 + (taxableAmount * 0.37);
    return Math.round(tax * 100) / 100;
  }

  // $190,001 and over: $51,638 plus 45c for each $1 over $190,000
  const taxableAmount = taxableIncome - 190000;
  const tax = 51638 + (taxableAmount * 0.45);
  return Math.round(tax * 100) / 100;
};

/**
 * Calculate Medicare Levy (2%)
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Medicare levy payable
 */
export const calculateMedicareLevy = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;

  // Standard 2% levy
  const levy = taxableIncome * 0.02;
  return Math.round(levy * 100) / 100;
};

/**
 * Get the marginal tax rate for a given income
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Marginal tax rate as decimal (e.g., 0.30 for 30%)
 */
export const getMarginalTaxRate = (taxableIncome: number): number => {
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return 0.16;
  if (taxableIncome <= 135000) return 0.30;
  if (taxableIncome <= 190000) return 0.37;
  return 0.45;
};

/**
 * Calculate effective (average) tax rate
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Effective tax rate as decimal
 */
export const getEffectiveTaxRate = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;

  const tax = calculateIncomeTax(taxableIncome);
  return tax / taxableIncome;
};

/**
 * Calculate total tax including Medicare levy
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Object with breakdown of all taxes
 */
export interface TaxBreakdown {
  taxableIncome: number;
  incomeTax: number;
  medicareLevy: number;
  totalTax: number;
  netIncome: number;
  marginalRate: number;
  effectiveRate: number;
}

export const calculateTotalTax = (taxableIncome: number): TaxBreakdown => {
  const incomeTax = calculateIncomeTax(taxableIncome);
  const medicareLevy = calculateMedicareLevy(taxableIncome);
  const totalTax = incomeTax + medicareLevy;
  const netIncome = taxableIncome - totalTax;
  const marginalRate = getMarginalTaxRate(taxableIncome);
  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0;

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    incomeTax: Math.round(incomeTax * 100) / 100,
    medicareLevy: Math.round(medicareLevy * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 10000,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
  };
};

/**
 * Get tax bracket information for a given income
 * @param taxableIncome - Annual taxable income in AUD
 * @returns Tax bracket object
 */
export const getTaxBracket = (taxableIncome: number): TaxBracket | null => {
  for (const bracket of ATO_TAX_BRACKETS_2024_25) {
    if (taxableIncome >= bracket.min && (bracket.max === null || taxableIncome <= bracket.max)) {
      return bracket;
    }
  }
  return null;
};

/**
 * Calculate tax on additional income (useful for optimization scenarios)
 * @param currentIncome - Current annual income
 * @param additionalIncome - Additional income to calculate tax on
 * @returns Tax on the additional income
 */
export const calculateTaxOnAdditionalIncome = (
  currentIncome: number,
  additionalIncome: number
): number => {
  const currentTax = calculateIncomeTax(currentIncome);
  const newTax = calculateIncomeTax(currentIncome + additionalIncome);
  return newTax - currentTax;
};
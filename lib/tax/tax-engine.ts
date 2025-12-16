/**
 * FinCalc Pro - Australian Tax Calculation Engine
 * 
 * This module implements a pluggable tax calculation system that can be updated
 * with current Australian tax rules without code changes.
 * 
 * IMPORTANT: Tax rules must be updated regularly to reflect current ATO guidelines.
 * See README.md for instructions on updating tax rules.
 */

export interface TaxBracket {
  min: number;
  max: number | null; // null for top bracket
  rate: number; // As decimal (e.g., 0.19 for 19%)
  baseAmount: number; // Cumulative tax at bracket minimum
}

export interface TaxRules {
  version: string;
  effectiveDate: string;
  taxYear: string;
  
  // Income tax brackets
  incomeTaxBrackets: TaxBracket[];
  
  // Medicare Levy
  medicareLevy: {
    rate: number;
    threshold: number;
    singleThreshold: number;
    familyThreshold: number;
  };
  
  // HECS/HELP thresholds and rates
  hecsThresholds: Array<{
    min: number;
    max: number | null;
    rate: number;
  }>;
  
  // Negative gearing rules
  negativeGearing: {
    allowed: boolean;
    depreciationRate: number;
    capitalWorksDeduction: number;
  };
  
  // Capital gains tax
  capitalGainsTax: {
    discountRate: number; // 50% discount for individuals
    indexationAllowed: boolean;
  };
  
  // Deduction categories and limits
  deductionCategories: {
    [category: string]: {
      maxAmount?: number;
      requiresReceipts: boolean;
      description: string;
    };
  };
}

export interface TaxCalculationInput {
  grossIncome: number;
  deductions: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  negativeGearingLoss?: number;
  capitalGains?: number;
  frankedDividends?: number;
  hecsBalance?: number;
  medicareExemption?: boolean;
}

export interface TaxCalculationResult {
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  medicareLevy: number;
  hecsRepayment: number;
  totalTax: number;
  afterTaxIncome: number;
  marginalTaxRate: number;
  averageTaxRate: number;
  breakdown: {
    deductions: number;
    negativeGearing: number;
    frankedCredits: number;
  };
}

/**
 * Default Australian Tax Rules for 2024-25 Financial Year
 * IMPORTANT: Update this with current ATO rates and thresholds
 */
export const DEFAULT_TAX_RULES: TaxRules = {
  version: "2024-25",
  effectiveDate: "2024-07-01",
  taxYear: "2024-25",
  
  incomeTaxBrackets: [
    { min: 0, max: 18200, rate: 0, baseAmount: 0 },
    { min: 18200, max: 45000, rate: 0.16, baseAmount: 0 },
    { min: 45000, max: 135000, rate: 0.30, baseAmount: 4288 },
    { min: 135000, max: 190000, rate: 0.37, baseAmount: 31288 },
    { min: 190000, max: null, rate: 0.45, baseAmount: 51638 }
  ],
  
  medicareLevy: {
    rate: 0.02, // 2%
    threshold: 24276,
    singleThreshold: 24276,
    familyThreshold: 40939
  },
  
  hecsThresholds: [
    { min: 51550, max: 59518, rate: 0.01 },
    { min: 59519, max: 65000, rate: 0.02 },
    { min: 65001, max: 71999, rate: 0.025 },
    { min: 72000, max: 79999, rate: 0.03 },
    { min: 80000, max: 89999, rate: 0.035 },
    { min: 90000, max: 100000, rate: 0.04 },
    { min: 100001, max: 109999, rate: 0.045 },
    { min: 110000, max: 124999, rate: 0.05 },
    { min: 125000, max: 139999, rate: 0.055 },
    { min: 140000, max: null, rate: 0.10 }
  ],
  
  negativeGearing: {
    allowed: true,
    depreciationRate: 0.025, // 2.5% for building depreciation
    capitalWorksDeduction: 0.025 // 2.5% for capital works
  },
  
  capitalGainsTax: {
    discountRate: 0.5, // 50% CGT discount
    indexationAllowed: false // Not available since 1999
  },
  
  deductionCategories: {
    "work-related": {
      description: "Work-related expenses",
      requiresReceipts: true
    },
    "investment": {
      description: "Investment property expenses",
      requiresReceipts: true
    },
    "professional": {
      description: "Professional development and memberships",
      requiresReceipts: true
    },
    "charitable": {
      description: "Charitable donations",
      requiresReceipts: true
    }
  }
};

/**
 * Calculate income tax based on current tax brackets
 */
export function calculateIncomeTax(taxableIncome: number, taxRules: TaxRules): number {
  if (taxableIncome <= 0) return 0;
  
  for (const bracket of taxRules.incomeTaxBrackets) {
    const isInBracket = taxableIncome >= bracket.min && 
      (bracket.max === null || taxableIncome <= bracket.max);
    
    if (isInBracket) {
      const taxableInBracket = taxableIncome - bracket.min;
      return bracket.baseAmount + (taxableInBracket * bracket.rate);
    }
  }
  
  // Should not reach here if brackets are properly configured
  return 0;
}

/**
 * Calculate Medicare Levy
 */
export function calculateMedicareLevy(
  taxableIncome: number, 
  taxRules: TaxRules,
  isExempt: boolean = false
): number {
  if (isExempt || taxableIncome <= taxRules.medicareLevy.threshold) {
    return 0;
  }
  
  return taxableIncome * taxRules.medicareLevy.rate;
}

/**
 * Calculate HECS/HELP repayment
 */
export function calculateHecsRepayment(
  grossIncome: number,
  taxRules: TaxRules,
  hecsBalance: number = 0
): number {
  if (hecsBalance <= 0) return 0;
  
  for (const threshold of taxRules.hecsThresholds) {
    const isInThreshold = grossIncome >= threshold.min && 
      (threshold.max === null || grossIncome <= threshold.max);
    
    if (isInThreshold) {
      const repaymentAmount = grossIncome * threshold.rate;
      return Math.min(repaymentAmount, hecsBalance); // Don't exceed debt
    }
  }
  
  return 0;
}

/**
 * Calculate marginal tax rate (rate on next dollar earned)
 */
export function calculateMarginalTaxRate(taxableIncome: number, taxRules: TaxRules): number {
  for (const bracket of taxRules.incomeTaxBrackets) {
    const isInBracket = taxableIncome >= bracket.min && 
      (bracket.max === null || taxableIncome <= bracket.max);
    
    if (isInBracket) {
      let marginalRate = bracket.rate;
      
      // Add Medicare Levy if applicable
      if (taxableIncome > taxRules.medicareLevy.threshold) {
        marginalRate += taxRules.medicareLevy.rate;
      }
      
      // Add HECS rate if applicable
      for (const threshold of taxRules.hecsThresholds) {
        const isInHecsThreshold = taxableIncome >= threshold.min && 
          (threshold.max === null || taxableIncome <= threshold.max);
        if (isInHecsThreshold) {
          marginalRate += threshold.rate;
          break;
        }
      }
      
      return marginalRate;
    }
  }
  
  return 0;
}

/**
 * Main tax calculation function
 * Returns comprehensive tax calculation with breakdown
 */
export function calculateTax(
  input: TaxCalculationInput,
  taxRules: TaxRules = DEFAULT_TAX_RULES
): TaxCalculationResult {
  // Calculate total deductions
  const totalDeductions = input.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  const negativeGearingLoss = input.negativeGearingLoss || 0;
  const frankedCredits = (input.frankedDividends || 0) * 0.3; // 30% franking credit
  
  // Calculate taxable income
  let taxableIncome = input.grossIncome - totalDeductions;
  
  // Apply negative gearing if allowed
  if (taxRules.negativeGearing.allowed && negativeGearingLoss > 0) {
    taxableIncome -= negativeGearingLoss;
  }
  
  // Add franked dividends and credits
  if (input.frankedDividends) {
    taxableIncome += input.frankedDividends + frankedCredits;
  }
  
  // Ensure non-negative taxable income
  taxableIncome = Math.max(0, taxableIncome);
  
  // Calculate tax components
  const incomeTax = calculateIncomeTax(taxableIncome, taxRules);
  const medicareLevy = calculateMedicareLevy(taxableIncome, taxRules, input.medicareExemption);
  const hecsRepayment = calculateHecsRepayment(input.grossIncome, taxRules, input.hecsBalance);
  
  // Subtract franking credits from income tax
  const adjustedIncomeTax = Math.max(0, incomeTax - frankedCredits);
  
  const totalTax = adjustedIncomeTax + medicareLevy + hecsRepayment;
  const afterTaxIncome = input.grossIncome - totalTax;
  
  const marginalTaxRate = calculateMarginalTaxRate(taxableIncome, taxRules);
  const averageTaxRate = input.grossIncome > 0 ? totalTax / input.grossIncome : 0;
  
  return {
    grossIncome: input.grossIncome,
    taxableIncome,
    incomeTax: adjustedIncomeTax,
    medicareLevy,
    hecsRepayment,
    totalTax,
    afterTaxIncome,
    marginalTaxRate,
    averageTaxRate,
    breakdown: {
      deductions: totalDeductions,
      negativeGearing: negativeGearingLoss,
      frankedCredits
    }
  };
}

/**
 * Calculate tax optimization scenarios
 * Compares current tax vs optimized tax with strategies applied
 */
export function calculateTaxOptimization(
  baseInput: TaxCalculationInput,
  optimizationStrategies: {
    additionalDeductions?: number;
    negativeGearingOpportunity?: number;
    superContributions?: number;
  },
  taxRules: TaxRules = DEFAULT_TAX_RULES
): {
  currentTax: TaxCalculationResult;
  optimizedTax: TaxCalculationResult;
  savings: number;
  strategies: string[];
} {
  const currentTax = calculateTax(baseInput, taxRules);
  
  // Create optimized scenario
  const optimizedInput: TaxCalculationInput = {
    ...baseInput,
    deductions: [
      ...baseInput.deductions,
      ...(optimizationStrategies.additionalDeductions ? [{
        category: 'optimization',
        amount: optimizationStrategies.additionalDeductions,
        description: 'Additional tax deductions'
      }] : [])
    ],
    negativeGearingLoss: (baseInput.negativeGearingLoss || 0) + 
      (optimizationStrategies.negativeGearingOpportunity || 0)
  };
  
  // Reduce gross income if super contributions are made (salary sacrifice)
  if (optimizationStrategies.superContributions) {
    optimizedInput.grossIncome -= optimizationStrategies.superContributions;
  }
  
  const optimizedTax = calculateTax(optimizedInput, taxRules);
  const savings = currentTax.totalTax - optimizedTax.totalTax;
  
  const strategies: string[] = [];
  if (optimizationStrategies.additionalDeductions) {
    strategies.push(`Claim additional deductions: $${optimizationStrategies.additionalDeductions.toLocaleString()}`);
  }
  if (optimizationStrategies.negativeGearingOpportunity) {
    strategies.push(`Negative gearing opportunity: $${optimizationStrategies.negativeGearingOpportunity.toLocaleString()}`);
  }
  if (optimizationStrategies.superContributions) {
    strategies.push(`Salary sacrifice to super: $${optimizationStrategies.superContributions.toLocaleString()}`);
  }
  
  return {
    currentTax,
    optimizedTax,
    savings,
    strategies
  };
}
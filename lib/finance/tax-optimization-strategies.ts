/**
 * Tax Optimization Strategies
 * 
 * Shared utility for generating consistent tax optimization strategies
 * used by both the Tax Optimization page and Summary page.
 */

export interface OptimizationStrategy {
  strategy: string;
  description: string;
  potentialSaving: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Deductions' | 'Super' | 'Investments' | 'Timing' | 'Other';
}

export interface TaxCalculationResult {
  annualIncome: number;
  taxableIncome: number;
  incomeTax: number;
  medicareLevy: number;
  hecsRepayment: number;
  totalTax: number;
  afterTaxIncome: number;
  marginalTaxRate: number;
  averageTaxRate: number;
  frankedCredits: number;
  totalDeductions: number;
}

/**
 * Generate tax optimization strategies based on current tax situation
 */
export function generateOptimizationStrategies(
  data: {
    annualIncome?: number;
    employmentIncome?: number;
    grossIncome?: number;
    investmentIncome?: number;
    rentalIncome?: number;
    otherIncome?: number;
    charityDonations?: number;
    workRelatedExpenses?: number;
    capitalGains?: number;
    rentalExpenses?: number;
    healthInsurance?: boolean;
    superContributions?: number;
    frankedDividends?: number;
  },
  currentResult: TaxCalculationResult
): OptimizationStrategy[] {
  const strategies: OptimizationStrategy[] = [];

  const income = data.annualIncome ?? data.employmentIncome ?? data.grossIncome ?? 0;

  // Charitable donations optimization
  if ((data.charityDonations ?? 0) < 2000) {
    const suggestedDonation = 2000 - (data.charityDonations ?? 0);
    const taxSaving = suggestedDonation * (currentResult.marginalTaxRate / 100);
    strategies.push({
      strategy: 'Charitable Donations',
      description: `Increase charitable donations by $${suggestedDonation.toLocaleString()} to maximize tax deductions. This is fully tax deductible at your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
      potentialSaving: taxSaving,
      difficulty: 'Easy',
      category: 'Deductions'
    });
  }

  // Pre-tax super contributions
  const maxConcessionalCap = 27500;
  const currentSuperContributions = data.superContributions ?? 0;
  if (currentSuperContributions < maxConcessionalCap && income > 50000) {
    const potentialContribution = Math.min(
      maxConcessionalCap - currentSuperContributions,
      income * 0.15
    );
    const taxSaving = potentialContribution * ((currentResult.marginalTaxRate - 15) / 100);
    strategies.push({
      strategy: 'Superannuation Contribution',
      description: `Make additional pre-tax super contributions of $${potentialContribution.toLocaleString()} to save on tax. This will be taxed at 15% instead of your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
      potentialSaving: taxSaving,
      difficulty: 'Medium',
      category: 'Super'
    });
  }

  // Negative gearing optimization for existing rental properties
  const currentRentalIncome = data.rentalIncome ?? 0;
  const currentRentalExpenses = data.rentalExpenses ?? 0;
  const currentNegativeGearing = Math.max(0, currentRentalExpenses - currentRentalIncome);

  if (currentNegativeGearing > 0) {
    const taxSaving = currentNegativeGearing * (currentResult.marginalTaxRate / 100);
    strategies.push({
      strategy: 'Rental Property Tax Optimization',
      description: `Your rental property is currently negatively geared with a loss of $${currentNegativeGearing.toLocaleString()}. This reduces your taxable income through negative gearing, resulting in tax savings at your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
      potentialSaving: taxSaving,
      difficulty: 'Medium',
      category: 'Investments'
    });
  }

  // Potential property investment opportunity
  if (currentRentalIncome === 0 && income > 80000) {
    const propertyValue = 750000; // Example property value
    const rentalYield = 0.04; // 4% rental yield
    const interestRate = 0.065; // 6.5% interest rate
    const potentialRent = propertyValue * rentalYield;
    const interestCost = propertyValue * 0.8 * interestRate; // Assuming 20% deposit
    const propertyExpenses = propertyValue * 0.02; // Estimated other expenses
    const potentialNegativeGearing = Math.max(0, interestCost + propertyExpenses - potentialRent);
    const taxSaving = potentialNegativeGearing * (currentResult.marginalTaxRate / 100);

    strategies.push({
      strategy: 'New Property Investment',
      description: `Consider an investment property worth $${propertyValue.toLocaleString()}. With rental income of $${potentialRent.toLocaleString()}/year and deductible expenses of $${(interestCost + propertyExpenses).toLocaleString()}/year, you could reduce your taxable income through negative gearing.`,
      potentialSaving: taxSaving,
      difficulty: 'Hard',
      category: 'Investments'
    });
  }

  // Private health insurance
  if (!data.healthInsurance && income > 90000) {
    const mlsSaving = Math.min(income * 0.015, 1500); // Medicare Levy Surcharge saving
    const insuranceCost = 2000; // Example annual premium
    const rebate = insuranceCost * 0.25; // Assuming 25% rebate tier
    const netCost = insuranceCost - rebate - mlsSaving;

    strategies.push({
      strategy: 'Private Health Insurance',
      description: `Take out private health insurance to avoid the Medicare Levy Surcharge of $${mlsSaving.toLocaleString()}. With a typical premium of $${insuranceCost.toLocaleString()} and rebate of $${rebate.toLocaleString()}, your net cost after tax savings would be $${netCost.toLocaleString()}.`,
      potentialSaving: mlsSaving,
      difficulty: 'Easy',
      category: 'Deductions'
    });
  }

  // Work-related deductions
  const potentialDeductions = Math.max(0, 3000 - (data.workRelatedExpenses ?? 0));
  if (potentialDeductions > 0) {
    strategies.push({
      strategy: 'Work-Related Expenses',
      description: `Claim additional work-related expenses of $${potentialDeductions.toLocaleString()} including home office, professional development, and tools. This could save you ${currentResult.marginalTaxRate.toFixed(1)}% in tax on these expenses.`,
      potentialSaving: potentialDeductions * (currentResult.marginalTaxRate / 100),
      difficulty: 'Easy',
      category: 'Deductions'
    });
  }

  // Capital gains timing
  if ((data.capitalGains ?? 0) > 0) {
    strategies.push({
      strategy: 'Capital Gains Tax Planning',
      description: 'Time asset sales to minimize tax impact and utilize CGT discount',
      potentialSaving: (data.capitalGains ?? 0) * 0.25 * (currentResult.marginalTaxRate / 100),
      difficulty: 'Medium',
      category: 'Timing'
    });
  }

  return strategies.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

/**
 * Calculate total potential tax savings from all strategies
 */
export function calculateTotalTaxSavings(strategies: OptimizationStrategy[]): number {
  return strategies.reduce((sum, strategy) => sum + strategy.potentialSaving, 0);
}

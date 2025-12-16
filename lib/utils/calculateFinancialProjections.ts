/**
 * Financial Projections Calculator
 *
 * Uses industry-standard financial formulas verified against online calculators
 * Implements proper compound interest, annuity calculations, and loan amortization
 */

import {
  calculateFutureValue,
  calculateFutureValueOfAnnuity,
  calculateRemainingLoanBalance,
  calculateSafeWithdrawal,
  validateFinancialInputs,
} from '@/lib/financial-calculations';

export interface InvestmentProperty {
  address: string;
  purchasePrice: number;
  currentValue: number;
  loanAmount: number;
  interestRate: number; // Annual percentage
  loanTerm: number; // Years
  weeklyRent: number;
  annualExpenses: number;
}

export interface Liability {
  lender: string;
  loanType: string;
  liabilityType: string;
  balanceOwing: number;
  repaymentAmount: number;
  frequency: 'W' | 'F' | 'M'; // Weekly, Fortnightly, Monthly
  interestRate: number;
  loanTerm: number;
  termRemaining: number;
}

export interface Asset {
  name: string;
  value: number;
  type: 'Property' | 'Super' | 'Shares' | 'Cash' | 'Other';
}

export interface Assumptions {
  inflationRate: number;
  salaryGrowthRate: number;
  superReturn: number;
  shareReturn: number;
  propertyGrowthRate: number;
  withdrawalRate: number;
  rentGrowthRate: number;
  savingsRate: number;
}

export interface FinancialInputs {
  // Income (all annual)
  annualIncome: number;
  rentalIncome: number;
  dividends: number;
  frankedDividends: number;
  capitalGains: number;
  otherIncome: number;

  // Expenses
  monthlyExpenses: number;

  // Assets & Liabilities
  assets: Asset[];
  liabilities: Liability[];
  investmentProperties: InvestmentProperty[];

  // Current Position
  currentAge: number;
  retirementAge: number;

  // Assumptions
  assumptions: Assumptions;
}

export interface ProjectionResults {
  // Current Position
  currentAge: number;
  retirementAge: number;
  currentSuper: number;
  currentSavings: number;
  currentShares: number;
  propertyEquity: number;
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyDebtPayments: number;
  monthlyRentalIncome: number;
  currentMonthlyCashflow: number;
  totalAnnualIncome: number;

  // Future Projections
  yearsToRetirement: number;
  futureSuper: number;
  futureShares: number;
  futurePropertyValue: number; // Total property value
  futurePropertyEquity: number; // Property value - remaining loans
  remainingPropertyLoans: number; // How much loan is left
  futurePropertyAssets: number; // General property assets
  futureOtherAssets: number; // Other assets
  futureSavings: number;
  combinedNetworthAtRetirement: number;

  // Retirement Income
  futureMonthlyRentalIncome: number;
  futureAnnualRentalIncome: number;
  annualSuperWithdrawal: number;
  monthlySuperWithdrawal: number;
  projectedAnnualPassiveIncome: number;
  combinedMonthlyCashflowRetirement: number;

  // Target & Surplus/Deficit
  finalAnnualIncome: number;
  requiredAnnualIncome: number;
  requiredMonthlyIncome: number;
  annualSurplusDeficit: number;
  monthlySurplusDeficit: number;
  status: 'surplus' | 'deficit';
  percentageOfTarget: number;
}

export function calculateFinancialProjections(inputs: FinancialInputs): ProjectionResults {
  // Validate inputs
  validateFinancialInputs({
    annualReturn: inputs.assumptions.superReturn / 100,
    years: inputs.retirementAge - inputs.currentAge,
    amount: inputs.annualIncome,
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
  });

  // ========================================
  // CONSTANTS
  // ========================================
  const SUPER_GUARANTEE_RATE = 0.12; // Super Guarantee Rate: 12% (ATO 2024-25, increased from 11.5% in July 2024)
  const QUARTERLY_EARNINGS_CAP = 63750; // ATO 2024-25 quarterly earnings cap
  const MAX_QUARTERLY_SUPER = QUARTERLY_EARNINGS_CAP * SUPER_GUARANTEE_RATE; // $7,650 quarterly maximum
  const MAX_ANNUAL_SUPER = MAX_QUARTERLY_SUPER * 4; // $30,600 annual maximum
  const RETIREMENT_INCOME_THRESHOLD = 0.70;

  const years = inputs.retirementAge - inputs.currentAge;

  // Convert rates to decimals
  const r_super = Math.max(0, (inputs.assumptions.superReturn - 0.08) / 100); // Reduce by average admin fee % (0.08%)
  const r_shares = inputs.assumptions.shareReturn / 100;
  const r_property = inputs.assumptions.propertyGrowthRate / 100;
  const g_salary = inputs.assumptions.salaryGrowthRate / 100;
  const g_rent = inputs.assumptions.rentGrowthRate / 100;
  const inflation = inputs.assumptions.inflationRate / 100;

  // ========================================
  // CURRENT POSITION CALCULATIONS
  // ========================================

  const currentSuper = inputs.assets
    .filter(a => a.type === 'Super')
    .reduce((sum, a) => sum + a.value, 0);

  const currentSavings = inputs.assets
    .filter(a => a.type === 'Cash')
    .reduce((sum, a) => sum + a.value, 0);

  const currentShares = inputs.assets
    .filter(a => a.type === 'Shares')
    .reduce((sum, a) => sum + a.value, 0);

  // Current property equity (value - loan)
  const propertyEquity = inputs.investmentProperties
    .reduce((sum, p) => sum + (p.currentValue - p.loanAmount), 0);

  // Total assets and liabilities
  const totalAssets = inputs.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = inputs.liabilities.reduce((sum, l) => sum + l.balanceOwing, 0);
  const currentNetWorth = totalAssets - totalLiabilities;

  // Monthly debt payments (converted from various frequencies)
  const monthlyDebtPayments = inputs.liabilities.reduce((sum, l) => {
    let monthly = 0;
    switch (l.frequency) {
      case 'W': monthly = l.repaymentAmount * 52 / 12; break;
      case 'F': monthly = l.repaymentAmount * 26 / 12; break;
      case 'M': monthly = l.repaymentAmount; break;
    }
    return sum + monthly;
  }, 0);

  // Monthly rental income
  const monthlyRentalIncome = inputs.investmentProperties
    .reduce((sum, p) => sum + (p.weeklyRent * 52 / 12), 0);

  // Total annual income
  const totalAnnualIncome =
    inputs.annualIncome +
    inputs.rentalIncome +
    inputs.dividends +
    inputs.frankedDividends +
    inputs.capitalGains +
    inputs.otherIncome;

  // Current monthly cashflow
  const currentMonthlyCashflow =
    (totalAnnualIncome / 12) -
    inputs.monthlyExpenses -
    monthlyDebtPayments;

  // ========================================
  // FUTURE SUPERANNUATION (simplified lump sum calculation)
  // ========================================

  // Formula: Super Lump Sum = (Current Balance + (Employment Income × 0.12)) × (1 + Rate)^Years
  // Super Guarantee Rate: 12% (ATO 2024-25)
  const annualSuperContribution = inputs.annualIncome * SUPER_GUARANTEE_RATE;
  const superLumpSum = currentSuper + annualSuperContribution;

  // Compound the total super amount for years to retirement
  const futureSuper = Math.round(calculateFutureValue(superLumpSum, r_super, years) * 100) / 100;

  // ========================================
  // FUTURE SHARES
  // ========================================

  const futureShares = calculateFutureValue(currentShares, r_shares, years);

  // ========================================
  // FUTURE PROPERTY ASSETS (from general assets)
  // ========================================

  const currentPropertyAssets = inputs.assets
    .filter(a => a.type === 'Property')
    .reduce((sum, a) => sum + a.value, 0);

  const futurePropertyAssets = calculateFutureValue(currentPropertyAssets, r_property, years);

  // ========================================
  // FUTURE OTHER ASSETS
  // ========================================

  const currentOtherAssets = inputs.assets
    .filter(a => a.type === 'Other')
    .reduce((sum, a) => sum + a.value, 0);

  const futureOtherAssets = calculateFutureValue(currentOtherAssets, 0.03, years); // 3% return

  // ========================================
  // FUTURE PROPERTY EQUITY (FIXED - PROPER COMPOUNDING)
  // ========================================

  let futurePropertyEquity = 0;
  let futurePropertyValue = 0;
  let remainingPropertyLoans = 0;

  for (const property of inputs.investmentProperties) {
    // STEP 1: Calculate future property value with compound growth
    // Formula: FV = Current Value × (1 + growth rate)^years
    const propFutureValue = calculateFutureValue(property.currentValue, r_property, years);
    futurePropertyValue += propFutureValue;

    // STEP 2: Calculate remaining loan balance using amortization
    const remainingBalance = calculateRemainingLoanBalance(
      property.loanAmount,
      property.interestRate / 100, // Convert percentage to decimal
      property.loanTerm,
      years
    );
    remainingPropertyLoans += remainingBalance;

    // STEP 3: Future equity = Future Value - Remaining Loan
    const propFutureEquity = propFutureValue - remainingBalance;
    futurePropertyEquity += Math.max(0, propFutureEquity); // Don't allow negative equity
  }

  // ========================================
  // FUTURE SAVINGS/CASH (using standard annuity formula)
  // ========================================

  // Part 1: Current savings grow at 3%
  const futureSavingsFromGrowth = calculateFutureValue(currentSavings, 0.03, years);

  // Part 2: Future savings contributions (constant annual contributions)
  const savingsRate = inputs.assumptions.savingsRate / 100;
  const annualSavingsContribution = inputs.annualIncome * savingsRate;

  // Use standard annuity formula for constant contributions
  const futureSavingsFromContributions = calculateFutureValueOfAnnuity(
    annualSavingsContribution,
    0.03, // Conservative savings return
    years,
    1 // Annual contributions
  );

  const futureSavings = Math.max(0, Math.round((futureSavingsFromGrowth + futureSavingsFromContributions) * 100) / 100);

  // ========================================
  // COMBINED NET WORTH AT RETIREMENT
  // ========================================

  const combinedNetworthAtRetirement =
    futureSuper +
    futureShares +
    futurePropertyAssets +
    futureOtherAssets +
    futurePropertyEquity +
    futureSavings;

  // ========================================
  // RETIREMENT INCOME
  // ========================================

  // Future rental income (grows with rent growth rate)
  const futureMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + g_rent, years);
  const futureAnnualRentalIncome = Math.round(futureMonthlyRentalIncome * 12 * 100) / 100;

  // Super withdrawal using withdrawal rate
  const withdrawalRate = inputs.assumptions.withdrawalRate / 100;
  const annualSuperWithdrawal = futureSuper * withdrawalRate;
  const monthlySuperWithdrawal = Math.round((annualSuperWithdrawal / 12) * 100) / 100;

  // Calculate remaining loan payments at retirement
  let futureMonthlyLoanPayments = 0;
  for (const liability of inputs.liabilities) {
    // Only include loans that will still be outstanding at retirement
    if (liability.termRemaining > years) {
      // Calculate monthly payment for remaining term
      const monthlyRate = liability.interestRate / 100 / 12;
      const remainingMonths = (liability.termRemaining - years) * 12;
      const monthlyPayment = (liability.balanceOwing * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
                            (Math.pow(1 + monthlyRate, remainingMonths) - 1);

      // Convert to monthly based on frequency
      switch (liability.frequency) {
        case 'W': futureMonthlyLoanPayments += monthlyPayment * 52 / 12; break;
        case 'F': futureMonthlyLoanPayments += monthlyPayment * 26 / 12; break;
        case 'M': futureMonthlyLoanPayments += monthlyPayment; break;
      }
    }
  }

  // Monthly cashflow at retirement: super withdrawal + rent - loan payments - expenses
  const combinedMonthlyCashflowRetirement =
    monthlySuperWithdrawal +
    futureMonthlyRentalIncome -
    futureMonthlyLoanPayments -
    inputs.monthlyExpenses; // Expenses stay the same

  // ========================================
  // TARGET INCOME & SURPLUS/DEFICIT
  // ========================================

  // Final salary after years of growth
  const finalAnnualIncome = inputs.annualIncome * Math.pow(1 + g_salary, years);

  // Required income is 70% of current salary (not projected future salary)
  const requiredAnnualIncome = inputs.annualIncome * RETIREMENT_INCOME_THRESHOLD;
  const requiredMonthlyIncome = Math.round((requiredAnnualIncome / 12) * 100) / 100;

  // Annual retirement income for surplus/deficit calculation
  const projectedAnnualPassiveIncome = (monthlySuperWithdrawal + futureMonthlyRentalIncome) * 12;

  // Surplus or deficit
  const annualSurplusDeficit = Math.round((projectedAnnualPassiveIncome - requiredAnnualIncome) * 100) / 100;
  const monthlySurplusDeficit = Math.round((annualSurplusDeficit / 12) * 100) / 100;
  const status: 'surplus' | 'deficit' = annualSurplusDeficit >= 0 ? 'surplus' : 'deficit';
  const percentageOfTarget = Math.round((projectedAnnualPassiveIncome / requiredAnnualIncome) * 10000) / 100;

  // ========================================
  // RETURN ALL RESULTS
  // ========================================

  return {
    // Current Position
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
    currentSuper,
    currentSavings,
    currentShares,
    propertyEquity,
    currentNetWorth,
    totalAssets,
    totalLiabilities,
    monthlyDebtPayments,
    monthlyRentalIncome,
    currentMonthlyCashflow,
    totalAnnualIncome,

    // Future Projections
    yearsToRetirement: years,
    futureSuper,
    futureShares,
    futurePropertyValue, // Total property value
    futurePropertyEquity, // Property value - remaining loans
    remainingPropertyLoans, // How much loan is left
    futurePropertyAssets,
    futureOtherAssets,
    futureSavings,
    combinedNetworthAtRetirement,

    // Retirement Income
    futureMonthlyRentalIncome,
    futureAnnualRentalIncome,
    annualSuperWithdrawal,
    monthlySuperWithdrawal,
    projectedAnnualPassiveIncome,
    combinedMonthlyCashflowRetirement,

    // Target & Status
    finalAnnualIncome,
    requiredAnnualIncome,
    requiredMonthlyIncome,
    annualSurplusDeficit,
    monthlySurplusDeficit,
    status,
    percentageOfTarget,
  };
}
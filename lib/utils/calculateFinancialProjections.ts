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
  futureSavings: number;
  combinedNetworthAtRetirement: number;

  // Retirement Income
  futureMonthlyRentalIncome: number;
  futureAnnualRentalIncome: number;
  annualInvestmentWithdrawal: number;
  monthlyInvestmentWithdrawal: number;
  projectedAnnualPassiveIncome: number;
  projectedMonthlyPassiveIncome: number;
  futureMonthlyExpenses: number;
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
  const SUPER_GUARANTEE_RATE = 0.12; // CORRECT: 12% for 2024-25 (was 11.5%)
  const RETIREMENT_INCOME_THRESHOLD = 0.70;

  const years = inputs.retirementAge - inputs.currentAge;

  // Convert rates to decimals
  const r_super = inputs.assumptions.superReturn / 100;
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
  // FUTURE SUPERANNUATION
  // ========================================

  // Part 1: Current super grows with compound interest
  const futureSuperFromGrowth = calculateFutureValue(currentSuper, r_super, years);

  // Part 2: Future value of super contributions (growing annuity)
  const annualSuperContribution = inputs.annualIncome * SUPER_GUARANTEE_RATE;

  // For growing annuity with salary growth, we need to calculate year by year
  let futureSuperFromContributions = 0;
  if (Math.abs(r_super - g_salary) < 0.0001) {
    // Edge case: when return rate equals salary growth rate
    futureSuperFromContributions = annualSuperContribution * years * Math.pow(1 + r_super, years - 1);
  } else {
    // Growing annuity formula: FV = PMT × [((1 + r)^n - (1 + g)^n) / (r - g)]
    futureSuperFromContributions = annualSuperContribution *
      ((Math.pow(1 + r_super, years) - Math.pow(1 + g_salary, years)) / (r_super - g_salary));
  }

  const futureSuper = Math.round((futureSuperFromGrowth + futureSuperFromContributions) * 100) / 100;

  // ========================================
  // FUTURE SHARES
  // ========================================

  const futureShares = calculateFutureValue(currentShares, r_shares, years);

  // ========================================
  // FUTURE PROPERTY EQUITY (CORRECTED)
  // ========================================

  let futurePropertyEquity = 0;
  let futurePropertyValue = 0;
  let remainingPropertyLoans = 0;

  for (const property of inputs.investmentProperties) {
    // Property value grows with compound interest
    const futurePropValue = calculateFutureValue(property.currentValue, r_property, years);
    futurePropertyValue += futurePropValue;

    // Calculate remaining loan balance using CORRECT amortization formula
    const remainingBalance = calculateRemainingLoanBalance(
      property.loanAmount,
      property.interestRate,
      property.loanTerm,
      years
    );
    remainingPropertyLoans += remainingBalance;

    // Equity = Value - Remaining Loan
    futurePropertyEquity += (futurePropValue - remainingBalance);
  }

  // ========================================
  // FUTURE SAVINGS/CASH
  // ========================================

  // Part 1: Current savings grow
  const futureSavingsFromGrowth = calculateFutureValue(currentSavings, r_super, years);

  // Part 2: Net cashflow accumulated
  const initialAnnualCashflow = currentMonthlyCashflow * 12;

  // Effective cashflow growth (rent grows, expenses grow with inflation)
  const effectiveCashflowGrowth = g_rent - inflation;

  let futureSavingsFromCashflow = 0;
  if (initialAnnualCashflow > 0) {
    if (Math.abs(r_super - effectiveCashflowGrowth) < 0.0001) {
      futureSavingsFromCashflow = initialAnnualCashflow * years * Math.pow(1 + r_super, years - 1);
    } else {
      futureSavingsFromCashflow = initialAnnualCashflow *
        ((Math.pow(1 + r_super, years) - Math.pow(1 + effectiveCashflowGrowth, years)) /
         (r_super - effectiveCashflowGrowth));
    }
  }

  const futureSavings = Math.max(0, Math.round((futureSavingsFromGrowth + futureSavingsFromCashflow) * 100) / 100);

  // ========================================
  // COMBINED NET WORTH AT RETIREMENT
  // ========================================

  const combinedNetworthAtRetirement =
    futureSuper +
    futureShares +
    futurePropertyEquity +
    futureSavings;

  // ========================================
  // RETIREMENT INCOME
  // ========================================

  // Future rental income (grows with rent growth rate)
  const futureMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + g_rent, years);
  const futureAnnualRentalIncome = Math.round(futureMonthlyRentalIncome * 12 * 100) / 100;

  // Investment withdrawal (safe withdrawal rate)
  const withdrawalRate = inputs.assumptions.withdrawalRate / 100;
  const annualInvestmentWithdrawal = calculateSafeWithdrawal(combinedNetworthAtRetirement, withdrawalRate);
  const monthlyInvestmentWithdrawal = Math.round((annualInvestmentWithdrawal / 12) * 100) / 100;

  // Total passive income
  const projectedAnnualPassiveIncome =
    futureAnnualRentalIncome +
    annualInvestmentWithdrawal;
  const projectedMonthlyPassiveIncome = Math.round((projectedAnnualPassiveIncome / 12) * 100) / 100;

  // Monthly cashflow at retirement (income - expenses, no debt if loans paid off)
  const futureMonthlyExpenses = inputs.monthlyExpenses * Math.pow(1 + inflation, years);
  const combinedMonthlyCashflowRetirement =
    projectedMonthlyPassiveIncome -
    futureMonthlyExpenses;

  // ========================================
  // TARGET INCOME & SURPLUS/DEFICIT
  // ========================================

  // Final salary after years of growth
  const finalAnnualIncome = inputs.annualIncome * Math.pow(1 + g_salary, years);

  // Required income is 70% of current salary (not projected future salary)
  const requiredAnnualIncome = inputs.annualIncome * RETIREMENT_INCOME_THRESHOLD;
  const requiredMonthlyIncome = Math.round((requiredAnnualIncome / 12) * 100) / 100;

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
    futureSavings,
    combinedNetworthAtRetirement,

    // Retirement Income
    futureMonthlyRentalIncome,
    futureAnnualRentalIncome,
    annualInvestmentWithdrawal,
    monthlyInvestmentWithdrawal,
    projectedAnnualPassiveIncome,
    projectedMonthlyPassiveIncome,
    futureMonthlyExpenses,
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
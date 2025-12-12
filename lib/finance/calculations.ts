/**
 * FinCalc Pro - Financial Calculation Engine
 * 
 * This module contains all financial formulas used throughout the application.
 * All calculations are deterministic and well-tested.
 * 
 * Formulas implemented:
 * - Loan amortization (monthly payments)
 * - Future value projections 
 * - Retirement deficit/surplus calculations
 * - Property serviceability calculations
 * - Investment returns and passive income
 */

export interface LoanCalculationInput {
  principal: number;
  annualInterestRate: number; // As decimal (e.g., 0.05 for 5%)
  termYears: number;
}

export interface ProjectionAssumptions {
  inflationRate: number;
  propertyGrowthRate: number;
  shareMarketReturn: number;
  superReturn: number;
  withdrawalRate: number; // Safe withdrawal rate at retirement (default 4%)
  salaryGrowthRate: number;
  expectedRentGrowthRate: number;
}

export interface RetirementProjection {
  currentAge: number;
  targetRetirementAge: number;
  yearsToRetirement: number;
  projectedLumpSum: number;
  projectedPassiveIncomeAnnual: number;
  annualDebtPayments: number;
  deficitOrSurplusMonthly: number;
  savingsDepletionYears?: number;
}

/**
 * Calculate monthly loan payment using standard amortization formula
 * Formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where: P = principal, r = monthly rate, n = total payments
 */
export function calculateLoanPayment({ 
  principal, 
  annualInterestRate, 
  termYears 
}: LoanCalculationInput): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualInterestRate === 0) return principal / (termYears * 12);
  
  const monthlyRate = annualInterestRate / 12;
  const totalPayments = termYears * 12;
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
  
  return principal * (numerator / denominator);
}

/**
 * Calculate maximum borrowing capacity based on serviceability
 * Inverts the loan payment formula to find principal
 */
export function calculateMaxBorrowingCapacity(
  monthlyPaymentCapacity: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (monthlyPaymentCapacity <= 0 || termYears <= 0) return 0;
  if (annualInterestRate === 0) return monthlyPaymentCapacity * termYears * 12;
  
  const monthlyRate = annualInterestRate / 12;
  const totalPayments = termYears * 12;
  
  const numerator = Math.pow(1 + monthlyRate, totalPayments) - 1;
  const denominator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
  
  return monthlyPaymentCapacity * (numerator / denominator);
}

/**
 * Project future value of an asset with compound growth
 * Formula: FV = PV * (1 + r)^t
 * Where: FV = future value, PV = present value, r = real return rate, t = time
 */
export function projectAssetValue(
  currentValue: number,
  nominalGrowthRate: number,
  inflationRate: number,
  years: number
): number {
  // Convert nominal growth to real growth using exact formula:
  // (1 + nominal) / (1 + inflation) - 1
  const realGrowthRate = (1 + nominalGrowthRate) / (1 + inflationRate) - 1;
  return currentValue * Math.pow(1 + realGrowthRate, years);
}

export interface PropertyExpenses {
  mortgageInterest: number;
  repairs: number;
  managementFees: number;
  insurance: number;
  councilRates: number;
  otherExpenses: number;
  depreciation: number;
}

export interface NegativeGearingResult {
  totalRentalIncome: number;
  totalExpenses: number;
  netLoss: number;
  taxBenefit: number;
}

/**
 * Calculate negative gearing benefits for an investment property
 * Formula: Net Loss = Total Rental Income - (Total Property Expenses + Depreciation)
 * Tax Benefit = Net Loss * Marginal Tax Rate
 */
export function calculateNegativeGearing(
  annualRentalIncome: number,
  expenses: PropertyExpenses,
  marginalTaxRate: number // As decimal (e.g., 0.33 for 33%)
): NegativeGearingResult {
  // Calculate total expenses including depreciation
  const totalExpenses = 
    expenses.mortgageInterest +
    expenses.repairs +
    expenses.managementFees +
    expenses.insurance +
    expenses.councilRates +
    expenses.otherExpenses +
    expenses.depreciation;

  // Calculate net loss
  const netLoss = Math.max(0, totalExpenses - annualRentalIncome);

  // Calculate tax benefit
  const taxBenefit = netLoss * marginalTaxRate;

  return {
    totalRentalIncome: annualRentalIncome,
    totalExpenses,
    netLoss,
    taxBenefit
  };
}

/**
 * Calculate projected retirement lump sum from current investments
 */
export function calculateRetirementLumpSum(
  currentAssets: {
    super: number;
    shares: number;
    properties: number; // Net equity
    savings: number;
  },
  assumptions: ProjectionAssumptions,
  yearsToRetirement: number
): number {
  const projectedSuper = projectAssetValue(
    currentAssets.super,
    assumptions.superReturn,
    assumptions.inflationRate,
    yearsToRetirement
  );
  
  const projectedShares = projectAssetValue(
    currentAssets.shares,
    assumptions.shareMarketReturn,
    assumptions.inflationRate,
    yearsToRetirement
  );
  
  const projectedProperties = projectAssetValue(
    currentAssets.properties,
    assumptions.propertyGrowthRate,
    assumptions.inflationRate,
    yearsToRetirement
  );
  
  const projectedSavings = projectAssetValue(
    currentAssets.savings,
    0.02, // Conservative savings rate
    assumptions.inflationRate,
    yearsToRetirement
  );
  
  return projectedSuper + projectedShares + projectedProperties + projectedSavings;
}

/**
 * Calculate annual passive income at retirement
 */
export function calculatePassiveIncome(
  retirementLumpSum: number,
  rentalIncomeAnnual: number,
  assumptions: ProjectionAssumptions
): number {
  const withdrawalIncome = retirementLumpSum * assumptions.withdrawalRate;
  const projectedRentalIncome = projectAssetValue(
    rentalIncomeAnnual,
    assumptions.expectedRentGrowthRate,
    assumptions.inflationRate,
    0 // Already at retirement
  );
  
  return withdrawalIncome + projectedRentalIncome;
}

/**
 * Calculate retirement deficit or surplus per the specification
 * If (projected passive income - debt payments) < 70% of current salary, compute deficit
 */
export function calculateRetirementDeficitSurplus(
  projectedPassiveIncome: number,
  annualDebtPayments: number,
  currentGrossIncome: number
): {
  monthlyAmount: number;
  isDeficit: boolean;
  requiredIncome: number;
  availableIncome: number;
} {
  const requiredIncome = currentGrossIncome * 0.7;
  const availableIncome = projectedPassiveIncome - annualDebtPayments;
  
  if (availableIncome < requiredIncome) {
    return {
      monthlyAmount: (requiredIncome - availableIncome) / 12,
      isDeficit: true,
      requiredIncome,
      availableIncome
    };
  } else {
    return {
      monthlyAmount: (availableIncome - requiredIncome) / 12,
      isDeficit: false,
      requiredIncome,
      availableIncome
    };
  }
}

/**
 * Calculate savings depletion timeline if deficit exists
 */
export function calculateSavingsDepletion(
  savingsBalances: number[],
  monthlyDeficit: number
): {
  yearsToDepletion: number;
  monthlyDraw: number;
  totalAvailable: number;
} {
  const totalSavings = savingsBalances.reduce((sum, balance) => sum + balance, 0);
  
  if (monthlyDeficit <= 0 || totalSavings <= 0) {
    return {
      yearsToDepletion: Infinity,
      monthlyDraw: 0,
      totalAvailable: totalSavings
    };
  }
  
  const yearsToDepletion = totalSavings / (monthlyDeficit * 12);
  
  return {
    yearsToDepletion,
    monthlyDraw: monthlyDeficit,
    totalAvailable: totalSavings
  };
}

/**
 * Calculate property rental yield
 * Formula: Annual Rent / Property Value * 100
 */
export function calculateRentalYield(
  annualRent: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return (annualRent / propertyValue) * 100;
}

/**
 * Calculate net property cashflow (monthly)
 * Includes: rent - loan payments - expenses - maintenance - management
 */
export function calculatePropertyCashflow(
  monthlyRent: number,
  monthlyLoanPayment: number,
  monthlyExpenses: number = 0,
  maintenanceReserve: number = 0.01, // 1% of property value annually
  managementFee: number = 0.07, // 7% of rent
  propertyValue: number = 0
): number {
  const monthlyMaintenance = (propertyValue * maintenanceReserve) / 12;
  const monthlyManagementFee = monthlyRent * managementFee;
  
  return monthlyRent - monthlyLoanPayment - monthlyExpenses - monthlyMaintenance - monthlyManagementFee;
}

/**
 * Calculate compound growth with regular contributions
 * Used for salary projections and super contributions
 */
export function calculateFutureValueWithContributions(
  presentValue: number,
  monthlyContribution: number,
  annualGrowthRate: number,
  years: number
): number {
  // Handle zero growth rate case
  if (annualGrowthRate === 0) {
    const totalMonths = years * 12;
    return presentValue + (monthlyContribution * totalMonths);
  }
  
  const monthlyRate = annualGrowthRate / 12;
  const totalMonths = years * 12;
  
  // Future value of present amount
  const fvPresent = presentValue * Math.pow(1 + monthlyRate, totalMonths);
  
  // Future value of annuity (monthly contributions)
  const fvAnnuity = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  
  return fvPresent + fvAnnuity;
}

/**
 * Default projection assumptions for Australian market
 */
export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  inflationRate: 0.025,      // 2.5% CPI target
  propertyGrowthRate: 0.065, // 6.5% historical average
  shareMarketReturn: 0.095,  // 9.5% historical ASX return
  superReturn: 0.075,        // 7.5% balanced super fund
  withdrawalRate: 0.04,      // 4% safe withdrawal rule
  salaryGrowthRate: 0.035,   // 3.5% annual salary increases
  expectedRentGrowthRate: 0.04 // 4% rent growth
};

// ---------------------------------------------------------------------------
// Monthly surplus / cash flow calculation
// ---------------------------------------------------------------------------
import { calculateTax, DEFAULT_TAX_RULES } from '../tax/tax-engine';

export interface MonthlySurplusResult {
  income: {
    employment: number;
    rental: number;
    investment: number;
    other: number;
    total: number;
  };
  expenses: {
    living: number;
    tax: number;
    hecs: number;
    propertyExpenses: number;
    loanRepayments: number;
    total: number;
  };
  surplus: number;
  savingsRate: number; // percent
}

/**
 * Calculate monthly surplus (cash flow) according to canonical definition:
 * Monthly Surplus = Total Monthly Income - Total Monthly Expenses
 */
export function calculateMonthlySurplus(clientData: any): MonthlySurplusResult {
  // Support both nested (income.employment) and flat (employmentIncome/grossSalary/grossIncome/annualIncome) structures
  const employmentAnnual = Number(
    clientData?.income?.employment || 
    clientData?.employmentIncome || 
    clientData?.annualIncome || 
    clientData?.grossSalary || 
    clientData?.grossIncome || 
    0
  );
  const rentalAnnual = Number(clientData?.income?.rental || clientData?.rentalIncome || 0);
  const investmentAnnual = Number(
    clientData?.income?.investment || 
    clientData?.investmentIncome || 
    clientData?.dividends || 
    0
  );
  const otherAnnual = Number(clientData?.income?.other || clientData?.otherIncome || 0);

  const employment = employmentAnnual / 12;
  const rental = rentalAnnual / 12;
  const investment = investmentAnnual / 12;
  const other = otherAnnual / 12;

  const totalMonthlyIncome = employment + rental + investment + other;

  // Living expenses (monthly)
  const livingExpenses = Number(clientData?.financials?.monthlyExpenses || clientData?.monthlyExpenses || 0);

  // Annual taxable income and tax calculations using tax engine
  const annualTaxableIncome = employmentAnnual + rentalAnnual + investmentAnnual + otherAnnual;
  const taxResult = calculateTax({
    grossIncome: annualTaxableIncome,
    deductions: [],
    hecsBalance: Number(clientData?.liabilities?.hecsDebt?.currentBalance || clientData?.hecsBalance || clientData?.helpDebt || 0)
  }, DEFAULT_TAX_RULES);

  const annualTax = taxResult.totalTax;
  // HECS/HELP repayment is reported separately on the tax result but is
  // also included in `totalTax`. To avoid double-counting we split the
  // HECS component out and compute the monthly income tax excluding HECS.
  const hecsAnnual = Number(taxResult.hecsRepayment || 0);
  const incomeTaxExcludingHecsAnnual = Math.max(0, annualTax - hecsAnnual);
  const monthlyTax = incomeTaxExcludingHecsAnnual / 12;

  const monthlyHECS = hecsAnnual / 12;

  // Property expenses: support both nested (assets.properties) and flat array (assets) formats
  // IMPORTANT: Avoid double-counting by tracking linked assets
  let monthlyPropertyExpenses = 0;
  
  // First, collect expenses from investment properties (Investment Properties page)
  // These are the primary source of property expenses with annualExpenses field
  const investmentProperties = clientData?.properties || [];
  const linkedAssetIds = new Set<string>();
  
  if (Array.isArray(investmentProperties)) {
    for (const p of investmentProperties) {
      monthlyPropertyExpenses += Number(p?.annualExpenses || 0) / 12;
      // Track which assets are linked to avoid double-counting
      if (p?.linkedAssetId) {
        linkedAssetIds.add(p.linkedAssetId);
      }
    }
  }
  
  // Check for nested properties structure (legacy format)
  let properties = clientData?.assets?.properties || [];
  
  // If assets is an array (Financial Position page format), filter for property assets
  if (Array.isArray(clientData?.assets)) {
    properties = clientData.assets.filter((a: any) => a?.type === 'property');
  }
  
  // Only add expenses from property assets that are NOT already linked to investment properties
  // This prevents double-counting when the same property appears in both arrays
  for (const p of properties) {
    // Skip if this asset is already linked to an investment property
    if (p?.id && linkedAssetIds.has(p.id)) {
      continue;
    }
    if ((p?.type || '').toString().toLowerCase() === 'investment' || (p?.type || '').toString().toLowerCase() === 'property') {
      monthlyPropertyExpenses += Number(p?.annualExpenses || p?.annualExpense || 0) / 12;
    }
  }

  // Loan repayments: support both nested structure and flat array structure
  let monthlyLoanRepayments = 0;
  
  // Check if liabilities is an array (Financial Position page format)
  if (Array.isArray(clientData?.liabilities)) {
    for (const liability of clientData.liabilities) {
      monthlyLoanRepayments += Number(liability?.monthlyPayment || 0);
    }
  } else {
    // Legacy nested structure
    const homeLoan = clientData?.liabilities?.homeLoan;
    if (homeLoan && Number(homeLoan.monthlyRepayment)) monthlyLoanRepayments += Number(homeLoan.monthlyRepayment);

    const investmentLoans = clientData?.liabilities?.investmentLoans || [];
    for (const l of investmentLoans) monthlyLoanRepayments += Number(l?.monthlyRepayment || 0);

    const personalLoans = clientData?.liabilities?.personalLoans || [];
    for (const l of personalLoans) monthlyLoanRepayments += Number(l?.monthlyRepayment || 0);

    const creditCards = clientData?.liabilities?.creditCards || [];
    for (const c of creditCards) monthlyLoanRepayments += Number(c?.minimumPayment || 0);
  }
  
  // Also check for HECS balance in flat structure
  let hecsBalance = Number(clientData?.liabilities?.hecsDebt?.currentBalance || 0);
  if (!hecsBalance && Array.isArray(clientData?.liabilities)) {
    const hecsLiability = clientData.liabilities.find((l: any) => l?.type === 'hecs');
    hecsBalance = Number(hecsLiability?.balance || 0);
  }
  if (!hecsBalance) {
    hecsBalance = Number(clientData?.hecsBalance || clientData?.helpDebt || 0);
  }
  
  // Recalculate HECS with actual balance
  const annualTaxableIncomeForHecs = employmentAnnual + rentalAnnual + investmentAnnual + otherAnnual;
  const taxResultForHecs = calculateTax({
    grossIncome: annualTaxableIncomeForHecs,
    deductions: [],
    hecsBalance: hecsBalance
  }, DEFAULT_TAX_RULES);
  const actualHecsAnnual = Number(taxResultForHecs.hecsRepayment || 0);
  const actualMonthlyHECS = actualHecsAnnual / 12;

  const totalMonthlyExpenses = livingExpenses + monthlyTax + actualMonthlyHECS + monthlyPropertyExpenses + monthlyLoanRepayments;

  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;

  const savingsRate = totalMonthlyIncome > 0 ? (monthlySurplus / totalMonthlyIncome) * 100 : 0;

  return {
    income: {
      employment,
      rental,
      investment,
      other,
      total: totalMonthlyIncome
    },
    expenses: {
      living: livingExpenses,
      tax: monthlyTax,
      hecs: actualMonthlyHECS,
      propertyExpenses: monthlyPropertyExpenses,
      loanRepayments: monthlyLoanRepayments,
      total: totalMonthlyExpenses
    },
    surplus: monthlySurplus,
    savingsRate
  };
}

/**
 * Calculate monthly debt payments that will still exist at retirement.
 * Considers the loan term for each liability - if a loan will be paid off
 * before retirement, it won't be included in retirement debt calculations.
 * 
 * @param liabilities - Array of liabilities with balance, monthlyPayment, and loanTerm
 * @param yearsToRetirement - Number of years until retirement
 * @returns Monthly debt payments that will still exist at retirement
 */
export function calculateDebtPaymentsAtRetirement(
  liabilities: Array<{
    balance: number;
    monthlyPayment: number;
    loanTerm: number; // in years
    interestRate?: number;
  }>,
  yearsToRetirement: number
): number {
  if (!liabilities || !Array.isArray(liabilities) || yearsToRetirement <= 0) {
    return 0;
  }

  let totalMonthlyPaymentsAtRetirement = 0;

  for (const liability of liabilities) {
    const balance = Number(liability.balance || 0);
    const monthlyPayment = Number(liability.monthlyPayment || 0);
    const loanTerm = Number(liability.loanTerm || 30); // Default to 30 years if not specified
    
    if (balance <= 0 || monthlyPayment <= 0) {
      continue;
    }

    // Calculate remaining years on the loan at retirement
    // If loanTerm is less than yearsToRetirement, the loan will be paid off before retirement
    const remainingYearsAtRetirement = loanTerm - yearsToRetirement;
    
    if (remainingYearsAtRetirement > 0) {
      // Loan will still exist at retirement - include the payment
      totalMonthlyPaymentsAtRetirement += monthlyPayment;
    }
    // else: Loan will be paid off before retirement - don't include
  }

  return totalMonthlyPaymentsAtRetirement;
}
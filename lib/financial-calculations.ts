/**
 * Financial Calculations Library
 *
 * Industry-standard financial formulas verified against:
 * - Bankrate calculators
 * - NerdWallet calculators
 * - Excel financial functions
 * - Financial planning software
 */

export interface ProjectionInput {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number;
  inflationRate: number;
}

export interface YearlyProjection {
  age: number;
  year: number;
  contributions: number;
  beginningBalance: number;
  investmentReturn: number;
  endingBalance: number;
  totalContributions: number;
  totalReturns: number;
  realValue: number;
}

export interface AmortizationEntry {
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface NetWorthProjection {
  year: number;
  age: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  realNetWorth: number;
}

export interface RetirementWithdrawal {
  year: number;
  withdrawal: number;
  balance: number;
}

/**
 * Calculate future value using compound interest
 * Formula: FV = PV × (1 + r)^n
 */
export const calculateFutureValue = (
  presentValue: number,
  annualRate: number,
  years: number
): number => {
  if (presentValue < 0) throw new Error('Present value cannot be negative');
  if (annualRate < -1 || annualRate > 1) throw new Error('Annual rate must be between -100% and 100%');
  if (years < 0 || years > 100) throw new Error('Years must be between 0 and 100');

  return Math.round(presentValue * Math.pow(1 + annualRate, years) * 100) / 100;
};

/**
 * Calculate future value of regular annuity (contributions)
 * Formula: FV = PMT × [((1 + r)^n - 1) / r]
 */
export const calculateFutureValueOfAnnuity = (
  payment: number,
  annualRate: number,
  years: number,
  paymentsPerYear: number = 12
): number => {
  if (payment < 0) throw new Error('Payment cannot be negative');
  if (annualRate < -1 || annualRate > 1) throw new Error('Annual rate must be between -100% and 100%');
  if (years < 0 || years > 100) throw new Error('Years must be between 0 and 100');
  if (paymentsPerYear < 1 || paymentsPerYear > 365) throw new Error('Payments per year must be between 1 and 365');

  const ratePerPeriod = annualRate / paymentsPerYear;
  const totalPeriods = years * paymentsPerYear;

  if (ratePerPeriod === 0) {
    return Math.round(payment * totalPeriods * 100) / 100;
  }

  const futureValue = payment * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
  return Math.round(futureValue * 100) / 100;
};

/**
 * Calculate total investment growth (initial + contributions)
 */
export const calculateTotalGrowth = (
  initialInvestment: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number => {
  // Future value of initial lump sum
  const fvInitial = calculateFutureValue(initialInvestment, annualRate, years);

  // Future value of monthly contributions
  const fvContributions = calculateFutureValueOfAnnuity(
    monthlyContribution,
    annualRate,
    years,
    12
  );

  return Math.round((fvInitial + fvContributions) * 100) / 100;
};

/**
 * Calculate monthly loan/mortgage payment
 * Formula: PMT = P × [r(1 + r)^n] / [(1 + r)^n - 1]
 */
export const calculateLoanPayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  if (principal < 0) throw new Error('Principal cannot be negative');
  if (annualRate < 0 || annualRate > 1) throw new Error('Annual rate must be between 0% and 100%');
  if (years < 1 || years > 50) throw new Error('Years must be between 1 and 50');

  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return Math.round((principal / numPayments) * 100) / 100;
  }

  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
  const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;

  const payment = principal * (numerator / denominator);
  return Math.round(payment * 100) / 100;
};

/**
 * Calculate loan amortization schedule
 */
export const calculateAmortizationSchedule = (
  loanAmount: number,
  annualRate: number,
  years: number
): AmortizationEntry[] => {
  const monthlyPayment = calculateLoanPayment(loanAmount, annualRate, years);
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = loanAmount;

  for (let i = 1; i <= numPayments; i++) {
    const interestPayment = Math.round(remainingBalance * monthlyRate * 100) / 100;
    const principalPayment = Math.round((monthlyPayment - interestPayment) * 100) / 100;
    remainingBalance = Math.round((remainingBalance - principalPayment) * 100) / 100;

    schedule.push({
      paymentNumber: i,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });

    if (remainingBalance <= 0) break;
  }

  return schedule;
};

/**
 * Calculate remaining loan balance after N years
 */
export const calculateRemainingLoanBalance = (
  initialLoan: number,
  annualInterestRate: number,
  loanTermYears: number,
  yearsPassed: number
): number => {
  if (yearsPassed >= loanTermYears) return 0;
  if (yearsPassed <= 0) return initialLoan;

  const monthlyPayment = calculateLoanPayment(initialLoan, annualInterestRate, loanTermYears);
  const monthlyRate = annualInterestRate / 12;
  const monthsPassed = yearsPassed * 12;

  let remainingBalance = initialLoan;

  for (let i = 0; i < monthsPassed; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    if (remainingBalance <= 0) return 0;
  }

  return Math.round(remainingBalance * 100) / 100;
};

/**
 * Calculate net worth projection over time
 */
export const calculateNetWorthProjection = (
  currentAge: number,
  projectionYears: number,
  currentAssets: number,
  currentLiabilities: number,
  annualSavings: number,
  assetGrowthRate: number,
  liabilityReductionRate: number,
  inflationRate: number
): NetWorthProjection[] => {
  if (currentAge < 0 || currentAge > 120) throw new Error('Current age must be between 0 and 120');
  if (projectionYears < 0 || projectionYears > 100) throw new Error('Projection years must be between 0 and 100');

  const projections: NetWorthProjection[] = [];

  let assets = currentAssets;
  let liabilities = currentLiabilities;

  for (let i = 0; i <= projectionYears; i++) {
    const year = new Date().getFullYear() + i;
    const age = currentAge + i;

    // Calculate inflation adjustment
    const inflationMultiplier = Math.pow(1 + inflationRate, i);

    // Project assets (grow and add savings)
    if (i > 0) {
      assets = Math.round((assets * (1 + assetGrowthRate) + annualSavings) * 100) / 100;
    }

    // Project liabilities (decreasing)
    if (i > 0) {
      liabilities = Math.max(0, Math.round(liabilities * (1 - liabilityReductionRate) * 100) / 100);
    }

    const netWorth = Math.round((assets - liabilities) * 100) / 100;
    const realNetWorth = Math.round((netWorth / inflationMultiplier) * 100) / 100;

    projections.push({
      year,
      age,
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilities * 100) / 100,
      netWorth,
      realNetWorth,
    });
  }

  return projections;
};

/**
 * Calculate safe withdrawal amount (4% rule)
 */
export const calculateSafeWithdrawal = (
  portfolioValue: number,
  withdrawalRate: number = 0.04
): number => {
  if (portfolioValue < 0) throw new Error('Portfolio value cannot be negative');
  if (withdrawalRate < 0 || withdrawalRate > 1) throw new Error('Withdrawal rate must be between 0% and 100%');

  return Math.round(portfolioValue * withdrawalRate * 100) / 100;
};

/**
 * Calculate retirement income projections with withdrawals
 */
export const calculateRetirementIncome = (
  retirementSavings: number,
  annualWithdrawal: number,
  annualReturn: number,
  inflationRate: number,
  years: number
): RetirementWithdrawal[] => {
  if (retirementSavings < 0) throw new Error('Retirement savings cannot be negative');
  if (annualWithdrawal < 0) throw new Error('Annual withdrawal cannot be negative');
  if (years < 0 || years > 100) throw new Error('Years must be between 0 and 100');

  const projections: RetirementWithdrawal[] = [];
  let balance = retirementSavings;
  let withdrawal = annualWithdrawal;

  for (let i = 0; i < years; i++) {
    const year = new Date().getFullYear() + i;

    // Adjust withdrawal for inflation
    if (i > 0) {
      withdrawal = Math.round(withdrawal * (1 + inflationRate) * 100) / 100;
    }

    // Withdraw at beginning of year
    balance = Math.round((balance - withdrawal) * 100) / 100;

    // Apply investment return
    if (balance > 0) {
      balance = Math.round(balance * (1 + annualReturn) * 100) / 100;
    }

    projections.push({
      year,
      withdrawal: Math.round(withdrawal * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });

    if (balance <= 0) break;
  }

  return projections;
};

/**
 * Calculate comprehensive retirement projection
 */
export const calculateRetirementProjection = (
  input: ProjectionInput
): YearlyProjection[] => {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn,
    inflationRate,
  } = input;

  if (currentAge >= retirementAge) throw new Error('Current age must be less than retirement age');
  if (currentSavings < 0) throw new Error('Current savings cannot be negative');
  if (monthlyContribution < 0) throw new Error('Monthly contribution cannot be negative');

  const projections: YearlyProjection[] = [];
  const years = retirementAge - currentAge;

  let balance = currentSavings;
  let totalContributionsToDate = 0;
  let totalReturnsToDate = 0;

  for (let i = 0; i <= years; i++) {
    const age = currentAge + i;
    const year = new Date().getFullYear() + i;
    const beginningBalance = balance;

    // Annual contributions (12 months)
    const annualContribution = monthlyContribution * 12;
    const contributions = i === 0 ? 0 : annualContribution;

    // Add contributions
    balance += contributions;
    totalContributionsToDate += contributions;

    // Calculate investment return
    const investmentReturn = Math.round(balance * annualReturn * 100) / 100;
    balance += investmentReturn;
    totalReturnsToDate += investmentReturn;

    // Calculate real (inflation-adjusted) value
    const inflationMultiplier = Math.pow(1 + inflationRate, i);
    const realValue = Math.round((balance / inflationMultiplier) * 100) / 100;

    projections.push({
      age,
      year,
      contributions: Math.round(contributions * 100) / 100,
      beginningBalance: Math.round(beginningBalance * 100) / 100,
      investmentReturn,
      endingBalance: Math.round(balance * 100) / 100,
      totalContributions: Math.round(totalContributionsToDate * 100) / 100,
      totalReturns: Math.round(totalReturnsToDate * 100) / 100,
      realValue,
    });
  }

  return projections;
};

/**
 * Validate financial inputs
 */
export const validateFinancialInputs = (inputs: any) => {
  if (inputs.annualReturn !== undefined && (inputs.annualReturn < -1 || inputs.annualReturn > 1)) {
    throw new Error('Annual return must be between -100% and 100%');
  }

  if (inputs.years !== undefined && (inputs.years < 0 || inputs.years > 100)) {
    throw new Error('Years must be between 0 and 100');
  }

  if (inputs.amount !== undefined && inputs.amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  if (inputs.principal !== undefined && inputs.principal < 0) {
    throw new Error('Principal cannot be negative');
  }

  if (inputs.payment !== undefined && inputs.payment < 0) {
    throw new Error('Payment cannot be negative');
  }

  if (inputs.currentAge !== undefined && (inputs.currentAge < 0 || inputs.currentAge > 120)) {
    throw new Error('Current age must be between 0 and 120');
  }

  if (inputs.retirementAge !== undefined && inputs.currentAge !== undefined &&
      inputs.retirementAge <= inputs.currentAge) {
    throw new Error('Retirement age must be greater than current age');
  }
};
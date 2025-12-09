import { calculateLoanPayment, calculateMaxBorrowingCapacity, calculateMonthlySurplus } from './calculations';

/**
 * Calculate the potential investment surplus based on income and expenses
 * @param monthlyIncome Total monthly income
 * @param monthlyExpenses Total monthly expenses
 * @returns RetirementMetrics object with calculated metrics
 */
export function calculateInvestmentSurplus(
  monthlyIncome: number,
  monthlyExpenses: number
): RetirementMetrics {
  // Handle invalid inputs
  const validIncome = isNaN(monthlyIncome) || monthlyIncome < 0 ? 0 : monthlyIncome;
  const validExpenses = isNaN(monthlyExpenses) || monthlyExpenses < 0 ? 0 : monthlyExpenses;
  
  const monthlyDeficitOrSurplus = validIncome - validExpenses;
  // Projected passive income is estimated from available monthly surplus/deficit.
  // Do not apply the retirement retention factor here to avoid double-reducing
  // the projected income; retention (required retirement income) is applied
  // in `calculatePropertyServiceability` when comparing required vs available.
  const projectedPassiveIncomeMonthly = monthlyDeficitOrSurplus;

  return {
    projectedPassiveIncomeMonthly: isNaN(projectedPassiveIncomeMonthly) ? 0 : projectedPassiveIncomeMonthly,
    currentMonthlyIncome: validIncome,
    monthlyDeficitOrSurplus: isNaN(monthlyDeficitOrSurplus) ? 0 : monthlyDeficitOrSurplus,
    isDeficit: monthlyDeficitOrSurplus < 0
  };
}

export interface ServiceabilityResult {
  maxPropertyValue: number;
  maxMonthlyPayment: number;
  surplusIncome: number;
  loanToValueRatio: number;
  monthlyRentalIncome: number;
  totalMonthlyExpenses: number;
  isViable: boolean;
  reason?: string;
}

export interface RetirementMetrics {
  projectedPassiveIncomeMonthly: number;
  currentMonthlyIncome: number;
  monthlyDeficitOrSurplus: number;
  isDeficit: boolean;
}

/**
 * Calculate investment property serviceability based on retirement surplus
 * @param retirementMetrics Retirement income and surplus/deficit metrics
 * @param interestRate Annual interest rate as decimal (e.g., 0.06 for 6%)
 * @param loanTermYears Loan term in years
 * @param loanToValueRatio Maximum LVR (e.g., 0.8 for 80%)
 * @param expectedRentalYield Annual rental yield as decimal (e.g., 0.04 for 4%)
 * @param propertyExpenses Monthly property expenses as % of property value
 */
export function calculatePropertyServiceability(
  retirementMetrics: RetirementMetrics,
  interestRate: number = 0.06,
  loanTermYears: number = 30,
  loanToValueRatio: number = 0.8,
  expectedRentalYield: number = 0.04,
  propertyExpenses: number = 0.02 // 2% annually for maintenance, insurance, rates etc.
): ServiceabilityResult {
  // Validate inputs
  const validInterestRate = isNaN(interestRate) || interestRate <= 0 ? 0.06 : interestRate;
  const validLoanTermYears = isNaN(loanTermYears) || loanTermYears <= 0 ? 30 : loanTermYears;
  const validLoanToValueRatio = isNaN(loanToValueRatio) || loanToValueRatio <= 0 ? 0.8 : loanToValueRatio;
  
  // Check if monthly income is zero or negative
  if (!retirementMetrics.currentMonthlyIncome || retirementMetrics.currentMonthlyIncome <= 0) {
    return {
      maxPropertyValue: 0,
      maxMonthlyPayment: 0,
      surplusIncome: 0,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: 0,
      totalMonthlyExpenses: 0,
      isViable: false,
      reason: "Please enter your income and expenses to calculate investment property potential."
    };
  }

  // First check if there's a retirement surplus
  if (retirementMetrics.isDeficit) {
    return {
      maxPropertyValue: 0,
      maxMonthlyPayment: 0,
      surplusIncome: 0,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: 0,
      totalMonthlyExpenses: 0,
      isViable: false,
      reason: "Retirement deficit must be addressed before considering investment properties"
    };
  }

  // Calculate available surplus after ensuring 70% of current income in retirement
  const retentionThreshold = retirementMetrics.currentMonthlyIncome * 0.7;
  const availableSurplus = Math.max(0, retirementMetrics.projectedPassiveIncomeMonthly - retentionThreshold);

  if (availableSurplus <= 0 || isNaN(availableSurplus)) {
    return {
      maxPropertyValue: 0,
      maxMonthlyPayment: 0,
      surplusIncome: 0,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: 0,
      totalMonthlyExpenses: 0,
      isViable: false,
      reason: "No surplus available after ensuring 70% of current income in retirement"
    };
  }

  // Add rental income to serviceability calculation
  // Use a conservative 75% of rental income for serviceability
  const rentalIncomeMultiplier = 0.75;
  
  // Calculate maximum borrowing based on surplus
  const maxMonthlyPayment = availableSurplus;
  const maxBorrowing = calculateMaxBorrowingCapacity(maxMonthlyPayment, validInterestRate, validLoanTermYears);
  
  // Validate borrowing calculation
  if (isNaN(maxBorrowing) || maxBorrowing <= 0) {
    return {
      maxPropertyValue: 0,
      maxMonthlyPayment: 0,
      surplusIncome: availableSurplus,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: 0,
      totalMonthlyExpenses: 0,
      isViable: false,
      reason: "Unable to calculate borrowing capacity. Please check your financial inputs."
    };
  }
  
  // Calculate maximum property value based on LVR
  const maxPropertyValue = maxBorrowing / validLoanToValueRatio;
  
  // Validate property value
  if (isNaN(maxPropertyValue) || maxPropertyValue <= 0) {
    return {
      maxPropertyValue: 0,
      maxMonthlyPayment: 0,
      surplusIncome: availableSurplus,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: 0,
      totalMonthlyExpenses: 0,
      isViable: false,
      reason: "Unable to calculate property value. Please check your financial inputs."
    };
  }
  
  // Calculate expected rental income
  const annualRentalIncome = maxPropertyValue * expectedRentalYield;
  const monthlyRentalIncome = annualRentalIncome / 12;
  
  // Calculate monthly property expenses
  const monthlyExpenses = (maxPropertyValue * propertyExpenses) / 12;
  
  // Recalculate with rental income contribution
  const totalServiceability = availableSurplus + (monthlyRentalIncome * rentalIncomeMultiplier);
  const maxBorrowingWithRental = calculateMaxBorrowingCapacity(totalServiceability, validInterestRate, validLoanTermYears);
  
  // Validate recalculation
  if (isNaN(maxBorrowingWithRental) || maxBorrowingWithRental <= 0) {
    // Return the initial calculation if recalculation fails
    return {
      maxPropertyValue: maxPropertyValue,
      maxMonthlyPayment: maxMonthlyPayment,
      surplusIncome: availableSurplus,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: monthlyRentalIncome || 0,
      totalMonthlyExpenses: monthlyExpenses || 0,
      isViable: true
    };
  }
  
  const maxPropertyValueWithRental = maxBorrowingWithRental / validLoanToValueRatio;
  
  // Final validation
  if (isNaN(maxPropertyValueWithRental) || maxPropertyValueWithRental <= 0) {
    return {
      maxPropertyValue: maxPropertyValue,
      maxMonthlyPayment: maxMonthlyPayment,
      surplusIncome: availableSurplus,
      loanToValueRatio: validLoanToValueRatio,
      monthlyRentalIncome: monthlyRentalIncome || 0,
      totalMonthlyExpenses: monthlyExpenses || 0,
      isViable: true
    };
  }
  
  return {
    maxPropertyValue: maxPropertyValueWithRental,
    maxMonthlyPayment: totalServiceability,
    surplusIncome: availableSurplus,
    loanToValueRatio: validLoanToValueRatio,
    monthlyRentalIncome: monthlyRentalIncome || 0,
    totalMonthlyExpenses: monthlyExpenses || 0,
    isViable: true
  };
}

/**
 * Calculate surplus available for investment after retirement needs
 * @param projectedPassiveIncome Monthly passive income in retirement
 * @param currentMonthlyIncome Current gross monthly income
 * @param requiredRetentionRatio Percentage of current income required in retirement (e.g., 0.7 for 70%)
 */
export function calculateRetirementInvestmentSurplus(
  projectedPassiveIncome: number,
  currentMonthlyIncome: number,
  requiredRetentionRatio: number = 0.7
): number {
  const requiredRetirementIncome = currentMonthlyIncome * requiredRetentionRatio;
  return Math.max(0, projectedPassiveIncome - requiredRetirementIncome);
}

// ---------------------------------------------------------------------------
// New canonical serviceability calculation
// Follows the specification: uses net income after tax, includes existing
// commitments, stress-tests at +3%, checks 10% buffer and serviceability ratio.
// ---------------------------------------------------------------------------
export interface ServiceabilityInput {
  clientData: any;
  proposedLoan?: {
    amount: number;
    interestRate?: number; // as decimal e.g., 0.06
    termYears?: number;
  };
}

export interface CanonicalServiceabilityResult {
  loanAmount: number;
  monthlyRepayment: number;
  totalMonthlyCommitments: number;
  monthlyNetIncome: number;
  netSurplusAfterLoan: number;
  serviceabilityRatio: number; // percent
  requiredBuffer: number;
  actualBuffer: number;
  hasBuffer: boolean;
  stressTestRepayment: number;
  passesStressTest: boolean;
  canAfford: boolean;
  assessment: 'APPROVED' | 'DECLINED';
  reasons: string[];
}

export function calculateServiceability(input: ServiceabilityInput): CanonicalServiceabilityResult {
  const clientData = input.clientData || {};
  const proposedLoan = input.proposedLoan || { amount: 0, interestRate: 0.06, termYears: 30 };

  const monthlySurplusResult = calculateMonthlySurplus(clientData);

  const monthlyNetIncome = (monthlySurplusResult.income.total || 0) - (monthlySurplusResult.expenses.tax || 0);

  // Sum existing commitments from the monthly surplus expenses (loanRepayments)
  const existingLoanRepayments = monthlySurplusResult.expenses.loanRepayments || 0;

  // Proposed loan repayment
  const monthlyRepayment = calculateLoanPayment({
    principal: proposedLoan.amount || 0,
    annualInterestRate: proposedLoan.interestRate || 0.06,
    termYears: proposedLoan.termYears || 30
  });

  const totalMonthlyCommitments = existingLoanRepayments + monthlyRepayment;

  const netSurplusAfterLoan = monthlySurplusResult.surplus - monthlyRepayment;

  const serviceabilityRatio = monthlyNetIncome > 0 ? (totalMonthlyCommitments / monthlyNetIncome) * 100 : Infinity;

  const requiredBuffer = monthlyNetIncome * 0.10;
  const actualBuffer = monthlyNetIncome - totalMonthlyCommitments;
  const hasBuffer = actualBuffer >= requiredBuffer;

  // Stress test at +3% interest
  const stressTestRate = (proposedLoan.interestRate || 0.06) + 0.03;
  const stressTestRepayment = calculateLoanPayment({
    principal: proposedLoan.amount || 0,
    annualInterestRate: stressTestRate,
    termYears: proposedLoan.termYears || 30
  });
  const passesStressTest = (monthlyNetIncome - existingLoanRepayments - stressTestRepayment) > requiredBuffer;

  const canAfford = isFinite(serviceabilityRatio) && serviceabilityRatio <= 35 && hasBuffer && passesStressTest && netSurplusAfterLoan >= 0;

  const reasons: string[] = [];
  if (!isFinite(serviceabilityRatio)) reasons.push('Insufficient net income to calculate serviceability');
  if (serviceabilityRatio > 35) reasons.push('Serviceability ratio too high (>35%)');
  if (!hasBuffer) reasons.push('Insufficient buffer remaining');
  if (!passesStressTest) reasons.push('Failed stress test at higher interest rate');
  if (netSurplusAfterLoan < 0) reasons.push('Negative cash flow after loan');

  return {
    loanAmount: proposedLoan.amount || 0,
    monthlyRepayment,
    totalMonthlyCommitments,
    monthlyNetIncome,
    netSurplusAfterLoan,
    serviceabilityRatio,
    requiredBuffer,
    actualBuffer,
    hasBuffer,
    stressTestRepayment,
    passesStressTest,
    canAfford,
    assessment: canAfford ? 'APPROVED' : 'DECLINED',
    reasons
  };
}
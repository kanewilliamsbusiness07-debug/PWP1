// ============================================
// TYPES & INTERFACES
// ============================================

export interface Asset {
  name: string;
  value: number;
  type: 'Property' | 'Super' | 'Shares' | 'Cash' | 'Other';
}

export interface Liability {
  lender: string;
  loanType: string;
  liabilityType: string;
  balanceOwing: number;
  repaymentAmount: number;
  frequency: 'W' | 'F' | 'M'; // Weekly, Fortnightly, Monthly
  interestRate: number; // Annual percentage
  loanTerm: number; // Years
  termRemaining: number; // Years remaining
}

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
  // Current Position Outputs
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

  // Future Projection Outputs
  yearsToRetirement: number;
  futureSuper: number;
  futureShares: number;
  futurePropertyValue: number;
  futurePropertyEquity: number;
  remainingPropertyLoans: number;
  futurePropertyAssets: number;
  futureOtherAssets: number;
  futureSavings: number;
  combinedNetworthAtRetirement: number;

  // Retirement Income Outputs
  futureMonthlyRentalIncome: number;
  futureAnnualRentalIncome: number;
  annualSuperWithdrawal: number;
  monthlySuperWithdrawal: number;
  projectedAnnualPassiveIncome: number;
  combinedMonthlyCashflowRetirement: number;

  // Analysis & Status Outputs
  finalAnnualIncome: number;
  requiredAnnualIncome: number;
  requiredMonthlyIncome: number;
  annualSurplusDeficit: number;
  monthlySurplusDeficit: number;
  status: 'surplus' | 'deficit';
  percentageOfTarget: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate remaining loan balance using standard amortization formula
 */
function calculateRemainingLoanBalance(
  initialLoan: number,
  annualInterestRate: number,
  loanTermYears: number,
  yearsPassed: number
): number {
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const monthsPassed = yearsPassed * 12;
  const remainingMonths = totalMonths - monthsPassed;

  // If loan is paid off
  if (remainingMonths <= 0) return 0;

  // Calculate monthly payment
  const monthlyPayment = initialLoan *
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // Calculate remaining balance
  const remainingBalance = monthlyPayment *
    ((1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate);

  return remainingBalance;
}

/**
 * Calculate future value with compound interest
 */
function calculateFutureValue(
  principal: number,
  rate: number,
  years: number
): number {
  return principal * Math.pow(1 + rate, years);
}

/**
 * Calculate future value of annuity (series of regular payments)
 */
function calculateFutureValueOfAnnuity(
  payment: number,
  rate: number,
  years: number,
  growthRate: number = 0
): number {
  if (Math.abs(rate - growthRate) < 0.0001) {
    // Edge case: when rate equals growth rate
    return payment * years * Math.pow(1 + rate, years - 1);
  }

  // Growing annuity formula
  return payment *
    ((Math.pow(1 + rate, years) - Math.pow(1 + growthRate, years)) / (rate - growthRate));
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

export function calculateFinancialProjections(inputs: FinancialInputs): ProjectionResults {

  // ========================================
  // CONSTANTS
  // ========================================
  const SUPER_GUARANTEE_RATE = 0.12; // 12% for 2024-25
  const RETIREMENT_INCOME_THRESHOLD = 0.70; // 70% of final income

  // ========================================
  // RATE CONVERSIONS
  // ========================================
  const years = inputs.retirementAge - inputs.currentAge;

  // Super return minus admin fees (0.08% = 0.0008)
  const r_super = (inputs.assumptions.superReturn - 0.08) / 100;
  const r_shares = inputs.assumptions.shareReturn / 100;
  const r_property = inputs.assumptions.propertyGrowthRate / 100;
  const g_salary = inputs.assumptions.salaryGrowthRate / 100;
  const g_rent = inputs.assumptions.rentGrowthRate / 100;
  const inflation = inputs.assumptions.inflationRate / 100;
  const withdrawalRate = inputs.assumptions.withdrawalRate / 100;
  const savingsRate = inputs.assumptions.savingsRate / 100;

  // ========================================
  // CURRENT POSITION CALCULATIONS
  // ========================================

  // Aggregate assets by type
  const currentSuper = inputs.assets
    .filter(a => a.type === 'Super')
    .reduce((sum, a) => sum + a.value, 0);

  const currentSavings = inputs.assets
    .filter(a => a.type === 'Cash')
    .reduce((sum, a) => sum + a.value, 0);

  const currentShares = inputs.assets
    .filter(a => a.type === 'Shares')
    .reduce((sum, a) => sum + a.value, 0);

  // Property assets (non-investment properties in asset list)
  const currentPropertyAssets = inputs.assets
    .filter(a => a.type === 'Property')
    .reduce((sum, a) => sum + a.value, 0);

  // Other assets (cash equivalents, bonds, etc.)
  const currentOtherAssets = inputs.assets
    .filter(a => a.type === 'Other')
    .reduce((sum, a) => sum + a.value, 0);

  // Investment property equity (value - loan)
  const propertyEquity = inputs.investmentProperties
    .reduce((sum, p) => sum + (p.currentValue - p.loanAmount), 0);

  // Totals
  const totalAssets = inputs.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = inputs.liabilities.reduce((sum, l) => sum + l.balanceOwing, 0);
  const currentNetWorth = totalAssets - totalLiabilities;

  // Monthly debt payments (convert all to monthly)
  const monthlyDebtPayments = inputs.liabilities.reduce((sum, l) => {
    let monthly = 0;
    switch (l.frequency) {
      case 'W': // Weekly
        monthly = l.repaymentAmount * 52 / 12;
        break;
      case 'F': // Fortnightly
        monthly = l.repaymentAmount * 26 / 12;
        break;
      case 'M': // Monthly
        monthly = l.repaymentAmount;
        break;
    }
    return sum + monthly;
  }, 0);

  // Monthly rental income from investment properties
  const monthlyRentalIncome = inputs.investmentProperties
    .reduce((sum, p) => sum + (p.weeklyRent * 52 / 12), 0);

  // Total annual income (all sources)
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

  // Annual super contribution (capped at maximum)
  const QUARTERLY_EARNINGS_CAP = 63750;
  const MAX_ANNUAL_SUPER = 30600;

  let annualSuperContribution = inputs.annualIncome * SUPER_GUARANTEE_RATE;
  if (annualSuperContribution > MAX_ANNUAL_SUPER) {
    annualSuperContribution = MAX_ANNUAL_SUPER;
  }

  // Part 1: Current super balance grows
  const futureSuperFromGrowth = calculateFutureValue(
    currentSuper,
    r_super,
    years
  );

  // Part 2: Future contributions (growing annuity)
  const futureSuperFromContributions = calculateFutureValueOfAnnuity(
    annualSuperContribution,
    r_super,
    years,
    g_salary
  );

  const futureSuper = futureSuperFromGrowth + futureSuperFromContributions;

  // ========================================
  // FUTURE SHARES
  // ========================================

  const futureShares = calculateFutureValue(
    currentShares,
    r_shares,
    years
  );

  // ========================================
  // FUTURE PROPERTY ASSETS (Non-Investment Properties)
  // ========================================

  const futurePropertyAssets = calculateFutureValue(
    currentPropertyAssets,
    r_property,
    years
  );

  // ========================================
  // FUTURE OTHER ASSETS
  // ========================================

  // Other assets grow at conservative 3% rate
  const futureOtherAssets = calculateFutureValue(
    currentOtherAssets,
    0.03,
    years
  );

  // ========================================
  // FUTURE INVESTMENT PROPERTY EQUITY
  // ========================================

  let futurePropertyValue = 0;
  let remainingPropertyLoans = 0;
  let futurePropertyEquity = 0;

  for (const property of inputs.investmentProperties) {
    // Property value grows with compound interest
    const futurePropValue = calculateFutureValue(
      property.currentValue,
      r_property,
      years
    );
    futurePropertyValue += futurePropValue;

    // Calculate remaining loan balance
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
  // FUTURE SAVINGS
  // ========================================

  // Part 1: Current savings grow
  const futureSavingsFromGrowth = calculateFutureValue(
    currentSavings,
    r_super,
    years
  );

  // Part 2: Future savings contributions
  // Savings rate applied to annual income
  const annualSavingsContribution = inputs.annualIncome * savingsRate;

  const futureSavingsFromContributions = calculateFutureValueOfAnnuity(
    annualSavingsContribution,
    r_super,
    years,
    g_salary
  );

  // Part 3: Net cashflow accumulated
  const initialAnnualCashflow = currentMonthlyCashflow * 12;

  // Only add if positive cashflow
  let futureSavingsFromCashflow = 0;
  if (initialAnnualCashflow > 0) {
    const effectiveCashflowGrowth = g_rent - inflation;
    futureSavingsFromCashflow = calculateFutureValueOfAnnuity(
      initialAnnualCashflow,
      r_super,
      years,
      effectiveCashflowGrowth
    );
  }

  const futureSavings = Math.max(
    0,
    futureSavingsFromGrowth +
    futureSavingsFromContributions +
    futureSavingsFromCashflow
  );

  // ========================================
  // COMBINED NET WORTH AT RETIREMENT
  // ========================================

  const combinedNetworthAtRetirement =
    futureSuper +
    futureShares +
    futurePropertyEquity +
    futurePropertyAssets +
    futureOtherAssets +
    futureSavings;

  // ========================================
  // RETIREMENT INCOME
  // ========================================

  // Future rental income (grows with rent growth rate)
  const futureMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + g_rent, years);
  const futureAnnualRentalIncome = futureMonthlyRentalIncome * 12;

  // Super withdrawal (safe withdrawal rate)
  const annualSuperWithdrawal = futureSuper * withdrawalRate;
  const monthlySuperWithdrawal = annualSuperWithdrawal / 12;

  // Total passive income
  const projectedAnnualPassiveIncome =
    futureAnnualRentalIncome +
    annualSuperWithdrawal;

  // Future monthly expenses (adjusted for inflation)
  const futureMonthlyExpenses = inputs.monthlyExpenses * Math.pow(1 + inflation, years);

  // Future loan payments (if any loans remain)
  const futureMonthlyLoanPayments = inputs.liabilities.reduce((sum, l) => {
    if (years < l.termRemaining) {
      // Loan still active
      let monthly = 0;
      switch (l.frequency) {
        case 'W': monthly = l.repaymentAmount * 52 / 12; break;
        case 'F': monthly = l.repaymentAmount * 26 / 12; break;
        case 'M': monthly = l.repaymentAmount; break;
      }
      return sum + monthly;
    }
    return sum;
  }, 0);

  // Monthly cashflow at retirement
  const combinedMonthlyCashflowRetirement =
    (projectedAnnualPassiveIncome / 12) -
    futureMonthlyExpenses -
    futureMonthlyLoanPayments;

  // ========================================
  // TARGET INCOME & SURPLUS/DEFICIT
  // ========================================

  // Final salary after years of growth
  const finalAnnualIncome = inputs.annualIncome * Math.pow(1 + g_salary, years);

  // Required income is 70% of final salary
  const requiredAnnualIncome = finalAnnualIncome * RETIREMENT_INCOME_THRESHOLD;
  const requiredMonthlyIncome = requiredAnnualIncome / 12;

  // Surplus or deficit
  const annualSurplusDeficit = projectedAnnualPassiveIncome - requiredAnnualIncome;
  const monthlySurplusDeficit = annualSurplusDeficit / 12;
  const status: 'surplus' | 'deficit' = annualSurplusDeficit >= 0 ? 'surplus' : 'deficit';
  const percentageOfTarget = (projectedAnnualPassiveIncome / requiredAnnualIncome) * 100;

  // ========================================
  // RETURN COMPLETE RESULTS
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
    futurePropertyValue,
    futurePropertyEquity,
    remainingPropertyLoans,
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

    // Analysis & Status
    finalAnnualIncome,
    requiredAnnualIncome,
    requiredMonthlyIncome,
    annualSurplusDeficit,
    monthlySurplusDeficit,
    status,
    percentageOfTarget,
  };
}

// ============================================
// VERIFICATION FUNCTION
// ============================================

export function verifyCalculations(inputs: FinancialInputs) {
  const results = calculateFinancialProjections(inputs);

  console.log('=== FINANCIAL PROJECTIONS VERIFICATION ===');
  console.log('\n📊 CURRENT POSITION:');
  console.log(`Age: ${results.currentAge} → Retirement: ${results.retirementAge} (${results.yearsToRetirement} years)`);
  console.log(`Current Net Worth: $${results.currentNetWorth.toLocaleString()}`);
  console.log(`  - Super: $${results.currentSuper.toLocaleString()}`);
  console.log(`  - Shares: $${results.currentShares.toLocaleString()}`);
  console.log(`  - Property Equity: $${results.propertyEquity.toLocaleString()}`);
  console.log(`  - Savings: $${results.currentSavings.toLocaleString()}`);
  console.log(`Current Monthly Cashflow: $${results.currentMonthlyCashflow.toLocaleString()}`);

  console.log('\n🎯 FUTURE PROJECTIONS:');
  console.log(`Combined Net Worth at Retirement: $${results.combinedNetworthAtRetirement.toLocaleString()}`);
  console.log(`  - Future Super: $${results.futureSuper.toLocaleString()}`);
  console.log(`  - Future Shares: $${results.futureShares.toLocaleString()}`);
  console.log(`  - Future Property Equity: $${results.futurePropertyEquity.toLocaleString()}`);
  console.log(`  - Future Property Assets: $${results.futurePropertyAssets.toLocaleString()}`);
  console.log(`  - Future Savings: $${results.futureSavings.toLocaleString()}`);
  console.log(`  - Future Other Assets: $${results.futureOtherAssets.toLocaleString()}`);
  console.log(`Remaining Property Loans: $${results.remainingPropertyLoans.toLocaleString()}`);

  console.log('\n💰 RETIREMENT INCOME:');
  console.log(`Projected Annual Passive Income: $${results.projectedAnnualPassiveIncome.toLocaleString()}`);
  console.log(`  - Super Withdrawal: $${results.annualSuperWithdrawal.toLocaleString()}/year`);
  console.log(`  - Rental Income: $${results.futureAnnualRentalIncome.toLocaleString()}/year`);
  console.log(`Monthly Passive Income: $${(results.projectedAnnualPassiveIncome / 12).toLocaleString()}`);
  console.log(`Monthly Cashflow: $${results.combinedMonthlyCashflowRetirement.toLocaleString()}`);

  console.log('\n✅ RETIREMENT STATUS:');
  console.log(`Required Annual Income (70% rule): $${results.requiredAnnualIncome.toLocaleString()}`);
  console.log(`Projected Annual Income: $${results.projectedAnnualPassiveIncome.toLocaleString()}`);
  console.log(`Annual ${results.status.toUpperCase()}: $${Math.abs(results.annualSurplusDeficit).toLocaleString()}`);
  console.log(`Monthly ${results.status.toUpperCase()}: $${Math.abs(results.monthlySurplusDeficit).toLocaleString()}`);
  console.log(`Percentage of Target: ${results.percentageOfTarget.toFixed(1)}%`);

  console.log('\n==========================================\n');

  return results;
}
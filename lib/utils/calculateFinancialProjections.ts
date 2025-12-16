/**
 * Financial Projections Calculator
 *
 * Comprehensive calculation engine for retirement planning projections
 * Implements proper compound interest formulas and data aggregation
 */

export interface FinancialInputs {
  // Income Sources (All Annual)
  annualIncome: number;
  rentalIncome: number;
  dividends: number;
  frankedDividends: number;
  capitalGains: number;
  otherIncome: number;

  // Expenses
  monthlyExpenses: number;

  // Assets (Dynamic Array)
  assets: Array<{
    name: string;
    value: number;
    type: 'Property' | 'Super' | 'Shares' | 'Cash' | 'Other';
  }>;

  // Liabilities (Dynamic Array)
  liabilities: Array<{
    lender: string;
    loanType: string;
    liabilityType: string;
    balanceOwing: number;
    repaymentAmount: number;
    frequency: 'W' | 'F' | 'M';
    interestRate: number;
    loanTerm: number;
    termRemaining: number;
  }>;

  // Investment Properties (Dynamic Array)
  investmentProperties: Array<{
    address: string;
    purchasePrice: number;
    currentValue: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    weeklyRent: number;
    annualExpenses: number;
  }>;

  // Current Position
  currentAge: number;
  retirementAge: number;

  // Assumptions (Shared)
  assumptions: {
    inflationRate: number;
    salaryGrowthRate: number;
    superReturn: number;
    shareReturn: number;
    propertyGrowthRate: number;
    withdrawalRate: number;
    rentGrowthRate: number;
  };
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
  monthlyDebtPayments: number;
  monthlyRentalIncome: number;
  currentMonthlyCashflow: number;
  totalAnnualIncome: number;

  // Future Projections
  yearsToRetirement: number;
  futureSuper: number;
  futureShares: number;
  futurePropertyEquity: number;
  futureSavings: number;
  combinedNetworthAtRetirement: number;

  // Retirement Income
  futureMonthlyRentalIncome: number;
  monthlyInvestmentWithdrawal: number;
  combinedMonthlyCashflowRetirement: number;
  projectedAnnualPassiveIncome: number;

  // Target & Surplus/Deficit
  requiredAnnualIncome: number;
  requiredMonthlyIncome: number;
  monthlySurplusDeficit: number;
  status: 'surplus' | 'deficit';
  percentageOfTarget: number;
}

export function calculateFinancialProjections(inputs: FinancialInputs): ProjectionResults {
  // Constants
  const SUPER_GUARANTEE_RATE = 0.115;
  const RETIREMENT_INCOME_THRESHOLD = 0.70;

  // Calculate current position
  const currentSuper = inputs.assets
    .filter(asset => asset.type === 'Super')
    .reduce((sum, asset) => sum + asset.value, 0);

  const currentSavings = inputs.assets
    .filter(asset => asset.type === 'Cash')
    .reduce((sum, asset) => sum + asset.value, 0);

  const currentShares = inputs.assets
    .filter(asset => asset.type === 'Shares')
    .reduce((sum, asset) => sum + asset.value, 0);

  const propertyEquity = inputs.investmentProperties.reduce((sum, property) => {
    const equity = property.currentValue - property.loanAmount;
    return sum + equity;
  }, 0);

  const totalAssets = inputs.assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = inputs.liabilities.reduce((sum, liability) => sum + liability.balanceOwing, 0);
  const currentNetWorth = totalAssets - totalLiabilities;

  const monthlyDebtPayments = inputs.liabilities.reduce((sum, liability) => {
    let monthlyAmount = 0;

    switch (liability.frequency) {
      case 'W': // Weekly
        monthlyAmount = liability.repaymentAmount * 52 / 12;
        break;
      case 'F': // Fortnightly
        monthlyAmount = liability.repaymentAmount * 26 / 12;
        break;
      case 'M': // Monthly
        monthlyAmount = liability.repaymentAmount;
        break;
      default:
        monthlyAmount = liability.repaymentAmount;
    }

    return sum + monthlyAmount;
  }, 0);

  const monthlyRentalIncome = inputs.investmentProperties.reduce((sum, property) => {
    const monthlyRent = property.weeklyRent * 52 / 12;
    return sum + monthlyRent;
  }, 0);

  const totalAnnualIncome =
    inputs.annualIncome +
    inputs.rentalIncome +
    inputs.dividends +
    inputs.frankedDividends +
    inputs.capitalGains +
    inputs.otherIncome;

  const currentMonthlyCashflow =
    (totalAnnualIncome / 12) - inputs.monthlyExpenses - monthlyDebtPayments;

  // Calculate years
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);

  // Convert rates to decimals
  const r_super = inputs.assumptions.superReturn / 100;
  const r_shares = inputs.assumptions.shareReturn / 100;
  const r_property = inputs.assumptions.propertyGrowthRate / 100;
  const g_salary = inputs.assumptions.salaryGrowthRate / 100;
  const g_rent = inputs.assumptions.rentGrowthRate / 100;
  const inflation = inputs.assumptions.inflationRate / 100;

  // ===== FUTURE SUPERANNUATION =====
  // Part 1: Current super grows with compound interest
  const futureSuperFromGrowth = currentSuper * Math.pow(1 + r_super, yearsToRetirement);

  // Part 2: Future contributions (growing annuity)
  const annualSuperContribution = inputs.annualIncome * SUPER_GUARANTEE_RATE;

  let futureSuperFromContributions = 0;
  if (Math.abs(r_super - g_salary) < 0.0001) {
    // Special case when rates are equal
    futureSuperFromContributions = annualSuperContribution * yearsToRetirement * Math.pow(1 + r_super, yearsToRetirement - 1);
  } else {
    futureSuperFromContributions = annualSuperContribution *
      ((Math.pow(1 + r_super, yearsToRetirement) - Math.pow(1 + g_salary, yearsToRetirement)) / (r_super - g_salary));
  }

  const futureSuper = futureSuperFromGrowth + futureSuperFromContributions;

  // ===== FUTURE SHARES =====
  const futureShares = currentShares * Math.pow(1 + r_shares, yearsToRetirement);

  // ===== FUTURE PROPERTY EQUITY =====
  let futurePropertyEquity = 0;

  inputs.investmentProperties.forEach(property => {
    const futurePropValue = property.currentValue * Math.pow(1 + r_property, yearsToRetirement);

    // Calculate remaining loan balance after years
    const monthlyRate = property.interestRate / 100 / 12;
    const monthsRemaining = property.loanTerm * 12;
    const monthlyPayment = property.loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, monthsRemaining)) /
      (Math.pow(1 + monthlyRate, monthsRemaining) - 1);

    // Calculate loan balance after years
    const monthsPassed = yearsToRetirement * 12;
    const remainingMonths = Math.max(0, monthsRemaining - monthsPassed);

    let remainingBalance = 0;
    if (remainingMonths > 0) {
      remainingBalance = monthlyPayment *
        ((Math.pow(1 + monthlyRate, remainingMonths) - 1) /
         (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)));
    }

    const equity = futurePropValue - remainingBalance;
    futurePropertyEquity += equity;
  });

  // ===== FUTURE SAVINGS =====
  // Current monthly net cashflow
  const initialAnnualCashflow = currentMonthlyCashflow * 12;

  // Part 1: Current savings grow
  const futureSavingsFromGrowth = currentSavings * Math.pow(1 + r_super, yearsToRetirement);

  // Part 2: Net cashflow accumulated (with adjustments)
  // Rental income grows at rent growth rate
  // Expenses grow at inflation rate
  // Net effect: effective growth = rent growth - inflation
  const effectiveCashflowGrowth = g_rent - inflation;

  let futureSavingsFromCashflow = 0;
  if (initialAnnualCashflow > 0) {
    if (Math.abs(r_super - effectiveCashflowGrowth) < 0.0001) {
      futureSavingsFromCashflow = initialAnnualCashflow * yearsToRetirement * Math.pow(1 + r_super, yearsToRetirement - 1);
    } else {
      futureSavingsFromCashflow = initialAnnualCashflow *
        ((Math.pow(1 + r_super, yearsToRetirement) - Math.pow(1 + effectiveCashflowGrowth, yearsToRetirement)) /
         (r_super - effectiveCashflowGrowth));
    }
  }

  const futureSavings = Math.max(0, futureSavingsFromGrowth + futureSavingsFromCashflow);

  // ===== COMBINED NET WORTH =====
  const combinedNetworthAtRetirement = futureSuper + futureShares + futurePropertyEquity + futureSavings;

  // ===== RETIREMENT INCOME =====
  const futureMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + g_rent, yearsToRetirement);
  const withdrawalRate = inputs.assumptions.withdrawalRate / 100;
  const annualInvestmentWithdrawal = combinedNetworthAtRetirement * withdrawalRate;
  const monthlyInvestmentWithdrawal = annualInvestmentWithdrawal / 12;

  const combinedMonthlyCashflowRetirement =
    futureMonthlyRentalIncome +
    monthlyInvestmentWithdrawal -
    inputs.monthlyExpenses; // Assumes expenses adjusted for inflation

  const projectedAnnualPassiveIncome =
    (futureMonthlyRentalIncome * 12) +
    annualInvestmentWithdrawal;

  // ===== TARGET INCOME =====
  const finalAnnualIncome = inputs.annualIncome * Math.pow(1 + g_salary, yearsToRetirement);
  const requiredAnnualIncome = finalAnnualIncome * RETIREMENT_INCOME_THRESHOLD;
  const requiredMonthlyIncome = requiredAnnualIncome / 12;

  // ===== SURPLUS/DEFICIT =====
  const monthlySurplusDeficit = (projectedAnnualPassiveIncome / 12) - requiredMonthlyIncome;
  const status: 'surplus' | 'deficit' = monthlySurplusDeficit >= 0 ? 'surplus' : 'deficit';
  const percentageOfTarget = (projectedAnnualPassiveIncome / requiredAnnualIncome) * 100;

  return {
    // Current Position
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
    currentSuper,
    currentSavings,
    currentShares,
    propertyEquity,
    currentNetWorth,
    monthlyDebtPayments,
    monthlyRentalIncome,
    currentMonthlyCashflow,
    totalAnnualIncome,

    // Future Projections
    yearsToRetirement,
    futureSuper,
    futureShares,
    futurePropertyEquity,
    futureSavings,
    combinedNetworthAtRetirement,

    // Retirement Income
    futureMonthlyRentalIncome,
    monthlyInvestmentWithdrawal,
    combinedMonthlyCashflowRetirement,
    projectedAnnualPassiveIncome,

    // Target & Surplus/Deficit
    requiredAnnualIncome,
    requiredMonthlyIncome,
    monthlySurplusDeficit,
    status,
    percentageOfTarget,
  };
}
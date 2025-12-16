/**
 * Test script to verify Financial Projections calculations
 */

import { calculateFinancialProjections } from '../lib/utils/calculateFinancialProjections';

const testInputs = {
  annualIncome: 150000,
  rentalIncome: 39000, // $3,250 monthly
  dividends: 0,
  frankedDividends: 0,
  capitalGains: 0,
  otherIncome: 0,
  monthlyExpenses: 4500,
  currentAge: 30,
  retirementAge: 65,
  assets: [
    { name: 'Superannuation', value: 220000, type: 'Super' as const },
    { name: 'Home', value: 1200000, type: 'Property' as const },
    { name: 'Investment Unit', value: 800000, type: 'Property' as const },
  ],
  liabilities: [
    { lender: 'ANZ', loanType: 'Fixed', liabilityType: 'Mortgage', balanceOwing: 410000, repaymentAmount: 600, frequency: 'W' as const, interestRate: 5.2, loanTerm: 30, termRemaining: 20 },
    { lender: 'ANZ', loanType: 'Fixed', liabilityType: 'Mortgage', balanceOwing: 400000, repaymentAmount: 750, frequency: 'W' as const, interestRate: 6.2, loanTerm: 30, termRemaining: 25 },
  ],
  investmentProperties: [
    { address: 'Investment Unit', purchasePrice: 500000, currentValue: 800000, loanAmount: 400000, interestRate: 6.2, loanTerm: 30, weeklyRent: 750, annualExpenses: 4000 },
  ],
  assumptions: {
    inflationRate: 2.5,
    salaryGrowthRate: 3.0,
    superReturn: 7.0,
    shareReturn: 7.0,
    propertyGrowthRate: 4.0,
    withdrawalRate: 4.0,
    rentGrowthRate: 3.0,
  },
};

console.log('=== FINANCIAL PROJECTIONS TEST ===');
const results = calculateFinancialProjections(testInputs);

console.log('Input Data:');
console.log('- Annual Income: $150,000');
console.log('- Current Age: 30, Retirement Age: 65');
console.log('- Current Super: $220,000');
console.log('- Monthly Expenses: $4,500');
console.log('- Investment Property: $800K value, $400K loan, $750/week rent');

console.log('\nCurrent Position:');
console.log('- Current Super:', results.currentSuper);
console.log('- Current Savings:', results.currentSavings);
console.log('- Current Shares:', results.currentShares);
console.log('- Property Equity:', results.propertyEquity);
console.log('- Current Net Worth:', results.currentNetWorth);
console.log('- Monthly Debt Payments:', results.monthlyDebtPayments);
console.log('- Monthly Rental Income:', results.monthlyRentalIncome);
console.log('- Current Monthly Cashflow:', results.currentMonthlyCashflow);

console.log('\nFuture Projections (35 years):');
console.log('- Years to Retirement:', results.yearsToRetirement);
console.log('- Future Super:', Math.round(results.futureSuper));
console.log('- Future Shares:', Math.round(results.futureShares));
console.log('- Future Property Equity:', Math.round(results.futurePropertyEquity));
console.log('- Future Savings:', Math.round(results.futureSavings));
console.log('- Combined Net Worth at Retirement:', Math.round(results.combinedNetworthAtRetirement));

console.log('\nRetirement Income:');
console.log('- Future Monthly Rental Income:', Math.round(results.futureMonthlyRentalIncome));
console.log('- Monthly Investment Withdrawal:', Math.round(results.monthlyInvestmentWithdrawal));
console.log('- Combined Monthly Cashflow at Retirement:', Math.round(results.combinedMonthlyCashflowRetirement));
console.log('- Projected Annual Passive Income:', Math.round(results.projectedAnnualPassiveIncome));

console.log('\nTarget & Surplus/Deficit:');
console.log('- Required Annual Income (70% of final salary):', Math.round(results.requiredAnnualIncome));
console.log('- Required Monthly Income:', Math.round(results.requiredMonthlyIncome));
console.log('- Monthly Surplus/Deficit:', Math.round(results.monthlySurplusDeficit));
console.log('- Status:', results.status);
console.log('- Percentage of Target:', Math.round(results.percentageOfTarget), '%');

console.log('\n=== TEST COMPLETE ===');
import { computeSummaryFromClient } from '@/lib/utils/summary-utils';
import { convertClientToInputs } from '@/lib/utils/convertClientToInputs';
import { calculateFinancialProjections } from '@/lib/utils/calculateFinancialProjections';

describe('Summary ↔ Projections integration', () => {
  const client = {
    firstName: 'Test',
    lastName: 'User',
    annualIncome: 80000,
    rentalIncome: 10000,
    monthlyExpenses: 3000,
    assets: [
      { name: 'Shares', currentValue: 100000, type: 'shares' },
      { name: 'Home', currentValue: 600000, type: 'property' },
      { name: 'Savings', currentValue: 50000, type: 'savings' },
      { name: 'Other', currentValue: 10000, type: 'other' }
    ],
    investmentProperties: [
      { address: 'Inv 1', purchasePrice: 400000, currentValue: 450000, loanAmount: 200000, interestRate: 4.0, loanTerm: 25, weeklyRent: 600, annualExpenses: 8000 }
    ],
    liabilities: [
      { lender: 'Bank', loanType: 'Mortgage', liabilityType: 'Mortgage', balanceOwing: 300000, repaymentAmount: 2500, frequency: 'M', interestRate: 4.5, loanTerm: 25, termRemaining: 20 }
    ],
    currentAge: 35,
    retirementAge: 65
  } as any;

  const sharedAssumptions = {
    inflationRate: 2.5,
    salaryGrowthRate: 3.0,
    superReturn: 8.0,
    shareReturn: 7.0,
    propertyGrowthRate: 5.0,
    withdrawalRate: 4.0,
    rentGrowthRate: 3.0,
    savingsRate: 10.0
  };

  test('Summary uses stored projection when available', () => {
    const inputs = convertClientToInputs(client, sharedAssumptions);
    if (!inputs) throw new Error('convertClientToInputs returned null in test');
    const proj = calculateFinancialProjections(inputs);

    // Simulate stored projection shape
    const stored = {
      projectedLumpSum: proj.combinedNetworthAtRetirement,
      monthlyPassiveIncome: proj.projectedAnnualPassiveIncome / 12,
      monthlyDeficitSurplus: proj.monthlySurplusDeficit,
      yearsToRetirement: proj.yearsToRetirement,
      isDeficit: proj.status === 'deficit'
    };

    const summary = computeSummaryFromClient(client, sharedAssumptions, stored);
    expect(summary.projectedRetirementLumpSum).toBeCloseTo(stored.projectedLumpSum);
    expect(summary.projectedRetirementMonthlyCashFlow).toBeCloseTo(stored.monthlyPassiveIncome);
    expect(summary.retirementDeficitSurplus).toBeCloseTo(stored.monthlyDeficitSurplus);
  });

  test('Summary computes same values as Projections when no stored result', () => {
    const inputs = convertClientToInputs(client, sharedAssumptions);
    if (!inputs) throw new Error('convertClientToInputs returned null in test');
    const proj = calculateFinancialProjections(inputs);

    const summary = computeSummaryFromClient(client, sharedAssumptions, undefined);
    expect(summary.projectedRetirementLumpSum).toBeCloseTo(proj.combinedNetworthAtRetirement);
    expect(summary.projectedRetirementMonthlyCashFlow).toBeCloseTo(proj.projectedAnnualPassiveIncome / 12);
    expect(summary.retirementDeficitSurplus).toBeCloseTo(proj.monthlySurplusDeficit);
  });
});
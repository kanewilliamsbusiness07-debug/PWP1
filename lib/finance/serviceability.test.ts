import { describe, it, expect } from 'vitest';
import { calculateServiceability, calculateRetirementInvestmentSurplus } from './serviceability';
import { calculateMonthlySurplus } from './calculations';

describe('Serviceability', () => {
  it('computes monthlyNetIncome as surplus + existing loan repayments and buffers correctly', () => {
    const clientData: any = {
      income: {
        employment: 120000, // annual
        rental: 0,
        investment: 0,
        other: 0
      },
      financials: {
        monthlyExpenses: 3000
      },
      liabilities: {
        homeLoan: null,
        investmentLoans: [],
        personalLoans: [],
        creditCards: []
      },
      assets: {
        properties: []
      },
      liabilitiesExtra: {}
    };

    const monthlySurplus = calculateMonthlySurplus(clientData);

    const proposed = { amount: 250000, interestRate: 0.06, termYears: 30 };

    const result = calculateServiceability({ clientData, proposedLoan: proposed });

    // monthlyNetIncome should equal surplus + existing loan repayments
    expect(result.monthlyNetIncome).toBeCloseTo(monthlySurplus.surplus + (monthlySurplus.expenses.loanRepayments || 0), 6);

    // requiredBuffer should be 10% of monthlyNetIncome
    expect(result.requiredBuffer).toBeCloseTo(result.monthlyNetIncome * 0.10, 6);

    // actualBuffer should equal monthlyNetIncome - totalMonthlyCommitments
    expect(result.actualBuffer).toBeCloseTo(result.monthlyNetIncome - result.totalMonthlyCommitments, 6);

    // serviceabilityRatio should be finite number
    expect(Number.isFinite(result.serviceabilityRatio)).toBeTruthy();
  });

  it('calculateRetirementInvestmentSurplus returns zero when projected passive income is below required retention', () => {
    const surplus = calculateRetirementInvestmentSurplus(500, 2000, 0.7);
    expect(surplus).toBe(0);
  });
});

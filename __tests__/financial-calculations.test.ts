/**
 * Financial Calculations Unit Tests
 *
 * Verified against online calculators:
 * - Bankrate: https://www.bankrate.com/calculators/
 * - NerdWallet: https://www.nerdwallet.com/calculator/
 * - Calculator.net: https://www.calculator.net/
 */

import {
  calculateFutureValue,
  calculateFutureValueOfAnnuity,
  calculateFutureValueOfGrowingAnnuity,
  calculateTotalGrowth,
  calculateLoanPayment,
  calculateAmortizationSchedule,
  calculateRemainingLoanBalance,
  calculateNetWorthProjection,
  calculateSafeWithdrawal,
  calculateRetirementIncome,
  calculateRetirementProjection,
  validateFinancialInputs,
} from '@/lib/financial-calculations';
import { calculateTax } from '@/lib/tax/tax-engine';

describe('Financial Calculations', () => {
  describe('calculateFutureValue', () => {
    test('matches Calculator.net compound interest calculator', () => {
      // $10,000 at 7% for 10 years = $19,671.51
      const result = calculateFutureValue(10000, 0.07, 10);
      expect(result).toBeCloseTo(19671.51, 2);
    });

    test('handles zero interest rate', () => {
      const result = calculateFutureValue(10000, 0, 10);
      expect(result).toBe(10000);
    });

    test('handles zero principal', () => {
      const result = calculateFutureValue(0, 0.07, 10);
      expect(result).toBe(0);
    });

    test('handles negative returns', () => {
      const result = calculateFutureValue(10000, -0.05, 5);
      expect(result).toBeCloseTo(7737.81, 2);
    });

    test('validates inputs', () => {
      expect(() => calculateFutureValue(-1000, 0.07, 10)).toThrow('Present value cannot be negative');
      expect(() => calculateFutureValue(1000, 2, 10)).toThrow('Annual rate must be between -100% and 100%');
      expect(() => calculateFutureValue(1000, 0.07, -5)).toThrow('Years must be between 0 and 100');
    });
  });

  describe('calculateFutureValueOfGrowingAnnuity', () => {
    test('calculates growing annuity correctly', () => {
      // $100 initial payment, 5% return, 3% annual growth, 10 years
      const result = calculateFutureValueOfGrowingAnnuity(100, 0.05, 0.03, 10, 1);
      expect(result).toBeCloseTo(1424.89, 2); // Verified calculation
    });

    test('handles zero growth rate (becomes regular annuity)', () => {
      const growing = calculateFutureValueOfGrowingAnnuity(100, 0.05, 0, 10, 1);
      const regular = calculateFutureValueOfAnnuity(100, 0.05, 10, 1);
      expect(growing).toBeCloseTo(regular, 2);
    });

    test('validates inputs', () => {
      expect(() => calculateFutureValueOfGrowingAnnuity(-100, 0.05, 0.03, 10, 1)).toThrow('Initial payment cannot be negative');
      expect(() => calculateFutureValueOfGrowingAnnuity(100, 0.05, 0.03, 10, 0)).toThrow('Payments per year must be between 1 and 365');
    });
  });

  describe('calculateTotalGrowth', () => {
    test('matches NerdWallet investment calculator', () => {
      // $10,000 initial + $500/month at 7% for 20 years
      const result = calculateTotalGrowth(10000, 500, 0.07, 20);
      expect(result).toBeCloseTo(299160.17, 2); // Correct calculation
    });
  });

  describe('calculateLoanPayment', () => {
    test('matches Bankrate mortgage calculator', () => {
      // $300,000 at 4.5% for 30 years = $1,520.06
      const result = calculateLoanPayment(300000, 0.045, 30);
      expect(result).toBeCloseTo(1520.06, 2);
    });

    test('handles zero interest rate', () => {
      const result = calculateLoanPayment(100000, 0, 10);
      expect(result).toBeCloseTo(833.33, 2); // 100000 / (10 * 12)
    });

    test('validates inputs', () => {
      expect(() => calculateLoanPayment(-100000, 0.045, 30)).toThrow('Principal cannot be negative');
      expect(() => calculateLoanPayment(100000, -0.01, 30)).toThrow('Annual rate must be between 0% and 100%');
      expect(() => calculateLoanPayment(100000, 0.045, 0)).toThrow('Years must be between 1 and 50');
    });
  });

  describe('calculateAmortizationSchedule', () => {
    test('calculates correct schedule', () => {
      const schedule = calculateAmortizationSchedule(100000, 0.06, 10);
      expect(schedule).toHaveLength(120); // 10 years * 12 months

      // First payment
      expect(schedule[0].payment).toBeCloseTo(1110.21, 2);
      expect(schedule[0].principal).toBeCloseTo(610.21, 2);
      expect(schedule[0].interest).toBeCloseTo(500.00, 2);
      expect(schedule[0].remainingBalance).toBeCloseTo(99389.79, 2);

      // Last payment should bring balance to zero
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.remainingBalance).toBe(0);
    });
  });

  describe('calculateRemainingLoanBalance', () => {
    test('calculates remaining balance correctly', () => {
      // $300,000 loan at 4.5% for 30 years, after 10 years
      const result = calculateRemainingLoanBalance(300000, 0.045, 30, 10);
      expect(result).toBeCloseTo(240268, 0); // Correct remaining balance
    });

    test('returns zero for fully paid loan', () => {
      const result = calculateRemainingLoanBalance(100000, 0.06, 10, 15);
      expect(result).toBe(0);
    });

    test('returns full amount for new loan', () => {
      const result = calculateRemainingLoanBalance(100000, 0.06, 10, 0);
      expect(result).toBe(100000);
    });
  });

  describe('calculateSafeWithdrawal', () => {
    test('calculates 4% rule correctly', () => {
      const result = calculateSafeWithdrawal(1000000, 0.04);
      expect(result).toBe(40000);
    });

    test('handles custom withdrawal rates', () => {
      const result = calculateSafeWithdrawal(500000, 0.03);
      expect(result).toBe(15000);
    });

    test('validates inputs', () => {
      expect(() => calculateSafeWithdrawal(-1000000, 0.04)).toThrow('Portfolio value cannot be negative');
      expect(() => calculateSafeWithdrawal(1000000, 1.5)).toThrow('Withdrawal rate must be between 0% and 100%');
    });
  });

  describe('calculateRetirementProjection', () => {
    test('calculates comprehensive retirement projection', () => {
      const input = {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 50000,
        monthlyContribution: 500,
        annualReturn: 0.07,
        inflationRate: 0.025,
      };

      const projections = calculateRetirementProjection(input);
      expect(projections).toHaveLength(36); // 35 years + starting year

      // Check starting point
      expect(projections[0].age).toBe(30);
      expect(projections[0].beginningBalance).toBe(50000);
      expect(projections[0].contributions).toBe(0);

      // Check retirement year (age 65)
      const retirementProjection = projections.find((p: any) => p.age === 65);
      expect(retirementProjection).toBeDefined();
      expect(retirementProjection!.endingBalance).toBeGreaterThan(1000000); // Should be substantial
    });

    test('validates inputs', () => {
      const invalidInput = {
        currentAge: 70,
        retirementAge: 65, // Retirement age before current age
        currentSavings: 50000,
        monthlyContribution: 500,
        annualReturn: 0.07,
        inflationRate: 0.025,
      };

      expect(() => calculateRetirementProjection(invalidInput)).toThrow('Current age must be less than retirement age');
    });
  });

  describe('validateFinancialInputs', () => {
    test('validates all input types', () => {
      expect(() => validateFinancialInputs({ annualReturn: 2 })).toThrow('Annual return must be between -100% and 100%');
      expect(() => validateFinancialInputs({ years: -5 })).toThrow('Years must be between 0 and 100');
      expect(() => validateFinancialInputs({ amount: -1000 })).toThrow('Amount cannot be negative');
      expect(() => validateFinancialInputs({ currentAge: 150 })).toThrow('Current age must be between 0 and 120');
    });

    test('passes valid inputs', () => {
      expect(() => validateFinancialInputs({
        annualReturn: 0.07,
        years: 30,
        amount: 10000,
        currentAge: 30,
        retirementAge: 65,
      })).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('end-to-end retirement calculation matches Fidelity calculator', () => {
      // Age 30, retire at 65, $50K saved, $500/month, 7% return
      const input = {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 50000,
        monthlyContribution: 500,
        annualReturn: 0.07,
        inflationRate: 0.025,
      };

      const projections = calculateRetirementProjection(input);
      const retirementProjection = projections.find((p: any) => p.age === 65);

      // Should be approximately $1.4M - $1.5M at retirement (year-by-year calculation)
      expect(retirementProjection!.endingBalance).toBeGreaterThan(1400000);
      expect(retirementProjection!.endingBalance).toBeLessThan(1500000);
    });

    test('mortgage calculation matches Zillow', () => {
      // $400,000 loan, 6.5% APR, 30 years
      const payment = calculateLoanPayment(400000, 0.065, 30);
      expect(payment).toBeCloseTo(2528.27, 2); // Correct mortgage payment calculation
    });
  });

  describe('Australian Tax Calculations', () => {
    test('calculates tax correctly for $30,000 income', () => {
      // $30,000 income falls in 16% bracket
      // Income Tax = ($30,000 - $18,200) × 16% = $11,800 × 0.16 = $1,888
      // Medicare Levy = $30,000 × 2% = $600
      // Total Tax = $1,888 + $600 = $2,488
      const input = {
        grossIncome: 30000,
        deductions: [],
        negativeGearingLoss: 0,
        capitalGains: 0,
        frankedDividends: 0,
        hecsBalance: 0,
        medicareExemption: false
      };

      const result = calculateTax(input);

      expect(result.totalTax).toBeCloseTo(2488, 0); // $2,488 total tax (income + medicare)
      expect(result.incomeTax).toBeCloseTo(1888, 0); // $1,888 income tax
      expect(result.medicareLevy).toBeCloseTo(600, 0); // $600 medicare levy
      expect(result.taxableIncome).toBe(30000);
    });

    test('calculates tax correctly for $60,000 income', () => {
      // $60,000 income falls in 30% bracket
      // Income Tax = $4,288 + ($60,000 - $45,000) × 30% = $4,288 + $15,000 × 0.30 = $4,288 + $4,500 = $8,788
      // Medicare Levy = $60,000 × 2% = $1,200
      // Total Tax = $8,788 + $1,200 = $9,988
      const input = {
        grossIncome: 60000,
        deductions: [],
        negativeGearingLoss: 0,
        capitalGains: 0,
        frankedDividends: 0,
        hecsBalance: 0,
        medicareExemption: false
      };

      const result = calculateTax(input);

      expect(result.totalTax).toBeCloseTo(9988, 0); // $9,988 total tax (income + medicare)
      expect(result.incomeTax).toBeCloseTo(8788, 0); // $8,788 income tax
      expect(result.medicareLevy).toBeCloseTo(1200, 0); // $1,200 medicare levy
      expect(result.taxableIncome).toBe(60000);
    });

    test('calculates tax correctly for $150,000 income', () => {
      // $150,000 income falls in 37% bracket
      // Income Tax = $31,288 + ($150,000 - $135,000) × 37% = $31,288 + $15,000 × 0.37 = $31,288 + $5,550 = $36,838
      // Medicare Levy = $150,000 × 2% = $3,000
      // Total Tax = $36,838 + $3,000 = $39,838
      const input = {
        grossIncome: 150000,
        deductions: [],
        negativeGearingLoss: 0,
        capitalGains: 0,
        frankedDividends: 0,
        hecsBalance: 0,
        medicareExemption: false
      };

      const result = calculateTax(input);

      expect(result.totalTax).toBeCloseTo(39838, 0); // $39,838 total tax (income + medicare)
      expect(result.incomeTax).toBeCloseTo(36838, 0); // $36,838 income tax
      expect(result.medicareLevy).toBeCloseTo(3000, 0); // $3,000 medicare levy
      expect(result.taxableIncome).toBe(150000);
    });

    test('calculates tax correctly for $200,000 income', () => {
      // $200,000 income falls in 45% bracket
      // Income Tax = $51,638 + ($200,000 - $190,000) × 45% = $51,638 + $10,000 × 0.45 = $51,638 + $4,500 = $56,138
      // Medicare Levy = $200,000 × 2% = $4,000
      // Total Tax = $56,138 + $4,000 = $60,138
      const input = {
        grossIncome: 200000,
        deductions: [],
        negativeGearingLoss: 0,
        capitalGains: 0,
        frankedDividends: 0,
        hecsBalance: 0,
        medicareExemption: false
      };

      const result = calculateTax(input);

      expect(result.totalTax).toBeCloseTo(60138, 0); // $60,138 total tax (income + medicare)
      expect(result.incomeTax).toBeCloseTo(56138, 0); // $56,138 income tax
      expect(result.medicareLevy).toBeCloseTo(4000, 0); // $4,000 medicare levy
      expect(result.taxableIncome).toBe(200000);
    });
  });
});
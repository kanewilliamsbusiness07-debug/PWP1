/**
 * FinCalc Pro - Financial Calculations Tests
 * 
 * Comprehensive tests for all financial calculation functions
 */

import {
  calculateLoanPayment,
  calculateMaxBorrowingCapacity,
  projectAssetValue,
  calculateRetirementLumpSum,
  calculatePassiveIncome,
  calculateRetirementDeficitSurplus,
  calculateSavingsDepletion,
  calculateRentalYield,
  calculatePropertyCashflow,
  calculateFutureValueWithContributions,
  calculateNegativeGearing,
  PropertyExpenses,
  DEFAULT_ASSUMPTIONS
} from './calculations';
import { calculateInvestmentSurplus, calculatePropertyServiceability } from './serviceability';

describe('Financial Calculations', () => {
  describe('calculateLoanPayment', () => {
    test('calculates correct monthly payment for standard loan', () => {
      const result = calculateLoanPayment({
        principal: 400000,
        annualInterestRate: 0.06, // 6%
        termYears: 30
      });
      
      expect(result).toBeCloseTo(2398.20, 1);
    });

    test('handles zero interest rate', () => {
      const result = calculateLoanPayment({
        principal: 120000,
        annualInterestRate: 0,
        termYears: 10
      });
      
      expect(result).toBeCloseTo(1000, 1); // 120000 / (10 * 12)
    });

    test('handles edge cases', () => {
      expect(calculateLoanPayment({
        principal: 0,
        annualInterestRate: 0.05,
        termYears: 30
      })).toBe(0);

      expect(calculateLoanPayment({
        principal: 100000,
        annualInterestRate: 0.05,
        termYears: 0
      })).toBe(0);
    });
  });

  describe('calculateMaxBorrowingCapacity', () => {
    it('calculates maximum borrowing from payment capacity', () => {
      const result = calculateMaxBorrowingCapacity(2000, 0.06, 30);

      // The actual correct calculation is 333583.23 (more precise)
      expect(result).toBeCloseTo(333583.23, 2);
    });    test('handles zero interest rate', () => {
      const result = calculateMaxBorrowingCapacity(1000, 0, 10);
      
      expect(result).toBe(120000); // 1000 * 10 * 12
    });
  });

  describe('projectAssetValue', () => {
    test('projects asset value with real growth rate', () => {
      const result = projectAssetValue(100000, 0.07, 0.025, 10);
      // Use exact real return formula: (1+nominal)/(1+inflation)-1
      const expectedRealGrowth = (1 + 0.07) / (1 + 0.025) - 1;
      const expected = 100000 * Math.pow(1 + expectedRealGrowth, 10);
      
      expect(result).toBeCloseTo(expected, 1);
    });

    test('handles zero growth', () => {
      const result = projectAssetValue(50000, 0.025, 0.025, 5);
      
      expect(result).toBeCloseTo(50000, 1);
    });
  });

  describe('calculateRetirementLumpSum', () => {
    const currentAssets = {
      super: 200000,
      shares: 50000,
      properties: 300000,
      savings: 25000
    };

    test('calculates projected retirement lump sum', () => {
      const result = calculateRetirementLumpSum(
        currentAssets,
        DEFAULT_ASSUMPTIONS,
        20
      );
      
      // Should be significantly more than current total due to growth
      const currentTotal = 575000;
      expect(result).toBeGreaterThan(currentTotal);
      expect(result).toBeGreaterThan(1000000); // Expected growth over 20 years
    });

    test('handles zero years to retirement', () => {
      const result = calculateRetirementLumpSum(
        currentAssets,
        DEFAULT_ASSUMPTIONS,
        0
      );
      
      expect(result).toBeCloseTo(575000, 0);
    });
  });

  describe('calculateRetirementDeficitSurplus', () => {
    test('calculates deficit when passive income is insufficient', () => {
      const result = calculateRetirementDeficitSurplus(
        40000, // passive income
        5000,  // debt payments
        80000  // current salary
      );
      
      const requiredIncome = 80000 * 0.7; // 56000
      const availableIncome = 40000 - 5000; // 35000
      const expectedDeficit = (requiredIncome - availableIncome) / 12; // 1750

      expect(result.isDeficit).toBe(true);
      expect(result.monthlyAmount).toBeCloseTo(expectedDeficit, 1);
      expect(result.requiredIncome).toBe(56000);
      expect(result.availableIncome).toBe(35000);
    });

    test('calculates surplus when passive income exceeds requirements', () => {
      const result = calculateRetirementDeficitSurplus(
        70000, // passive income
        5000,  // debt payments  
        80000  // current salary
      );
      
      const requiredIncome = 80000 * 0.7; // 56000
      const availableIncome = 70000 - 5000; // 65000
      const expectedSurplus = (availableIncome - requiredIncome) / 12; // 750

      expect(result.isDeficit).toBe(false);
      expect(result.monthlyAmount).toBeCloseTo(expectedSurplus, 1);
    });
  });

  describe('calculateSavingsDepletion', () => {
    test('calculates years to depletion with positive deficit', () => {
      const savingsBalances = [50000, 30000, 20000]; // 100000 total
      const monthlyDeficit = 1000;
      
      const result = calculateSavingsDepletion(savingsBalances, monthlyDeficit);
      
      expect(result.yearsToDepletion).toBeCloseTo(8.33, 1); // 100000 / (1000 * 12)
      expect(result.monthlyDraw).toBe(1000);
      expect(result.totalAvailable).toBe(100000);
    });

    test('handles no deficit', () => {
      const result = calculateSavingsDepletion([50000], 0);
      
      expect(result.yearsToDepletion).toBe(Infinity);
      expect(result.monthlyDraw).toBe(0);
    });

    test('handles no savings', () => {
      const result = calculateSavingsDepletion([], 500);
      
      expect(result.yearsToDepletion).toBe(Infinity);
      expect(result.totalAvailable).toBe(0);
    });
  });

  describe('calculateRentalYield', () => {
    test('calculates rental yield percentage', () => {
      const result = calculateRentalYield(24000, 400000); // $2000/month rent
      
      expect(result).toBeCloseTo(6, 1); // 6% yield
    });

    test('handles zero property value', () => {
      const result = calculateRentalYield(12000, 0);
      
      expect(result).toBe(0);
    });
  });

  describe('calculatePropertyCashflow', () => {
    test('calculates positive cashflow property', () => {
      const result = calculatePropertyCashflow(
        2500,   // monthly rent
        1800,   // loan payment
        200,    // expenses
        0.01,   // maintenance (1% annually)
        0.07,   // management fee (7%)
        400000  // property value
      );
      
      const monthlyMaintenance = (400000 * 0.01) / 12; // 333.33
      const managementFee = 2500 * 0.07; // 175
      const expected = 2500 - 1800 - 200 - monthlyMaintenance - managementFee;
      
      expect(result).toBeCloseTo(expected, 1);
    });

    test('calculates negative cashflow property', () => {
      const result = calculatePropertyCashflow(
        1500,   // monthly rent
        2000,   // loan payment
        100,    // expenses
        0.01,   // maintenance
        0.08,   // management fee
        300000  // property value
      );
      
      expect(result).toBeLessThan(0);
    });
  });

  describe('calculateFutureValueWithContributions', () => {
    test('calculates future value with regular contributions', () => {
      const result = calculateFutureValueWithContributions(
        50000,  // present value
        500,    // monthly contribution
        0.06,   // annual growth rate
        10      // years
      );
      
      // Should include growth of present value plus compound growth of contributions
      expect(result).toBeGreaterThan(50000);
      expect(result).toBeGreaterThan(110000); // Present value + contributions without growth
    });

    test('handles zero present value', () => {
      const result = calculateFutureValueWithContributions(0, 1000, 0.05, 5);
      
      // Should equal the future value of annuity only
      expect(result).toBeGreaterThan(60000); // 5 years * 12 months * $1000
    });

    test('handles zero growth rate', () => {
      const result = calculateFutureValueWithContributions(10000, 100, 0, 2);
      
      expect(result).toBeCloseTo(12400, 1); // 10000 + (100 * 24)
    });
  });

  describe('Integration Tests', () => {
    test('complete retirement projection scenario', () => {
      const currentAssets = {
        super: 150000,
        shares: 75000,
        properties: 400000, // net equity
        savings: 50000
      };
      
      const yearsToRetirement = 15;
      const currentSalary = 100000;
      
      // Calculate projected lump sum
      const lumpSum = calculateRetirementLumpSum(
        currentAssets,
        DEFAULT_ASSUMPTIONS,
        yearsToRetirement
      );
      
      // Calculate passive income
      const passiveIncome = calculatePassiveIncome(
        lumpSum,
        18000, // annual rental income
        DEFAULT_ASSUMPTIONS
      );
      
      // Calculate deficit/surplus
      const deficitSurplus = calculateRetirementDeficitSurplus(
        passiveIncome,
        12000, // annual debt payments
        currentSalary
      );
      
      expect(lumpSum).toBeGreaterThan(675000); // Current total
      expect(passiveIncome).toBeGreaterThan(0);
      expect(deficitSurplus.requiredIncome).toBe(70000); // 70% of salary
      expect(typeof deficitSurplus.isDeficit).toBe('boolean');
      expect(deficitSurplus.monthlyAmount).toBeGreaterThan(0);
    });

    test('property investment serviceability scenario', () => {
      const monthlyCapacity = 3000;
      const interestRate = 0.065;
      const loanTerm = 30;
      
      const maxBorrow = calculateMaxBorrowingCapacity(
        monthlyCapacity,
        interestRate,
        loanTerm
      );
      
      // Verify loan payment matches capacity
      const payment = calculateLoanPayment({
        principal: maxBorrow,
        annualInterestRate: interestRate,
        termYears: loanTerm
      });
      
      expect(payment).toBeCloseTo(monthlyCapacity, 1);
      expect(maxBorrow).toBeGreaterThan(400000);
    });
  });

  describe('Serviceability calculations', () => {
    test('calculateInvestmentSurplus returns projected passive equal to monthly surplus', () => {
      const metrics = calculateInvestmentSurplus(8000, 6000); // $2,000 surplus
      expect(metrics.currentMonthlyIncome).toBe(8000);
      expect(metrics.monthlyDeficitOrSurplus).toBe(2000);
      expect(metrics.projectedPassiveIncomeMonthly).toBe(2000);
      expect(metrics.isDeficit).toBe(false);
    });

    test('calculatePropertyServiceability returns non-viable for small passive income', () => {
      const metrics = calculateInvestmentSurplus(8000, 7000); // $1,000 surplus
      const svc = calculatePropertyServiceability(metrics, 0.06, 30, 0.8, 0.04, 0.02);
      // Required retirement income = 70% of 8000 = 5600, monthly passive 1000 -> not viable
      expect(svc.isViable).toBe(false);
      expect(svc.maxPropertyValue).toBe(0);
    });
  });

  describe('calculateNegativeGearing', () => {
    test('calculates correct negative gearing benefits for a loss-making property', () => {
      const expenses: PropertyExpenses = {
        mortgageInterest: 20000,
        repairs: 2000,
        managementFees: 2400,
        insurance: 1200,
        councilRates: 2400,
        otherExpenses: 1000,
        depreciation: 5000
      };
      
      const result = calculateNegativeGearing(
        20000, // Annual rental income
        expenses,
        0.33 // 33% marginal tax rate
      );
      
      // Total expenses should be sum of all expenses
      expect(result.totalExpenses).toBe(34000);
      
      // Net loss should be total expenses minus rental income
      expect(result.netLoss).toBe(14000);
      
      // Tax benefit should be net loss times marginal tax rate
      expect(result.taxBenefit).toBeCloseTo(4620, 1); // 14000 * 0.33
    });

    test('handles break-even property with no negative gearing benefit', () => {
      const expenses: PropertyExpenses = {
        mortgageInterest: 15000,
        repairs: 1000,
        managementFees: 1800,
        insurance: 1000,
        councilRates: 2000,
        otherExpenses: 700,
        depreciation: 3500
      };
      
      const result = calculateNegativeGearing(
        25000, // Annual rental income exceeds expenses
        expenses,
        0.33
      );
      
      // There should be no net loss or tax benefit when income exceeds expenses
      expect(result.netLoss).toBe(0);
      expect(result.taxBenefit).toBe(0);
    });
  });
});
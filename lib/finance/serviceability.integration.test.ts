import { describe, it, expect } from 'vitest';
import { calculatePropertyServiceability } from './serviceability';

describe('calculatePropertyServiceability (conventional scenarios)', () => {
  it('uses current surplus when it is larger than projected passive after retention', () => {
    const retirementMetrics: any = {
      currentMonthlyIncome: 8000,
      monthlyDeficitOrSurplus: 1500, // current surplus
      projectedPassiveIncomeMonthly: 500 // small projected passive
    };

    const res = calculatePropertyServiceability(retirementMetrics, 0.06, 30, 0.8, 0.04, 0.02);
    expect(res.surplusIncome).toBeGreaterThan(0);
    expect(res.surplusIncome).toBeCloseTo(1500, 6);
    expect(res.isViable).toBeTruthy();
  });

  it('uses projected passive income (post-retention) when it is larger than current surplus', () => {
    const retirementMetrics: any = {
      currentMonthlyIncome: 8000,
      monthlyDeficitOrSurplus: 200, // small current surplus
      projectedPassiveIncomeMonthly: 7000 // large projected passive
    };

    // retentionThreshold = 8000 * 0.7 = 5600; surplusFromProjected = 1400
    const res = calculatePropertyServiceability(retirementMetrics, 0.06, 30, 0.8, 0.04, 0.02);
    expect(res.surplusIncome).toBeGreaterThan(0);
    expect(res.surplusIncome).toBeCloseTo(1400, 6);
    expect(res.isViable).toBeTruthy();
  });
});

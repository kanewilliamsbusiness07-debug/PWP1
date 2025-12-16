import {
  calculateIncomeTax,
  calculateTotalTax,
  getMarginalTaxRate,
  getEffectiveTaxRate,
  ATO_TAX_BRACKETS_2024_25,
  getTaxBracket,
  calculateTaxOnAdditionalIncome,
} from '@/lib/australian-tax-calculator';

describe('Australian Tax Calculator', () => {
  describe('calculateIncomeTax', () => {
    test('Tax-free threshold: $18,200 or less', () => {
      expect(calculateIncomeTax(0)).toBe(0);
      expect(calculateIncomeTax(10000)).toBe(0);
      expect(calculateIncomeTax(18200)).toBe(0);
    });

    test('First bracket: $18,201 - $45,000 (16%)', () => {
      // $20,000: 16% of ($20,000 - $18,200) = 16% of $1,800 = $288
      expect(calculateIncomeTax(20000)).toBe(288);

      // $30,000: 16% of ($30,000 - $18,200) = 16% of $11,800 = $1,888
      expect(calculateIncomeTax(30000)).toBe(1888);

      // $45,000: 16% of ($45,000 - $18,200) = 16% of $26,800 = $4,288
      expect(calculateIncomeTax(45000)).toBe(4288);
    });

    test('Second bracket: $45,001 - $135,000 (30%)', () => {
      // $50,000: $4,288 + 30% of ($50,000 - $45,000) = $4,288 + $1,500 = $5,788
      expect(calculateIncomeTax(50000)).toBe(5788);

      // $100,000: $4,288 + 30% of ($100,000 - $45,000) = $4,288 + $16,500 = $20,788
      expect(calculateIncomeTax(100000)).toBe(20788);

      // $135,000: $4,288 + 30% of ($135,000 - $45,000) = $4,288 + $27,000 = $31,288
      expect(calculateIncomeTax(135000)).toBe(31288);
    });

    test('Third bracket: $135,001 - $190,000 (37%)', () => {
      // $150,000: $31,288 + 37% of ($150,000 - $135,000) = $31,288 + $5,550 = $36,838
      expect(calculateIncomeTax(150000)).toBe(36838);

      // $190,000: $31,288 + 37% of ($190,000 - $135,000) = $31,288 + $20,350 = $51,638
      expect(calculateIncomeTax(190000)).toBe(51638);
    });

    test('Fourth bracket: $190,001+ (45%)', () => {
      // $200,000: $51,638 + 45% of ($200,000 - $190,000) = $51,638 + $4,500 = $56,138
      expect(calculateIncomeTax(200000)).toBe(56138);

      // $300,000: $51,638 + 45% of ($300,000 - $190,000) = $51,638 + $49,500 = $101,138
      expect(calculateIncomeTax(300000)).toBe(101138);
    });

    test('throws error for negative income', () => {
      expect(() => calculateIncomeTax(-1000)).toThrow('Taxable income cannot be negative');
    });
  });

  describe('getMarginalTaxRate', () => {
    test('Returns correct marginal rates', () => {
      expect(getMarginalTaxRate(10000)).toBe(0);
      expect(getMarginalTaxRate(30000)).toBe(0.16);
      expect(getMarginalTaxRate(80000)).toBe(0.30);
      expect(getMarginalTaxRate(150000)).toBe(0.37);
      expect(getMarginalTaxRate(250000)).toBe(0.45);
    });
  });

  describe('getEffectiveTaxRate', () => {
    test('Returns correct effective rates', () => {
      expect(getEffectiveTaxRate(0)).toBe(0);
      expect(getEffectiveTaxRate(30000)).toBe(1888 / 30000); // 0.062933...
      expect(getEffectiveTaxRate(100000)).toBe(20788 / 100000); // 0.20788
    });
  });

  describe('calculateTotalTax', () => {
    test('Includes Medicare levy', () => {
      const result = calculateTotalTax(100000);
      expect(result.incomeTax).toBe(20788);
      expect(result.medicareLevy).toBe(2000); // 2% of $100,000
      expect(result.totalTax).toBe(22788);
      expect(result.netIncome).toBe(77212);
      expect(result.marginalRate).toBe(0.30);
      expect(result.effectiveRate).toBeCloseTo(0.2279, 3); // Approximately 22.79%
    });

    test('Zero income returns zero taxes', () => {
      const result = calculateTotalTax(0);
      expect(result.incomeTax).toBe(0);
      expect(result.medicareLevy).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.netIncome).toBe(0);
    });
  });

  describe('getTaxBracket', () => {
    test('Returns correct bracket for different incomes', () => {
      expect(getTaxBracket(10000)?.rate).toBe(0);
      expect(getTaxBracket(30000)?.rate).toBe(0.16);
      expect(getTaxBracket(80000)?.rate).toBe(0.30);
      expect(getTaxBracket(150000)?.rate).toBe(0.37);
      expect(getTaxBracket(250000)?.rate).toBe(0.45);
    });

    test('Returns null for invalid income', () => {
      expect(getTaxBracket(-1000)).toBeNull();
    });
  });

  describe('calculateTaxOnAdditionalIncome', () => {
    test('Calculates marginal tax on additional income', () => {
      // Adding $10,000 to $40,000 income (pushes from 16% to 30% bracket)
      // Current tax: ($40,000 - $18,200) × 0.16 = $21,800 × 0.16 = $3,488
      // New tax: $4,288 + ($50,000 - $45,000) × 0.30 = $4,288 + $1,500 = $5,788
      // Tax on additional: $5,788 - $3,488 = $2,300
      const taxOnAdditional = calculateTaxOnAdditionalIncome(40000, 10000);
      expect(taxOnAdditional).toBe(2300);

      // Adding $10,000 to $130,000 income (crosses from 30% to 37% bracket)
      // $130,000: $29,788 tax (30% bracket)
      // $140,000: $33,138 tax (37% bracket)
      // The $10,000 additional income consists of:
      // - $5,000 at 30%: $1,500 tax
      // - $5,000 at 37%: $1,850 tax
      // Total additional tax: $3,350
      const taxOnAdditional2 = calculateTaxOnAdditionalIncome(130000, 10000);
      expect(taxOnAdditional2).toBe(3350);
    });
  });

  describe('ATO_TAX_BRACKETS_2024_25', () => {
    test('Has correct number of brackets', () => {
      expect(ATO_TAX_BRACKETS_2024_25).toHaveLength(5);
    });

    test('First bracket is tax-free', () => {
      const firstBracket = ATO_TAX_BRACKETS_2024_25[0];
      expect(firstBracket.min).toBe(0);
      expect(firstBracket.max).toBe(18200);
      expect(firstBracket.rate).toBe(0);
      expect(firstBracket.baseTax).toBe(0);
    });

    test('Last bracket has no upper limit', () => {
      const lastBracket = ATO_TAX_BRACKETS_2024_25[4];
      expect(lastBracket.min).toBe(190001);
      expect(lastBracket.max).toBeNull();
      expect(lastBracket.rate).toBe(0.45);
      expect(lastBracket.baseTax).toBe(51638);
    });
  });
});
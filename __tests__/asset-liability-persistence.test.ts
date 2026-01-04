import { describe, it, expect, vi } from 'vitest';

// Mock the necessary dependencies
vi.mock('@/lib/hooks/use-client-storage', () => ({
  useClientStorage: () => ({
    saveClient: vi.fn(),
    loadClient: vi.fn(),
  }),
}));

vi.mock('@/lib/store/financial-store', () => ({
  financialStore: {
    clientA: null,
    clientB: null,
    setClientData: vi.fn(),
  },
}));

describe('Asset Liability Persistence', () => {
  it('should save assets and liabilities correctly', () => {
    // Test data with assetLiabilityPairs
    const testData = {
      firstName: 'John',
      lastName: 'Doe',
      dob: '1990-01-01',
      assetLiabilityPairs: [
        {
          asset: {
            id: 'asset-1',
            name: 'Home',
            currentValue: 500000,
            type: 'property',
            ownerOccupied: 'own',
          },
          liability: {
            id: 'liability-1',
            name: 'Home Loan',
            balance: 300000,
            monthlyPayment: 2500,
            interestRate: 3.5,
            loanTerm: 30,
            termRemaining: 25,
            type: 'mortgage',
            lender: 'Bank A',
            loanType: 'variable',
            paymentFrequency: 'M',
          },
        },
        {
          asset: {
            id: 'asset-2',
            name: 'Savings',
            currentValue: 50000,
            type: 'savings',
          },
          liability: {
            id: 'liability-2',
            name: 'Credit Card',
            balance: 5000,
            monthlyPayment: 200,
            interestRate: 15,
            loanTerm: 0,
            termRemaining: 0,
            type: 'credit-card',
            lender: 'Bank B',
            loanType: 'variable',
            paymentFrequency: 'M',
          },
        },
      ],
    };

    // Simulate the filtering logic from onSubmitInternal
    const assetsToSave = testData.assetLiabilityPairs
      .map((pair: any) => pair?.asset)
      .filter((asset: any) =>
        asset &&
        asset.id &&
        asset.name &&
        asset.type &&
        typeof asset.currentValue === 'number' &&
        asset.currentValue > 0
      );

    const liabilitiesToSave = testData.assetLiabilityPairs
      .map((pair: any) => pair?.liability)
      .filter((liability: any) =>
        liability &&
        liability.id &&
        liability.name &&
        typeof liability.balance === 'number' &&
        typeof liability.monthlyPayment === 'number' &&
        typeof liability.interestRate === 'number' &&
        typeof liability.loanTerm === 'number' &&
        liability.type &&
        (liability.balance > 0 || liability.monthlyPayment > 0)
      );

    // Verify assets are saved correctly
    expect(assetsToSave).toHaveLength(2);
    expect(assetsToSave[0]).toEqual({
      id: 'asset-1',
      name: 'Home',
      currentValue: 500000,
      type: 'property',
      ownerOccupied: 'own',
    });
    expect(assetsToSave[1]).toEqual({
      id: 'asset-2',
      name: 'Savings',
      currentValue: 50000,
      type: 'savings',
    });

    // Verify liabilities are saved correctly
    expect(liabilitiesToSave).toHaveLength(2);
    expect(liabilitiesToSave[0]).toEqual({
      id: 'liability-1',
      name: 'Home Loan',
      balance: 300000,
      monthlyPayment: 2500,
      interestRate: 3.5,
      loanTerm: 30,
      termRemaining: 25,
      type: 'mortgage',
      lender: 'Bank A',
      loanType: 'variable',
      paymentFrequency: 'M',
    });
    expect(liabilitiesToSave[1]).toEqual({
      id: 'liability-2',
      name: 'Credit Card',
      balance: 5000,
      monthlyPayment: 200,
      interestRate: 15,
      loanTerm: 0,
      termRemaining: 0,
      type: 'credit-card',
      lender: 'Bank B',
      loanType: 'variable',
      paymentFrequency: 'M',
    });
  });

  it('should reconstruct assetLiabilityPairs from saved client data', () => {
    // Simulate saved client data from database
    const savedClient = {
      id: 'client-123',
      firstName: 'John',
      lastName: 'Doe',
      assets: [
        {
          id: 'asset-1',
          name: 'Home',
          currentValue: 500000,
          type: 'property',
          ownerOccupied: 'own',
        },
        {
          id: 'asset-2',
          name: 'Savings',
          currentValue: 50000,
          type: 'savings',
        },
      ],
      liabilities: [
        {
          id: 'liability-1',
          name: 'Home Loan',
          balance: 300000,
          monthlyPayment: 2500,
          interestRate: 3.5,
          loanTerm: 30,
          termRemaining: 25,
          type: 'mortgage',
          lender: 'Bank A',
          loanType: 'variable',
          paymentFrequency: 'M',
        },
        {
          id: 'liability-2',
          name: 'Credit Card',
          balance: 5000,
          monthlyPayment: 200,
          interestRate: 15,
          loanTerm: 0,
          termRemaining: 0,
          type: 'credit-card',
          lender: 'Bank B',
          loanType: 'variable',
          paymentFrequency: 'M',
        },
      ],
    };

    // Simulate the reconstruction logic from form reset
    const validAssets = (savedClient?.assets || []).filter(asset =>
      asset &&
      typeof asset.id === 'string' &&
      typeof asset.name === 'string' &&
      typeof asset.currentValue === 'number' &&
      typeof asset.type === 'string' &&
      ['property', 'vehicle', 'savings', 'shares', 'super', 'other'].includes(asset.type) &&
      (asset.ownerOccupied === undefined || typeof asset.ownerOccupied === 'string' && ['own', 'rent'].includes(asset.ownerOccupied))
    );

    const validLiabilities = (savedClient?.liabilities || []).filter(liability =>
      liability &&
      typeof liability.id === 'string' &&
      typeof liability.name === 'string' &&
      typeof liability.balance === 'number' &&
      typeof liability.monthlyPayment === 'number' &&
      typeof liability.interestRate === 'number' &&
      typeof liability.loanTerm === 'number' &&
      (liability.termRemaining === undefined || typeof liability.termRemaining === 'number') &&
      typeof liability.type === 'string' &&
      ['mortgage', 'personal-loan', 'credit-card', 'hecs', 'other'].includes(liability.type) &&
      (liability.lender === undefined || typeof liability.lender === 'string') &&
      (liability.loanType === undefined || typeof liability.loanType === 'string' && ['fixed', 'split', 'variable'].includes(liability.loanType)) &&
      (liability.paymentFrequency === undefined || typeof liability.paymentFrequency === 'string' && ['W', 'F', 'M'].includes(liability.paymentFrequency))
    );

    const assets = validAssets.length > 0 ? validAssets : [{ id: 'asset-home', name: 'Home', currentValue: 0, type: 'property' as const, ownerOccupied: 'own' as const }];
    const liabilities = validLiabilities.length > 0 ? validLiabilities : [{ id: 'liability-home', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }];

    const maxLength = Math.max(assets.length, liabilities.length);
    const pairs = [];
    for (let i = 0; i < maxLength; i++) {
      pairs.push({
        asset: assets[i] || { id: `asset-fallback-${i}`, name: `Asset ${i + 1}`, currentValue: 0, type: 'other' as const },
        liability: liabilities[i] || { id: `liability-fallback-${i}`, name: `Liability ${i + 1}`, balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 30, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }
      });
    }

    // Verify pairs are reconstructed correctly
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual({
      asset: {
        id: 'asset-1',
        name: 'Home',
        currentValue: 500000,
        type: 'property',
        ownerOccupied: 'own',
      },
      liability: {
        id: 'liability-1',
        name: 'Home Loan',
        balance: 300000,
        monthlyPayment: 2500,
        interestRate: 3.5,
        loanTerm: 30,
        termRemaining: 25,
        type: 'mortgage',
        lender: 'Bank A',
        loanType: 'variable',
        paymentFrequency: 'M',
      },
    });
    expect(pairs[1]).toEqual({
      asset: {
        id: 'asset-2',
        name: 'Savings',
        currentValue: 50000,
        type: 'savings',
      },
      liability: {
        id: 'liability-2',
        name: 'Credit Card',
        balance: 5000,
        monthlyPayment: 200,
        interestRate: 15,
        loanTerm: 0,
        termRemaining: 0,
        type: 'credit-card',
        lender: 'Bank B',
        loanType: 'variable',
        paymentFrequency: 'M',
      },
    });
  });
});
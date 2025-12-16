import type { FinancialInputs, InvestmentProperty } from './calculateFinancialProjections';

export function convertClientToInputs(client: any, sharedAssumptions: any): FinancialInputs | null {
  if (!client) return null;

  const annualIncome = client.annualIncome ?? client.grossSalary ?? 0;
  const currentAge = client.currentAge ?? 30;
  const retirementAge = client.retirementAge ?? 65;

  // Convert assets
  const assets: Array<{ name: string; value: number; type: 'Property' | 'Super' | 'Shares' | 'Cash' | 'Other'; }> = [];

  if (Array.isArray(client.assets)) {
    client.assets.forEach((a: any) => {
      const t = String(a.type || '').toLowerCase();
      let mapped: any = 'Other';
      if (t === 'property') mapped = 'Property';
      else if (t === 'super') mapped = 'Super';
      else if (t === 'shares') mapped = 'Shares';
      else if (t === 'cash' || t === 'savings') mapped = 'Cash';
      assets.push({ name: a.name || '', value: Number(a.currentValue || a.value || 0), type: mapped });
    });
  } else {
    // Legacy fields
    if (client.currentSuper ?? client.superFundValue) assets.push({ name: 'Super', value: Number(client.currentSuper || client.superFundValue || 0), type: 'Super' });
    if (client.currentShares ?? client.sharesTotalValue) assets.push({ name: 'Shares', value: Number(client.currentShares || client.sharesTotalValue || 0), type: 'Shares' });
    if (client.savingsValue ?? client.currentSavings) assets.push({ name: 'Cash', value: Number(client.savingsValue || client.currentSavings || 0), type: 'Cash' });
    if (client.homeValue ?? 0) assets.push({ name: 'Home', value: Number(client.homeValue || 0), type: 'Property' });
  }

  // Liabilities
  const liabilities = Array.isArray(client.liabilities) ? client.liabilities.map((l: any) => ({
    lender: l.lender || '',
    loanType: l.loanType || '',
    liabilityType: l.liabilityType || '',
    balanceOwing: Number(l.balance || l.balanceOwing || 0),
    repaymentAmount: Number(l.repaymentAmount || 0),
    frequency: l.frequency || 'M',
    interestRate: Number(l.interestRate || 0),
    loanTerm: Number(l.loanTerm || 0),
    termRemaining: Number(l.termRemaining || l.term_remaining || 0)
  })) : [];

  // Investment properties
  const investmentProperties: InvestmentProperty[] = [];
  if (Array.isArray(client.investmentProperties)) {
    client.investmentProperties.forEach((p: any) => {
      investmentProperties.push({
        address: p.address || '',
        purchasePrice: Number(p.purchasePrice || p.purchase_price || 0),
        currentValue: Number(p.currentValue || p.current_value || 0),
        loanAmount: Number(p.loanAmount || p.loan_amount || 0),
        interestRate: Number(p.interestRate || p.interest_rate || 0),
        loanTerm: Number(p.loanTerm || p.loan_term || 0),
        weeklyRent: Number(p.weeklyRent || p.weekly_rent || 0),
        annualExpenses: Number(p.annualExpenses || p.annual_expenses || 0)
      });
    });
  }

  const inputs: FinancialInputs = {
    annualIncome: Number(annualIncome || 0),
    rentalIncome: Number(client.rentalIncome || 0),
    dividends: Number(client.dividends || 0),
    frankedDividends: Number(client.frankedDividends || 0),
    capitalGains: Number(client.capitalGains || 0),
    otherIncome: Number(client.otherIncome || 0),
    monthlyExpenses: Number(client.monthlyExpenses || 0),
    assets,
    liabilities,
    investmentProperties,
    currentAge: Number(currentAge),
    retirementAge: Number(retirementAge),
    assumptions: {
      inflationRate: sharedAssumptions?.inflationRate ?? 2.5,
      salaryGrowthRate: sharedAssumptions?.salaryGrowthRate ?? 3.0,
      superReturn: sharedAssumptions?.superReturn ?? 6.2,
      shareReturn: sharedAssumptions?.shareReturn ?? 7.0,
      propertyGrowthRate: sharedAssumptions?.propertyGrowthRate ?? 4.0,
      withdrawalRate: sharedAssumptions?.withdrawalRate ?? 4.0,
      rentGrowthRate: sharedAssumptions?.rentGrowthRate ?? 3.0,
      savingsRate: sharedAssumptions?.savingsRate ?? 10.0,
    }
  };

  return inputs;
}

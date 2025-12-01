import { useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/store';

export function useClientFinancials() {
  const financialStore = useFinancialStore();
  const activeClient = financialStore.activeClient;
  const clientData = activeClient 
    ? financialStore[`client${activeClient}` as keyof typeof financialStore]
    : undefined;

  const updateFinancials = (data: {
    grossIncome?: number;
    workRelatedExpenses?: number;
    investmentDeductions?: number;
    rentalIncome?: number;
    rentalExpenses?: number;
    propertyValue?: number;
    mortgageAmount?: number;
    cashSavings?: number;
    totalDebt?: number;
  }) => {
    // Only update if we have an active client
    if (activeClient) {
      financialStore.setFinancialPosition(data);
    }
  };

  // Get financial data for the current client
  const getFinancials = () => {
    if (!activeClient) return null;
    
    return {
      grossIncome: financialStore.grossIncome,
      workRelatedExpenses: financialStore.workRelatedExpenses,
      investmentDeductions: financialStore.investmentDeductions,
      rentalIncome: financialStore.rentalIncome,
      rentalExpenses: financialStore.rentalExpenses,
      propertyValue: financialStore.propertyValue,
      mortgageAmount: financialStore.mortgageAmount,
      cashSavings: financialStore.cashSavings,
      totalDebt: financialStore.totalDebt,
    };
  };

  return {
    activeClient,
    clientData,
    updateFinancials,
    getFinancials,
  };
}
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeLocalStorage } from './safe-storage';

interface ClientData {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  ownOrRent?: 'OWN' | 'RENT';
}

interface IncomeData {
  // Primary Income
  grossIncome: number;
  employmentIncome: number;
  
  // Investment Income
  investmentIncome: number;
  rentalIncome: number;
  frankedDividends: number;
  capitalGains: number;
  otherIncome: number;
}

interface ExpenseData {
  // Expenses & Deductions
  workRelatedExpenses: number;
  investmentExpenses: number;
  rentalExpenses: number;
}

interface PropertyData {
  propertyValue: number;
  mortgageAmount: number;
  interestRate: number;
}

interface PositionData {
  cashSavings: number;
  investments: number;
  superBalance: number;
  totalDebt: number;
}

interface BaseFinancialData extends IncomeData, ExpenseData, PropertyData, PositionData {
  // Tax Related
  taxableIncome: number;
  
  // Client Data
  clientA?: ClientData;
  clientB?: ClientData;
  activeClient?: "A" | "B";

  // Computed Values
  totalIncome: number;
  netIncome: number;
}

interface FinancialStore extends BaseFinancialData {
  // Core updates
  setFinancialData: (data: Partial<BaseFinancialData>) => void;
  setClientData: (client: "A" | "B", data: Partial<ClientData>) => void;
  setActiveClient: (client: "A" | "B" | undefined) => void;
  reset: () => void;

  // Specialized updates
  updateIncome: (data: Partial<IncomeData>) => void;
  updateExpenses: (data: Partial<ExpenseData>) => void;
  updateProperty: (data: Partial<PropertyData>) => void;
  updatePosition: (data: Partial<PositionData>) => void;
}

const initialState: BaseFinancialData = {
  // Primary Income
  grossIncome: 0,
  employmentIncome: 0,
  
  // Investment Income
  investmentIncome: 0,
  rentalIncome: 0,
  frankedDividends: 0,
  capitalGains: 0,
  otherIncome: 0,
  
  // Expenses & Deductions
  workRelatedExpenses: 0,
  investmentExpenses: 0,
  rentalExpenses: 0,
  
  // Tax Related
  taxableIncome: 0,
  
  // Property Data
  propertyValue: 0,
  mortgageAmount: 0,
  interestRate: 0,
  
  // Position Data
  cashSavings: 0,
  investments: 0,
  superBalance: 0,
  totalDebt: 0,

  // Computed Values
  totalIncome: 0,
  netIncome: 0,
};

const calculateComputedValues = (state: BaseFinancialData) => {
  const totalIncome = 
    state.employmentIncome +
    state.investmentIncome +
    state.rentalIncome + 
    state.frankedDividends +
    state.capitalGains + 
    state.otherIncome;

  const netIncome = 
    totalIncome -
    state.workRelatedExpenses -
    state.investmentExpenses -
    state.rentalExpenses;

  return {
    totalIncome,
    netIncome,
  };
};

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set) => ({
      ...initialState,

      setFinancialData: (data) => 
        set((state) => {
          const newState = {
            ...state,
            ...data,
          };
          const computed = calculateComputedValues(newState);
          return { ...newState, ...computed };
        }),

      setClientData: (client, data) =>
        set((state) => ({
          ...state,
          [client === "A" ? "clientA" : "clientB"]: {
            ...state[client === "A" ? "clientA" : "clientB"],
            ...data,
          },
        })),

      setActiveClient: (client) =>
        set((state) => ({
          ...state,
          activeClient: client,
        })),

      updateIncome: (data) =>
        set((state) => {
          const newState = {
            ...state,
            ...data,
          };
          const computed = calculateComputedValues(newState);
          return { ...newState, ...computed };
        }),

      updateExpenses: (data) =>
        set((state) => {
          const newState = {
            ...state,
            ...data,
          };
          const computed = calculateComputedValues(newState);
          return { ...newState, ...computed };
        }),

      updateProperty: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      updatePosition: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'financial-store',
      storage: createJSONStorage(() => new SafeLocalStorage()),
      partialize: (state) => ({
        ...state,
        // Don't persist computed values
        totalIncome: undefined,
        netIncome: undefined,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

// SafeLocalStorage implementation
class SafeLocalStorage implements StateStorage {
  private maxRetries = 3;
  private retryDelay = 100;

  getItem(name: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch (err) {
      console.warn('Error reading from localStorage:', err);
      return null;
    }
  }

  setItem(name: string, value: string): void {
    if (typeof window === 'undefined') return;
    let retries = 0;
    const trySet = () => {
      try {
        window.localStorage.setItem(name, value);
      } catch (err) {
        if (retries < this.maxRetries) {
          retries++;
          setTimeout(trySet, this.retryDelay);
        } else {
          console.error('Failed to save to localStorage after retries:', err);
        }
      }
    };
    trySet();
  }

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.warn('Error removing from localStorage:', err);
    }
  }
}

// Client data type - comprehensive including all fields from all pages
interface ClientData {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  maritalStatus?: string;
  numberOfDependants?: number;
  agesOfDependants?: string;
  email?: string;
  phoneNumber?: string;
  // Legacy field - kept for backward compatibility during migration
  mobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  ownOrRent?: 'OWN' | 'RENT' | 'MORTGAGED';
  
  // Assets - Real Estate
  homePrice?: number;
  homeYear?: number;
  homeValue?: number;
  investment1Price?: number;
  investment1Year?: number;
  investment1Value?: number;
  investment2Price?: number;
  investment2Year?: number;
  investment2Value?: number;
  investment3Price?: number;
  investment3Year?: number;
  investment3Value?: number;
  investment4Price?: number;
  investment4Year?: number;
  investment4Value?: number;

  // Liabilities - Real Estate
  homeFunder?: string;
  homeBalance?: number;
  homeRate?: number;
  homeRepayment?: number;
  investment1Funder?: string;
  investment1Balance?: number;
  investment1Rate?: number;
  investment1Repayment?: number;
  investment2Funder?: string;
  investment2Balance?: number;
  investment2Rate?: number;
  investment2Repayment?: number;
  investment3Funder?: string;
  investment3Balance?: number;
  investment3Rate?: number;
  investment3Repayment?: number;
  investment4Funder?: string;
  investment4Balance?: number;
  investment4Rate?: number;
  investment4Repayment?: number;

  // Assets - Other
  vehicleType?: string;
  vehicleYear?: number;
  vehicleValue?: number;
  savingsValue?: number;
  homeContentsValue?: number;
  superFundValue?: number;
  superFundTime?: number;
  sharesValue?: number;
  sharesTotalValue?: number;

  // Liabilities - Other
  creditCardLimit?: number;
  creditCardBalance?: number;
  personalLoanRepayment?: number;
  personalLoanBalance?: number;
  hecsRepayment?: number;
  hecsBalance?: number;

  // Financial Position - Income
  grossSalary?: number;
  grossIncome?: number; // Legacy field - kept for backward compatibility
  annualIncome?: number; // Canonical field name
  rentalIncome?: number;
  dividends?: number;
  frankedDividends?: number;
  capitalGains?: number;
  otherIncome?: number;

  // Financial Position - Assets (dynamic)
  assets?: Array<{
    id: string;
    name: string;
    currentValue: number;
    type: 'property' | 'vehicle' | 'savings' | 'shares' | 'super' | 'other';
  }>;

  // Financial Position - Liabilities (dynamic)
  liabilities?: Array<{
    id: string;
    name: string;
    balance: number;
    monthlyPayment: number;
    interestRate: number;
    loanTerm: number;
    type: 'mortgage' | 'personal-loan' | 'credit-card' | 'hecs' | 'other';
  }>;

  // Investment Properties
  properties?: Array<{
    id: string;
    address: string;
    purchasePrice: number;
    currentValue: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    weeklyRent: number;
    annualExpenses: number;
    linkedAssetId?: string;
    linkedLiabilityId?: string;
  }>;

  // Projections
  currentAge?: number;
  retirementAge?: number;
  currentSuper?: number;
  currentSavings?: number;
  currentShares?: number;
  propertyEquity?: number;
  monthlyDebtPayments?: number;
  monthlyRentalIncome?: number;
  monthlyExpenses?: number;
  
  // Projection Assumptions
  inflationRate?: number;
  salaryGrowthRate?: number;
  superReturn?: number;
  shareReturn?: number;
  propertyGrowthRate?: number;
  withdrawalRate?: number;
  rentGrowthRate?: number;
  
  // Projection Results (calculated on Projections page, used by Summary page)
  projectionResults?: {
    yearsToRetirement: number;
    projectedLumpSum: number;
    projectedPassiveIncome: number; // Annual
    projectedMonthlyPassiveIncome: number; // Monthly
    requiredIncome: number; // Annual target (70% of current income)
    monthlyDeficitSurplus: number;
    isDeficit: boolean;
    calculatedAt: string; // ISO timestamp
  };

  // Tax Optimization Results (calculated on Tax Optimization page, used by Summary page)
  taxOptimizationResults?: {
    currentTax: number;
    optimizedTax: number;
    taxSavings: number;
    annualIncome: number;
    taxableIncome: number;
    totalDeductions: number;
    marginalTaxRate: number;
    averageTaxRate: number;
    calculatedAt: string; // ISO timestamp
  };

  // Tax Optimization
  employmentIncome?: number;
  investmentIncome?: number;
  workRelatedExpenses?: number;
  vehicleExpenses?: number;
  uniformsAndLaundry?: number;
  homeOfficeExpenses?: number;
  selfEducationExpenses?: number;
  investmentExpenses?: number;
  charityDonations?: number;
  accountingFees?: number;
  rentalExpenses?: number;
  superContributions?: number;
  healthInsurance?: boolean;
  hecs?: boolean;
  helpDebt?: number;
  privateHealthInsurance?: boolean;
}

// Financial data structure
type FinancialFields = {
  // Income
  grossIncome: number;
  employmentIncome: number;
  investmentIncome: number;
  rentalIncome: number;
  frankedDividends: number;
  capitalGains: number;
  otherIncome: number;

  // Expenses
  workRelatedExpenses: number;
  investmentExpenses: number;
  rentalExpenses: number;

  // Tax
  taxableIncome: number;

  // Property
  propertyValue: number;
  mortgageAmount: number;
  interestRate: number;

  // Assets & Liabilities
  cashSavings: number;
  investments: number;
  superBalance: number;
  totalDebt: number;

  // Client Info
  clientA?: ClientData;
  clientB?: ClientData;
  activeClient?: "A" | "B";

  // Computed Values
  totalIncome: number;
  netIncome: number;
}

// Saved clients by name
interface SavedClient {
  id: string;
  name: string;
  data: ClientData;
  savedAt: string;
}

// Store interface with actions
interface FinancialStore extends FinancialFields {
  // Update a single financial field
  updateField: (key: keyof Omit<FinancialFields, 'clientA' | 'clientB' | 'activeClient' | 'totalIncome' | 'netIncome' | 'savedClients'>, value: number) => void;
  
  // Update client data
  setClientData: (client: "A" | "B", data: Partial<ClientData>) => void;
  
  // Set active client
  setActiveClient: (client: "A" | "B") => void;

  // Set income data
  setIncomeData: (data: Partial<Pick<FinancialFields, 'grossIncome' | 'employmentIncome' | 'investmentIncome' | 'rentalIncome' | 'frankedDividends' | 'otherIncome'>>) => void;
  
  // Set financial position
  setFinancialPosition: (data: Partial<Pick<FinancialFields, 'cashSavings' | 'investments' | 'superBalance' | 'totalDebt'>>) => void;

  // Save/load clients by name
  savedClients: Record<string, SavedClient>;
  saveClientByName: (name: string, clientSlot: "A" | "B") => void;
  loadClientByName: (name: string, clientSlot: "A" | "B") => void;
  deleteClientByName: (name: string) => void;
  getAllSavedClientNames: () => string[];

  // Additional computed fields
  investmentDeductions?: number;
}

// Initial state
const initialState: FinancialFields = {
  grossIncome: 0,
  employmentIncome: 0,
  investmentIncome: 0,
  rentalIncome: 0,
  frankedDividends: 0,
  capitalGains: 0,
  otherIncome: 0,
  workRelatedExpenses: 0,
  investmentExpenses: 0,
  rentalExpenses: 0,
  taxableIncome: 0,
  propertyValue: 0,
  mortgageAmount: 0,
  interestRate: 0,
  cashSavings: 0,
  investments: 0,
  superBalance: 0,
  totalDebt: 0,
  totalIncome: 0,
  netIncome: 0
};

// Create the store
export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      savedClients: {},
      
      updateField: (key, value) => {
        set((state) => {
          const newState = { ...state, [key]: value } as FinancialFields;
          
          // Recalculate derived values
          newState.totalIncome = 
            (newState.grossIncome || 0) +
            (newState.rentalIncome || 0) +
            (newState.investmentIncome || 0) +
            (newState.otherIncome || 0);
            
          newState.netIncome = 
            newState.totalIncome -
            (newState.workRelatedExpenses || 0) -
            (newState.investmentExpenses || 0) -
            (newState.rentalExpenses || 0);
            
          return newState;
        });
      },
      
      setClientData: (client, data) => {
        set((state) => {
          const clientKey = client === "A" ? "clientA" : "clientB";
          const currentClient = state[clientKey] || {};
          const updatedClient = { ...currentClient, ...data };
          
          // Auto-update financial store fields when client data changes
          const updates: Partial<FinancialFields> = {};
          
          // Contact fields - map phoneNumber to mobile for backward compatibility
          if (data.phoneNumber !== undefined) {
            updatedClient.mobile = data.phoneNumber;
            updatedClient.phoneNumber = data.phoneNumber;
          }
          // Legacy mobile field support
          if (data.mobile !== undefined && !data.phoneNumber) {
            updatedClient.phoneNumber = data.mobile;
          }
          
          // Income fields - map multiple field names to the same store field
          // CANONICAL: annualIncome → grossIncome (store internal name)
          if (data.annualIncome !== undefined) {
            updates.grossIncome = data.annualIncome;
            updates.employmentIncome = data.annualIncome;
          }
          if (data.grossSalary !== undefined) {
            updates.grossIncome = data.grossSalary;
            updates.employmentIncome = data.grossSalary; // Also update employmentIncome
          }
          if (data.employmentIncome !== undefined) {
            updates.grossIncome = data.employmentIncome;
            updates.employmentIncome = data.employmentIncome;
          }
          if (data.rentalIncome !== undefined) {
            updates.rentalIncome = data.rentalIncome;
          }
          if (data.monthlyRentalIncome !== undefined) {
            // Convert monthly to annual if needed
            updates.rentalIncome = data.monthlyRentalIncome * 12;
          }
          if (data.dividends !== undefined || data.frankedDividends !== undefined) {
            const currentDividends = data.dividends !== undefined ? data.dividends : ((currentClient as any)?.dividends || 0);
            const currentFranked = data.frankedDividends !== undefined ? data.frankedDividends : ((currentClient as any)?.frankedDividends || 0);
            updates.investmentIncome = currentDividends + currentFranked;
            updates.frankedDividends = currentFranked;
          }
          if (data.capitalGains !== undefined) {
            updates.capitalGains = data.capitalGains;
          }
          if (data.otherIncome !== undefined) {
            updates.otherIncome = data.otherIncome;
          }
          if (data.investmentIncome !== undefined) {
            updates.investmentIncome = data.investmentIncome;
          }
          
          // Expense fields
          if (data.workRelatedExpenses !== undefined) {
            updates.workRelatedExpenses = data.workRelatedExpenses;
          }
          if (data.investmentExpenses !== undefined) {
            updates.investmentExpenses = data.investmentExpenses;
          }
          if (data.rentalExpenses !== undefined) {
            updates.rentalExpenses = data.rentalExpenses;
          }
          
          // Asset fields - map multiple field names
          if (data.savingsValue !== undefined) {
            updates.cashSavings = data.savingsValue;
          }
          if (data.currentSavings !== undefined) {
            updates.cashSavings = data.currentSavings;
          }
          if (data.sharesTotalValue !== undefined) {
            updates.investments = data.sharesTotalValue;
          }
          if (data.currentShares !== undefined) {
            updates.investments = data.currentShares;
          }
          if (data.superFundValue !== undefined) {
            updates.superBalance = data.superFundValue;
          }
          if (data.currentSuper !== undefined) {
            updates.superBalance = data.currentSuper;
          }
          
          // Calculate total debt from liabilities
          if (data.liabilities) {
            const totalDebt = data.liabilities.reduce((sum, liab) => sum + (liab.balance || 0), 0);
            updates.totalDebt = totalDebt;
          }
          
          // Recalculate derived values
          const newGrossIncome = updates.grossIncome !== undefined ? updates.grossIncome : state.grossIncome;
          const newRentalIncome = updates.rentalIncome !== undefined ? updates.rentalIncome : state.rentalIncome;
          const newInvestmentIncome = updates.investmentIncome !== undefined ? updates.investmentIncome : state.investmentIncome;
          const newOtherIncome = updates.otherIncome !== undefined ? updates.otherIncome : state.otherIncome;
          const newWorkExpenses = updates.workRelatedExpenses !== undefined ? updates.workRelatedExpenses : state.workRelatedExpenses;
          const newInvExpenses = updates.investmentExpenses !== undefined ? updates.investmentExpenses : state.investmentExpenses;
          const newRentalExpenses = updates.rentalExpenses !== undefined ? updates.rentalExpenses : state.rentalExpenses;
          
          updates.totalIncome = newGrossIncome + newRentalIncome + newInvestmentIncome + newOtherIncome;
          updates.netIncome = updates.totalIncome - newWorkExpenses - newInvExpenses - newRentalExpenses;
          
          return {
            ...state,
            [clientKey]: updatedClient,
            ...updates
          };
        });
      },
      
      setActiveClient: (client) => set({ activeClient: client }),

      setIncomeData: (data) => {
        set((state) => {
          const newState = { ...state, ...data };
          
          // Recalculate derived values
          newState.totalIncome = 
            (newState.grossIncome || 0) +
            (newState.rentalIncome || 0) +
            (newState.investmentIncome || 0) +
            (newState.otherIncome || 0);
            
          newState.netIncome = 
            newState.totalIncome -
            (newState.workRelatedExpenses || 0) -
            (newState.investmentExpenses || 0) -
            (newState.rentalExpenses || 0);
            
          return newState;
        });
      },

      setFinancialPosition: (data) => {
        set((state) => {
          const newState = { ...state, ...data };
          return newState;
        });
      },

      saveClientByName: (name, clientSlot) => {
        set((state) => {
          const client = clientSlot === "A" ? state.clientA : state.clientB;
          if (!client || !client.firstName) {
            console.warn('Cannot save client: no client data available');
            return state;
          }
          
          const savedClient: SavedClient = {
            id: `client-${Date.now()}`,
            name: name || `${client.firstName} ${client.lastName}`,
            data: client,
            savedAt: new Date().toISOString()
          };
          
          return {
            ...state,
            savedClients: {
              ...state.savedClients,
              [savedClient.name]: savedClient
            }
          };
        });
      },

      loadClientByName: (name, clientSlot) => {
        const state = get();
        const savedClient = state.savedClients[name];
        
        if (!savedClient) {
          console.warn(`Client "${name}" not found`);
          return;
        }
        
        set((currentState) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const clientData = savedClient.data;
          
          // Auto-update financial store fields
          const updates: Partial<FinancialFields> = {};
          
          if (clientData.grossSalary !== undefined) updates.grossIncome = clientData.grossSalary;
          if (clientData.rentalIncome !== undefined) updates.rentalIncome = clientData.rentalIncome;
          if (clientData.dividends !== undefined || clientData.frankedDividends !== undefined) {
            updates.investmentIncome = (clientData.dividends || 0) + (clientData.frankedDividends || 0);
            updates.frankedDividends = clientData.frankedDividends || 0;
          }
          if (clientData.capitalGains !== undefined) updates.capitalGains = clientData.capitalGains;
          if (clientData.otherIncome !== undefined) updates.otherIncome = clientData.otherIncome;
          if (clientData.workRelatedExpenses !== undefined) updates.workRelatedExpenses = clientData.workRelatedExpenses;
          if (clientData.investmentExpenses !== undefined) updates.investmentExpenses = clientData.investmentExpenses;
          if (clientData.rentalExpenses !== undefined) updates.rentalExpenses = clientData.rentalExpenses;
          if (clientData.savingsValue !== undefined) updates.cashSavings = clientData.savingsValue;
          if (clientData.sharesTotalValue !== undefined) updates.investments = clientData.sharesTotalValue;
          if (clientData.superFundValue !== undefined) updates.superBalance = clientData.superFundValue;
          
          if (clientData.liabilities) {
            const totalDebt = clientData.liabilities.reduce((sum, liab) => sum + (liab.balance || 0), 0);
            updates.totalDebt = totalDebt;
          }
          
          return {
            ...currentState,
            [clientKey]: clientData,
            activeClient: clientSlot,
            ...updates
          };
        });
      },

      deleteClientByName: (name) => {
        set((state) => {
          const { [name]: deleted, ...rest } = state.savedClients;
          return {
            ...state,
            savedClients: rest
          };
        });
      },

      getAllSavedClientNames: () => {
        const state = get();
        return Object.keys(state.savedClients).sort();
      },
      
      investmentDeductions: 0
    }),
    {
      name: 'financial-store',
      storage: createJSONStorage(() => new SafeLocalStorage())
    }
  )
);
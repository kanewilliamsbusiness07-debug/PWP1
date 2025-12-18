import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { normalizeFields } from '@/lib/utils/field-mapping';

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

// Asset and Liability type definitions
type Asset = {
  id: string;
  name: string;
  currentValue: number;
  type: 'property' | 'vehicle' | 'savings' | 'shares' | 'super' | 'other';
  ownerOccupied?: 'own' | 'rent';
  linkedLiabilityId?: string;
};

type Liability = {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  loanTerm: number;
  termRemaining?: number;
  type: 'mortgage' | 'personal-loan' | 'credit-card' | 'hecs' | 'other';
  lender?: string;
  loanType?: 'fixed' | 'split' | 'variable';
  paymentFrequency?: 'W' | 'F' | 'M';
  linkedAssetId?: string;
};

// Client data type - comprehensive including all fields from all pages
interface ClientData {
  // Database ID (optional - may not exist for locally saved clients)
  id?: string;
  
  // Personal Information - Primary Person
  // Personal Information - Primary Person
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  dob?: Date | string; // Database field name (alias for dateOfBirth)
  email?: string;
  phoneNumber?: string;
  // Legacy field - kept for backward compatibility during migration
  mobile?: string;
  
  // Personal Information - Partner/Spouse (optional)
  partnerFirstName?: string;
  partnerLastName?: string;
  partnerDateOfBirth?: Date;
  partnerEmail?: string;
  partnerPhoneNumber?: string;
  
  // Shared Household Information
  maritalStatus?: string;
  numberOfDependants?: number;
  agesOfDependants?: string;
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
  assets?: Asset[];

  // Financial Position - Liabilities (dynamic)
  liabilities?: Liability[];

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
  
  // Tax Results (for combined display across clients)
  taxResults?: {
    annualIncome: number;
    totalTax: number;
    afterTaxIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    marginalTaxRate: number;
    averageTaxRate: number;
  };
  
  // Optimized Tax Results (for combined display)
  optimizedTaxResults?: {
    totalTax: number;
    afterTaxIncome: number;
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
  otherDeductions?: number;
  rentalExpenses?: number;
  superContributions?: number;
  healthInsurance?: boolean;
  hecs?: boolean;
  helpDebt?: number;
  privateHealthInsurance?: boolean;
}

// Shared Assumptions that apply to both clients
interface SharedAssumptions {
  inflationRate: number;
  salaryGrowthRate: number;
  superReturn: number;
  shareReturn: number;
  propertyGrowthRate: number;
  withdrawalRate: number;
  rentGrowthRate: number;
  savingsRate: number;
  taxYear: number;
  medicareLevyRate: number;
  hecsThreshold: number;
}

// Calculation Results stored globally for cross-page access
interface CalculationResults {
  clientA?: {
    projectedLumpSum: number;
    monthlyPassiveIncome: number;
    yearsToRetirement: number;
    requiredIncome: number;
    monthlyDeficitSurplus: number;
    isDeficit: boolean;
    currentTax?: number;
    optimizedTax?: number;
    taxSavings?: number;
  };
  clientB?: {
    projectedLumpSum: number;
    monthlyPassiveIncome: number;
    yearsToRetirement: number;
    requiredIncome: number;
    monthlyDeficitSurplus: number;
    isDeficit: boolean;
    currentTax?: number;
    optimizedTax?: number;
    taxSavings?: number;
  };
  combined?: {
    totalProjectedLumpSum: number;
    totalMonthlyIncome: number;
    combinedSurplusDeficit: number;
    totalTax?: number;
    totalTaxSavings?: number;
  };
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
  
  // Shared Assumptions (apply to both clients)
  sharedAssumptions: SharedAssumptions;

  // Calculation Results (stored globally for cross-page access)
  results?: CalculationResults;

  // Computed Values
  totalIncome: number;
  netIncome: number;
  investmentDeductions?: number;
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

  // Set calculation results
  setResults: (results: CalculationResults) => void;

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
  
  // Shared assumptions actions
  setSharedAssumptions: (data: Partial<SharedAssumptions>) => void;

  // Asset and liability management
  addAsset: (clientSlot: "A" | "B", asset: Omit<Asset, 'id'>) => string;
  addLiability: (clientSlot: "A" | "B", liability: Omit<Liability, 'id'>) => string;
  addPairedAssetLiability: (clientSlot: "A" | "B", asset: Omit<Asset, 'id' | 'linkedLiabilityId'>, liability: Omit<Liability, 'id' | 'linkedAssetId'>) => { assetId: string; liabilityId: string };
  removeAsset: (clientSlot: "A" | "B", assetId: string) => void;
  removeLiability: (clientSlot: "A" | "B", liabilityId: string) => void;
  updateAsset: (clientSlot: "A" | "B", assetId: string, updates: Partial<Asset>) => void;
  updateLiability: (clientSlot: "A" | "B", liabilityId: string, updates: Partial<Liability>) => void;

// Enhanced data synchronization actions
syncClientData: (clientSlot: "A" | "B", clientData: Partial<ClientData>) => void;
syncFromDatabase: (clientId: string, clientSlot: "A" | "B") => Promise<void>;
validateDataIntegrity: () => boolean;
forceSync: () => Promise<boolean>;
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
  netIncome: 0,
  investmentDeductions: 0,
  results: undefined,
  sharedAssumptions: {
    inflationRate: 2.5,
    salaryGrowthRate: 3.0,
    superReturn: 6.2,
    shareReturn: 7.0,
    propertyGrowthRate: 4.0,
    withdrawalRate: 4.0,
    rentGrowthRate: 3.0,
    savingsRate: 10.0,
    taxYear: new Date().getFullYear(),
    medicareLevyRate: 2.0,
    hecsThreshold: 51550,
  }
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
          // grossIncome is the total of all income sources
          newState.grossIncome = 
            (newState.employmentIncome || 0) +
            (newState.rentalIncome || 0) +
            (newState.investmentIncome || 0) +
            (newState.otherIncome || 0);
            
          newState.totalIncome = newState.grossIncome;
            
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
          // CANONICAL: annualIncome → employmentIncome (store internal name)
          if (data.annualIncome !== undefined) {
            updates.employmentIncome = data.annualIncome;
          }
          if (data.grossSalary !== undefined) {
            updates.employmentIncome = data.grossSalary;
          }
          if (data.employmentIncome !== undefined) {
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
          const newEmploymentIncome = updates.employmentIncome !== undefined ? updates.employmentIncome : state.employmentIncome;
          const newRentalIncome = updates.rentalIncome !== undefined ? updates.rentalIncome : state.rentalIncome;
          const newInvestmentIncome = updates.investmentIncome !== undefined ? updates.investmentIncome : state.investmentIncome;
          const newOtherIncome = updates.otherIncome !== undefined ? updates.otherIncome : state.otherIncome;
          const newWorkExpenses = updates.workRelatedExpenses !== undefined ? updates.workRelatedExpenses : state.workRelatedExpenses;
          const newInvExpenses = updates.investmentExpenses !== undefined ? updates.investmentExpenses : state.investmentExpenses;
          const newRentalExpenses = updates.rentalExpenses !== undefined ? updates.rentalExpenses : state.rentalExpenses;
          
          // grossIncome is the total of all income sources
          updates.grossIncome = newEmploymentIncome + newRentalIncome + newInvestmentIncome + newOtherIncome;
          updates.totalIncome = updates.grossIncome;
          updates.netIncome = updates.totalIncome - newWorkExpenses - newInvExpenses - newRentalExpenses;
          
          return {
            ...state,
            [clientKey]: updatedClient,
            ...updates
          };
        });
      },
      
      setActiveClient: (client) => set({ activeClient: client }),

      setResults: (results) => set({ results }),

      setIncomeData: (data) => {
        set((state) => {
          const newState = { ...state, ...data };
          
          // Recalculate derived values
          // grossIncome is the total of all income sources
          newState.grossIncome = 
            (newState.employmentIncome || 0) +
            (newState.rentalIncome || 0) +
            (newState.investmentIncome || 0) +
            (newState.otherIncome || 0);
            
          newState.totalIncome = newState.grossIncome;
            
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
          
          if (clientData.grossSalary !== undefined) updates.employmentIncome = clientData.grossSalary;
          if (clientData.annualIncome !== undefined) updates.employmentIncome = clientData.annualIncome;
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
          
          // Recalculate derived values
          const newEmploymentIncome = updates.employmentIncome !== undefined ? updates.employmentIncome : currentState.employmentIncome;
          const newRentalIncome = updates.rentalIncome !== undefined ? updates.rentalIncome : currentState.rentalIncome;
          const newInvestmentIncome = updates.investmentIncome !== undefined ? updates.investmentIncome : currentState.investmentIncome;
          const newOtherIncome = updates.otherIncome !== undefined ? updates.otherIncome : currentState.otherIncome;
          
          updates.grossIncome = newEmploymentIncome + newRentalIncome + newInvestmentIncome + newOtherIncome;
          updates.totalIncome = updates.grossIncome;
          
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
      
      setSharedAssumptions: (data) => {
        set((state) => ({
          ...state,
          sharedAssumptions: { ...state.sharedAssumptions, ...data }
        }));
      },

      addAsset: (clientSlot, asset) => {
        const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentAssets = currentClient.assets || [];
          
          const newAsset = { ...asset, id: assetId };
          const updatedClient = {
            ...currentClient,
            assets: [...currentAssets, newAsset]
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
        return assetId;
      },

      addLiability: (clientSlot, liability) => {
        const liabilityId = `liability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentLiabilities = currentClient.liabilities || [];
          
          const newLiability = { ...liability, id: liabilityId };
          const updatedClient = {
            ...currentClient,
            liabilities: [...currentLiabilities, newLiability]
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
        return liabilityId;
      },

      addPairedAssetLiability: (clientSlot, asset, liability) => {
        const pairId = `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const assetId = `asset-${pairId}`;
        const liabilityId = `liability-${pairId}`;
        
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentAssets = currentClient.assets || [];
          const currentLiabilities = currentClient.liabilities || [];
          
          const newAsset = { ...asset, id: assetId, linkedLiabilityId: liabilityId };
          const newLiability = { ...liability, id: liabilityId, linkedAssetId: assetId };
          
          const updatedClient = {
            ...currentClient,
            assets: [...currentAssets, newAsset],
            liabilities: [...currentLiabilities, newLiability]
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
        
        return { assetId, liabilityId };
      },

      removeAsset: (clientSlot, assetId) => {
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentAssets = currentClient.assets || [];
          
          const assetToRemove = currentAssets.find(a => a.id === assetId);
          const updatedAssets = currentAssets.filter(a => a.id !== assetId);
          
          // If the asset was linked to a liability, remove the link from the liability
          let updatedLiabilities = currentClient.liabilities || [];
          if (assetToRemove?.linkedLiabilityId) {
            updatedLiabilities = updatedLiabilities.map(l => 
              l.id === assetToRemove.linkedLiabilityId 
                ? { ...l, linkedAssetId: undefined }
                : l
            );
          }
          
          const updatedClient = {
            ...currentClient,
            assets: updatedAssets,
            liabilities: updatedLiabilities
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
      },

      removeLiability: (clientSlot, liabilityId) => {
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentLiabilities = currentClient.liabilities || [];
          
          const liabilityToRemove = currentLiabilities.find(l => l.id === liabilityId);
          const updatedLiabilities = currentLiabilities.filter(l => l.id !== liabilityId);
          
          // If the liability was linked to an asset, remove the link from the asset
          let updatedAssets = currentClient.assets || [];
          if (liabilityToRemove?.linkedAssetId) {
            updatedAssets = updatedAssets.map(a => 
              a.id === liabilityToRemove.linkedAssetId 
                ? { ...a, linkedLiabilityId: undefined }
                : a
            );
          }
          
          const updatedClient = {
            ...currentClient,
            assets: updatedAssets,
            liabilities: updatedLiabilities
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
      },

      updateAsset: (clientSlot, assetId, updates) => {
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentAssets = currentClient.assets || [];
          
          const updatedAssets = currentAssets.map(a => 
            a.id === assetId ? { ...a, ...updates } : a
          );
          
          const updatedClient = {
            ...currentClient,
            assets: updatedAssets
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
      },

      updateLiability: (clientSlot, liabilityId, updates) => {
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = (state[clientKey] || {}) as Partial<ClientData>;
          const currentLiabilities = currentClient.liabilities || [];
          
          const updatedLiabilities = currentLiabilities.map(l => 
            l.id === liabilityId ? { ...l, ...updates } : l
          );
          
          const updatedClient = {
            ...currentClient,
            liabilities: updatedLiabilities
          };
          
          return {
            ...state,
            [clientKey]: updatedClient
          };
        });
      },
      
      syncClientData: (clientSlot, clientData) => {
        set((state) => {
          const clientKey = clientSlot === "A" ? "clientA" : "clientB";
          const currentClient = state[clientKey] || {};
          
          // Apply field normalization consistently
          const normalizedData = normalizeFields(clientData);
          
          // Update client data
          const updatedClient = { ...currentClient, ...normalizedData };
          
          // Auto-sync financial fields
          const updates: Partial<FinancialFields> = {};
          
          // Apply the same field mapping logic as setClientData
          if (normalizedData.annualIncome !== undefined) {
            updates.grossIncome = normalizedData.annualIncome;
            updates.employmentIncome = normalizedData.annualIncome;
          }
          if (normalizedData.grossSalary !== undefined) {
            updates.grossIncome = normalizedData.grossSalary;
            updates.employmentIncome = normalizedData.grossSalary;
          }
          if (normalizedData.rentalIncome !== undefined) {
            updates.rentalIncome = normalizedData.rentalIncome;
          }
          if (normalizedData.savingsValue !== undefined) {
            updates.cashSavings = normalizedData.savingsValue;
          }
          if (normalizedData.superFundValue !== undefined) {
            updates.superBalance = normalizedData.superFundValue;
          }
          
          return {
            ...state,
            [clientKey]: updatedClient,
            ...updates
          };
        });
      },
      
      syncFromDatabase: async (clientId, clientSlot) => {
        try {
          const response = await fetch(`/api/clients/${clientId}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const clientData = await response.json();
            get().syncClientData(clientSlot, clientData);
          } else {
            console.error('Failed to sync client from database:', response.status);
          }
        } catch (error) {
          console.error('Error syncing client from database:', error);
        }
      },
      
      validateDataIntegrity: () => {
        const state = get();
        
        // Check if client data is consistent
        const clientA = state.clientA;
        const clientB = state.clientB;
        
        // Validate that store grossIncome equals sum of all income sources
        const expectedGrossIncomeA = (state.employmentIncome || 0) + (state.rentalIncome || 0) + (state.investmentIncome || 0) + (state.otherIncome || 0);
        if (Math.abs(state.grossIncome - expectedGrossIncomeA) > 0.01) {
          console.warn('Data integrity issue: store grossIncome does not match sum of income sources', {
            grossIncome: state.grossIncome,
            expected: expectedGrossIncomeA,
            employmentIncome: state.employmentIncome,
            rentalIncome: state.rentalIncome,
            investmentIncome: state.investmentIncome,
            otherIncome: state.otherIncome
          });
          return false;
        }
        
        // Validate that client annualIncome matches store employmentIncome
        if (clientA?.annualIncome && Math.abs(state.employmentIncome - clientA.annualIncome) > 0.01) {
          console.warn('Data integrity issue: clientA annualIncome does not match store employmentIncome', {
            clientAnnualIncome: clientA.annualIncome,
            storeEmploymentIncome: state.employmentIncome
          });
          return false;
        }
        
        if (clientB?.annualIncome && Math.abs(state.employmentIncome - clientB.annualIncome) > 0.01) {
          console.warn('Data integrity issue: clientB annualIncome does not match store employmentIncome', {
            clientAnnualIncome: clientB.annualIncome,
            storeEmploymentIncome: state.employmentIncome
          });
          return false;
        }
        
        return true;
      },
      
      forceSync: async () => {
        const state = get();
        
        // Sync both clients if they have IDs
        if (state.clientA?.id) {
          await get().syncFromDatabase(state.clientA.id, "A");
        }
        
        if (state.clientB?.id) {
          await get().syncFromDatabase(state.clientB.id, "B");
        }
        
        // Validate integrity after sync
        return get().validateDataIntegrity();
      },
    }),
    {
      name: 'financial-store',
      storage: createJSONStorage(() => new SafeLocalStorage())
    }
  )
);

// Alias for compatibility with diagnostic guides
export const useGlobalState = useFinancialStore;
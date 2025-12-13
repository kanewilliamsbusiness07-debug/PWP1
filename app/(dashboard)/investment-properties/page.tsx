/**
 * FinCalc Pro - Investment Properties Page
 * 
 * Property serviceability analysis and negative gearing calculations
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Chrome as Home, Calculator, TrendingUp, TrendingDown, Plus, Trash2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFinancialStore } from '@/lib/store/store';
import { ClientSelector } from '@/components/client-selector';

const propertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  purchasePrice: z.number().min(0, 'Price must be positive'),
  currentValue: z.number().min(0, 'Value must be positive'),
  loanAmount: z.number().min(0, 'Loan amount must be positive'),
  interestRate: z.number().min(0).max(20, 'Rate must be between 0-20%'),
  loanTerm: z.number().min(1).max(100, 'Term must be between 1-100 years'),
  weeklyRent: z.number().min(0, 'Rent must be positive'),
  annualExpenses: z.number().min(0, 'Expenses must be positive')
});

const serviceabilitySchema = z.object({
  annualIncome: z.number().min(0, 'Annual income must be positive'), // Canonical field name (was grossIncome)
  monthlyExpenses: z.number().min(0, 'Expenses must be positive'),
  existingDebtPayments: z.number().min(0, 'Debt payments must be positive'),
  targetPropertyPrice: z.number().min(0, 'Price must be positive'),
  deposit: z.number().min(0, 'Deposit must be positive'),
  interestRate: z.number().min(0).max(20, 'Rate must be between 0-20%'),
  loanTerm: z.number().min(1).max(100, 'Term must be between 1-100 years'),
  expectedRent: z.number().min(0, 'Rent must be positive'),
  annualPropertyExpenses: z.number().min(0, 'Property expenses must be positive'),
  depreciationAmount: z.number().min(0, 'Depreciation must be positive'),
  marginalTaxRate: z.number().min(0).max(100, 'Tax rate must be between 0-100%')
});

type Property = z.infer<typeof propertySchema> & { id: string };
type ServiceabilityData = z.infer<typeof serviceabilitySchema>;

interface PropertyAnalysis {
  monthlyLoanPayment: number;
  monthlyRent: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  rentalYield: number;
  isNegativelyGeared: boolean;
  taxBenefit: number;
  netCashFlow: number;
}

interface ServiceabilityResult {
  maxBorrowingCapacity: number;
  monthlyServiceCapacity: number;
  loanToValueRatio: number;
  debtToIncomeRatio: number;
  canAfford: boolean;
  monthlyShortfall?: number;
  isNegativelyGeared: boolean;
  negativeGearingAmount: number;
  annualTaxBenefit: number;
  monthlyTaxBenefit: number;
  netMonthlyPaymentAfterTax: number;
}

export default function InvestmentPropertiesPage() {
  const [serviceabilityResult, setServiceabilityResult] = useState<ServiceabilityResult | null>(null);
  const { toast } = useToast();

  const propertyForm = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: '',
      purchasePrice: 0,
      currentValue: 0,
      loanAmount: 0,
      interestRate: 6.5,
      loanTerm: 30,
      weeklyRent: 0,
      annualExpenses: 0
    }
  });

  // Subscribe to store values
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const totalDebt = useFinancialStore((state) => state.totalDebt);
  const cashSavings = useFinancialStore((state) => state.cashSavings);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  
  // Subscribe to active client and their properties
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const setClientData = useFinancialStore((state) => state.setClientData);
  
  // Get properties from the active client
  const clientData = activeClient === 'A' ? clientA : clientB;
  const properties: Property[] = (clientData?.properties as Property[]) || [];
  
  // For combined results display
  const hasClientA = clientA && (clientA.firstName || clientA.grossSalary || clientA.annualIncome || (clientA.properties as Property[])?.length > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.grossSalary || clientB.annualIncome || (clientB.properties as Property[])?.length > 0);
  const showCombined = hasClientA && hasClientB;
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';
  
  // Get properties from both clients
  const clientAProperties: Property[] = (clientA?.properties as Property[]) || [];
  const clientBProperties: Property[] = (clientB?.properties as Property[]) || [];
  
  // Function to update properties in the store
  const updatePropertiesInStore = (newProperties: Property[]) => {
    setClientData(activeClient || 'A', { properties: newProperties });
  };
  
  const calculateLoanPayment = (principal: number, rate: number, years: number): number => {
    if (rate === 0) return principal / (years * 12);
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const serviceabilityForm = useForm<ServiceabilityData>({
    resolver: zodResolver(serviceabilitySchema),
    defaultValues: {
      annualIncome: grossIncome || 0,
      monthlyExpenses: 0,
      existingDebtPayments: totalDebt ? calculateLoanPayment(totalDebt, 0.065, 30) : 0,
      targetPropertyPrice: 0,
      deposit: cashSavings || 0,
      annualPropertyExpenses: 0,
      depreciationAmount: 0,
      marginalTaxRate: 32.5,
      interestRate: 6.5,
      loanTerm: 30,
      expectedRent: rentalIncome ? (rentalIncome / 52) : 0
    }
  });

  // Watch store and update form when store changes (use setValue to avoid disrupting user input)
  useEffect(() => {
    const currentValues = serviceabilityForm.getValues();
    const storeAnnualIncome = grossIncome || 0;
    const storeDeposit = cashSavings || 0;
    const storeExistingDebtPayments = totalDebt ? calculateLoanPayment(totalDebt, 0.065, 30) : 0;
    const storeExpectedRent = rentalIncome ? (rentalIncome / 52) : currentValues.expectedRent;
    
    // Only update if values differ
    if (currentValues.annualIncome !== storeAnnualIncome) {
      serviceabilityForm.setValue('annualIncome', storeAnnualIncome, { shouldDirty: false });
    }
    if (currentValues.deposit !== storeDeposit) {
      serviceabilityForm.setValue('deposit', storeDeposit, { shouldDirty: false });
    }
    if (Math.abs((currentValues.existingDebtPayments || 0) - storeExistingDebtPayments) > 0.01) {
      serviceabilityForm.setValue('existingDebtPayments', storeExistingDebtPayments, { shouldDirty: false });
    }
    if (Math.abs((currentValues.expectedRent || 0) - storeExpectedRent) > 0.01) {
      serviceabilityForm.setValue('expectedRent', storeExpectedRent, { shouldDirty: false });
    }
  }, [grossIncome, totalDebt, cashSavings, rentalIncome, serviceabilityForm]);

  const analyzeProperty = (property: Property): PropertyAnalysis => {
    const monthlyLoanPayment = calculateLoanPayment(property.loanAmount, property.interestRate, property.loanTerm);
    const monthlyRent = (property.weeklyRent * 52) / 12;
    const monthlyExpenses = property.annualExpenses / 12;
    const monthlyCashFlow = monthlyRent - monthlyLoanPayment - monthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const rentalYield = ((property.weeklyRent * 52) / property.currentValue) * 100;
    const isNegativelyGeared = monthlyCashFlow < 0;
    
    // Simplified tax benefit calculation (negative gearing)
    const taxBenefit = isNegativelyGeared ? Math.abs(annualCashFlow) * 0.325 : 0; // 32.5% tax rate
    const netCashFlow = monthlyCashFlow + (taxBenefit / 12);

    return {
      monthlyLoanPayment,
      monthlyRent,
      monthlyCashFlow,
      annualCashFlow,
      rentalYield,
      isNegativelyGeared,
      taxBenefit,
      netCashFlow
    };
  };

  // Standalone serviceability calculation - uses Australian lending standards
  const calculateServiceability = (data: ServiceabilityData): ServiceabilityResult => {
    // ========================================
    // INPUT VALIDATION
    // ========================================
    const annualIncome = data.annualIncome || 0;
    const monthlyGrossIncome = annualIncome / 12;
    const monthlyExpenses = data.monthlyExpenses || 0;
    const existingDebtPayments = data.existingDebtPayments || 0;
    const targetPropertyPrice = data.targetPropertyPrice || 0;
    const deposit = data.deposit || 0;
    const interestRatePercent = data.interestRate || 6.5;
    const interestRateDecimal = interestRatePercent / 100;
    const loanTermYears = data.loanTerm || 30;
    const weeklyRent = data.expectedRent || 0;
    const annualPropertyExpenses = data.annualPropertyExpenses || 0;
    const depreciationAmount = data.depreciationAmount || 0;
    const marginalTaxRate = (data.marginalTaxRate || 32.5) / 100;

    // ========================================
    // LOAN CALCULATIONS
    // ========================================
    const loanAmount = Math.max(0, targetPropertyPrice - deposit);
    
    // Monthly loan repayment (P&I)
    const monthlyRepayment = calculateLoanPayment(loanAmount, interestRatePercent, loanTermYears);
    
    // LTV Ratio
    const ltvRatio = targetPropertyPrice > 0 ? (loanAmount / targetPropertyPrice) * 100 : 0;

    // ========================================
    // INCOME & SERVICEABILITY
    // ========================================
    // Net monthly income after tax (approximate using 30% effective tax rate)
    const effectiveTaxRate = annualIncome > 180000 ? 0.39 : annualIncome > 120000 ? 0.34 : annualIncome > 45000 ? 0.25 : 0.19;
    const monthlyNetIncome = monthlyGrossIncome * (1 - effectiveTaxRate);
    
    // Add 80% of rental income (lender shading)
    const monthlyRent = (weeklyRent * 52) / 12;
    const shadedMonthlyRent = monthlyRent * 0.8;
    
    // Total assessable income
    const totalAssessableIncome = monthlyNetIncome + shadedMonthlyRent;
    
    // Total monthly commitments
    const monthlyPropertyExpenses = annualPropertyExpenses / 12;
    const totalMonthlyCommitments = existingDebtPayments + monthlyRepayment + monthlyExpenses + monthlyPropertyExpenses;
    
    // Net disposable income (NDI)
    const netDisposableIncome = totalAssessableIncome - totalMonthlyCommitments;
    
    // DTI Ratio (total debt service / gross monthly income)
    const dtiRatio = monthlyGrossIncome > 0 
      ? ((existingDebtPayments + monthlyRepayment) / monthlyGrossIncome) * 100 
      : 0;

    // ========================================
    // MAX BORROWING CAPACITY
    // ========================================
    // Based on 30% of gross income for all debt repayments (Australian standard)
    const maxDebtPayment = monthlyGrossIncome * 0.30;
    const availableForNewLoan = Math.max(0, maxDebtPayment - existingDebtPayments);
    const maxBorrowing = calculateMaxBorrowingFromPayment(availableForNewLoan, interestRateDecimal, loanTermYears);

    // ========================================
    // STRESS TEST (+3% rate buffer)
    // ========================================
    const stressTestRate = interestRatePercent + 3;
    const stressTestRepayment = calculateLoanPayment(loanAmount, stressTestRate, loanTermYears);
    const stressTestNDI = totalAssessableIncome - (existingDebtPayments + stressTestRepayment + monthlyExpenses + monthlyPropertyExpenses);
    const passesStressTest = stressTestNDI > 0;

    // ========================================
    // NEGATIVE GEARING & TAX BENEFITS
    // ========================================
    // Interest-only component for tax deductions
    const monthlyInterest = loanAmount * interestRateDecimal / 12;
    const monthlyDepreciation = depreciationAmount / 12;
    
    // Net property income (for tax purposes)
    const netPropertyIncome = monthlyRent - monthlyPropertyExpenses - monthlyInterest - monthlyDepreciation;
    const isNegativelyGeared = netPropertyIncome < 0;
    const negativeGearingAmount = isNegativelyGeared ? Math.abs(netPropertyIncome * 12) : 0;
    
    // Tax benefit from negative gearing
    const annualTaxBenefit = negativeGearingAmount * marginalTaxRate;
    const monthlyTaxBenefit = annualTaxBenefit / 12;
    
    // Net monthly cost after tax benefit
    // = Loan repayment - Rent + Property expenses - Tax benefit
    const netMonthlyPayment = monthlyRepayment - monthlyRent + monthlyPropertyExpenses - monthlyTaxBenefit;

    // ========================================
    // AFFORDABILITY ASSESSMENT
    // ========================================
    // Can afford if:
    // 1. DTI ratio <= 35%
    // 2. Net disposable income > 0
    // 3. Passes stress test
    // 4. LTV <= 95% (with LMI) or <= 80% (without)
    const canAfford = dtiRatio <= 35 && netDisposableIncome > 0 && passesStressTest && ltvRatio <= 95;

    return {
      maxBorrowingCapacity: Math.max(0, Math.round(maxBorrowing)),
      monthlyServiceCapacity: Math.max(0, Math.round(netDisposableIncome)),
      loanToValueRatio: Math.round(ltvRatio * 10) / 10,
      debtToIncomeRatio: Math.round(dtiRatio * 10) / 10,
      canAfford,
      monthlyShortfall: netDisposableIncome < 0 ? Math.abs(Math.round(netDisposableIncome)) : undefined,
      isNegativelyGeared,
      negativeGearingAmount: Math.round(negativeGearingAmount),
      annualTaxBenefit: Math.round(annualTaxBenefit),
      monthlyTaxBenefit: Math.round(monthlyTaxBenefit),
      netMonthlyPaymentAfterTax: Math.round(netMonthlyPayment)
    };
  };
  
  // Helper function to calculate max borrowing from a monthly payment
  const calculateMaxBorrowingFromPayment = (monthlyPayment: number, annualRate: number, years: number): number => {
    if (monthlyPayment <= 0) return 0;
    if (annualRate === 0) return monthlyPayment * years * 12;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    return monthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  };

  const addProperty = (data: z.infer<typeof propertySchema>) => {
    const newProperty: Property = { ...data, id: Date.now().toString() };
    updatePropertiesInStore([...properties, newProperty]);
    propertyForm.reset();
    toast({ title: 'Property added', description: `${data.address} has been added to your portfolio` });
  };

  const removeProperty = (id: string) => {
    updatePropertiesInStore(properties.filter(property => property.id !== id));
    toast({ title: 'Property removed', description: 'Property has been removed from your portfolio' });
  };

  // Watch form values for auto-calculation
  const watchedFormValues = serviceabilityForm.watch();
  
  // Auto-calculate serviceability when form data changes
  useEffect(() => {
    const data = serviceabilityForm.getValues();
    const result = calculateServiceability(data);
    setServiceabilityResult(result);
  }, [
    watchedFormValues.annualIncome,
    watchedFormValues.monthlyExpenses,
    watchedFormValues.existingDebtPayments,
    watchedFormValues.targetPropertyPrice,
    watchedFormValues.deposit,
    watchedFormValues.interestRate,
    watchedFormValues.loanTerm,
    watchedFormValues.expectedRent,
    watchedFormValues.annualPropertyExpenses,
    watchedFormValues.depreciationAmount,
    watchedFormValues.marginalTaxRate
  ]);

  // Manual trigger (kept for UI button) - mirrors auto-calc behavior
  const runServiceabilityTest = () => {
    const data = serviceabilityForm.getValues();
    const result = calculateServiceability(data);
    setServiceabilityResult(result);
    toast({
      title: 'Serviceability calculated',
      description: result.canAfford ? 'Property appears affordable' : 'Property may not be serviceable'
    });
  };

  // Calculate portfolio totals
  const portfolioTotals = properties.reduce((totals, property) => {
    const analysis = analyzeProperty(property);
    return {
      totalValue: totals.totalValue + property.currentValue,
      totalDebt: totals.totalDebt + property.loanAmount,
      totalEquity: totals.totalEquity + (property.currentValue - property.loanAmount),
      totalRent: totals.totalRent + analysis.monthlyRent,
      totalLoanPayments: totals.totalLoanPayments + analysis.monthlyLoanPayment,
      totalCashFlow: totals.totalCashFlow + analysis.monthlyCashFlow,
      totalTaxBenefit: totals.totalTaxBenefit + analysis.taxBenefit
    };
  }, {
    totalValue: 0,
    totalDebt: 0,
    totalEquity: 0,
    totalRent: 0,
    totalLoanPayments: 0,
    totalCashFlow: 0,
    totalTaxBenefit: 0
  });

  // Calculate per-client and combined portfolio totals
  const calculatePortfolioForClient = (clientProperties: Property[]) => {
    return clientProperties.reduce((totals, property) => {
      const analysis = analyzeProperty(property);
      return {
        propertyCount: totals.propertyCount + 1,
        totalValue: totals.totalValue + property.currentValue,
        totalDebt: totals.totalDebt + property.loanAmount,
        totalEquity: totals.totalEquity + (property.currentValue - property.loanAmount),
        totalRent: totals.totalRent + analysis.monthlyRent,
        totalCashFlow: totals.totalCashFlow + analysis.monthlyCashFlow,
      };
    }, {
      propertyCount: 0,
      totalValue: 0,
      totalDebt: 0,
      totalEquity: 0,
      totalRent: 0,
      totalCashFlow: 0,
    });
  };
  
  const clientAPortfolio = calculatePortfolioForClient(clientAProperties);
  const clientBPortfolio = calculatePortfolioForClient(clientBProperties);
  
  const combinedPortfolio = showCombined ? {
    propertyCount: clientAPortfolio.propertyCount + clientBPortfolio.propertyCount,
    totalValue: clientAPortfolio.totalValue + clientBPortfolio.totalValue,
    totalDebt: clientAPortfolio.totalDebt + clientBPortfolio.totalDebt,
    totalEquity: clientAPortfolio.totalEquity + clientBPortfolio.totalEquity,
    totalRent: clientAPortfolio.totalRent + clientBPortfolio.totalRent,
    totalCashFlow: clientAPortfolio.totalCashFlow + clientBPortfolio.totalCashFlow,
  } : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Investment Properties</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Analyze property investments and calculate serviceability</p>
        </div>
      </div>

      {/* Combined Household Portfolio Summary */}
      {showCombined && combinedPortfolio && combinedPortfolio.propertyCount > 0 && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <Home className="h-5 w-5 mr-2" />
              Combined Household Property Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Per-client breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientAProperties.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{clientAName} ({clientAPortfolio.propertyCount} properties)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Value:</span>
                        <span className="ml-1 font-semibold">${clientAPortfolio.totalValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Equity:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">${clientAPortfolio.totalEquity.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">${Math.round(clientAPortfolio.totalRent).toLocaleString()}/mo</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cash Flow:</span>
                        <span className={`ml-1 font-semibold ${clientAPortfolio.totalCashFlow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600'}`}>
                          ${Math.round(clientAPortfolio.totalCashFlow).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {clientBProperties.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{clientBName} ({clientBPortfolio.propertyCount} properties)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Value:</span>
                        <span className="ml-1 font-semibold">${clientBPortfolio.totalValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Equity:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">${clientBPortfolio.totalEquity.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">${Math.round(clientBPortfolio.totalRent).toLocaleString()}/mo</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cash Flow:</span>
                        <span className={`ml-1 font-semibold ${clientBPortfolio.totalCashFlow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600'}`}>
                          ${Math.round(clientBPortfolio.totalCashFlow).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined totals */}
              <div className="pt-3 border-t border-yellow-300 dark:border-yellow-700">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Properties</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{combinedPortfolio.propertyCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">${combinedPortfolio.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Equity</p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">${combinedPortfolio.totalEquity.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Rent</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">${Math.round(combinedPortfolio.totalRent).toLocaleString()}/mo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                    <p className={`text-lg font-bold ${combinedPortfolio.totalCashFlow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600'}`}>
                      ${Math.round(combinedPortfolio.totalCashFlow).toLocaleString()}/mo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Home className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold text-foreground">${portfolioTotals.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-muted-foreground">Total Equity</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">${portfolioTotals.totalEquity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-gray-500" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-muted-foreground">Monthly Rent</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">${Math.round(portfolioTotals.totalRent).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 text-gray-500" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-muted-foreground">Loan Payments</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">${Math.round(portfolioTotals.totalLoanPayments).toLocaleString()}/mo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                {portfolioTotals.totalCashFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                )}
                <div className="ml-3">
                  <p className="text-xs font-medium text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-lg font-bold ${portfolioTotals.totalCashFlow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>
                    ${Math.round(portfolioTotals.totalCashFlow).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">
            Property Portfolio ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="serviceability">
            Serviceability Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-6">
          {/* Add Property Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Investment Property</CardTitle>
              <CardDescription>
                Enter property details to analyze cash flow and returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...propertyForm}>
                <form onSubmit={propertyForm.handleSubmit(addProperty)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={propertyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Investment St, Sydney NSW" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="600000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="650000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="480000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              step="0.01"
                              placeholder="6.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="loanTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Term (years)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="weeklyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Rent</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="650"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={propertyForm.control}
                      name="annualExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Expenses</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="5000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Properties List */}
          <div className="space-y-4">
            {properties.map((property) => {
              const analysis = analyzeProperty(property);
              return (
                <Card key={property.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{property.address}</h3>
                        <p className="text-muted-foreground">Current Value: ${property.currentValue.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={analysis.isNegativelyGeared ? "destructive" : "secondary"}>
                          {analysis.isNegativelyGeared ? 'Negatively Geared' : 'Positively Geared'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Rent</p>
                        <p className="text-lg font-semibold text-emerald-500">${analysis.monthlyRent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loan Payment</p>
                        <p className="text-lg font-semibold text-destructive">${analysis.monthlyLoanPayment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Flow</p>
                        <p className={`text-lg font-semibold ${analysis.monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                          ${analysis.monthlyCashFlow.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rental Yield</p>
                        <p className="text-lg font-semibold text-primary">{analysis.rentalYield.toFixed(2)}%</p>
                      </div>
                    </div>

                    {analysis.isNegativelyGeared && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Tax Benefit:</strong> Estimated annual tax saving of ${analysis.taxBenefit.toLocaleString()} 
                          (Net monthly cash flow: ${analysis.netCashFlow.toLocaleString()})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {properties.length === 0 && (
              <Card>
                <CardContent className="text-center p-12">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No investment properties added yet. Add your first property above.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="serviceability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Serviceability Form */}
            <Card>
              <CardHeader>
                <CardTitle>Serviceability Calculator</CardTitle>
                <CardDescription>
                  Calculate your borrowing capacity for investment properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...serviceabilityForm}>
                  <form className="space-y-4">
                    <FormField
                      control={serviceabilityForm.control}
                      name="annualIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Income</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="100000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceabilityForm.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Expenses</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="4000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceabilityForm.control}
                      name="existingDebtPayments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Existing Monthly Debt Payments</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="2000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceabilityForm.control}
                      name="targetPropertyPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Property Price</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="600000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceabilityForm.control}
                      name="deposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Deposit</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="120000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={serviceabilityForm.control}
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interest Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                step="0.01"
                                placeholder="6.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceabilityForm.control}
                        name="loanTerm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Term (years)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={serviceabilityForm.control}
                      name="expectedRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Weekly Rent</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="650"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-4 border-t mt-4">
                      <h4 className="font-medium">Negative Gearing Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={serviceabilityForm.control}
                          name="annualPropertyExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Expenses</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="5000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={serviceabilityForm.control}
                          name="depreciationAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Depreciation</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="2000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={serviceabilityForm.control}
                          name="marginalTaxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marginal Tax Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="32.5"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="button"
                      onClick={runServiceabilityTest}
                      className="w-full"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Serviceability
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {serviceabilityResult && (
                <>
                  <Card className={serviceabilityResult.canAfford ? "border-emerald-500" : "border-destructive"}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {serviceabilityResult.canAfford ? (
                          <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                        )}
                        {serviceabilityResult.canAfford ? 'Property is Serviceable' : 'Serviceability Concern'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {serviceabilityResult.canAfford ? (
                        <p className="text-emerald-500">
                          Based on your income and expenses, you should be able to service this investment property loan.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-destructive">
                            This property may not be serviceable with your current financial position.
                          </p>
                          {serviceabilityResult.monthlyShortfall && (
                            <p className="text-destructive">
                              <strong>Monthly shortfall:</strong> ${serviceabilityResult.monthlyShortfall.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Serviceability Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Max Borrowing Capacity</p>
                          <p className="text-xl font-bold text-primary">
                            ${serviceabilityResult.maxBorrowingCapacity.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Service Capacity</p>
                          <p className="text-xl font-bold text-emerald-500">
                            ${serviceabilityResult.monthlyServiceCapacity.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Loan to Value Ratio</p>
                          <p className={`text-xl font-bold ${serviceabilityResult.loanToValueRatio > 80 ? 'text-destructive' : 'text-primary'}`}>
                            {serviceabilityResult.loanToValueRatio.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Debt to Income Ratio</p>
                          <p className="text-xl font-bold text-amber-500">
                            {serviceabilityResult.debtToIncomeRatio.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Negative Gearing Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {serviceabilityResult.isNegativelyGeared ? (
                          <TrendingDown className="h-5 w-5 mr-2 text-amber-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                        )}
                        {serviceabilityResult.isNegativelyGeared ? 'Negatively Geared Property' : 'Positively Geared Property'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {serviceabilityResult.isNegativelyGeared && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Annual Negative Gearing</p>
                              <p className="text-xl font-bold text-amber-500">
                                ${serviceabilityResult.negativeGearingAmount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Annual Tax Benefit</p>
                              <p className="text-xl font-bold text-emerald-500">
                                ${serviceabilityResult.annualTaxBenefit.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Monthly Tax Benefit</p>
                              <p className="text-xl font-bold text-emerald-500">
                                ${serviceabilityResult.monthlyTaxBenefit.toLocaleString()}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Net Monthly Payment (After Tax)</p>
                          <p className={`text-xl font-bold ${serviceabilityResult.netMonthlyPaymentAfterTax >= 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                            ${Math.abs(serviceabilityResult.netMonthlyPaymentAfterTax).toLocaleString()}
                            {serviceabilityResult.netMonthlyPaymentAfterTax < 0 ? ' (income)' : ' (cost)'}
                          </p>
                        </div>
                      </div>
                      
                      {serviceabilityResult.isNegativelyGeared && (
                        <div className="p-3 bg-muted rounded-lg mt-4">
                          <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> Negative gearing means property expenses exceed rental income. 
                            The tax benefit partially offsets this loss, reducing your effective out-of-pocket cost.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {!serviceabilityResult && (
                <Card>
                  <CardContent className="text-center p-12">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Enter your financial details and click "Calculate Serviceability" to see if you can afford this investment property.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
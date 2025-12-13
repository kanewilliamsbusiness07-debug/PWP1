/**
 * FinCalc Pro - Tax Optimization Page
 * 
 * Australian tax calculations with optimization strategies
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator, TrendingDown, DollarSign, FileText, Lightbulb, CircleAlert as AlertCircle, PieChart, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTaxForm } from '@/lib/hooks/use-tax-form';
import { useClientFinancials } from '@/lib/hooks/use-client-financials';
import { useFinancialStore } from '@/lib/store/store';
import { ClientSelector } from '@/components/client-selector';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const taxFormSchema = z.object({
  // Income
  annualIncome: z.number().min(0, { message: 'Annual income must be a positive number' }),
  employmentIncome: z.number().min(0), // Kept for backward compatibility
  investmentIncome: z.number().min(0),
  rentalIncome: z.number().min(0),
  otherIncome: z.number().min(0),
  frankedDividends: z.number().min(0, 'Dividends must be positive'),
  capitalGains: z.number().min(0, 'Capital gains must be positive'),

  // Deductions
  workRelatedExpenses: z.number().min(0),
  vehicleExpenses: z.number().min(0),
  uniformsAndLaundry: z.number().min(0),
  homeOfficeExpenses: z.number().min(0),
  selfEducationExpenses: z.number().min(0),
  investmentExpenses: z.number().min(0),
  charityDonations: z.number().min(0),
  accountingFees: z.number().min(0),
  otherDeductions: z.number().min(0),
  rentalExpenses: z.number().min(0, 'Rental expenses must be positive'),

  // Super & Tax Offsets
  superContributions: z.number().min(0),
  healthInsurance: z.boolean().optional(),
  hecs: z.boolean().optional(),
  helpDebt: z.number().min(0).optional(),
  hecsBalance: z.number().min(0, 'HECS balance must be positive'),
  privateHealthInsurance: z.boolean().default(false)
});

type TaxFormData = z.infer<typeof taxFormSchema>;

interface ChartDataItem {
  category: string;
  saving: number;
}

interface TaxCalculationResult {
  annualIncome: number; // Canonical field name (was grossIncome)
  taxableIncome: number;
  incomeTax: number;
  medicareLevy: number;
  hecsRepayment: number;
  totalTax: number;
  afterTaxIncome: number;
  marginalTaxRate: number;
  averageTaxRate: number;
  frankedCredits: number;
  totalDeductions: number;
}

interface OptimizationStrategy {
  strategy: string;
  description: string;
  potentialSaving: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Deductions' | 'Super' | 'Investments' | 'Timing' | 'Other';
}

export default function TaxOptimizationPage() {
  const [currentTax, setCurrentTax] = useState<TaxCalculationResult | null>(null);
  const [optimizedTax, setOptimizedTax] = useState<TaxCalculationResult | null>(null);
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [viewMode, setViewMode] = useState<'A' | 'B' | 'combined'>('A');
  const [combinedCurrentTax, setCombinedCurrentTax] = useState<TaxCalculationResult | null>(null);
  const [combinedOptimizedTax, setCombinedOptimizedTax] = useState<TaxCalculationResult | null>(null);
  const [combinedStrategies, setCombinedStrategies] = useState<OptimizationStrategy[]>([]);
  const { toast } = useToast();
  const financialStore = useFinancialStore();
  const setClientData = useFinancialStore((state) => state.setClientData);
  const setActiveClient = useFinancialStore((state) => state.setActiveClient);
  const clientFinancials = useClientFinancials();
  
  // Subscribe to specific store values to ensure re-renders
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const employmentIncome = useFinancialStore((state) => state.employmentIncome);
  const investmentIncome = useFinancialStore((state) => state.investmentIncome);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  const otherIncome = useFinancialStore((state) => state.otherIncome);
  const workRelatedExpenses = useFinancialStore((state) => state.workRelatedExpenses);
  const investmentExpenses = useFinancialStore((state) => state.investmentExpenses);
  const rentalExpenses = useFinancialStore((state) => state.rentalExpenses);
  const frankedDividends = useFinancialStore((state) => state.frankedDividends);
  const capitalGains = useFinancialStore((state) => state.capitalGains);
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  
  // For combined results display
  const hasClientA = clientA && (clientA.firstName || clientA.grossSalary || clientA.annualIncome);
  const hasClientB = clientB && (clientB.firstName || clientB.grossSalary || clientB.annualIncome);
  const showCombined = hasClientA && hasClientB;
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';
  
  // Get tax results from both clients 
  const clientATaxResults = clientA?.taxResults;
  const clientBTaxResults = clientB?.taxResults;
  
  // Calculate combined tax results
  const combinedTaxResults = (showCombined && clientATaxResults && clientBTaxResults) ? {
    annualIncome: (clientATaxResults.annualIncome || 0) + (clientBTaxResults.annualIncome || 0),
    totalTax: (clientATaxResults.totalTax || 0) + (clientBTaxResults.totalTax || 0),
    afterTaxIncome: (clientATaxResults.afterTaxIncome || 0) + (clientBTaxResults.afterTaxIncome || 0),
    totalDeductions: (clientATaxResults.totalDeductions || 0) + (clientBTaxResults.totalDeductions || 0),
    optimizedTotalTax: ((clientA?.optimizedTaxResults?.totalTax || clientATaxResults.totalTax || 0) + 
                        (clientB?.optimizedTaxResults?.totalTax || clientBTaxResults.totalTax || 0)),
    potentialSavings: 0 // Will be calculated below
  } : null;
  
  if (combinedTaxResults) {
    combinedTaxResults.potentialSavings = combinedTaxResults.totalTax - combinedTaxResults.optimizedTotalTax;
  }

  // Set viewMode to combined when both clients exist
  useEffect(() => {
    if (showCombined && viewMode !== 'combined') {
      setViewMode('combined');
    }
  }, [showCombined, viewMode]);
  
  const taxForm = useForm<TaxFormData>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      annualIncome: grossIncome || 0,
      employmentIncome: employmentIncome || 0,
      investmentIncome: investmentIncome || 0,
      rentalIncome: rentalIncome || 0,
      otherIncome: otherIncome || 0,
      frankedDividends: 0,
      capitalGains: 0,
      workRelatedExpenses: workRelatedExpenses || 0,
      vehicleExpenses: 0,
      uniformsAndLaundry: 0,
      homeOfficeExpenses: 0,
      selfEducationExpenses: 0,
      investmentExpenses: investmentExpenses || 0,
      charityDonations: 0,
      accountingFees: 0,
      otherDeductions: 0,
      rentalExpenses: rentalExpenses || 0,
      superContributions: 0,
      healthInsurance: false,
      hecs: false,
      helpDebt: 0,
      hecsBalance: 0,
      privateHealthInsurance: false
    }
  });

  // Subscribe to store updates in real-time
  React.useEffect(() => {
    const clientData = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;
    const currentValues = taxForm.getValues();
    
    // Only update if values differ to avoid disrupting user input
    const updates: Partial<TaxFormData> = {};
    
    if (currentValues.annualIncome !== grossIncome) {
      updates.annualIncome = grossIncome;
    }
    if (currentValues.employmentIncome !== employmentIncome) {
      updates.employmentIncome = employmentIncome;
    }
    if (currentValues.investmentIncome !== investmentIncome) {
      updates.investmentIncome = investmentIncome;
    }
    if (currentValues.rentalIncome !== rentalIncome) {
      updates.rentalIncome = rentalIncome;
    }
    if (currentValues.otherIncome !== (otherIncome || 0)) {
      updates.otherIncome = otherIncome || 0;
    }
    if (currentValues.workRelatedExpenses !== workRelatedExpenses) {
      updates.workRelatedExpenses = workRelatedExpenses;
    }
    if (currentValues.investmentExpenses !== investmentExpenses) {
      updates.investmentExpenses = investmentExpenses;
    }
    if (currentValues.rentalExpenses !== rentalExpenses) {
      updates.rentalExpenses = rentalExpenses;
    }
    if (Math.abs((currentValues.frankedDividends || 0) - (frankedDividends || 0)) > 0.01) {
      updates.frankedDividends = frankedDividends || 0;
    }
    if (Math.abs((currentValues.capitalGains || 0) - (capitalGains || 0)) > 0.01) {
      updates.capitalGains = capitalGains || 0;
    }
    
    if (clientData) {
      if (currentValues.vehicleExpenses !== (clientData.vehicleExpenses || 0)) {
        updates.vehicleExpenses = clientData.vehicleExpenses || 0;
      }
      if (currentValues.uniformsAndLaundry !== (clientData.uniformsAndLaundry || 0)) {
        updates.uniformsAndLaundry = clientData.uniformsAndLaundry || 0;
      }
      if (currentValues.homeOfficeExpenses !== (clientData.homeOfficeExpenses || 0)) {
        updates.homeOfficeExpenses = clientData.homeOfficeExpenses || 0;
      }
      if (currentValues.selfEducationExpenses !== (clientData.selfEducationExpenses || 0)) {
        updates.selfEducationExpenses = clientData.selfEducationExpenses || 0;
      }
      if (currentValues.charityDonations !== (clientData.charityDonations || 0)) {
        updates.charityDonations = clientData.charityDonations || 0;
      }
      if (currentValues.accountingFees !== (clientData.accountingFees || 0)) {
        updates.accountingFees = clientData.accountingFees || 0;
      }
      if (currentValues.superContributions !== (clientData.superContributions || 0)) {
        updates.superContributions = clientData.superContributions || 0;
      }
      if (currentValues.helpDebt !== (clientData.helpDebt || 0)) {
        updates.helpDebt = clientData.helpDebt || 0;
      }
      if (currentValues.hecsBalance !== (clientData.hecsBalance || 0)) {
        updates.hecsBalance = clientData.hecsBalance || 0;
      }
      if (currentValues.healthInsurance !== (clientData.healthInsurance || false)) {
        updates.healthInsurance = clientData.healthInsurance || false;
      }
      if (currentValues.hecs !== (clientData.hecs || false)) {
        updates.hecs = clientData.hecs || false;
      }
      if (currentValues.privateHealthInsurance !== (clientData.privateHealthInsurance || false)) {
        updates.privateHealthInsurance = clientData.privateHealthInsurance || false;
      }
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      Object.entries(updates).forEach(([key, value]) => {
        taxForm.setValue(key as keyof TaxFormData, value, { shouldDirty: false });
      });
    }
  }, [
    grossIncome,
    employmentIncome,
    investmentIncome,
    rentalIncome,
    otherIncome,
    workRelatedExpenses,
    investmentExpenses,
    rentalExpenses,
    frankedDividends,
    capitalGains,
    activeClient,
    clientA,
    clientB,
    taxForm
  ]);

  // Australian tax brackets 2024-25 (corrected)
  const taxBrackets = [
    { min: 0, max: 18200, rate: 0, baseAmount: 0 },
    { min: 18201, max: 45000, rate: 0.19, baseAmount: 0 },
    { min: 45001, max: 120000, rate: 0.325, baseAmount: 5092 },
    { min: 120001, max: 180000, rate: 0.37, baseAmount: 29467 },
    { min: 180001, max: Infinity, rate: 0.45, baseAmount: 51667 }
  ];
  
  // Medicare Levy thresholds 2024-25
  const MEDICARE_LEVY_RATE = 0.02; // 2%
  const MEDICARE_LEVY_THRESHOLD_SINGLE = 24276;
  const MEDICARE_LEVY_THRESHOLD_FAMILY = 40939;
  const MEDICARE_LEVY_SURCHARGE_THRESHOLD = 90000; // Single
  const MEDICARE_LEVY_SURCHARGE_RATE = 0.01; // 1% to 1.5% depending on income

  const hecsThresholds = [
    { min: 51550, max: 59518, rate: 0.01 },
    { min: 59519, max: 65000, rate: 0.02 },
    { min: 65001, max: 71999, rate: 0.025 },
    { min: 72000, max: 79999, rate: 0.03 },
    { min: 80000, max: 89999, rate: 0.035 },
    { min: 90000, max: 100000, rate: 0.04 },
    { min: 100001, max: 109999, rate: 0.045 },
    { min: 110000, max: 124999, rate: 0.05 },
    { min: 125000, max: 139999, rate: 0.055 },
    { min: 140000, max: Infinity, rate: 0.10 }
  ];

  // Watch form values and sync to client data for cross-page synchronization
  const watchedTaxData = taxForm.watch();
  
  useEffect(() => {
    if (!activeClient) return;
    
    const syncTimeoutId = setTimeout(() => {
      // Only sync if we have valid data
      if (watchedTaxData.annualIncome > 0) {
        setClientData(activeClient, {
          annualIncome: watchedTaxData.annualIncome,
          grossSalary: watchedTaxData.annualIncome,
          employmentIncome: watchedTaxData.employmentIncome,
          investmentIncome: watchedTaxData.investmentIncome,
          rentalIncome: watchedTaxData.rentalIncome,
          otherIncome: watchedTaxData.otherIncome,
          frankedDividends: watchedTaxData.frankedDividends,
          capitalGains: watchedTaxData.capitalGains,
          workRelatedExpenses: watchedTaxData.workRelatedExpenses,
          vehicleExpenses: watchedTaxData.vehicleExpenses,
          uniformsAndLaundry: watchedTaxData.uniformsAndLaundry,
          homeOfficeExpenses: watchedTaxData.homeOfficeExpenses,
          selfEducationExpenses: watchedTaxData.selfEducationExpenses,
          investmentExpenses: watchedTaxData.investmentExpenses,
          charityDonations: watchedTaxData.charityDonations,
          accountingFees: watchedTaxData.accountingFees,
          rentalExpenses: watchedTaxData.rentalExpenses,
          superContributions: watchedTaxData.superContributions,
          healthInsurance: watchedTaxData.healthInsurance,
          hecs: watchedTaxData.hecs,
          helpDebt: watchedTaxData.helpDebt,
          hecsBalance: watchedTaxData.hecsBalance,
          privateHealthInsurance: watchedTaxData.privateHealthInsurance,
        });
      }
    }, 500); // Debounce to prevent excessive updates
    
    return () => clearTimeout(syncTimeoutId);
  }, [
    activeClient,
    setClientData,
    watchedTaxData.annualIncome,
    watchedTaxData.employmentIncome,
    watchedTaxData.investmentIncome,
    watchedTaxData.rentalIncome,
    watchedTaxData.otherIncome,
    watchedTaxData.frankedDividends,
    watchedTaxData.capitalGains,
    watchedTaxData.workRelatedExpenses,
    watchedTaxData.vehicleExpenses,
    watchedTaxData.uniformsAndLaundry,
    watchedTaxData.homeOfficeExpenses,
    watchedTaxData.selfEducationExpenses,
    watchedTaxData.investmentExpenses,
    watchedTaxData.charityDonations,
    watchedTaxData.accountingFees,
    watchedTaxData.rentalExpenses,
    watchedTaxData.superContributions,
    watchedTaxData.healthInsurance,
    watchedTaxData.hecs,
    watchedTaxData.helpDebt,
    watchedTaxData.hecsBalance,
    watchedTaxData.privateHealthInsurance,
  ]);

  const calculateIncomeTax = (taxableIncome: number): number => {
    if (taxableIncome <= 0) return 0;
    
    // Find the correct bracket
    for (let i = taxBrackets.length - 1; i >= 0; i--) {
      const bracket = taxBrackets[i];
      if (taxableIncome >= bracket.min) {
        const taxableInBracket = taxableIncome - bracket.min;
        return bracket.baseAmount + (taxableInBracket * bracket.rate);
      }
    }
    return 0;
  };

  const calculateMedicareLevy = (taxableIncome: number, hasPrivateHealth: boolean): number => {
    // Medicare Levy: 2% of taxable income above threshold
    if (taxableIncome <= MEDICARE_LEVY_THRESHOLD_SINGLE) return 0;
    
    // Calculate Medicare Levy (2%)
    let medicareLevy = taxableIncome * MEDICARE_LEVY_RATE;
    
    // Medicare Levy Surcharge: Additional 1-1.5% if no private health insurance and income > threshold
    if (!hasPrivateHealth && taxableIncome > MEDICARE_LEVY_SURCHARGE_THRESHOLD) {
      let surchargeRate = 0.01; // 1% for $90,001 - $105,000
      if (taxableIncome > 105000 && taxableIncome <= 140000) {
        surchargeRate = 0.0125; // 1.25% for $105,001 - $140,000
      } else if (taxableIncome > 140000) {
        surchargeRate = 0.015; // 1.5% for $140,001+
      }
      medicareLevy += taxableIncome * surchargeRate;
    }
    
    return medicareLevy;
  };

  const calculateHecsRepayment = (grossIncome: number, hecsBalance: number): number => {
    if (hecsBalance <= 0 || grossIncome < 51550) return 0;
    
    // Find the correct threshold
    for (let i = hecsThresholds.length - 1; i >= 0; i--) {
      const threshold = hecsThresholds[i];
      if (grossIncome >= threshold.min) {
        const repayment = grossIncome * threshold.rate;
        return Math.min(repayment, hecsBalance);
      }
    }
    return 0;
  };

  const calculateMarginalTaxRate = (taxableIncome: number, hasPrivateHealth: boolean = false): number => {
    // Find the correct bracket
    for (let i = taxBrackets.length - 1; i >= 0; i--) {
      const bracket = taxBrackets[i];
      if (taxableIncome >= bracket.min) {
        let marginalRate = bracket.rate;
        // Add Medicare Levy (2%)
        if (taxableIncome > MEDICARE_LEVY_THRESHOLD_SINGLE) {
          marginalRate += MEDICARE_LEVY_RATE;
        }
        // Add Medicare Levy Surcharge if applicable
        if (!hasPrivateHealth && taxableIncome > MEDICARE_LEVY_SURCHARGE_THRESHOLD) {
          if (taxableIncome > 140000) {
            marginalRate += 0.015; // 1.5%
          } else if (taxableIncome > 105000) {
            marginalRate += 0.0125; // 1.25%
          } else {
            marginalRate += 0.01; // 1%
          }
        }
        return marginalRate * 100;
      }
    }
    return 0;
  };

  const calculateTax = (data: TaxFormData): TaxCalculationResult => {
    // Calculate total deductions
    const totalDeductions = data.workRelatedExpenses + 
                           data.vehicleExpenses +
                           data.uniformsAndLaundry +
                           data.homeOfficeExpenses +
                           data.selfEducationExpenses +
                           data.investmentExpenses +
                           data.charityDonations +
                           data.accountingFees +
                           data.otherDeductions;
    
    // Negative gearing: rental expenses can offset rental income
    const negativeGearing = Math.max(0, data.rentalExpenses - data.rentalIncome);
    
    // Franking credits: 30% of franked dividends (company tax rate)
    const frankedCredits = data.frankedDividends * 0.3;
    
    // Use annualIncome (canonical) or fall back to grossIncome for backward compatibility
    const income = data.annualIncome ?? (data as any).grossIncome ?? 0;
    
    // Calculate total assessable income
    // Note: Franked dividends are included in assessable income, but franking credits reduce tax
    // Capital gains: only 50% is assessable if held > 12 months (CGT discount)
    const assessableCapitalGains = data.capitalGains * 0.5; // Assuming 50% CGT discount
    
    // Calculate taxable income
    let taxableIncome = income + 
                       data.investmentIncome +
                       data.rentalIncome +
                       data.frankedDividends + 
                       assessableCapitalGains + 
                       data.otherIncome -
                       totalDeductions - 
                       negativeGearing;
    taxableIncome = Math.max(0, taxableIncome);
    
    // Calculate income tax (franking credits reduce tax payable)
    const incomeTaxBeforeCredits = calculateIncomeTax(taxableIncome);
    const incomeTax = Math.max(0, incomeTaxBeforeCredits - frankedCredits);
    
    // Medicare Levy and Surcharge
    const medicareLevy = calculateMedicareLevy(taxableIncome, data.privateHealthInsurance || false);
    
    // HECS/HELP repayment (based on gross income, not taxable income)
    const hecsRepayment = calculateHecsRepayment(income, data.hecsBalance || 0);
    
    // Total tax
    const totalTax = incomeTax + medicareLevy + hecsRepayment;
    const afterTaxIncome = income + data.investmentIncome + data.rentalIncome + data.otherIncome - totalTax;
    const marginalTaxRate = calculateMarginalTaxRate(taxableIncome, data.privateHealthInsurance || false);
    const averageTaxRate = income > 0 ? (totalTax / income) * 100 : 0;
    
    return {
      annualIncome: income,
      taxableIncome,
      incomeTax,
      medicareLevy,
      hecsRepayment,
      totalTax,
      afterTaxIncome,
      marginalTaxRate,
      averageTaxRate,
      frankedCredits,
      totalDeductions: totalDeductions + negativeGearing
    };
  };

  const generateOptimizationStrategies = (data: TaxFormData, currentResult: TaxCalculationResult): OptimizationStrategy[] => {
    const strategies: OptimizationStrategy[] = [];
    
    // Charitable donations optimization
    if (data.charityDonations < 2000) {
      const suggestedDonation = 2000 - data.charityDonations;
      const taxSaving = suggestedDonation * (currentResult.marginalTaxRate / 100);
      strategies.push({
        strategy: 'Charitable Donations',
        description: `Increase charitable donations by $${suggestedDonation.toLocaleString()} to maximize tax deductions. This is fully tax deductible at your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
        potentialSaving: taxSaving,
        difficulty: 'Easy',
        category: 'Deductions'
      });
    }
    
    // Pre-tax super contributions
    const maxConcessionalCap = 27500;
    const currentSuperContributions = data.superContributions || 0;
    const income = data.annualIncome ?? (data as any).grossIncome ?? 0;
    if (currentSuperContributions < maxConcessionalCap && income > 50000) {
      const potentialContribution = Math.min(
        maxConcessionalCap - currentSuperContributions,
        income * 0.15
      );
      const taxSaving = potentialContribution * ((currentResult.marginalTaxRate - 15) / 100);
      strategies.push({
        strategy: 'Superannuation Contribution',
        description: `Make additional pre-tax super contributions of $${potentialContribution.toLocaleString()} to save on tax. This will be taxed at 15% instead of your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
        potentialSaving: taxSaving,
        difficulty: 'Medium',
        category: 'Super'
      });
    }
    
    // Negative gearing optimization for existing rental properties
    const currentRentalIncome = data.rentalIncome || 0;
    const currentRentalExpenses = data.rentalExpenses || 0;
    const currentNegativeGearing = Math.max(0, currentRentalExpenses - currentRentalIncome);
    
    if (currentNegativeGearing > 0) {
      const taxSaving = currentNegativeGearing * (currentResult.marginalTaxRate / 100);
      strategies.push({
        strategy: 'Rental Property Tax Optimization',
        description: `Your rental property is currently negatively geared with a loss of $${currentNegativeGearing.toLocaleString()}. This reduces your taxable income through negative gearing, resulting in tax savings at your marginal rate of ${currentResult.marginalTaxRate.toFixed(1)}%.`,
        potentialSaving: taxSaving,
        difficulty: 'Medium',
        category: 'Investments'
      });
    }
    
    // Potential property investment opportunity
    if (currentRentalIncome === 0 && income > 80000) {
      const propertyValue = 750000; // Example property value
      const rentalYield = 0.04; // 4% rental yield
      const interestRate = 0.065; // 6.5% interest rate
      const potentialRent = propertyValue * rentalYield;
      const interestCost = propertyValue * 0.8 * interestRate; // Assuming 20% deposit
      const propertyExpenses = propertyValue * 0.02; // Estimated other expenses
      const potentialNegativeGearing = Math.max(0, interestCost + propertyExpenses - potentialRent);
      const taxSaving = potentialNegativeGearing * (currentResult.marginalTaxRate / 100);
      
      strategies.push({
        strategy: 'New Property Investment',
        description: `Consider an investment property worth $${propertyValue.toLocaleString()}. With rental income of $${potentialRent.toLocaleString()}/year and deductible expenses of $${(interestCost + propertyExpenses).toLocaleString()}/year, you could reduce your taxable income through negative gearing.`,
        potentialSaving: taxSaving,
        difficulty: 'Hard',
        category: 'Investments'
      });
    }
    
    // Private health insurance
    if (!data.healthInsurance && income > 90000) {
      const mlsSaving = Math.min(income * 0.015, 1500); // Medicare Levy Surcharge saving
      const insuranceCost = 2000; // Example annual premium
      const rebate = insuranceCost * 0.25; // Assuming 25% rebate tier
      const netCost = insuranceCost - rebate - mlsSaving;
      
      strategies.push({
        strategy: 'Private Health Insurance',
        description: `Take out private health insurance to avoid the Medicare Levy Surcharge of $${mlsSaving.toLocaleString()}. With a typical premium of $${insuranceCost.toLocaleString()} and rebate of $${rebate.toLocaleString()}, your net cost after tax savings would be $${netCost.toLocaleString()}.`,
        potentialSaving: mlsSaving,
        difficulty: 'Easy',
        category: 'Deductions'
      });
    }
    
    // Work-related deductions
    const potentialDeductions = Math.max(0, 3000 - data.workRelatedExpenses);
    if (potentialDeductions > 0) {
      strategies.push({
        strategy: 'Work-Related Expenses',
        description: `Claim additional work-related expenses of $${potentialDeductions.toLocaleString()} including home office, professional development, and tools. This could save you ${currentResult.marginalTaxRate.toFixed(1)}% in tax on these expenses.`,
        potentialSaving: potentialDeductions * (currentResult.marginalTaxRate / 100),
        difficulty: 'Easy',
        category: 'Deductions'
      });
    }
    
    // Capital gains timing
    if (data.capitalGains > 0) {
      strategies.push({
        strategy: 'Capital Gains Tax Planning',
        description: 'Time asset sales to minimize tax impact and utilize CGT discount',
        potentialSaving: data.capitalGains * 0.25 * (currentResult.marginalTaxRate / 100),
        difficulty: 'Medium',
        category: 'Timing'
      });
    }
    
    return strategies.sort((a, b) => b.potentialSaving - a.potentialSaving);
  };

  const aggregateSavingsByCategory = (strategies: OptimizationStrategy[]) => {
    const categoryTotals = strategies.reduce((acc, strategy) => {
      acc[strategy.category] = (acc[strategy.category] || 0) + strategy.potentialSaving;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      saving: total
    })).sort((a, b) => b.saving - a.saving);
  };

  const calculateOptimizations = (inputData?: TaxFormData, client?: 'A' | 'B') => {
    const data = inputData || taxForm.getValues();
    const targetClient = client || activeClient;
    
    if (!inputData) setIsCalculating(true);
    
    setTimeout(() => {
      // Calculate current scenario
      const current = calculateTax(data);
      if (!inputData) setCurrentTax(current);
      
      // Generate optimization strategies
      const optimizationStrategies = generateOptimizationStrategies(data, current);
      if (!inputData) setStrategies(optimizationStrategies);

      // Calculate total savings from strategies
      const totalStrategySavings = optimizationStrategies.reduce((sum, strategy) => sum + strategy.potentialSaving, 0);

      // Create optimized scenario based on total savings
      const optimized = {
        ...current,
        afterTaxIncome: current.afterTaxIncome + totalStrategySavings,
        totalTax: current.totalTax - totalStrategySavings
      };
      
      if (!inputData) {
        setOptimizedTax(optimized);
        setIsCalculating(false);
      }
      
      // Store tax optimization results in client data for Summary page to use
      const clientSlot = targetClient || 'A';
      const activeClientData = clientSlot === 'A' ? clientA : clientB;
      if (activeClientData) {
        setClientData(clientSlot, {
          taxResults: {
            annualIncome: current.annualIncome,
            totalTax: current.totalTax,
            afterTaxIncome: current.afterTaxIncome,
            totalDeductions: current.totalDeductions,
            taxableIncome: current.taxableIncome,
            marginalTaxRate: current.marginalTaxRate,
            averageTaxRate: current.averageTaxRate,
          },
          optimizedTaxResults: {
            totalTax: optimized.totalTax,
            afterTaxIncome: optimized.afterTaxIncome,
          },
          taxOptimizationResults: {
            currentTax: current.totalTax,
            optimizedTax: optimized.totalTax,
            taxSavings: totalStrategySavings,
            annualIncome: current.annualIncome,
            taxableIncome: current.taxableIncome,
            totalDeductions: current.totalDeductions,
            marginalTaxRate: current.marginalTaxRate,
            averageTaxRate: current.averageTaxRate,
            calculatedAt: new Date().toISOString(),
          }
        });
      }
      
      if (!inputData) {
        toast({
          title: 'Tax calculation complete',
          description: `Potential savings identified: $${totalStrategySavings.toLocaleString()}`
        });
      }
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-secondary text-secondary-foreground';
      case 'Medium': return 'bg-secondary text-secondary-foreground';
      case 'Hard': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Deductions': return 'bg-secondary text-secondary-foreground';
      case 'Investments': return 'bg-secondary text-secondary-foreground';
      case 'Super': return 'bg-secondary text-secondary-foreground';
      case 'Timing': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // Watch form values for auto-calculation
  const watchedAnnualIncome = taxForm.watch('annualIncome');
  const watchedEmploymentIncome = taxForm.watch('employmentIncome');
  const watchedInvestmentIncome = taxForm.watch('investmentIncome');
  const watchedRentalIncome = taxForm.watch('rentalIncome');
  const watchedOtherIncome = taxForm.watch('otherIncome');
  const watchedFrankedDividends = taxForm.watch('frankedDividends');
  const watchedCapitalGains = taxForm.watch('capitalGains');
  const watchedWorkRelatedExpenses = taxForm.watch('workRelatedExpenses');
  const watchedVehicleExpenses = taxForm.watch('vehicleExpenses');
  const watchedUniformsAndLaundry = taxForm.watch('uniformsAndLaundry');
  const watchedHomeOfficeExpenses = taxForm.watch('homeOfficeExpenses');
  const watchedSelfEducationExpenses = taxForm.watch('selfEducationExpenses');
  const watchedInvestmentExpenses = taxForm.watch('investmentExpenses');
  const watchedCharityDonations = taxForm.watch('charityDonations');
  const watchedAccountingFees = taxForm.watch('accountingFees');
  const watchedOtherDeductions = taxForm.watch('otherDeductions');
  const watchedRentalExpenses = taxForm.watch('rentalExpenses');
  const watchedSuperContributions = taxForm.watch('superContributions');
  const watchedHealthInsurance = taxForm.watch('healthInsurance');
  const watchedHecs = taxForm.watch('hecs');
  const watchedHelpDebt = taxForm.watch('helpDebt');
  const watchedHecsBalance = taxForm.watch('hecsBalance');
  const watchedPrivateHealthInsurance = taxForm.watch('privateHealthInsurance');

  // Auto-calculate tax optimization when form data changes
  useEffect(() => {
    const data = taxForm.getValues();
    if (data.annualIncome >= 0) {
      calculateOptimizations();
      
      // Also calculate for the other client if both exist
      if (showCombined) {
        if (activeClient === 'A' && clientB) {
          const bData: TaxFormData = {
            annualIncome: clientB.annualIncome ?? clientB.grossSalary ?? 0,
            employmentIncome: clientB.employmentIncome ?? 0,
            investmentIncome: clientB.investmentIncome ?? 0,
            rentalIncome: clientB.rentalIncome ?? 0,
            otherIncome: clientB.otherIncome ?? 0,
            frankedDividends: clientB.frankedDividends ?? 0,
            capitalGains: clientB.capitalGains ?? 0,
            workRelatedExpenses: clientB.workRelatedExpenses ?? 0,
            vehicleExpenses: clientB.vehicleExpenses ?? 0,
            uniformsAndLaundry: clientB.uniformsAndLaundry ?? 0,
            homeOfficeExpenses: clientB.homeOfficeExpenses ?? 0,
            selfEducationExpenses: clientB.selfEducationExpenses ?? 0,
            investmentExpenses: clientB.investmentExpenses ?? 0,
            charityDonations: clientB.charityDonations ?? 0,
            accountingFees: clientB.accountingFees ?? 0,
            otherDeductions: 0,
            rentalExpenses: clientB.rentalExpenses ?? 0,
            superContributions: clientB.superContributions ?? 0,
            healthInsurance: clientB.healthInsurance ?? false,
            hecs: clientB.hecs ?? false,
            helpDebt: clientB.helpDebt ?? 0,
            hecsBalance: clientB.hecsBalance ?? 0,
            privateHealthInsurance: clientB.privateHealthInsurance ?? false
          };
          calculateOptimizations(bData, 'B');
        } else if (activeClient === 'B' && clientA) {
          const aData: TaxFormData = {
            annualIncome: clientA.annualIncome ?? clientA.grossSalary ?? 0,
            employmentIncome: clientA.employmentIncome ?? 0,
            investmentIncome: clientA.investmentIncome ?? 0,
            rentalIncome: clientA.rentalIncome ?? 0,
            otherIncome: clientA.otherIncome ?? 0,
            frankedDividends: clientA.frankedDividends ?? 0,
            capitalGains: clientA.capitalGains ?? 0,
            workRelatedExpenses: clientA.workRelatedExpenses ?? 0,
            vehicleExpenses: clientA.vehicleExpenses ?? 0,
            uniformsAndLaundry: clientA.uniformsAndLaundry ?? 0,
            homeOfficeExpenses: clientA.homeOfficeExpenses ?? 0,
            selfEducationExpenses: clientA.selfEducationExpenses ?? 0,
            investmentExpenses: clientA.investmentExpenses ?? 0,
            charityDonations: clientA.charityDonations ?? 0,
            accountingFees: clientA.accountingFees ?? 0,
            otherDeductions: 0,
            rentalExpenses: clientA.rentalExpenses ?? 0,
            superContributions: clientA.superContributions ?? 0,
            healthInsurance: clientA.healthInsurance ?? false,
            hecs: clientA.hecs ?? false,
            helpDebt: clientA.helpDebt ?? 0,
            hecsBalance: clientA.hecsBalance ?? 0,
            privateHealthInsurance: clientA.privateHealthInsurance ?? false
          };
          calculateOptimizations(aData, 'A');
        }
      }
      
      // Calculate combined results if both clients have data
      if (showCombined && clientATaxResults && clientBTaxResults) {
        // Combined current tax
        const combinedCurrent = {
          annualIncome: (clientATaxResults.annualIncome || 0) + (clientBTaxResults.annualIncome || 0),
          totalTax: (clientATaxResults.totalTax || 0) + (clientBTaxResults.totalTax || 0),
          afterTaxIncome: (clientATaxResults.afterTaxIncome || 0) + (clientBTaxResults.afterTaxIncome || 0),
          totalDeductions: (clientATaxResults.totalDeductions || 0) + (clientBTaxResults.totalDeductions || 0),
          taxableIncome: (clientATaxResults.taxableIncome || 0) + (clientBTaxResults.taxableIncome || 0),
          marginalTaxRate: Math.max(clientATaxResults.marginalTaxRate || 0, clientBTaxResults.marginalTaxRate || 0), // Use higher marginal rate
          averageTaxRate: (((clientATaxResults.totalTax || 0) + (clientBTaxResults.totalTax || 0)) / 
                          ((clientATaxResults.annualIncome || 0) + (clientBTaxResults.annualIncome || 0))) * 100,
          // Add required fields with combined values
          incomeTax: (clientATaxResults.totalTax || 0) + (clientBTaxResults.totalTax || 0),
          medicareLevy: 0, // Simplified - would need proper calculation
          hecsRepayment: 0, // Simplified - would need proper calculation  
          frankedCredits: 0 // Simplified - would need proper calculation
        };
        setCombinedCurrentTax(combinedCurrent);
        
        // Combined optimized tax (using stored optimized results)
        const clientAOptimized = clientA?.optimizedTaxResults;
        const clientBOptimized = clientB?.optimizedTaxResults;
        if (clientAOptimized && clientBOptimized) {
          const combinedOptimized = {
            ...combinedCurrent,
            totalTax: (clientAOptimized.totalTax || clientATaxResults.totalTax || 0) + 
                     (clientBOptimized.totalTax || clientBTaxResults.totalTax || 0),
            afterTaxIncome: (clientAOptimized.afterTaxIncome || clientATaxResults.afterTaxIncome || 0) + 
                           (clientBOptimized.afterTaxIncome || clientBTaxResults.afterTaxIncome || 0)
          };
          setCombinedOptimizedTax(combinedOptimized);
          
          // Note: Combined strategies are not calculated separately - using individual strategies
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedAnnualIncome,
    watchedEmploymentIncome,
    watchedInvestmentIncome,
    watchedRentalIncome,
    watchedOtherIncome,
    watchedFrankedDividends,
    watchedCapitalGains,
    watchedWorkRelatedExpenses,
    watchedVehicleExpenses,
    watchedUniformsAndLaundry,
    watchedHomeOfficeExpenses,
    watchedSelfEducationExpenses,
    watchedInvestmentExpenses,
    watchedCharityDonations,
    watchedAccountingFees,
    watchedOtherDeductions,
    watchedRentalExpenses,
    watchedSuperContributions,
    watchedHealthInsurance,
    watchedHecs,
    watchedHelpDebt,
    watchedHecsBalance,
    watchedPrivateHealthInsurance
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tax Optimization</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Analyze tax implications and optimize your strategy</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Client Selector */}
          {showCombined && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View:</span>
              <Select
                value={viewMode}
                onValueChange={(value: 'A' | 'B' | 'combined') => {
                  setViewMode(value);
                  if (value !== 'combined') {
                    setActiveClient(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">{clientAName}</SelectItem>
                  <SelectItem value="B">{clientBName}</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button 
            onClick={taxForm.handleSubmit((data) => calculateOptimizations(data))}
            disabled={isCalculating}
            className="bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Calculate & Optimize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Input Form */}
        <div className="lg:col-span-2">
                    <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Tax Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your income and tax details for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...taxForm}>
                <form onSubmit={taxForm.handleSubmit((data) => calculateOptimizations(data))} className="space-y-6">
                  <Tabs defaultValue="income" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="income" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                        Income
                      </TabsTrigger>
                      <TabsTrigger value="deductions" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                        Deductions
                      </TabsTrigger>
                      <TabsTrigger value="other" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                        Other
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="income" className="space-y-4">
                      <FormField
                        control={taxForm.control}
                        name="annualIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Income</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="100000"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const numVal = val === "" ? 0 : parseFloat(val);
                                  field.onChange(numVal);
                                  financialStore.updateField('grossIncome', numVal);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={taxForm.control}
                          name="investmentIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Investment Income</FormLabel>
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
                          control={taxForm.control}
                          name="capitalGains"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capital Gains</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="otherIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="rentalIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rental Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="24000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="rentalExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rental Expenses</FormLabel>
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
                    </TabsContent>

                    <TabsContent value="deductions" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={taxForm.control}
                          name="workRelatedExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work-Related Deductions</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="2500"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="investmentExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Investment Deductions</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="1000"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? '' : parseFloat(val));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="charityDonations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Charitable Donations</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="500"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taxForm.control}
                          name="otherDeductions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Deductions</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="other" className="space-y-4">
                      <FormField
                        control={taxForm.control}
                          name="hecsBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HECS/HELP Balance</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="25000"
                                className="bg-white border-gray-300 text-gray-900"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                          name="healthInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border rounded"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I have private health insurance
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isCalculating}
                      className="bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      {isCalculating ? 'Calculating...' : 'Calculate & Optimize'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Combined Household Tax Summary */}
          {viewMode === 'combined' && combinedTaxResults && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
                  <Calculator className="h-5 w-5 mr-2" />
                  Combined Household Tax
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Per-client breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    {clientATaxResults && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{clientAName}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Income:</span>
                            <span className="font-semibold">${(clientATaxResults.annualIncome || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientATaxResults.totalTax || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">After Tax:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientATaxResults.afterTaxIncome || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {clientBTaxResults && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{clientBName}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Income:</span>
                            <span className="font-semibold">${(clientBTaxResults.annualIncome || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientBTaxResults.totalTax || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">After Tax:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientBTaxResults.afterTaxIncome || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Combined totals */}
                  <div className="pt-3 border-t border-yellow-300 dark:border-yellow-700">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">Combined Income:</span>
                        <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">${combinedTaxResults.annualIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">Combined Tax:</span>
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">${combinedTaxResults.totalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">Combined After-Tax:</span>
                        <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">${combinedTaxResults.afterTaxIncome.toLocaleString()}</span>
                      </div>
                      {combinedTaxResults.potentialSavings > 0 && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">Potential Savings:</span>
                          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">${combinedTaxResults.potentialSavings.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(viewMode === 'A' || viewMode === 'B' || (!showCombined && !viewMode)) && currentTax && (
            <>
              {/* Current Tax Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <FileText className="h-5 w-5 mr-2" />
                    Current Tax Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Income:</span>
                      <span className="font-semibold text-foreground">${currentTax.annualIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Deductions:</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">-${currentTax.totalDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxable Income:</span>
                      <span className="font-semibold">${currentTax.taxableIncome.toLocaleString()}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Income Tax:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${currentTax.incomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medicare Levy:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${currentTax.medicareLevy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HECS Repayment:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${currentTax.hecsRepayment.toLocaleString()}</span>
                    </div>
                    <hr className="border" />
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Total Tax:</span>
                      <span className="text-xl font-bold text-gray-700 dark:text-gray-300">${currentTax.totalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">After-Tax Income:</span>
                      <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">${currentTax.afterTaxIncome.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Marginal Tax Rate</p>
                        <p className="font-semibold text-foreground">{currentTax.marginalTaxRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Average Tax Rate</p>
                        <p className="font-semibold text-foreground">{currentTax.averageTaxRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Comparison */}
              {optimizedTax && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      Potential Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-green-600">
                        ${(currentTax.totalTax - optimizedTax.totalTax).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-800">Annual tax savings</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-800">Current Tax:</span>
                        <span className="font-semibold">${currentTax.totalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-800">Optimized Tax:</span>
                        <span className="font-semibold">${optimizedTax.totalTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Lifetime Tax Until Retirement */}
              {(() => {
                const clientData = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;
                const currentAge = clientData?.currentAge || 35;
                const retirementAge = clientData?.retirementAge || 65;
                const yearsToRetirement = Math.max(0, retirementAge - currentAge);
                const totalTaxUntilRetirement = currentTax.totalTax * yearsToRetirement;
                const optimizedTotalTax = optimizedTax ? optimizedTax.totalTax * yearsToRetirement : totalTaxUntilRetirement;
                const lifetimeSavings = totalTaxUntilRetirement - optimizedTotalTax;
                
                return (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Tax Until Retirement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-red-600">
                          ${totalTaxUntilRetirement.toLocaleString()}
                        </p>
                        <p className="text-sm text-amber-800">Total tax over {yearsToRetirement} years</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-800">Annual Tax:</span>
                          <span className="font-semibold">${currentTax.totalTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-800">Years to Retirement:</span>
                          <span className="font-semibold">{yearsToRetirement} years</span>
                        </div>
                        {optimizedTax && lifetimeSavings > 0 && (
                          <>
                            <hr className="border-amber-300" />
                            <div className="flex justify-between">
                              <span className="text-amber-800">Optimized Lifetime Tax:</span>
                              <span className="font-semibold text-green-600">${optimizedTotalTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-800 font-medium">Lifetime Savings:</span>
                              <span className="font-bold text-green-600">${lifetimeSavings.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          )}

          {viewMode === 'combined' && combinedCurrentTax && (
            <>
              {/* Combined Current Tax Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <FileText className="h-5 w-5 mr-2" />
                    Combined Current Tax Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Gross Income:</span>
                      <span className="font-semibold text-foreground">${combinedCurrentTax.annualIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Deductions:</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">-${combinedCurrentTax.totalDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Taxable Income:</span>
                      <span className="font-semibold">${combinedCurrentTax.taxableIncome.toLocaleString()}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Income Tax:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${(combinedCurrentTax.incomeTax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Medicare Levy:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${(combinedCurrentTax.medicareLevy || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined HECS Repayment:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${(combinedCurrentTax.hecsRepayment || 0).toLocaleString()}</span>
                    </div>
                    <hr className="border" />
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Combined Total Tax:</span>
                      <span className="text-xl font-bold text-gray-700 dark:text-gray-300">${combinedCurrentTax.totalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Combined After-Tax Income:</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">${combinedCurrentTax.afterTaxIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Tax Rate:</span>
                      <span className="font-semibold text-foreground">{combinedCurrentTax.averageTaxRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marginal Tax Rate:</span>
                      <span className="font-semibold text-foreground">{combinedCurrentTax.marginalTaxRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Optimization Comparison */}
              {combinedOptimizedTax && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      Combined Potential Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-green-600">
                        ${(combinedCurrentTax.totalTax - combinedOptimizedTax.totalTax).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-800">Combined annual tax savings</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-800">Current Combined Tax:</span>
                        <span className="font-semibold">${combinedCurrentTax.totalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-800">Optimized Combined Tax:</span>
                        <span className="font-semibold">${combinedOptimizedTax.totalTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Combined Lifetime Tax Until Retirement */}
              {(() => {
                // Use average retirement age from both clients
                const clientAAge = clientA?.currentAge || 35;
                const clientARetirement = clientA?.retirementAge || 65;
                const clientBAge = clientB?.currentAge || 35;
                const clientBRetirement = clientB?.retirementAge || 65;
                const avgCurrentAge = (clientAAge + clientBAge) / 2;
                const avgRetirementAge = (clientARetirement + clientBRetirement) / 2;
                const yearsToRetirement = Math.max(0, avgRetirementAge - avgCurrentAge);
                const totalTaxUntilRetirement = combinedCurrentTax.totalTax * yearsToRetirement;
                const optimizedTotalTax = combinedOptimizedTax ? combinedOptimizedTax.totalTax * yearsToRetirement : totalTaxUntilRetirement;
                const lifetimeSavings = totalTaxUntilRetirement - optimizedTotalTax;
                
                return (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Combined Tax Until Retirement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-red-600">
                          ${totalTaxUntilRetirement.toLocaleString()}
                        </p>
                        <p className="text-sm text-amber-800">Combined total tax over {yearsToRetirement} years</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-800">Combined Annual Tax:</span>
                          <span className="font-semibold">${combinedCurrentTax.totalTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-800">Average Years to Retirement:</span>
                          <span className="font-semibold">{yearsToRetirement} years</span>
                        </div>
                        {combinedOptimizedTax && lifetimeSavings > 0 && (
                          <>
                            <hr className="border-amber-300" />
                            <div className="flex justify-between">
                              <span className="text-amber-800">Optimized Combined Lifetime Tax:</span>
                              <span className="font-semibold text-green-600">${optimizedTotalTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-800 font-medium">Combined Lifetime Savings:</span>
                              <span className="font-bold text-green-600">${lifetimeSavings.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          )}

          {!currentTax && !combinedCurrentTax && (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Enter your tax information and click "Calculate Tax" to see your results and optimization strategies</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Optimization Strategies */}
      {((viewMode !== 'combined' && strategies.length > 0) || (viewMode === 'combined' && combinedStrategies.length > 0)) && (
        <div className="space-y-6">
          {/* Tax Savings by Category */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                {viewMode === 'combined' ? 'Combined Tax Optimization Impact' : 'Tax Optimization Impact'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {(viewMode !== 'combined' && currentTax && optimizedTax) || (viewMode === 'combined' && combinedCurrentTax && combinedOptimizedTax) ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Current After-Tax Income */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-gray-700 mb-2">{viewMode === 'combined' ? 'Current Combined Income' : 'Current Income'}</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      ${(viewMode === 'combined' ? combinedCurrentTax!.afterTaxIncome : currentTax!.afterTaxIncome).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Optimized After-Tax Income */}
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <h3 className="text-green-700 mb-2">{viewMode === 'combined' ? 'Optimized Combined Income' : 'Optimized Income'}</h3>
                    <p className="text-3xl font-bold text-green-700">
                      ${(viewMode === 'combined' ? combinedOptimizedTax!.afterTaxIncome : optimizedTax!.afterTaxIncome).toLocaleString()}
                    </p>
                    <p className="text-green-700 mt-2 font-medium">
                      Total Savings: ${((viewMode === 'combined' ? combinedOptimizedTax!.afterTaxIncome : optimizedTax!.afterTaxIncome) - (viewMode === 'combined' ? combinedCurrentTax!.afterTaxIncome : currentTax!.afterTaxIncome)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Enter your details and calculate to see the comparison</p>
              )}
            </CardContent>
          </Card>

          {/* Tax Optimization Strategies Card */}
          <Card className="bg-white border-gray-200 mt-6">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                {viewMode === 'combined' ? 'Combined Tax Optimization Strategies' : 'Tax Optimization Strategies'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {((viewMode !== 'combined' && strategies.length > 0) || (viewMode === 'combined' && combinedStrategies.length > 0)) ? (
                <div className="space-y-4">
                  {(viewMode === 'combined' ? combinedStrategies : strategies).map((strategy, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{strategy.strategy}</h3>
                          <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-green-600">
                            ${strategy.potentialSaving.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round((strategy.potentialSaving / (viewMode === 'combined' ? combinedStrategies : strategies).reduce((sum, s) => sum + s.potentialSaving, 0)) * 100)}% of total
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-gray-200 text-gray-700">{strategy.category}</Badge>
                        <Badge className="bg-gray-200 text-gray-700">{strategy.difficulty}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((strategy.potentialSaving / (viewMode === 'combined' ? combinedStrategies : strategies).reduce((sum, s) => sum + s.potentialSaving, 0)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Calculate to see optimization strategies</p>
              )}
            </CardContent>
          </Card>


        </div>
      )}
    </div>
  );
}
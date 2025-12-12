/**
 * FinCalc Pro - Financial Projections Page
 * 
 * Retirement planning with deficit/surplus analysis and projections
 */

'use client';

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TrendingUp, Calculator, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const projectionSchema = z.object({
  currentAge: z.number().min(18).max(100),
  retirementAge: z.number().min(50).max(100),
  annualIncome: z.number().min(0), // Canonical field name (was currentSalary)
  currentSuper: z.number().min(0),
  currentSavings: z.number().min(0),
  currentShares: z.number().min(0),
  propertyEquity: z.number().min(0),
  monthlyDebtPayments: z.number().min(0),
  monthlyRentalIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0)
});

const assumptionsSchema = z.object({
  inflationRate: z.number().min(0).max(20),
  salaryGrowthRate: z.number().min(0).max(20),
  superReturn: z.number().min(0).max(30),
  shareReturn: z.number().min(0).max(30),
  propertyGrowthRate: z.number().min(0).max(30),
  withdrawalRate: z.number().min(0).max(20),
  rentGrowthRate: z.number().min(0).max(20)
});

type ProjectionData = z.infer<typeof projectionSchema>;
type AssumptionsData = z.infer<typeof assumptionsSchema>;

interface ProjectionResults {
  yearsToRetirement: number;
  projectedLumpSum: number;
  projectedPassiveIncome: number;
  requiredIncome: number;
  monthlyDeficitSurplus: number;
  isDeficit: boolean;
  savingsDepletionYears?: number;
  monthlySavings: number;
  afterTaxIncome: number;
  totalTax: number;
}

export default function ProjectionsPage() {
  const [results, setResults] = useState<ProjectionResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  // Auto-calculate projections when form data changes
  
  
  // Subscribe to specific store values to ensure re-renders
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const superBalance = useFinancialStore((state) => state.superBalance);
  const cashSavings = useFinancialStore((state) => state.cashSavings);
  const investments = useFinancialStore((state) => state.investments);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  
  const clientData = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;

  const projectionForm = useForm<ProjectionData>({
    resolver: zodResolver(projectionSchema),
    defaultValues: {
      currentAge: clientData?.currentAge ?? 0,
      retirementAge: clientData?.retirementAge ?? 0,
      annualIncome: grossIncome ?? 0,
      currentSuper: superBalance ?? 0,
      currentSavings: cashSavings ?? 0,
      currentShares: investments ?? 0,
      propertyEquity: clientData?.propertyEquity ?? 0,
      monthlyDebtPayments: clientData?.monthlyDebtPayments ?? 0,
      monthlyRentalIncome: clientData?.monthlyRentalIncome ?? (rentalIncome ? rentalIncome / 12 : 0),
      monthlyExpenses: clientData?.monthlyExpenses ?? 0
    }
  });

  // Watch store and client data, update form when they change (use setValue to avoid disrupting user input)
  useEffect(() => {
    if (!activeClient) return;
    
    const currentValues = projectionForm.getValues();
    const storeAnnualIncome = grossIncome ?? 0;
    const storeCurrentSuper = superBalance ?? 0;
    const storeCurrentSavings = cashSavings ?? 0;
    const storeCurrentShares = investments ?? 0;
    const storeMonthlyRentalIncome = clientData?.monthlyRentalIncome ?? (rentalIncome ? rentalIncome / 12 : 0);
    
    // Only update if values differ
    if (currentValues.annualIncome !== storeAnnualIncome) {
      projectionForm.setValue('annualIncome', storeAnnualIncome, { shouldDirty: false });
    }
    if (currentValues.currentSuper !== storeCurrentSuper) {
      projectionForm.setValue('currentSuper', storeCurrentSuper, { shouldDirty: false });
    }
    if (currentValues.currentSavings !== storeCurrentSavings) {
      projectionForm.setValue('currentSavings', storeCurrentSavings, { shouldDirty: false });
    }
    if (currentValues.currentShares !== storeCurrentShares) {
      projectionForm.setValue('currentShares', storeCurrentShares, { shouldDirty: false });
    }
    if (Math.abs((currentValues.monthlyRentalIncome || 0) - storeMonthlyRentalIncome) > 0.01) {
      projectionForm.setValue('monthlyRentalIncome', storeMonthlyRentalIncome, { shouldDirty: false });
    }
    if (currentValues.currentAge !== (clientData?.currentAge ?? 0)) {
      projectionForm.setValue('currentAge', clientData?.currentAge ?? 0, { shouldDirty: false });
    }
    if (currentValues.retirementAge !== (clientData?.retirementAge ?? 0)) {
      projectionForm.setValue('retirementAge', clientData?.retirementAge ?? 0, { shouldDirty: false });
    }
    if (currentValues.propertyEquity !== (clientData?.propertyEquity ?? 0)) {
      projectionForm.setValue('propertyEquity', clientData?.propertyEquity ?? 0, { shouldDirty: false });
    }
    if (currentValues.monthlyDebtPayments !== (clientData?.monthlyDebtPayments ?? 0)) {
      projectionForm.setValue('monthlyDebtPayments', clientData?.monthlyDebtPayments ?? 0, { shouldDirty: false });
    }
    if (currentValues.monthlyExpenses !== (clientData?.monthlyExpenses ?? 0)) {
      projectionForm.setValue('monthlyExpenses', clientData?.monthlyExpenses ?? 0, { shouldDirty: false });
    }
  }, [
    grossIncome,
    superBalance,
    cashSavings,
    investments,
    rentalIncome,
    clientData?.currentAge,
    clientData?.retirementAge,
    clientData?.propertyEquity,
    clientData?.monthlyDebtPayments,
    clientData?.monthlyRentalIncome,
    clientData?.monthlyExpenses,
    activeClient,
    projectionForm
  ]);

  // Default assumptions based on Australian market norms
  const DEFAULT_ASSUMPTIONS = {
    inflationRate: 2.5,       // RBA target
    salaryGrowthRate: 3.0,    // Typical salary growth
    superReturn: 7.0,         // Long-term super return
    shareReturn: 7.0,         // Long-term equity return
    propertyGrowthRate: 4.0,  // Conservative property growth
    withdrawalRate: 4.0,      // Safe withdrawal rate
    rentGrowthRate: 3.0       // Rent typically tracks inflation + 0.5%
  };

  const assumptionsForm = useForm<AssumptionsData>({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: {
      inflationRate: clientData?.inflationRate || DEFAULT_ASSUMPTIONS.inflationRate,
      salaryGrowthRate: clientData?.salaryGrowthRate || DEFAULT_ASSUMPTIONS.salaryGrowthRate,
      superReturn: clientData?.superReturn || DEFAULT_ASSUMPTIONS.superReturn,
      shareReturn: clientData?.shareReturn || DEFAULT_ASSUMPTIONS.shareReturn,
      propertyGrowthRate: clientData?.propertyGrowthRate || DEFAULT_ASSUMPTIONS.propertyGrowthRate,
      withdrawalRate: clientData?.withdrawalRate || DEFAULT_ASSUMPTIONS.withdrawalRate,
      rentGrowthRate: clientData?.rentGrowthRate || DEFAULT_ASSUMPTIONS.rentGrowthRate
    }
  });

  // Watch client data and update assumptions form when it changes (use setValue to avoid disrupting user input)
  // Only override if client has explicitly set a value (non-zero), otherwise keep defaults
  useEffect(() => {
    if (!activeClient) return;
    
    const currentValues = assumptionsForm.getValues();
    
    // Only update if client has a non-zero value that differs from current
    if (clientData?.inflationRate && clientData.inflationRate > 0 && 
        Math.abs((currentValues.inflationRate || 0) - clientData.inflationRate) > 0.01) {
      assumptionsForm.setValue('inflationRate', clientData.inflationRate, { shouldDirty: false });
    }
    if (clientData?.salaryGrowthRate && clientData.salaryGrowthRate > 0 && 
        Math.abs((currentValues.salaryGrowthRate || 0) - clientData.salaryGrowthRate) > 0.01) {
      assumptionsForm.setValue('salaryGrowthRate', clientData.salaryGrowthRate, { shouldDirty: false });
    }
    if (clientData?.superReturn && clientData.superReturn > 0 && 
        Math.abs((currentValues.superReturn || 0) - clientData.superReturn) > 0.01) {
      assumptionsForm.setValue('superReturn', clientData.superReturn, { shouldDirty: false });
    }
    if (clientData?.shareReturn && clientData.shareReturn > 0 && 
        Math.abs((currentValues.shareReturn || 0) - clientData.shareReturn) > 0.01) {
      assumptionsForm.setValue('shareReturn', clientData.shareReturn, { shouldDirty: false });
    }
    if (clientData?.propertyGrowthRate && clientData.propertyGrowthRate > 0 && 
        Math.abs((currentValues.propertyGrowthRate || 0) - clientData.propertyGrowthRate) > 0.01) {
      assumptionsForm.setValue('propertyGrowthRate', clientData.propertyGrowthRate, { shouldDirty: false });
    }
    if (clientData?.withdrawalRate && clientData.withdrawalRate > 0 && 
        Math.abs((currentValues.withdrawalRate || 0) - clientData.withdrawalRate) > 0.01) {
      assumptionsForm.setValue('withdrawalRate', clientData.withdrawalRate, { shouldDirty: false });
    }
    if (clientData?.rentGrowthRate && clientData.rentGrowthRate > 0 && 
        Math.abs((currentValues.rentGrowthRate || 0) - clientData.rentGrowthRate) > 0.01) {
      assumptionsForm.setValue('rentGrowthRate', clientData.rentGrowthRate, { shouldDirty: false });
    }
  }, [
    clientData?.inflationRate,
    clientData?.salaryGrowthRate,
    clientData?.superReturn,
    clientData?.shareReturn,
    clientData?.propertyGrowthRate,
    clientData?.withdrawalRate,
    clientData?.rentGrowthRate,
    activeClient,
    assumptionsForm
  ]);

  // Watch form values outside useEffect to avoid infinite loops
  const watchedProjectionData = projectionForm.watch();
  const watchedAssumptionsData = assumptionsForm.watch();

  // Auto-calculate projections when form data changes (forms are declared above)
  useEffect(() => {
    // Debounce to prevent too frequent calculations
    const timeoutId = setTimeout(() => {
      try {
        if (
          watchedProjectionData.currentAge > 0 &&
          watchedProjectionData.retirementAge > watchedProjectionData.currentAge &&
          watchedProjectionData.annualIncome >= 0 &&
          watchedProjectionData.currentSuper >= 0 &&
          watchedProjectionData.currentSavings >= 0 &&
          watchedProjectionData.currentShares >= 0 &&
          watchedProjectionData.propertyEquity >= 0 &&
          watchedProjectionData.monthlyDebtPayments >= 0 &&
          watchedProjectionData.monthlyRentalIncome >= 0 &&
          watchedProjectionData.monthlyExpenses >= 0
        ) {
          calculateProjections();
        }
      } catch (err) {
        // safe-guard during initial render
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedProjectionData.currentAge,
    watchedProjectionData.retirementAge,
    watchedProjectionData.annualIncome,
    watchedProjectionData.currentSuper,
    watchedProjectionData.currentSavings,
    watchedProjectionData.currentShares,
    watchedProjectionData.propertyEquity,
    watchedProjectionData.monthlyDebtPayments,
    watchedProjectionData.monthlyRentalIncome,
    watchedProjectionData.monthlyExpenses,
    watchedAssumptionsData.inflationRate,
    watchedAssumptionsData.salaryGrowthRate,
    watchedAssumptionsData.superReturn,
    watchedAssumptionsData.shareReturn,
    watchedAssumptionsData.propertyGrowthRate,
    watchedAssumptionsData.withdrawalRate,
    watchedAssumptionsData.rentGrowthRate
  ]);

  // Australian tax calculation functions
  const taxBrackets = [
    { min: 0, max: 18200, rate: 0, baseAmount: 0 },
    { min: 18201, max: 45000, rate: 0.19, baseAmount: 0 },
    { min: 45001, max: 120000, rate: 0.325, baseAmount: 5092 },
    { min: 120001, max: 180000, rate: 0.37, baseAmount: 29467 },
    { min: 180001, max: Infinity, rate: 0.45, baseAmount: 51667 }
  ];

  const calculateIncomeTax = (taxableIncome: number): number => {
    if (taxableIncome <= 0) return 0;
    for (let i = taxBrackets.length - 1; i >= 0; i--) {
      const bracket = taxBrackets[i];
      if (taxableIncome >= bracket.min) {
        const taxableInBracket = taxableIncome - bracket.min;
        return bracket.baseAmount + (taxableInBracket * bracket.rate);
      }
    }
    return 0;
  };

  const calculateMedicareLevy = (taxableIncome: number): number => {
    if (taxableIncome <= 24276) return 0;
    return taxableIncome * 0.02; // 2% Medicare Levy
  };

  const calculateTax = (annualIncome: number): { incomeTax: number; medicareLevy: number; totalTax: number; afterTaxIncome: number } => {
    const incomeTax = calculateIncomeTax(annualIncome);
    const medicareLevy = calculateMedicareLevy(annualIncome);
    const totalTax = incomeTax + medicareLevy;
    const afterTaxIncome = annualIncome - totalTax;
    return { incomeTax, medicareLevy, totalTax, afterTaxIncome };
  };

  const calculateProjections = () => {
    // ========================================
    // ASIC MONEYSMART VERIFIED CALCULATOR
    // Based on ASIC Regulatory Guide 276
    // ========================================
    
    const projectionData = projectionForm.getValues();
    const assumptions = assumptionsForm.getValues();
    setIsCalculating(true);

    try {
      // CONSTANTS
      const SUPER_GUARANTEE_RATE = 0.115; // 11.5% for 2024-25
      const RETIREMENT_INCOME_THRESHOLD = 0.70; // 70% ASFA comfortable retirement standard
      
      // Convert to decimals
      const years = Math.max(0, projectionData.retirementAge - projectionData.currentAge);
      if (years <= 0) {
        toast({ title: 'Invalid Input', description: 'Retirement age must be greater than current age', variant: 'destructive' });
        setIsCalculating(false);
        return;
      }

      const r_super = assumptions.superReturn / 100;
      const r_shares = assumptions.shareReturn / 100;
      const r_property = assumptions.propertyGrowthRate / 100;
      const g_salary = assumptions.salaryGrowthRate / 100;
      const g_rent = assumptions.rentGrowthRate / 100;
      const inflation = assumptions.inflationRate / 100;

      // ========================================
      // SUPERANNUATION - Growing Annuity Formula
      // ========================================
      
      const initialSuperContribution = projectionData.annualIncome * SUPER_GUARANTEE_RATE;
      
      // Part 1: Current balance grows with compound interest
      const futureSuperFromGrowth = projectionData.currentSuper * Math.pow(1 + r_super, years);
      
      // Part 2: Future value of growing annuity
      // Contributions grow at salary growth rate, earn returns at super rate
      let futureSuperFromContributions = 0;
      
      if (Math.abs(r_super - g_salary) < 0.0001) {
        // When interest rate equals growth rate, use alternative formula
        futureSuperFromContributions = initialSuperContribution * years * Math.pow(1 + r_super, years - 1);
      } else {
        // Standard growing annuity: FV = PMT * [(1+r)^n - (1+g)^n] / (r - g)
        futureSuperFromContributions = initialSuperContribution * 
          ((Math.pow(1 + r_super, years) - Math.pow(1 + g_salary, years)) / (r_super - g_salary));
      }
      
      const futureSuperannuation = futureSuperFromGrowth + futureSuperFromContributions;

      // ========================================
      // SHARES - Simple Compound Growth
      // ========================================
      
      const futureShares = projectionData.currentShares * Math.pow(1 + r_shares, years);

      // ========================================
      // PROPERTY - Proper Value Growth with Mortgage Paydown
      // ========================================
      
      // Get property details from client data if available
      const properties = clientData?.properties || [];
      let futureProperty = 0;
      
      if (properties.length > 0) {
        // Calculate for each property: future value - remaining mortgage
        futureProperty = properties.reduce((total: number, prop: any) => {
          const currentValue = parseFloat(prop.currentValue) || 0;
          const loanAmount = parseFloat(prop.loanAmount) || 0;
          const loanTerm = parseFloat(prop.loanTerm) || 30; // Default 30 years
          
          // Property VALUE grows at property growth rate
          const futureValue = currentValue * Math.pow(1 + r_property, years);
          
          // Calculate remaining mortgage after 'years' of payments
          // Assuming loan is paid down linearly over loan term
          const yearsRemaining = Math.max(0, loanTerm - years);
          const remainingMortgage = loanAmount > 0 ? (loanAmount * yearsRemaining / loanTerm) : 0;
          
          // Future equity = future value - remaining mortgage
          const futureEquity = Math.max(0, futureValue - remainingMortgage);
          
          return total + futureEquity;
        }, 0);
      } else {
        // Fallback: if no property details, use the old method
        // But note: this compounds equity directly which may understate growth
        futureProperty = projectionData.propertyEquity * Math.pow(1 + r_property, years);
      }

      // ========================================
      // SAVINGS - Complex (Balance + Cashflow)
      // ========================================
      
      // Calculate net annual cashflow
      const initialMonthlyNetCashflow = projectionData.monthlyRentalIncome - projectionData.monthlyDebtPayments - projectionData.monthlyExpenses;
      const initialAnnualNetCashflow = initialMonthlyNetCashflow * 12;
      
      // Part 1: Current savings grow at super return rate
      const futureSavingsFromGrowth = projectionData.currentSavings * Math.pow(1 + r_super, years);
      
      // Part 2: Net cashflow grows as a growing annuity
      // Rental income grows at rent growth rate
      // Expenses grow at inflation rate
      // Net effect: effective growth = rent growth - inflation
      const effectiveCashflowGrowth = g_rent - inflation;
      
      let futureSavingsFromCashflow = 0;
      
      if (initialAnnualNetCashflow > 0) {
        // Positive cashflow: calculate growing annuity
        if (Math.abs(r_super - effectiveCashflowGrowth) < 0.0001) {
          futureSavingsFromCashflow = initialAnnualNetCashflow * years * Math.pow(1 + r_super, years - 1);
        } else {
          futureSavingsFromCashflow = initialAnnualNetCashflow * 
            ((Math.pow(1 + r_super, years) - Math.pow(1 + effectiveCashflowGrowth, years)) / 
             (r_super - effectiveCashflowGrowth));
        }
      } else if (initialAnnualNetCashflow < 0) {
        // Negative cashflow reduces savings over time
        if (Math.abs(r_super - effectiveCashflowGrowth) < 0.0001) {
          futureSavingsFromCashflow = initialAnnualNetCashflow * years * Math.pow(1 + r_super, years - 1);
        } else {
          futureSavingsFromCashflow = initialAnnualNetCashflow * 
            ((Math.pow(1 + r_super, years) - Math.pow(1 + effectiveCashflowGrowth, years)) / 
             (r_super - effectiveCashflowGrowth));
        }
      }
      
      const futureSavings = Math.max(0, futureSavingsFromGrowth + futureSavingsFromCashflow);

      // ========================================
      // TOTAL PROJECTED LUMP SUM
      // ========================================
      
      // Total lump sum includes all assets (for net worth display)
      const projectedLumpSum = futureSuperannuation + futureShares + futureProperty + futureSavings;
      
      // Liquid assets for withdrawal calculation (excludes property - can't easily withdraw from property)
      const liquidAssetsForWithdrawal = futureSuperannuation + futureShares + futureSavings;

      // ========================================
      // PASSIVE INCOME CALCULATION
      // ========================================
      
      // Rental income grows over the years
      const finalMonthlyRentalIncome = projectionData.monthlyRentalIncome * Math.pow(1 + g_rent, years);
      const finalAnnualRentalIncome = finalMonthlyRentalIncome * 12;
      
      // Investment withdrawal based on safe withdrawal rate (from LIQUID assets only, not property)
      const investmentWithdrawal = liquidAssetsForWithdrawal * (assumptions.withdrawalRate / 100);
      
      // Total passive income = withdrawals from liquid assets + rental income from properties
      const annualPassiveIncome = investmentWithdrawal + finalAnnualRentalIncome;

      // ========================================
      // TARGET INCOME & SURPLUS/DEFICIT
      // ========================================
      
      // Calculate final salary after salary growth (for reference only)
      const finalAnnualIncome = projectionData.annualIncome * Math.pow(1 + g_salary, years);
      
      // Target is 70% of CURRENT income (not final salary)
      const targetRetirementIncome = projectionData.annualIncome * RETIREMENT_INCOME_THRESHOLD;
      
      // Calculate surplus or deficit: passive income at retirement vs 70% of current income
      const surplusOrDeficit = annualPassiveIncome - targetRetirementIncome;
      const percentageOfTarget = targetRetirementIncome > 0 ? 
        (annualPassiveIncome / targetRetirementIncome) * 100 : 0;
      const isDeficit = surplusOrDeficit < 0;
      const monthlyDeficitSurplus = Math.abs(surplusOrDeficit) / 12;

      // Savings depletion estimate
      let savingsDepletionYears: number | undefined = undefined;
      if (isDeficit && futureSavings > 0) {
        const annualDeficit = Math.abs(surplusOrDeficit);
        if (annualDeficit > 0) {
          savingsDepletionYears = futureSavings / annualDeficit;
        }
      }

      // Tax calculation on final annual income
      const taxCalc = calculateTax(finalAnnualIncome);

      // ========================================
      // DEBUG LOGGING (can be removed in production)
      // ========================================
      console.log('=== ASIC MONEYSMART CALCULATION DEBUG ===');
      console.log('Years:', years);
      console.log('Super return (decimal):', r_super);
      console.log('Salary growth (decimal):', g_salary);
      console.log('Property growth (decimal):', r_property);
      console.log('');
      console.log('SUPERANNUATION:');
      console.log('Initial contribution:', initialSuperContribution);
      console.log('Future from growth:', futureSuperFromGrowth);
      console.log('Future from contributions:', futureSuperFromContributions);
      console.log('Total future super:', futureSuperannuation);
      console.log('');
      console.log('PROPERTY:');
      console.log('Number of properties:', properties.length);
      console.log('Current equity (form):', projectionData.propertyEquity);
      console.log('Future property equity:', futureProperty);
      console.log('');
      console.log('OTHER ASSETS:');
      console.log('Future shares:', futureShares);
      console.log('Future savings:', futureSavings);
      console.log('');
      console.log('TOTALS:');
      console.log('Projected lump sum:', projectedLumpSum);
      console.log('Annual passive income at retirement:', annualPassiveIncome);
      console.log('Target income (70% of CURRENT income):', targetRetirementIncome);
      console.log('Current annual income:', projectionData.annualIncome);
      console.log('Annual Surplus/Deficit:', surplusOrDeficit);
      console.log('Monthly Surplus/Deficit:', monthlyDeficitSurplus);
      console.log('==========================================');

      const calculatedResults: ProjectionResults = {
        yearsToRetirement: years,
        projectedLumpSum,
        projectedPassiveIncome: annualPassiveIncome,
        requiredIncome: targetRetirementIncome,
        monthlyDeficitSurplus,
        isDeficit,
        savingsDepletionYears,
        monthlySavings: initialMonthlyNetCashflow,
        afterTaxIncome: taxCalc.afterTaxIncome,
        totalTax: taxCalc.totalTax
      };

      setTimeout(() => {
        setResults(calculatedResults);
        setIsCalculating(false);
        toast({ title: 'Projections calculated', description: `Your retirement projection has been updated` });
      }, 300);
    } catch (err) {
      console.error('Projection calculation error', err);
      toast({ title: 'Calculation Error', description: 'An error occurred while calculating projections', variant: 'destructive' });
      setIsCalculating(false);
    }
  };

  const projectionData = projectionForm.watch();
  const progressToRetirement = projectionData.retirementAge > projectionData.currentAge 
    ? ((projectionData.retirementAge - projectionData.currentAge) / (projectionData.retirementAge - 25)) * 100
    : 100;

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Projections</h1>
          <p className="text-muted-foreground">Plan your retirement and analyze future financial position</p>
        </div>
        {/* Button removed for auto-calc */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Forms */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="current" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                Current Position
              </TabsTrigger>
              <TabsTrigger value="assumptions" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                Assumptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Current Financial Position</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter your current age, retirement plans, and financial position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...projectionForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={projectionForm.control}
                          name="currentAge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Age</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="retirementAge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Retirement Age</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="annualIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="100000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="currentSuper"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Superannuation</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="150000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="currentSavings"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Savings</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="50000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="currentShares"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Shares/Investments</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="100000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="propertyEquity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Equity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="300000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="monthlyDebtPayments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Debt Payments</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="2500"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="monthlyRentalIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Rental Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="3000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={projectionForm.control}
                          name="monthlyExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Expenses</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="5000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Total monthly living expenses (after tax)
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assumptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Projection Assumptions
                  </CardTitle>
                  <CardDescription>
                    Adjust the assumptions used in your retirement projections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...assumptionsForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={assumptionsForm.control}
                          name="inflationRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inflation Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="2.5"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="salaryGrowthRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salary Growth Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="3"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="superReturn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Super Return (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="7"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="shareReturn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Share Market Return (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="8"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="propertyGrowthRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Growth Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="4"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="withdrawalRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Safe Withdrawal Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="4"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={assumptionsForm.control}
                          name="rentGrowthRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rent Growth Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="3"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Retirement Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Retirement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Age {projectionData.currentAge}</span>
                  <span className="text-muted-foreground">Age {projectionData.retirementAge}</span>
                </div>
                <Progress value={100 - progressToRetirement} className="h-2" />
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {projectionData.retirementAge - projectionData.currentAge} years
                  </p>
                  <p className="text-sm text-muted-foreground">until retirement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Projection Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Projected Lump Sum:</span>
                      <span className="font-semibold text-green-600">
                        ${results.projectedLumpSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Annual Passive Income:</span>
                      <span className="font-semibold text-blue-600">
                        ${results.projectedPassiveIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Required Income (70%):</span>
                      <span className="font-semibold">
                        ${results.requiredIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${results.isDeficit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${results.isDeficit ? 'text-red-800' : 'text-green-800'}`}>
                    {results.isDeficit ? (
                      <AlertTriangle className="h-5 w-5 mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    {results.isDeficit ? 'Retirement Deficit' : 'Retirement Surplus'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${results.isDeficit ? 'text-red-600' : 'text-green-600'}`}>
                        ${results.monthlyDeficitSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {results.isDeficit ? 'Shortfall' : 'Surplus'} in retirement
                      </p>
                    </div>

                    {results.isDeficit && results.savingsDepletionYears && (
                      <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Warning:</strong> At this rate, your savings could be depleted in approximately{' '}
                          <strong>{Math.round(results.savingsDepletionYears)} years</strong> after retirement.
                        </p>
                      </div>
                    )}

                    {!results.isDeficit && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Great news!</strong> You're on track for a comfortable retirement with a monthly surplus.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!results && (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Click "Calculate Projections" to see your retirement forecast</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
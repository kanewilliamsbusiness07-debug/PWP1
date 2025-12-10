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

  const assumptionsForm = useForm<AssumptionsData>({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: {
      inflationRate: clientData?.inflationRate ?? 0,
      salaryGrowthRate: clientData?.salaryGrowthRate ?? 0,
      superReturn: clientData?.superReturn ?? 0,
      shareReturn: clientData?.shareReturn ?? 0,
      propertyGrowthRate: clientData?.propertyGrowthRate ?? 0,
      withdrawalRate: clientData?.withdrawalRate ?? 0,
      rentGrowthRate: clientData?.rentGrowthRate ?? 0
    }
  });

  // Watch client data and update assumptions form when it changes (use setValue to avoid disrupting user input)
  useEffect(() => {
    if (!activeClient) return;
    
    const currentValues = assumptionsForm.getValues();
    
    // Only update if values differ
    if (Math.abs((currentValues.inflationRate || 0) - (clientData?.inflationRate ?? 0)) > 0.01) {
      assumptionsForm.setValue('inflationRate', clientData?.inflationRate ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.salaryGrowthRate || 0) - (clientData?.salaryGrowthRate ?? 0)) > 0.01) {
      assumptionsForm.setValue('salaryGrowthRate', clientData?.salaryGrowthRate ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.superReturn || 0) - (clientData?.superReturn ?? 0)) > 0.01) {
      assumptionsForm.setValue('superReturn', clientData?.superReturn ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.shareReturn || 0) - (clientData?.shareReturn ?? 0)) > 0.01) {
      assumptionsForm.setValue('shareReturn', clientData?.shareReturn ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.propertyGrowthRate || 0) - (clientData?.propertyGrowthRate ?? 0)) > 0.01) {
      assumptionsForm.setValue('propertyGrowthRate', clientData?.propertyGrowthRate ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.withdrawalRate || 0) - (clientData?.withdrawalRate ?? 0)) > 0.01) {
      assumptionsForm.setValue('withdrawalRate', clientData?.withdrawalRate ?? 0, { shouldDirty: false });
    }
    if (Math.abs((currentValues.rentGrowthRate || 0) - (clientData?.rentGrowthRate ?? 0)) > 0.01) {
      assumptionsForm.setValue('rentGrowthRate', clientData?.rentGrowthRate ?? 0, { shouldDirty: false });
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
    // --- Begin: User-specified Financial Projection Logic ---
    const projectionData = projectionForm.getValues();
    const assumptions = assumptionsForm.getValues();
    setIsCalculating(true);
    setTimeout(() => {
      // Step 1: Years Until Retirement
      const yearsToRetirement = Math.max(0, projectionData.retirementAge - projectionData.currentAge);
      if (yearsToRetirement <= 0) {
        toast({
          title: 'Invalid Input',
          description: 'Retirement age must be greater than current age',
          variant: 'destructive'
        });
        setIsCalculating(false);
        return;
      }

      // Step 2: Net Monthly Cash Flow
      const netMonthlyCashFlow = projectionData.monthlyRentalIncome - projectionData.monthlyDebtPayments - projectionData.monthlyExpenses;

      // Step 3: Annual Contributions
      // Superannuation Guarantee Rate (default 11.5%)
      const superGuaranteeRate = 0.115;
      let superContributions: number[] = [];
      let savingsContributions: number[] = [];
      let annualIncomeArr: number[] = [];
      let superArr: number[] = [];
      let savingsArr: number[] = [];
      let sharesArr: number[] = [];
      let propertyArr: number[] = [];
      let rentArr: number[] = [];
      let expensesArr: number[] = [];

      // Initialize starting values
      annualIncomeArr[0] = projectionData.annualIncome;
      superArr[0] = projectionData.currentSuper;
      savingsArr[0] = projectionData.currentSavings;
      sharesArr[0] = projectionData.currentShares;
      propertyArr[0] = projectionData.propertyEquity;
      rentArr[0] = projectionData.monthlyRentalIncome;
      expensesArr[0] = projectionData.monthlyExpenses;

      // Step 4: Project Asset Growth Over Time
      for (let i = 1; i <= yearsToRetirement; i++) {
        // Annual Income
        annualIncomeArr[i] = annualIncomeArr[i - 1] * (1 + assumptions.salaryGrowthRate / 100);
        // Super Contribution
        superContributions[i] = annualIncomeArr[i] * superGuaranteeRate;
        // Savings Contribution
        savingsContributions[i] = netMonthlyCashFlow * 12;
        // Super Balance
        superArr[i] = superArr[i - 1] * (1 + assumptions.superReturn / 100) + superContributions[i] * Math.pow(1 + assumptions.superReturn / 100, 0.5);
        // Savings Balance
        savingsArr[i] = savingsArr[i - 1] * (1 + assumptions.superReturn / 100) + savingsContributions[i] * Math.pow(1 + assumptions.superReturn / 100, 0.5);
        // Shares/Investments
        sharesArr[i] = sharesArr[i - 1] * (1 + assumptions.shareReturn / 100);
        // Property Equity
        propertyArr[i] = propertyArr[i - 1] * (1 + assumptions.propertyGrowthRate / 100);
        // Monthly Rental Income
        rentArr[i] = rentArr[i - 1] * (1 + assumptions.rentGrowthRate / 100);
        // Monthly Expenses
        expensesArr[i] = expensesArr[i - 1] * (1 + assumptions.inflationRate / 100);
      }

      // Step 5: Calculate Retirement Position
      const finalSuper = superArr[yearsToRetirement];
      const finalSavings = savingsArr[yearsToRetirement];
      const finalShares = sharesArr[yearsToRetirement];
      const finalProperty = propertyArr[yearsToRetirement];
      const projectedLumpSum = finalSuper + finalSavings + finalShares + finalProperty;

      // Step 6: Calculate Annual Passive Income
      const annualWithdrawal = projectedLumpSum * (assumptions.withdrawalRate / 100);
      const annualRentalIncome = rentArr[yearsToRetirement] * 12;
      const projectedPassiveIncome = annualWithdrawal + annualRentalIncome;

      // Step 7: Calculate Retirement Income Target
      const currentAnnualExpenses = projectionData.monthlyExpenses * 12;
      const targetIncome70 = annualIncomeArr[yearsToRetirement] * 0.7;
      const inflationAdjustedTarget = projectionData.annualIncome * 0.7 * Math.pow(1 + assumptions.inflationRate / 100, yearsToRetirement);
      // Use whichever is more relevant (here, use 70% of final year income)
      const requiredIncome = targetIncome70;

      // Step 8: Calculate Surplus/Deficit
      const retirementSurplusDeficit = projectedPassiveIncome - requiredIncome;
      const isDeficit = retirementSurplusDeficit < 0;
      const monthlyDeficitSurplus = Math.abs(retirementSurplusDeficit) / 12;
      const percentOfTarget = (projectedPassiveIncome / requiredIncome) * 100;

      // Step 9: Optional - Required Adjustments (not displayed, but can be added)
      let savingsDepletionYears;
      if (isDeficit && finalSavings > 0) {
        const annualDeficit = requiredIncome - projectedPassiveIncome;
        savingsDepletionYears = finalSavings / annualDeficit;
      }

      // Step 10: Output Results
      const calculatedResults: ProjectionResults = {
        yearsToRetirement,
        projectedLumpSum,
        projectedPassiveIncome,
        requiredIncome,
        monthlyDeficitSurplus,
        isDeficit,
        savingsDepletionYears: savingsDepletionYears,
        monthlySavings: netMonthlyCashFlow,
        afterTaxIncome: annualIncomeArr[yearsToRetirement],
        totalTax: 0 // Not calculated in this logic
      };
      setResults(calculatedResults);
      setIsCalculating(false);
      toast({
        title: 'Projections calculated',
        description: `Your retirement projection has been updated`
      });
    }, 1500);
    // --- End: User-specified Financial Projection Logic ---

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
        <Button 
          onClick={calculateProjections}
          disabled={isCalculating}
          className="bg-yellow-500 text-white hover:bg-yellow-600"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Calculating...' : 'Calculate Projections'}
        </Button>
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
                          control={projectionForm.control}
                          name="currentSuper"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Superannuation</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="150000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="50000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          control={projectionForm.control}
                          name="propertyEquity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Equity</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="300000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          control={projectionForm.control}
                          name="monthlyRentalIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Rental Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="3000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="5000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="2.5"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="3"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="7"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="8"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="4"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="4"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                  type="text"
                                  placeholder="3"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        ${results.projectedLumpSum.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Annual Passive Income:</span>
                      <span className="font-semibold text-blue-600">
                        ${results.projectedPassiveIncome.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Required Income (70%):</span>
                      <span className="font-semibold">
                        ${results.requiredIncome.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">Monthly Savings:</span>
                      <span className={`font-semibold ${results.monthlySavings >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        ${results.monthlySavings.toLocaleString()}
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
                        ${results.monthlyDeficitSurplus.toLocaleString()}/month
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
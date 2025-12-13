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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateDebtPaymentsAtRetirement } from '@/lib/finance/calculations';

// Shared Assumptions Component
function SharedAssumptionsSection() {
  const financialStore = useFinancialStore();
  const sharedAssumptions = useFinancialStore((state) => state.sharedAssumptions);
  
  const handleChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      financialStore.setSharedAssumptions({ [field]: numValue });
    }
  };
  
  return (
    <Card className="border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared Assumptions (Apply to Both Clients)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Inflation Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.inflationRate ?? 2.5}
              onChange={(e) => handleChange('inflationRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Salary Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.salaryGrowthRate ?? 3.0}
              onChange={(e) => handleChange('salaryGrowthRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Super Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.superReturn ?? 7.0}
              onChange={(e) => handleChange('superReturn', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Share Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.shareReturn ?? 7.0}
              onChange={(e) => handleChange('shareReturn', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Property Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.propertyGrowthRate ?? 4.0}
              onChange={(e) => handleChange('propertyGrowthRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Withdrawal Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.withdrawalRate ?? 4.0}
              onChange={(e) => handleChange('withdrawalRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Rent Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.rentGrowthRate ?? 3.0}
              onChange={(e) => handleChange('rentGrowthRate', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Projection Form Component for individual clients
function ProjectionForm({ clientSlot, clientData, onFormChange }: {
  clientSlot: 'A' | 'B';
  clientData: any;
  onFormChange: (slot: 'A' | 'B', data: ProjectionData) => void;
}) {
  const form = useForm<ProjectionData>({
    resolver: zodResolver(projectionSchema),
    defaultValues: {
      currentAge: clientData?.currentAge ?? 0,
      retirementAge: clientData?.retirementAge ?? 65,
      annualIncome: clientData?.annualIncome ?? clientData?.grossSalary ?? 0,
      currentSuper: clientData?.superFundValue ?? 0,
      currentSavings: clientData?.savingsValue ?? 0,
      currentShares: clientData?.sharesValue ?? 0,
      propertyEquity: clientData?.propertyEquity ?? 0,
      monthlyDebtPayments: clientData?.monthlyDebtPayments ?? 0,
      monthlyRentalIncome: clientData?.monthlyRentalIncome ?? (clientData?.rentalIncome ? clientData.rentalIncome / 12 : 0),
      monthlyExpenses: clientData?.monthlyExpenses ?? 0
    }
  });

  // Watch form changes and notify parent
  useEffect(() => {
    const subscription = form.watch((data) => {
      onFormChange(clientSlot, data as ProjectionData);
    });
    return () => subscription.unsubscribe();
  }, [form, clientSlot, onFormChange]);

  const clientName = clientSlot === 'A' ? 'Client A' : 'Client B';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{clientName} - Current Financial Position</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter {clientName.toLowerCase()}'s current age, retirement plans, and financial position
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="35"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="retirementAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retirement Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="65"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 65)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="80000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentSuper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Superannuation Balance ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              control={form.control}
              name="currentSavings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Savings Balance ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              control={form.control}
              name="currentShares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shares/Investments ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              control={form.control}
              name="propertyEquity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Equity ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              control={form.control}
              name="monthlyDebtPayments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Debt Payments ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              control={form.control}
              name="monthlyRentalIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rental Income ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1500"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Expenses ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

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
  const [viewMode, setViewMode] = useState<'A' | 'B' | 'combined'>('A');
  const { toast } = useToast();

  // Auto-calculate projections when form data changes
  
  
  // Subscribe to specific store values to ensure re-renders
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const setClientData = useFinancialStore((state) => state.setClientData);
  const setActiveClient = useFinancialStore((state) => state.setActiveClient);
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const superBalance = useFinancialStore((state) => state.superBalance);
  const cashSavings = useFinancialStore((state) => state.cashSavings);
  const investments = useFinancialStore((state) => state.investments);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  
  const clientData = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;

  // For combined results display
  const hasClientA = clientA && (clientA.firstName || clientA.grossSalary || clientA.annualIncome);
  const hasClientB = clientB && (clientB.firstName || clientB.grossSalary || clientB.annualIncome);
  const showCombined = hasClientA && hasClientB;
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';
  
  // Get projection results from both clients
  const clientAResults = clientA?.projectionResults;
  const clientBResults = clientB?.projectionResults;
  
  // Calculate combined projections if both clients have results
  const combinedProjections = (showCombined && clientAResults && clientBResults) ? {
    projectedLumpSum: (clientAResults.projectedLumpSum || 0) + (clientBResults.projectedLumpSum || 0),
    projectedPassiveIncome: (clientAResults.projectedPassiveIncome || 0) + (clientBResults.projectedPassiveIncome || 0),
    requiredIncome: (clientAResults.requiredIncome || 0) + (clientBResults.requiredIncome || 0),
    monthlyDeficitSurplus: 0, // Will be calculated below
    isDeficit: false, // Will be calculated below
    averageYearsToRetirement: Math.round(((clientAResults.yearsToRetirement || 0) + (clientBResults.yearsToRetirement || 0)) / 2)
  } : null;
  
  // Calculate combined deficit/surplus
  if (combinedProjections) {
    const surplus = combinedProjections.projectedPassiveIncome - combinedProjections.requiredIncome;
    combinedProjections.monthlyDeficitSurplus = Math.abs(surplus) / 12;
    combinedProjections.isDeficit = surplus < 0;
  }

  // Set viewMode to combined when both clients exist
  useEffect(() => {
    if (showCombined && viewMode !== 'combined') {
      setViewMode('combined');
    }
  }, [showCombined, viewMode]);

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
  
  // Sync projection form values back to client data for cross-page synchronization
  useEffect(() => {
    if (!activeClient) return;
    
    const syncTimeoutId = setTimeout(() => {
      // Only sync if we have valid data
      if (watchedProjectionData.currentAge > 0 || watchedProjectionData.retirementAge > 0 ||
          watchedProjectionData.annualIncome > 0 || watchedProjectionData.currentSuper > 0) {
        setClientData(activeClient, {
          currentAge: watchedProjectionData.currentAge,
          retirementAge: watchedProjectionData.retirementAge,
          annualIncome: watchedProjectionData.annualIncome,
          grossSalary: watchedProjectionData.annualIncome,
          currentSuper: watchedProjectionData.currentSuper,
          currentSavings: watchedProjectionData.currentSavings,
          currentShares: watchedProjectionData.currentShares,
          propertyEquity: watchedProjectionData.propertyEquity,
          monthlyDebtPayments: watchedProjectionData.monthlyDebtPayments,
          monthlyRentalIncome: watchedProjectionData.monthlyRentalIncome,
          monthlyExpenses: watchedProjectionData.monthlyExpenses,
          // Also sync assumptions
          inflationRate: watchedAssumptionsData.inflationRate,
          salaryGrowthRate: watchedAssumptionsData.salaryGrowthRate,
          superReturn: watchedAssumptionsData.superReturn,
          shareReturn: watchedAssumptionsData.shareReturn,
          propertyGrowthRate: watchedAssumptionsData.propertyGrowthRate,
          withdrawalRate: watchedAssumptionsData.withdrawalRate,
          rentGrowthRate: watchedAssumptionsData.rentGrowthRate,
        });
      }
    }, 500); // Debounce to prevent excessive updates
    
    return () => clearTimeout(syncTimeoutId);
  }, [
    activeClient,
    setClientData,
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
    watchedAssumptionsData.rentGrowthRate,
  ]);

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
          
          // Also calculate for the other client if both exist
          if (showCombined) {
            if (activeClient === 'A' && clientB) {
              const bProjectionData: ProjectionData = {
                currentAge: clientB.currentAge ?? 0,
                retirementAge: clientB.retirementAge ?? 65,
                annualIncome: clientB.annualIncome ?? clientB.grossSalary ?? 0,
                currentSuper: clientB.superFundValue ?? 0,
                currentSavings: clientB.savingsValue ?? 0,
                currentShares: clientB.sharesValue ?? 0,
                propertyEquity: clientB.propertyEquity ?? 0,
                monthlyDebtPayments: clientB.monthlyDebtPayments ?? 0,
                monthlyRentalIncome: clientB.monthlyRentalIncome ?? (clientB.rentalIncome ? clientB.rentalIncome / 12 : 0),
                monthlyExpenses: clientB.monthlyExpenses ?? 0
              };
              const bAssumptionsData: AssumptionsData = {
                inflationRate: clientB.inflationRate ?? DEFAULT_ASSUMPTIONS.inflationRate,
                salaryGrowthRate: clientB.salaryGrowthRate ?? DEFAULT_ASSUMPTIONS.salaryGrowthRate,
                superReturn: clientB.superReturn ?? DEFAULT_ASSUMPTIONS.superReturn,
                shareReturn: clientB.shareReturn ?? DEFAULT_ASSUMPTIONS.shareReturn,
                propertyGrowthRate: clientB.propertyGrowthRate ?? DEFAULT_ASSUMPTIONS.propertyGrowthRate,
                withdrawalRate: clientB.withdrawalRate ?? DEFAULT_ASSUMPTIONS.withdrawalRate,
                rentGrowthRate: clientB.rentGrowthRate ?? DEFAULT_ASSUMPTIONS.rentGrowthRate
              };
              calculateProjections(bProjectionData, bAssumptionsData, 'B');
            } else if (activeClient === 'B' && clientA) {
              const aProjectionData: ProjectionData = {
                currentAge: clientA.currentAge ?? 0,
                retirementAge: clientA.retirementAge ?? 65,
                annualIncome: clientA.annualIncome ?? clientA.grossSalary ?? 0,
                currentSuper: clientA.superFundValue ?? 0,
                currentSavings: clientA.savingsValue ?? 0,
                currentShares: clientA.sharesValue ?? 0,
                propertyEquity: clientA.propertyEquity ?? 0,
                monthlyDebtPayments: clientA.monthlyDebtPayments ?? 0,
                monthlyRentalIncome: clientA.monthlyRentalIncome ?? (clientA.rentalIncome ? clientA.rentalIncome / 12 : 0),
                monthlyExpenses: clientA.monthlyExpenses ?? 0
              };
              const aAssumptionsData: AssumptionsData = {
                inflationRate: clientA.inflationRate ?? DEFAULT_ASSUMPTIONS.inflationRate,
                salaryGrowthRate: clientA.salaryGrowthRate ?? DEFAULT_ASSUMPTIONS.salaryGrowthRate,
                superReturn: clientA.superReturn ?? DEFAULT_ASSUMPTIONS.superReturn,
                shareReturn: clientA.shareReturn ?? DEFAULT_ASSUMPTIONS.shareReturn,
                propertyGrowthRate: clientA.propertyGrowthRate ?? DEFAULT_ASSUMPTIONS.propertyGrowthRate,
                withdrawalRate: clientA.withdrawalRate ?? DEFAULT_ASSUMPTIONS.withdrawalRate,
                rentGrowthRate: clientA.rentGrowthRate ?? DEFAULT_ASSUMPTIONS.rentGrowthRate
              };
              calculateProjections(aProjectionData, aAssumptionsData, 'A');
            }
          }
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

  const calculateProjections = (inputProjectionData?: ProjectionData, inputAssumptionsData?: AssumptionsData, client?: 'A' | 'B') => {
    // ========================================
    // ASIC MONEYSMART VERIFIED CALCULATOR
    // Based on ASIC Regulatory Guide 276
    // ========================================
    
    const projectionData = inputProjectionData || projectionForm.getValues();
    const assumptions = inputAssumptionsData || assumptionsForm.getValues();
    const targetClient = client || activeClient;
    
    if (!inputProjectionData) setIsCalculating(true);

    try {
      // CONSTANTS
      const SUPER_GUARANTEE_RATE = 0.115; // 11.5% for 2024-25
      const RETIREMENT_INCOME_THRESHOLD = 0.70; // 70% ASFA comfortable retirement standard
      
      // Convert to decimals
      const years = Math.max(0, projectionData.retirementAge - projectionData.currentAge);
      if (years <= 0) {
        if (!inputProjectionData) toast({ title: 'Invalid Input', description: 'Retirement age must be greater than current age', variant: 'destructive' });
        if (!inputProjectionData) setIsCalculating(false);
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
      
      // Calculate debt payments at retirement - only include loans that won't be paid off
      // Get liabilities from client data (Financial Position page)
      const liabilities = clientData?.liabilities || [];
      const monthlyDebtAtRetirement = calculateDebtPaymentsAtRetirement(liabilities, years);
      const annualDebtPaymentsAtRetirement = monthlyDebtAtRetirement * 12;
      
      // Calculate available income at retirement: passive income minus debt payments that still exist
      const availableIncomeAtRetirement = annualPassiveIncome - annualDebtPaymentsAtRetirement;
      
      // Calculate surplus or deficit: available income vs 70% of current income
      // This matches the summary page's calculateRetirementDeficitSurplus function
      const surplusOrDeficit = availableIncomeAtRetirement - targetRetirementIncome;
      const percentageOfTarget = targetRetirementIncome > 0 ? 
        (availableIncomeAtRetirement / targetRetirementIncome) * 100 : 0;
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
      console.log('Total liabilities count:', liabilities.length);
      console.log('Monthly debt payments at retirement:', monthlyDebtAtRetirement);
      console.log('Annual debt payments at retirement:', annualDebtPaymentsAtRetirement);
      console.log('Available income (passive - debt at retirement):', availableIncomeAtRetirement);
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

      // Store projection results in client data for Summary page to use
      if (targetClient) {
        setClientData(targetClient, {
          projectionResults: {
            yearsToRetirement: years,
            projectedLumpSum,
            projectedPassiveIncome: annualPassiveIncome,
            projectedMonthlyPassiveIncome: annualPassiveIncome / 12,
            requiredIncome: targetRetirementIncome,
            monthlyDeficitSurplus,
            isDeficit,
            calculatedAt: new Date().toISOString(),
          }
        });
      }

      setTimeout(() => {
        if (!inputProjectionData) setResults(calculatedResults);
        if (!inputProjectionData) setIsCalculating(false);
        if (!inputProjectionData) toast({ title: 'Projections calculated', description: `Your retirement projection has been updated` });
      }, 300);
    } catch (err) {
      console.error('Projection calculation error', err);
      if (!inputProjectionData) {
        toast({ title: 'Calculation Error', description: 'An error occurred while calculating projections', variant: 'destructive' });
        setIsCalculating(false);
      }
    }
  };

  // State for dual forms
  const [clientAFormData, setClientAFormData] = useState<ProjectionData | null>(null);
  const [clientBFormData, setClientBFormData] = useState<ProjectionData | null>(null);

  const handleFormChange = (slot: 'A' | 'B', data: ProjectionData) => {
    if (slot === 'A') {
      setClientAFormData(data);
    } else {
      setClientBFormData(data);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Financial Projections</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Plan your retirement and analyze future financial position</p>
        </div>
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
      </div>

      {/* Shared Assumptions */}
      <SharedAssumptionsSection />

      {/* Dual Client Forms - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Client A */}
        <div>
          <ProjectionForm
            clientSlot="A"
            clientData={clientA}
            onFormChange={handleFormChange}
          />
        </div>

        {/* Client B */}
        {clientB && (
          <div>
            <ProjectionForm
              clientSlot="B"
              clientData={clientB}
              onFormChange={handleFormChange}
            />
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Retirement Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Retirement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Age {activeClient === 'A' ? (clientA?.currentAge ?? 30) : (clientB?.currentAge ?? 30)}</span>
                  <span className="text-muted-foreground">Age {activeClient === 'A' ? (clientA?.retirementAge ?? 65) : (clientB?.retirementAge ?? 65)}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, ((activeClient === 'A' ? (clientA?.currentAge ?? 30) : (clientB?.currentAge ?? 30)) / (activeClient === 'A' ? (clientA?.retirementAge ?? 65) : (clientB?.retirementAge ?? 65))) * 100))} className="h-2" />
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(activeClient === 'A' ? (clientA?.retirementAge ?? 65) : (clientB?.retirementAge ?? 65)) - (activeClient === 'A' ? (clientA?.currentAge ?? 30) : (clientB?.currentAge ?? 30))} years
                  </p>
                  <p className="text-sm text-muted-foreground">until retirement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for results */}
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
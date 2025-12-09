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
import { calculateMonthlySurplus } from '@/lib/finance/calculations';
import { calculateServiceability as canonicalCalculateServiceability } from '@/lib/finance/serviceability';

const propertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  purchasePrice: z.number().min(0, 'Price must be positive'),
  currentValue: z.number().min(0, 'Value must be positive'),
  loanAmount: z.number().min(0, 'Loan amount must be positive'),
  interestRate: z.number().min(0).max(20, 'Rate must be between 0-20%'),
  loanTerm: z.number().min(1).max(50, 'Term must be between 1-50 years'),
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
  loanTerm: z.number().min(1).max(50, 'Term must be between 1-50 years'),
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
  const [properties, setProperties] = useState<Property[]>([]);
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

  // Subscribe to specific store values to ensure re-renders
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const totalDebt = useFinancialStore((state) => state.totalDebt);
  const cashSavings = useFinancialStore((state) => state.cashSavings);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  
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

  // Adapter: map the serviceability form data into the canonical serviceability function
  const calculateServiceability = (data: ServiceabilityData): ServiceabilityResult => {
    const clientData: any = {
      income: {
        // canonical monthly/gross representation expected by canonical functions
        annual: data.annualIncome || 0
      },
      expenses: {
        living: data.monthlyExpenses || 0
      },
      loans: [
        {
          // existing monthly repayment passed through
          monthlyRepayment: data.existingDebtPayments || 0
        }
      ],
      properties: []
    };

    const proposedLoan: any = {
      amount: Math.max(0, (data.targetPropertyPrice || 0) - (data.deposit || 0)),
      interestRate: data.interestRate || 0,
      termYears: data.loanTerm || 0,
      expectedRentWeekly: data.expectedRent || 0,
      annualExpenses: data.annualPropertyExpenses || 0,
      depreciation: data.depreciationAmount || 0,
    };

    // Use canonical serviceability implementation
    const canonical = canonicalCalculateServiceability({ clientData, proposedLoan } as any);

    // Map canonical result into the local ServiceabilityResult shape (best-effort)
    const mapped: ServiceabilityResult = {
      // maxBorrowingCapacity isn't provided by canonical result; leave 0 as placeholder
      maxBorrowingCapacity: 0,
      // Expose monthly net income as the primary service capacity
      monthlyServiceCapacity: canonical.monthlyNetIncome ?? 0,
      loanToValueRatio: 0,
      debtToIncomeRatio: 0,
      canAfford: !!canonical.canAfford,
      monthlyShortfall: canonical.netSurplusAfterLoan < 0 ? Math.abs(Math.round(canonical.netSurplusAfterLoan)) : undefined,
      isNegativelyGeared: canonical.netSurplusAfterLoan < 0,
      negativeGearingAmount: canonical.netSurplusAfterLoan < 0 ? Math.abs(Math.round(canonical.netSurplusAfterLoan) * 12) : 0,
      annualTaxBenefit: 0,
      monthlyTaxBenefit: 0,
      netMonthlyPaymentAfterTax: canonical.monthlyRepayment ?? 0
    };

    return mapped;
  };

  const addProperty = (data: z.infer<typeof propertySchema>) => {
    const newProperty: Property = { ...data, id: Date.now().toString() };
    setProperties([...properties, newProperty]);
    propertyForm.reset();
    toast({ title: 'Property added', description: `${data.address} has been added to your portfolio` });
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter(property => property.id !== id));
    toast({ title: 'Property removed', description: 'Property has been removed from your portfolio' });
  };

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
      totalCashFlow: totals.totalCashFlow + analysis.monthlyCashFlow,
      totalTaxBenefit: totals.totalTaxBenefit + analysis.taxBenefit
    };
  }, {
    totalValue: 0,
    totalDebt: 0,
    totalEquity: 0,
    totalRent: 0,
    totalCashFlow: 0,
    totalTaxBenefit: 0
  });

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investment Properties</h1>
          <p className="text-muted-foreground">Analyze property investments and calculate serviceability</p>
        </div>
      </div>

      {/* Portfolio Summary */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">${portfolioTotals.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

                    <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                  <p className="text-4xl font-bold mt-2">
                    ${portfolioTotals.totalEquity.toLocaleString()}
                  </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary">${portfolioTotals.totalRent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${portfolioTotals.totalCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    ${portfolioTotals.totalCashFlow.toLocaleString()}
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                                step="0.1"
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
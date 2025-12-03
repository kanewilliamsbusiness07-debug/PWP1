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
  currentSalary: z.number().min(0),
  currentSuper: z.number().min(0),
  currentSavings: z.number().min(0),
  currentShares: z.number().min(0),
  propertyEquity: z.number().min(0),
  monthlyDebtPayments: z.number().min(0),
  monthlyRentalIncome: z.number().min(0)
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
}

export default function ProjectionsPage() {
  const [results, setResults] = useState<ProjectionResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const financialStore = useFinancialStore();
  const activeClient = financialStore.activeClient;
  const clientData = activeClient ? (activeClient === 'A' ? financialStore.clientA : financialStore.clientB) : null;

  const projectionForm = useForm<ProjectionData>({
    resolver: zodResolver(projectionSchema),
    defaultValues: {
      currentAge: clientData?.currentAge ?? 0,
      retirementAge: clientData?.retirementAge ?? 0,
      currentSalary: financialStore.grossIncome ?? 0,
      currentSuper: financialStore.superBalance ?? 0,
      currentSavings: financialStore.cashSavings ?? 0,
      currentShares: financialStore.investments ?? 0,
      propertyEquity: clientData?.propertyEquity ?? 0,
      monthlyDebtPayments: clientData?.monthlyDebtPayments ?? 0,
      monthlyRentalIncome: clientData?.monthlyRentalIncome ?? (financialStore.rentalIncome ? financialStore.rentalIncome / 12 : 0)
    }
  });

  // Watch store and client data, update form when they change
  useEffect(() => {
    if (!activeClient) return;
    
    projectionForm.reset({
      currentAge: clientData?.currentAge ?? 0,
      retirementAge: clientData?.retirementAge ?? 0,
      currentSalary: financialStore.grossIncome ?? 0,
      currentSuper: financialStore.superBalance ?? 0,
      currentSavings: financialStore.cashSavings ?? 0,
      currentShares: financialStore.investments ?? 0,
      propertyEquity: clientData?.propertyEquity ?? 0,
      monthlyDebtPayments: clientData?.monthlyDebtPayments ?? 0,
      monthlyRentalIncome: clientData?.monthlyRentalIncome ?? (financialStore.rentalIncome ? financialStore.rentalIncome / 12 : 0)
    });
  }, [
    financialStore.grossIncome,
    financialStore.superBalance,
    financialStore.cashSavings,
    financialStore.investments,
    financialStore.rentalIncome,
    clientData?.currentAge,
    clientData?.retirementAge,
    clientData?.propertyEquity,
    clientData?.monthlyDebtPayments,
    clientData?.monthlyRentalIncome,
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

  // Watch client data and update assumptions form when it changes
  useEffect(() => {
    if (!activeClient) return;
    
    assumptionsForm.reset({
      inflationRate: clientData?.inflationRate ?? 0,
      salaryGrowthRate: clientData?.salaryGrowthRate ?? 0,
      superReturn: clientData?.superReturn ?? 0,
      shareReturn: clientData?.shareReturn ?? 0,
      propertyGrowthRate: clientData?.propertyGrowthRate ?? 0,
      withdrawalRate: clientData?.withdrawalRate ?? 0,
      rentGrowthRate: clientData?.rentGrowthRate ?? 0
    });
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

  const calculateProjections = () => {
    const projectionData = projectionForm.getValues();
    const assumptions = assumptionsForm.getValues();
    
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const yearsToRetirement = projectionData.retirementAge - projectionData.currentAge;
      
      // Calculate projected lump sum with compound growth
      const superGrowthFactor = Math.pow(1 + assumptions.superReturn / 100, yearsToRetirement);
      const shareGrowthFactor = Math.pow(1 + assumptions.shareReturn / 100, yearsToRetirement);
      const propertyGrowthFactor = Math.pow(1 + assumptions.propertyGrowthRate / 100, yearsToRetirement);
      const savingsGrowthFactor = Math.pow(1 + 2 / 100, yearsToRetirement); // Conservative 2% for savings
      
      const projectedSuper = projectionData.currentSuper * superGrowthFactor;
      const projectedShares = projectionData.currentShares * shareGrowthFactor;
      const projectedProperty = projectionData.propertyEquity * propertyGrowthFactor;
      const projectedSavings = projectionData.currentSavings * savingsGrowthFactor;
      
      const projectedLumpSum = projectedSuper + projectedShares + projectedProperty + projectedSavings;
      
      // Calculate passive income
      const withdrawalIncome = projectedLumpSum * (assumptions.withdrawalRate / 100);
      const rentGrowthFactor = Math.pow(1 + assumptions.rentGrowthRate / 100, yearsToRetirement);
      const projectedRentalIncome = (projectionData.monthlyRentalIncome * 12) * rentGrowthFactor;
      const projectedPassiveIncome = withdrawalIncome + projectedRentalIncome;
      
      // Calculate required income (70% of current salary adjusted for inflation)
      const inflationFactor = Math.pow(1 + assumptions.inflationRate / 100, yearsToRetirement);
      const requiredIncome = (projectionData.currentSalary * 0.7) * inflationFactor;
      
      // Calculate deficit/surplus
      const annualDebtPayments = projectionData.monthlyDebtPayments * 12;
      const availableIncome = projectedPassiveIncome - annualDebtPayments;
      const isDeficit = availableIncome < requiredIncome;
      const monthlyDeficitSurplus = Math.abs(availableIncome - requiredIncome) / 12;
      
      // Calculate savings depletion if deficit exists
      let savingsDepletionYears;
      if (isDeficit && projectedSavings > 0) {
        const annualDeficit = requiredIncome - availableIncome;
        savingsDepletionYears = projectedSavings / annualDeficit;
      }
      
      const calculatedResults: ProjectionResults = {
        yearsToRetirement,
        projectedLumpSum,
        projectedPassiveIncome,
        requiredIncome,
        monthlyDeficitSurplus,
        isDeficit,
        savingsDepletionYears
      };
      
      setResults(calculatedResults);
      setIsCalculating(false);
      
      toast({
        title: 'Projections calculated',
        description: `Your retirement projection has been updated`
      });
    }, 1500);
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
                          name="currentSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Income</FormLabel>
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
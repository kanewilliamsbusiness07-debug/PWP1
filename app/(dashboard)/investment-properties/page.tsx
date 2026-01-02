/**
 * FinCalc Pro - Investment Properties Page
 * 
 * Property serviceability analysis and negative gearing calculations
 */

'use client';

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { Home, Calculator, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type Property = {
  id: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  weeklyRent: number;
  annualExpenses: number;
};

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
  breakevenMonthlyRent?: number;
  isNegativelyGeared: boolean;
  negativeGearingAmount: number;
  annualTaxBenefit: number;
  monthlyTaxBenefit: number;
  netMonthlyPaymentAfterTax: number;
  retirementMaxBorrowingCapacity?: number;
  retirementMonthlyServiceCapacity?: number;
  retirementLoanToValueRatio?: number;
  retirementDebtToIncomeRatio?: number;
}

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
  breakevenMonthlyRent?: number;
  isNegativelyGeared: boolean;
  negativeGearingAmount: number;
  annualTaxBenefit: number;
  monthlyTaxBenefit: number;
  netMonthlyPaymentAfterTax: number;
}

export default function InvestmentPropertiesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Subscribe to client data
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const financialStore = useFinancialStore();
  const { loadRecentClients } = useClientStorage();

  // Check if we have data in each client slot for combined view
  const hasClientA = clientA && (clientA.firstName || clientA.lastName || (clientA.annualIncome ?? clientA.grossSalary ?? 0) > 0 || ((clientA.properties as Property[])?.length ?? 0) > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.lastName || (clientB.annualIncome ?? clientB.grossSalary ?? 0) > 0 || ((clientB.properties as Property[])?.length ?? 0) > 0);
  const showCombined = hasClientA && hasClientB;

  // Auto-load recent client data if no client data is available
  useEffect(() => {
    const loadClientData = async () => {
      // Only load if we don't have any client data
      if (!hasClientA && !hasClientB) {
        try {
          let clients = await loadRecentClients(2); // Load up to 2 most recent clients
          
          // If no recent clients found, try to load all clients
          if (clients.length === 0) {
            try {
              const response = await fetch('/api/clients?limit=2', {
                credentials: 'include',
              });
              if (response.ok) {
                clients = await response.json();
              }
            } catch (apiError) {
              console.error('Error loading all clients from API:', apiError);
            }
          }
          
          if (clients.length > 0) {
            // Load first client into slot A
            financialStore.setClientData('A', {
              ...clients[0],
              dateOfBirth: clients[0].dob ? (typeof clients[0].dob === 'string' ? new Date(clients[0].dob) : clients[0].dob) : undefined,
            } as any);
            
            // Load second client into slot B if available
            if (clients.length > 1) {
              financialStore.setClientData('B', {
                ...clients[1],
                dateOfBirth: clients[1].dob ? (typeof clients[1].dob === 'string' ? new Date(clients[1].dob) : clients[1].dob) : undefined,
              } as any);
            }
          }
        } catch (error) {
          console.error('Error loading client data:', error);
        }
      }
    };

    loadClientData();
  }, [hasClientA, hasClientB]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get client names
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';

  // Get properties from both clients
  const clientAProperties: Property[] = (clientA?.properties as Property[]) || [];
  const clientBProperties: Property[] = (clientB?.properties as Property[]) || [];

  // Calculate loan payment function
  const calculateLoanPayment = (principal: number, rate: number, years: number): number => {
    if (rate === 0) return principal / (years * 12);
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Calculate property analysis
  const calculatePropertyAnalysis = (property: Property): PropertyAnalysis => {
    const monthlyLoanPayment = calculateLoanPayment(property.loanAmount, property.interestRate, property.loanTerm);
    const monthlyRent = (property.weeklyRent * 52) / 12;

    // Estimate additional yearly property costs
    const annualRent = monthlyRent * 12;
    const councilRates = property.currentValue * 0.0075; // 0.75% of property value
    const insurance = property.currentValue * 0.004; // 0.4% of property value
    const maintenance = property.currentValue * 0.015; // 1.5% of property value
    const propertyManagement = annualRent * 0.09; // 9% of annual rent
    const strataFees = 1500; // Estimated annual strata fees

    // Total annual expenses including estimated costs
    const totalAnnualExpenses = property.annualExpenses + councilRates + insurance + maintenance + propertyManagement + strataFees;

    const monthlyCashFlow = monthlyRent - monthlyLoanPayment - (totalAnnualExpenses / 12);
    const annualCashFlow = monthlyCashFlow * 12;
    const rentalYield = (monthlyRent * 12) / property.currentValue * 100;
    const isNegativelyGeared = monthlyCashFlow < 0;
    const taxBenefit = isNegativelyGeared ? Math.abs(annualCashFlow) * 0.325 : 0; // Assuming 32.5% marginal tax rate
    const netCashFlow = annualCashFlow + taxBenefit;

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

  // Calculate serviceability for a client
  const calculateServiceability = (client: any): ServiceabilityResult | null => {
    if (!client) return null;

    const annualIncome = client.annualIncome ?? client.grossSalary ?? 0;
    const monthlyExpenses = client.monthlyExpenses ?? 0;
    const existingDebtPayments = client.monthlyDebtPayments ?? 0;
    const cashSavings = client.currentSavings ?? client.savingsValue ?? 0;

    // Get monthly surplus from financial projections results
    const monthlySurplus = financialStore.results?.clientA?.monthlyDeficitSurplus ?? 
                          financialStore.results?.clientB?.monthlyDeficitSurplus ?? 
                          0;

    // Get retirement passive income from financial projections
    const retirementAnnualIncome = financialStore.results?.clientA?.projectedAnnualPassiveIncome ??
                                   financialStore.results?.clientB?.projectedAnnualPassiveIncome ?? 
                                   0;
    const retirementMonthlySurplus = retirementAnnualIncome / 12;

    // Get interest rate from shared assumptions (using super return as proxy for loan interest rate)
    const interestRate = financialStore.sharedAssumptions?.superReturn ?? 6.5;

    // Use 50% of savings for down payment
    const deposit = cashSavings * 0.5;

    // Calculate target property price based on 80% LVR
    // LVR = Loan Amount / Property Value = 80% = 0.8
    // So Property Value = Loan Amount / 0.8 = Loan Amount * 1.25
    // But we need to determine what loan amount we can afford based on surplus

    // CURRENT SERVICEABILITY
    // Use monthly surplus as the available amount for loan payments
    const availableMonthlyPayment = Math.max(0, monthlySurplus);

    // Calculate maximum loan amount based on available payment and interest rate
    const loanTerm = 30; // 30 years
    let maxLoanAmount = 0;
    if (availableMonthlyPayment > 0) {
      // Use loan payment formula to solve for principal
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;
      maxLoanAmount = availableMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);
    }

    // With 80% LVR, maximum property value = maxLoanAmount / 0.8
    const maxPropertyValue = maxLoanAmount / 0.8;

    // But we also need to consider the deposit - property value can't exceed what we can afford with deposit
    const maxPropertyWithDeposit = deposit / 0.2; // 20% deposit needed for 80% LVR

    // Take the minimum of what we can afford based on income vs deposit
    const targetPropertyPrice = Math.min(maxPropertyValue, maxPropertyWithDeposit);

    // Recalculate loan amount based on final property price and 80% LVR
    const loanAmount = targetPropertyPrice * 0.8;

    // Ensure we don't exceed our payment capacity
    const monthlyLoanPayment = calculateLoanPayment(loanAmount, interestRate, loanTerm);

    // RETIREMENT SERVICEABILITY
    const retirementAvailableMonthlyPayment = Math.max(0, retirementMonthlySurplus);
    let retirementMaxLoanAmount = 0;
    if (retirementAvailableMonthlyPayment > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;
      retirementMaxLoanAmount = retirementAvailableMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);
    }
    const retirementMaxPropertyValue = retirementMaxLoanAmount / 0.8;
    const retirementMaxPropertyWithDeposit = deposit / 0.2;
    const retirementTargetPropertyPrice = Math.min(retirementMaxPropertyValue, retirementMaxPropertyWithDeposit);
    const retirementLoanAmount = retirementTargetPropertyPrice * 0.8;
    const retirementMonthlyLoanPayment = calculateLoanPayment(retirementLoanAmount, interestRate, loanTerm);

    // Negative gearing analysis (using current serviceability)
    const expectedRent = (targetPropertyPrice * 0.004); // 0.4% of property value per week
    const annualRent = expectedRent * 52;
    const annualPropertyExpenses = targetPropertyPrice * 0.02; // 2% of property value
    const annualCashFlow = annualRent - (monthlyLoanPayment * 12) - annualPropertyExpenses;
    const isNegativelyGeared = annualCashFlow < 0;
    const negativeGearingAmount = Math.abs(annualCashFlow);
    const annualTaxBenefit = negativeGearingAmount * 0.325; // 32.5% marginal tax rate
    const monthlyTaxBenefit = annualTaxBenefit / 12;
    const netMonthlyPaymentAfterTax = monthlyLoanPayment - monthlyTaxBenefit;

    const canAfford = monthlyLoanPayment <= availableMonthlyPayment;
    const breakevenMonthlyRent = monthlyLoanPayment + (annualPropertyExpenses / 12);

    return {
      maxBorrowingCapacity: targetPropertyPrice,
      monthlyServiceCapacity: availableMonthlyPayment,
      loanToValueRatio: 80, // Fixed at 80% as required
      debtToIncomeRatio: ((existingDebtPayments + monthlyLoanPayment) / (annualIncome / 12)) * 100,
      canAfford,
      breakevenMonthlyRent,
      isNegativelyGeared,
      negativeGearingAmount,
      annualTaxBenefit,
      monthlyTaxBenefit,
      netMonthlyPaymentAfterTax,
      // Retirement serviceability
      retirementMaxBorrowingCapacity: retirementTargetPropertyPrice,
      retirementMonthlyServiceCapacity: retirementAvailableMonthlyPayment,
      retirementLoanToValueRatio: 80,
      retirementDebtToIncomeRatio: retirementAnnualIncome > 0 ? ((existingDebtPayments + retirementMonthlyLoanPayment) / (retirementAnnualIncome / 12)) * 100 : 0,
    };
  };

  const clientAServiceability = calculateServiceability(clientA);
  const clientBServiceability = calculateServiceability(clientB);

  // Calculate combined serviceability
  const combinedServiceability = showCombined && clientAServiceability && clientBServiceability ? {
    maxBorrowingCapacity: clientAServiceability.maxBorrowingCapacity + clientBServiceability.maxBorrowingCapacity,
    monthlyServiceCapacity: clientAServiceability.monthlyServiceCapacity + clientBServiceability.monthlyServiceCapacity,
    loanToValueRatio: Math.max(clientAServiceability.loanToValueRatio, clientBServiceability.loanToValueRatio),
    debtToIncomeRatio: Math.max(clientAServiceability.debtToIncomeRatio, clientBServiceability.debtToIncomeRatio),
    canAfford: clientAServiceability.canAfford && clientBServiceability.canAfford,
    breakevenMonthlyRent: (clientAServiceability.breakevenMonthlyRent ?? 0) + (clientBServiceability.breakevenMonthlyRent ?? 0),
    isNegativelyGeared: clientAServiceability.isNegativelyGeared || clientBServiceability.isNegativelyGeared,
    negativeGearingAmount: clientAServiceability.negativeGearingAmount + clientBServiceability.negativeGearingAmount,
    annualTaxBenefit: clientAServiceability.annualTaxBenefit + clientBServiceability.annualTaxBenefit,
    monthlyTaxBenefit: clientAServiceability.monthlyTaxBenefit + clientBServiceability.monthlyTaxBenefit,
    netMonthlyPaymentAfterTax: clientAServiceability.netMonthlyPaymentAfterTax + clientBServiceability.netMonthlyPaymentAfterTax
  } : null;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Investment Properties</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Property investment analysis and serviceability calculations based on your financial position
        </p>
      </div>

      {/* Client Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="client-a" disabled={!hasClientA} className="text-xs sm:text-sm">
            {clientAName}
          </TabsTrigger>
          <TabsTrigger value="client-b" disabled={!hasClientB} className="text-xs sm:text-sm">
            {clientBName}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {showCombined ? (
            <div className="space-y-6">
              {/* Combined Serviceability Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Combined Household Serviceability
                  </CardTitle>
                  <CardDescription>
                    Investment property serviceability for {clientAName} & {clientBName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Max Borrowing Capacity</p>
                      <p className="text-2xl font-bold text-green-600">${combinedServiceability?.maxBorrowingCapacity.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Service Capacity</p>
                      <p className="text-2xl font-bold">${combinedServiceability?.monthlyServiceCapacity.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">LVR</p>
                      <p className="text-2xl font-bold">{combinedServiceability?.loanToValueRatio.toFixed(1) ?? 0}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">DTI</p>
                      <p className="text-2xl font-bold">{combinedServiceability?.debtToIncomeRatio.toFixed(1) ?? 0}%</p>
                    </div>
                  </div>

                  {/* Affordability Status */}
                  <div className="flex items-center justify-center gap-4">
                    {combinedServiceability?.canAfford ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Can afford investment property</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Breakeven monthly rent: ${combinedServiceability?.breakevenMonthlyRent?.toLocaleString() ?? 0}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Combined Properties */}
              {(clientAProperties.length > 0 || clientBProperties.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Combined Property Portfolio</CardTitle>
                    <CardDescription>
                      All investment properties across both clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...clientAProperties, ...clientBProperties].map((property, index) => {
                        const analysis = calculatePropertyAnalysis(property);
                        return (
                          <div key={property.id || index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{property.address}</h4>
                              <Badge variant={analysis.isNegativelyGeared ? "destructive" : "default"}>
                                {analysis.isNegativelyGeared ? "Negatively Geared" : "Positively Geared"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Monthly Cash Flow</p>
                                <p className={`font-semibold ${analysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.monthlyCashFlow.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Rental Yield</p>
                                <p className="font-semibold">{analysis.rentalYield.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tax Benefit</p>
                                <p className="font-semibold text-green-600">${analysis.taxBenefit.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Net Cash Flow</p>
                                <p className={`font-semibold ${analysis.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.netCashFlow.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Add client information to see investment property analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-a" className="space-y-6">
          {clientAServiceability ? (
            <div className="space-y-6">
              {/* Client A Serviceability */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientAName} - Investment Property Serviceability</CardTitle>
                  <CardDescription>
                    Serviceability analysis based on current financial position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Max Borrowing Capacity</p>
                      <p className="text-2xl font-bold text-green-600">${clientAServiceability.maxBorrowingCapacity.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Service Capacity</p>
                      <p className="text-2xl font-bold">${clientAServiceability.monthlyServiceCapacity.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">LVR</p>
                      <p className="text-2xl font-bold">{clientAServiceability.loanToValueRatio.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">DTI</p>
                      <p className="text-2xl font-bold">{clientAServiceability.debtToIncomeRatio.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Affordability Status */}
                  <div className="flex items-center justify-center gap-4">
                    {clientAServiceability.canAfford ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Can afford investment property</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Breakeven monthly rent: ${clientAServiceability.breakevenMonthlyRent?.toLocaleString() ?? 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Current vs Retirement Serviceability Comparison */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Serviceability Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-4 py-2 text-left">Metric</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Current</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Retirement</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-200 px-4 py-2 font-medium">Max Borrowing Capacity</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${clientAServiceability.maxBorrowingCapacity.toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${(clientAServiceability.retirementMaxBorrowingCapacity || 0).toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientAServiceability.retirementMaxBorrowingCapacity || 0) >= clientAServiceability.maxBorrowingCapacity ? 'text-green-600' : 'text-red-600'}`}>
                                ${((clientAServiceability.retirementMaxBorrowingCapacity || 0) - clientAServiceability.maxBorrowingCapacity).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">Monthly Service Capacity</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${clientAServiceability.monthlyServiceCapacity.toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${(clientAServiceability.retirementMonthlyServiceCapacity || 0).toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientAServiceability.retirementMonthlyServiceCapacity || 0) >= clientAServiceability.monthlyServiceCapacity ? 'text-green-600' : 'text-red-600'}`}>
                                ${((clientAServiceability.retirementMonthlyServiceCapacity || 0) - clientAServiceability.monthlyServiceCapacity).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-4 py-2 font-medium">Debt-to-Income Ratio</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">{clientAServiceability.debtToIncomeRatio.toFixed(1)}%</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">{(clientAServiceability.retirementDebtToIncomeRatio || 0).toFixed(1)}%</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientAServiceability.retirementDebtToIncomeRatio || 0) <= clientAServiceability.debtToIncomeRatio ? 'text-green-600' : 'text-red-600'}`}>
                                {((clientAServiceability.retirementDebtToIncomeRatio || 0) - clientAServiceability.debtToIncomeRatio).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Negative Gearing Analysis */}
                  {clientAServiceability.isNegativelyGeared && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Negative Gearing Opportunity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700">Annual Loss</p>
                          <p className="font-semibold">${clientAServiceability.negativeGearingAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Tax Benefit</p>
                          <p className="font-semibold">${clientAServiceability.annualTaxBenefit.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Net Monthly Cost</p>
                          <p className="font-semibold">${clientAServiceability.netMonthlyPaymentAfterTax.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client A Properties */}
              {clientAProperties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientAProperties.map((property) => {
                        const analysis = calculatePropertyAnalysis(property);
                        return (
                          <div key={property.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{property.address}</h4>
                              <Badge variant={analysis.isNegativelyGeared ? "destructive" : "default"}>
                                {analysis.isNegativelyGeared ? "Negatively Geared" : "Positively Geared"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Monthly Cash Flow</p>
                                <p className={`font-semibold ${analysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.monthlyCashFlow.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Rental Yield</p>
                                <p className="font-semibold">{analysis.rentalYield.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tax Benefit</p>
                                <p className="font-semibold text-green-600">${analysis.taxBenefit.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Net Cash Flow</p>
                                <p className={`font-semibold ${analysis.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.netCashFlow.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No data available for {clientAName}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-b" className="space-y-6">
          {clientBServiceability ? (
            <div className="space-y-6">
              {/* Client B Serviceability */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientBName} - Investment Property Serviceability</CardTitle>
                  <CardDescription>
                    Serviceability analysis based on current financial position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Max Borrowing Capacity</p>
                      <p className="text-2xl font-bold text-green-600">${clientBServiceability.maxBorrowingCapacity.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Service Capacity</p>
                      <p className="text-2xl font-bold">${clientBServiceability.monthlyServiceCapacity.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">LVR</p>
                      <p className="text-2xl font-bold">{clientBServiceability.loanToValueRatio.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">DTI</p>
                      <p className="text-2xl font-bold">{clientBServiceability.debtToIncomeRatio.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Affordability Status */}
                  <div className="flex items-center justify-center gap-4">
                    {clientBServiceability.canAfford ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Can afford investment property</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Breakeven monthly rent: ${clientBServiceability.breakevenMonthlyRent?.toLocaleString() ?? 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Current vs Retirement Serviceability Comparison */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Serviceability Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-4 py-2 text-left">Metric</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Current</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Retirement</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-200 px-4 py-2 font-medium">Max Borrowing Capacity</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${clientBServiceability.maxBorrowingCapacity.toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${(clientBServiceability.retirementMaxBorrowingCapacity || 0).toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientBServiceability.retirementMaxBorrowingCapacity || 0) >= clientBServiceability.maxBorrowingCapacity ? 'text-green-600' : 'text-red-600'}`}>
                                ${((clientBServiceability.retirementMaxBorrowingCapacity || 0) - clientBServiceability.maxBorrowingCapacity).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">Monthly Service Capacity</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${clientBServiceability.monthlyServiceCapacity.toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">${(clientBServiceability.retirementMonthlyServiceCapacity || 0).toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientBServiceability.retirementMonthlyServiceCapacity || 0) >= clientBServiceability.monthlyServiceCapacity ? 'text-green-600' : 'text-red-600'}`}>
                                ${((clientBServiceability.retirementMonthlyServiceCapacity || 0) - clientBServiceability.monthlyServiceCapacity).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-4 py-2 font-medium">Debt-to-Income Ratio</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">{clientBServiceability.debtToIncomeRatio.toFixed(1)}%</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">{(clientBServiceability.retirementDebtToIncomeRatio || 0).toFixed(1)}%</td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`font-semibold ${(clientBServiceability.retirementDebtToIncomeRatio || 0) <= clientBServiceability.debtToIncomeRatio ? 'text-green-600' : 'text-red-600'}`}>
                                {((clientBServiceability.retirementDebtToIncomeRatio || 0) - clientBServiceability.debtToIncomeRatio).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Negative Gearing Analysis */}
                  {clientBServiceability.isNegativelyGeared && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Negative Gearing Opportunity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700">Annual Loss</p>
                          <p className="font-semibold">${clientBServiceability.negativeGearingAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Tax Benefit</p>
                          <p className="font-semibold">${clientBServiceability.annualTaxBenefit.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Net Monthly Cost</p>
                          <p className="font-semibold">${clientBServiceability.netMonthlyPaymentAfterTax.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client B Properties */}
              {clientBProperties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientBProperties.map((property) => {
                        const analysis = calculatePropertyAnalysis(property);
                        return (
                          <div key={property.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{property.address}</h4>
                              <Badge variant={analysis.isNegativelyGeared ? "destructive" : "default"}>
                                {analysis.isNegativelyGeared ? "Negatively Geared" : "Positively Geared"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Monthly Cash Flow</p>
                                <p className={`font-semibold ${analysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.monthlyCashFlow.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Rental Yield</p>
                                <p className="font-semibold">{analysis.rentalYield.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tax Benefit</p>
                                <p className="font-semibold text-green-600">${analysis.taxBenefit.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Net Cash Flow</p>
                                <p className={`font-semibold ${analysis.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${analysis.netCashFlow.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No data available for {clientBName}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

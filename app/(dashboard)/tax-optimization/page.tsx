/**
 * FinCalc Pro - Tax Optimization Page
 *
 * Australian tax calculations with optimization strategies
 */

'use client';

import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialStore } from '@/lib/store/store';

// Australian Tax Calculation Function
const calculateTax = (client: any) => {
  if (!client) return null;

  // Primary income (these are synonymous fields)
  const primaryIncome = client.annualIncome ?? client.grossSalary ?? client.employmentIncome ?? 0;
  const investmentIncome = client.investmentIncome ?? 0;
  const rentalIncome = client.rentalIncome ?? 0;
  const dividends = client.dividends ?? 0;
  const frankedDividends = client.frankedDividends ?? 0;
  const capitalGains = client.capitalGains ?? 0;
  const otherIncome = client.otherIncome ?? 0;

  const totalIncome = primaryIncome + investmentIncome + rentalIncome + dividends + frankedDividends + capitalGains + otherIncome;

  // Deductions
  const workRelatedExpenses = client.workRelatedExpenses ?? 0;
  const vehicleExpenses = client.vehicleExpenses ?? 0;
  const uniformsAndLaundry = client.uniformsAndLaundry ?? 0;
  const homeOfficeExpenses = client.homeOfficeExpenses ?? 0;
  const selfEducationExpenses = client.selfEducationExpenses ?? 0;
  const investmentExpenses = client.investmentExpenses ?? 0;
  const charityDonations = client.charityDonations ?? 0;
  const accountingFees = client.accountingFees ?? 0;
  const rentalExpenses = client.rentalExpenses ?? 0;
  const superContributions = client.superContributions ?? 0;

  const totalDeductions = workRelatedExpenses + vehicleExpenses + uniformsAndLaundry + homeOfficeExpenses + 
                         selfEducationExpenses + investmentExpenses + charityDonations + accountingFees + 
                         rentalExpenses + superContributions;
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  // Australian Tax Brackets 2023-24
  let incomeTax = 0;
  if (taxableIncome <= 18200) {
    incomeTax = 0;
  } else if (taxableIncome <= 45000) {
    incomeTax = (taxableIncome - 18200) * 0.19;
  } else if (taxableIncome <= 120000) {
    incomeTax = 5092 + (taxableIncome - 45000) * 0.325;
  } else if (taxableIncome <= 180000) {
    incomeTax = 29467 + (taxableIncome - 120000) * 0.37;
  } else {
    incomeTax = 51667 + (taxableIncome - 180000) * 0.45;
  }

  // Medicare Levy (2%)
  const medicareLevy = taxableIncome * 0.02;

  // HECS Repayment (if applicable)
  let hecsRepayment = 0;
  if (client.hecs && taxableIncome > 51550) {
    const hecsThreshold = 51550;
    const hecsRate = taxableIncome > 58150 ? 0.10 :
                    taxableIncome > 54750 ? 0.08 :
                    taxableIncome > 51550 ? 0.06 :
                    taxableIncome > 48350 ? 0.04 :
                    taxableIncome > 45150 ? 0.02 : 0;
    hecsRepayment = (taxableIncome - hecsThreshold) * hecsRate;
  }

  const totalTax = incomeTax + medicareLevy + hecsRepayment;
  const netIncome = totalIncome - totalTax;
  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
    taxableIncome,
    totalTax,
    netIncome,
    effectiveRate,
    incomeBreakdown: {
      employmentIncome: primaryIncome,
      investmentIncome,
      rentalIncome,
      otherIncome: dividends + frankedDividends + capitalGains + otherIncome
    },
    deductionsBreakdown: {
      workRelated: workRelatedExpenses + vehicleExpenses + uniformsAndLaundry + homeOfficeExpenses + selfEducationExpenses,
      investment: investmentExpenses,
      other: charityDonations + accountingFees + rentalExpenses + superContributions
    }
  };
};

// Tax Optimization Strategies
const calculateOptimizationStrategies = (client: any) => {
  if (!client) return [];

  const strategies = [];
  const annualIncome = client.annualIncome ?? client.grossSalary ?? 0;

  // Super contribution strategy
  if (annualIncome > 50000) {
    strategies.push({
      strategy: 'Increase Super Contributions',
      description: 'Contribute more to superannuation to reduce taxable income. Consider salary sacrificing.',
      potentialSavings: Math.min(annualIncome * 0.15, 11000) * 0.325
    });
  }

  // Deduction optimization
  const currentDeductions = (client.workRelatedExpenses ?? 0) + (client.investmentExpenses ?? 0);
  if (currentDeductions < annualIncome * 0.2) {
    strategies.push({
      strategy: 'Maximize Work-Related Deductions',
      description: 'Review and claim all eligible work-related expenses including home office, vehicle, and equipment costs.',
      potentialSavings: (annualIncome * 0.2 - currentDeductions) * 0.325
    });
  }

  // Investment strategy
  if ((client.investmentIncome ?? 0) > 0) {
    strategies.push({
      strategy: 'Offset Investment Income with Losses',
      description: 'Utilize capital losses or negative gearing to offset investment income.',
      potentialSavings: (client.investmentIncome ?? 0) * 0.325
    });
  }

  return strategies;
};

export default function TaxOptimizationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Subscribe to client data
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);

  // Check if we have data in each client slot for combined view
  const hasClientA = clientA && (clientA.firstName || clientA.lastName || (clientA.annualIncome ?? clientA.grossSalary ?? 0) > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.lastName || (clientB.annualIncome ?? clientB.grossSalary ?? 0) > 0);
  const showCombined = hasClientA && hasClientB;

  // Get client names
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';

  // Calculate tax for each client
  const clientATax = calculateTax(clientA);
  const clientBTax = calculateTax(clientB);

  // Calculate optimization strategies
  const clientAOptimizations = calculateOptimizationStrategies(clientA);
  const clientBOptimizations = calculateOptimizationStrategies(clientB);

  // Save tax optimization results to global state for consistency across pages
  useEffect(() => {
    if (clientATax) {
      const clientATaxResults = {
        currentTax: clientATax.totalTax,
        optimizedTax: clientATax.totalTax, // For now, same as current
        taxSavings: 0, // Will be calculated when optimization strategies are implemented
      };
      
      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        clientA: {
          ...currentResults.clientA,
          ...clientATaxResults,
        } as any, // Type assertion to handle partial updates
      });
    }
  }, [clientATax]);

  useEffect(() => {
    if (clientBTax) {
      const clientBTaxResults = {
        currentTax: clientBTax.totalTax,
        optimizedTax: clientBTax.totalTax, // For now, same as current
        taxSavings: 0, // Will be calculated when optimization strategies are implemented
      };
      
      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        clientB: {
          ...currentResults.clientB,
          ...clientBTaxResults,
        } as any, // Type assertion to handle partial updates
      });
    }
  }, [clientBTax]);

  useEffect(() => {
    if (clientATax && clientBTax) {
      const combinedTaxResults = {
        totalTax: clientATax.totalTax + clientBTax.totalTax,
        totalTaxSavings: 0, // Will be calculated when optimization strategies are implemented
      };
      
      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        combined: {
          ...currentResults.combined,
          ...combinedTaxResults,
        } as any, // Type assertion to handle partial updates
      });
    }
  }, [clientATax, clientBTax]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Tax Optimization</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Australian tax calculations and optimization strategies based on your financial position
        </p>
      </div>

      {/* Client Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client-a" disabled={!hasClientA}>
            {clientAName}
          </TabsTrigger>
          <TabsTrigger value="client-b" disabled={!hasClientB}>
            {clientBName}
          </TabsTrigger>
          <TabsTrigger value="combined" disabled={!showCombined}>
            Combined
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {showCombined ? (
            <div className="space-y-6">
              {/* Combined Tax Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Combined Household Tax Summary
                  </CardTitle>
                  <CardDescription>
                    Tax calculations for {clientAName} & {clientBName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${((clientATax?.totalIncome ?? 0) + (clientBTax?.totalIncome ?? 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${((clientATax?.totalTax ?? 0) + (clientBTax?.totalTax ?? 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Effective Rate</p>
                      <p className="text-2xl font-bold">
                        {(((clientATax?.totalTax ?? 0) + (clientBTax?.totalTax ?? 0)) /
                          Math.max(1, (clientATax?.totalIncome ?? 0) + (clientBTax?.totalIncome ?? 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Net Income</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${((clientATax?.netIncome ?? 0) + (clientBTax?.netIncome ?? 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Optimization Strategies */}
              {((clientAOptimizations?.length ?? 0) > 0 || (clientBOptimizations?.length ?? 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Combined Optimization Strategies</CardTitle>
                    <CardDescription>
                      Tax optimization opportunities across both clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...(clientAOptimizations ?? []), ...(clientBOptimizations ?? [])].map((strategy, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{strategy.strategy}</h4>
                            <Badge variant="secondary">
                              Potential Savings: ${strategy.potentialSavings.toLocaleString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Add client information to see tax optimization analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-a" className="space-y-6">
          {clientATax ? (
            <div className="space-y-6">
              {/* Client A Tax Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientAName} - Tax Calculation</CardTitle>
                  <CardDescription>
                    Australian tax calculation based on current financial position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">${clientATax.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold text-red-600">${clientATax.totalTax.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Effective Rate</p>
                      <p className="text-2xl font-bold">{clientATax.effectiveRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Net Income</p>
                      <p className="text-2xl font-bold text-blue-600">${clientATax.netIncome.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tax Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Income Sources</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Employment Income:</span>
                            <span>${clientATax.incomeBreakdown.employmentIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment Income:</span>
                            <span>${clientATax.incomeBreakdown.investmentIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rental Income:</span>
                            <span>${clientATax.incomeBreakdown.rentalIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Income:</span>
                            <span>${clientATax.incomeBreakdown.otherIncome.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Deductions</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Work-Related:</span>
                            <span>${clientATax.deductionsBreakdown.workRelated.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment:</span>
                            <span>${clientATax.deductionsBreakdown.investment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Deductions:</span>
                            <span>${clientATax.deductionsBreakdown.other.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client A Optimization Strategies */}
              {clientAOptimizations && clientAOptimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Optimization Strategies</CardTitle>
                    <CardDescription>
                      Strategies to minimize tax liability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientAOptimizations.map((strategy, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{strategy.strategy}</h4>
                            <Badge variant="secondary">
                              Potential Savings: ${strategy.potentialSavings.toLocaleString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No data available for {clientAName}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-b" className="space-y-6">
          {clientBTax ? (
            <div className="space-y-6">
              {/* Client B Tax Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientBName} - Tax Calculation</CardTitle>
                  <CardDescription>
                    Australian tax calculation based on current financial position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">${clientBTax.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold text-red-600">${clientBTax.totalTax.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Effective Rate</p>
                      <p className="text-2xl font-bold">{clientBTax.effectiveRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Net Income</p>
                      <p className="text-2xl font-bold text-blue-600">${clientBTax.netIncome.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tax Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Income Sources</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Employment Income:</span>
                            <span>${clientBTax.incomeBreakdown.employmentIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment Income:</span>
                            <span>${clientBTax.incomeBreakdown.investmentIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rental Income:</span>
                            <span>${clientBTax.incomeBreakdown.rentalIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Income:</span>
                            <span>${clientBTax.incomeBreakdown.otherIncome.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Deductions</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Work-Related:</span>
                            <span>${clientBTax.deductionsBreakdown.workRelated.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment:</span>
                            <span>${clientBTax.deductionsBreakdown.investment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Deductions:</span>
                            <span>${clientBTax.deductionsBreakdown.other.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client B Optimization Strategies */}
              {clientBOptimizations && clientBOptimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Optimization Strategies</CardTitle>
                    <CardDescription>
                      Strategies to minimize tax liability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientBOptimizations.map((strategy, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{strategy.strategy}</h4>
                            <Badge variant="secondary">
                              Potential Savings: ${strategy.potentialSavings.toLocaleString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No data available for {clientBName}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="combined" className="space-y-6">
          {showCombined && clientATax && clientBTax ? (
            <div className="space-y-6">
              {/* Combined Tax Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle>Combined Household Tax Calculation</CardTitle>
                  <CardDescription>
                    Joint tax calculation for {clientAName} & {clientBName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(clientATax.totalIncome + clientBTax.totalIncome).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Tax</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${(clientATax.totalTax + clientBTax.totalTax).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Effective Rate</p>
                      <p className="text-2xl font-bold">
                        {((clientATax.totalTax + clientBTax.totalTax) /
                          Math.max(1, clientATax.totalIncome + clientBTax.totalIncome) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Net Income</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(clientATax.netIncome + clientBTax.netIncome).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Combined Tax Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Combined Tax Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Combined Income Sources</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Employment Income:</span>
                            <span>${(clientATax.incomeBreakdown.employmentIncome + clientBTax.incomeBreakdown.employmentIncome).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment Income:</span>
                            <span>${(clientATax.incomeBreakdown.investmentIncome + clientBTax.incomeBreakdown.investmentIncome).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rental Income:</span>
                            <span>${(clientATax.incomeBreakdown.rentalIncome + clientBTax.incomeBreakdown.rentalIncome).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Income:</span>
                            <span>${(clientATax.incomeBreakdown.otherIncome + clientBTax.incomeBreakdown.otherIncome).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Combined Deductions</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Work-Related:</span>
                            <span>${(clientATax.deductionsBreakdown.workRelated + clientBTax.deductionsBreakdown.workRelated).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment:</span>
                            <span>${(clientATax.deductionsBreakdown.investment + clientBTax.deductionsBreakdown.investment).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Deductions:</span>
                            <span>${(clientATax.deductionsBreakdown.other + clientBTax.deductionsBreakdown.other).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Optimization Strategies */}
              {((clientAOptimizations?.length ?? 0) > 0 || (clientBOptimizations?.length ?? 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Combined Optimization Strategies</CardTitle>
                    <CardDescription>
                      Joint tax optimization opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...(clientAOptimizations ?? []), ...(clientBOptimizations ?? [])].map((strategy, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{strategy.strategy}</h4>
                            <Badge variant="secondary">
                              Potential Savings: ${strategy.potentialSavings.toLocaleString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Combined view requires data for both clients
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
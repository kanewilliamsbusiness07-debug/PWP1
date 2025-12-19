'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Calculator, Wallet, CreditCard, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useFinancialStore } from '@/lib/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Asset = {
  id: string;
  name: string;
  currentValue: number;
  type: 'property' | 'vehicle' | 'savings' | 'shares' | 'super' | 'other';
  ownerOccupied?: 'own' | 'rent';
  linkedLiabilityId?: string; // Links to a liability
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
  linkedAssetId?: string; // Links to an asset
};

type FinancialPair = {
  id: string;
  asset: Asset;
  liability: Liability;
};

export default function FinancialPositionPage() {
  const [activeTab, setActiveTab] = useState('assets');
  
  // Subscribe to client data
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const addAsset = useFinancialStore((state) => state.addAsset);
  const addLiability = useFinancialStore((state) => state.addLiability);
  const addPairedAssetLiability = useFinancialStore((state) => state.addPairedAssetLiability);
  const removeAsset = useFinancialStore((state) => state.removeAsset);
  const removeLiability = useFinancialStore((state) => state.removeLiability);
  
  // New financial pairs functions
  const addFinancialPair = useFinancialStore((state) => state.addFinancialPair);
  const removeFinancialPair = useFinancialStore((state) => state.removeFinancialPair);
  const updateFinancialPair = useFinancialStore((state) => state.updateFinancialPair);
  
  // Get current client data
  const currentClient = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;
  
  // Check if we have data in each client slot for combined view
  const hasClientA = clientA && (clientA.firstName || clientA.lastName || (clientA.assets?.length ?? 0) > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.lastName || (clientB.assets?.length ?? 0) > 0);
  const showCombined = hasClientA && hasClientB;
  
  // Get client names
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';
  
  // Calculate totals for each client
  const clientAAssets = (clientA?.assets as Asset[]) || [];
  const clientBAssets = (clientB?.assets as Asset[]) || [];
  const clientALiabilities = (clientA?.liabilities as Liability[]) || [];
  const clientBLiabilities = (clientB?.liabilities as Liability[]) || [];
  
  const clientATotalAssets = clientAAssets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
  const clientBTotalAssets = clientBAssets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
  const clientATotalLiabilities = clientALiabilities.reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
  const clientBTotalLiabilities = clientBLiabilities.reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
  
  const combinedTotalAssets = clientATotalAssets + clientBTotalAssets;
  const combinedTotalLiabilities = clientATotalLiabilities + clientBTotalLiabilities;
  const combinedNetPosition = combinedTotalAssets - combinedTotalLiabilities;
  
  // Combined income
  const clientAIncome = (clientA?.annualIncome || clientA?.grossSalary || 0) + (clientA?.rentalIncome || 0);
  const clientBIncome = (clientB?.annualIncome || clientB?.grossSalary || 0) + (clientB?.rentalIncome || 0);
  const combinedIncome = clientAIncome + clientBIncome;
  
  // Monthly cashflow calculations: (yearly income + rental income) / 12 - monthly living expenses - monthly debt payments
  const clientAMonthlyIncome = clientAIncome / 12;
  const clientBMonthlyIncome = clientBIncome / 12;
  const clientAMonthlyDebtPayments = clientA?.monthlyDebtPayments || 0;
  const clientBMonthlyDebtPayments = clientB?.monthlyDebtPayments || 0;
  const clientAMonthlyExpenses = clientA?.monthlyExpenses || 0;
  const clientBMonthlyExpenses = clientB?.monthlyExpenses || 0;
  const clientAMonthlyCashflow = clientAMonthlyIncome - clientAMonthlyExpenses - clientAMonthlyDebtPayments;
  const clientBMonthlyCashflow = clientBMonthlyIncome - clientBMonthlyExpenses - clientBMonthlyDebtPayments;
  const combinedMonthlyCashflow = clientAMonthlyCashflow + clientBMonthlyCashflow;

  // Get financial pairs for each client
  const clientAPairs = clientA?.financialPairs || [];
  const clientBPairs = clientB?.financialPairs || [];
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      {/* Header with summary cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Wallet className="mr-2 h-5 w-5 text-yellow-600" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasClientA && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientAName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${clientATotalAssets.toLocaleString()}</span>
                </div>
              )}
              {hasClientB && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientBName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${clientBTotalAssets.toLocaleString()}</span>
                </div>
              )}
              {showCombined && (
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300 dark:border-yellow-700">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Combined</span>
                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">${combinedTotalAssets.toLocaleString()}</span>
                </div>
              )}
              {!showCombined && (
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${(activeClient === 'A' ? clientATotalAssets : clientBTotalAssets).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasClientA && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientAName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${clientATotalLiabilities.toLocaleString()}</span>
                </div>
              )}
              {hasClientB && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientBName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${clientBTotalLiabilities.toLocaleString()}</span>
                </div>
              )}
              {showCombined && (
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300 dark:border-yellow-700">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Combined</span>
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">${combinedTotalLiabilities.toLocaleString()}</span>
                </div>
              )}
              {!showCombined && (
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  ${(activeClient === 'A' ? clientATotalLiabilities : clientBTotalLiabilities).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calculator className="mr-2 h-5 w-5 text-yellow-600" />
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasClientA && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientAName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientATotalAssets - clientATotalLiabilities).toLocaleString()}</span>
                </div>
              )}
              {hasClientB && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientBName}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">${(clientBTotalAssets - clientBTotalLiabilities).toLocaleString()}</span>
                </div>
              )}
              {showCombined && (
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300 dark:border-yellow-700">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Combined</span>
                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">${combinedNetPosition.toLocaleString()}</span>
                </div>
              )}
              {!showCombined && (
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${(
                    (activeClient === 'A' ? clientATotalAssets : clientBTotalAssets) -
                    (activeClient === 'A' ? clientATotalLiabilities : clientBTotalLiabilities)
                  ).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Wallet className="mr-2 h-5 w-5 text-yellow-600" />
              Monthly Cashflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasClientA && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientAName}</span>
                  <span className={`font-semibold flex items-center ${clientAMonthlyCashflow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {clientAMonthlyCashflow >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    ${Math.abs(clientAMonthlyCashflow).toLocaleString()}
                  </span>
                </div>
              )}
              {hasClientB && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{clientBName}</span>
                  <span className={`font-semibold flex items-center ${clientBMonthlyCashflow >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {clientBMonthlyCashflow >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    ${Math.abs(clientBMonthlyCashflow).toLocaleString()}
                  </span>
                </div>
              )}
              {showCombined && (
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300 dark:border-yellow-700">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Combined</span>
                  <span className={`text-lg font-bold flex items-center ${combinedMonthlyCashflow >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {combinedMonthlyCashflow >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    ${Math.abs(combinedMonthlyCashflow).toLocaleString()}
                  </span>
                </div>
              )}
              {!showCombined && (
                <div className={`text-2xl font-bold flex items-center ${(activeClient === 'A' ? clientAMonthlyCashflow : clientBMonthlyCashflow) >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(activeClient === 'A' ? clientAMonthlyCashflow : clientBMonthlyCashflow) >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
                  ${Math.abs(activeClient === 'A' ? clientAMonthlyCashflow : clientBMonthlyCashflow).toLocaleString()}/mo
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Combined Household Summary Banner */}
      {showCombined && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Combined Household Financial Position</p>
                <p className="text-xs text-muted-foreground">Aggregated totals for {clientAName} & {clientBName}</p>
              </div>
              <div className="grid grid-cols-5 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Assets</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-400">${combinedTotalAssets.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Liabilities</p>
                  <p className="font-bold text-gray-700 dark:text-gray-300">${combinedTotalLiabilities.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Position</p>
                  <p className="font-bold text-lg text-yellow-700 dark:text-yellow-400">${combinedNetPosition.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Combined Income</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-400">${combinedIncome.toLocaleString()}/yr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Cashflow</p>
                  <p className={`font-bold ${combinedMonthlyCashflow >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${Math.abs(combinedMonthlyCashflow).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Current Financial Position</CardTitle>
              <CardDescription>
                Manage your assets, liabilities, and income streams
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (!activeClient) {
                  alert('Please select a client first');
                  return;
                }
                // Add a paired asset and liability
                addFinancialPair(activeClient, {
                  name: 'New Asset',
                  currentValue: 0,
                  type: 'other' as const
                }, {
                  name: 'New Liability',
                  balance: 0,
                  monthlyPayment: 0,
                  interestRate: 0,
                  loanTerm: 0,
                  type: 'other' as const
                });
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset & Liability
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="assets" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="liabilities" className="flex items-center">
                <TrendingDown className="mr-2 h-4 w-4" />
                Liabilities
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Income
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Assets</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeClient) {
                      alert('Please select a client first');
                      return;
                    }
                    // Add a paired asset and liability
                    addFinancialPair(activeClient, {
                      name: 'New Asset',
                      currentValue: 0,
                      type: 'other' as const
                    }, {
                      name: 'New Liability',
                      balance: 0,
                      monthlyPayment: 0,
                      interestRate: 0,
                      loanTerm: 0,
                      type: 'other' as const
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset & Liability
                </Button>
              </div>
              <div className="space-y-6">
                {hasClientA && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientAName} - Assets</h3>
                    <div className="space-y-4">
                      {clientAAssets.map((asset) => {
                        const linkedLiability = clientALiabilities.find(l => l.id === asset.linkedLiabilityId);
                        return (
                          <Card key={asset.id} className="border-2 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Asset */}
                                <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-blue-700 dark:text-blue-400">Asset</h4>
                                    {asset.linkedLiabilityId && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Paired</span>}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium">{asset.name}</h5>
                                      <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                        ${Number(asset.currentValue || 0).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Liability */}
                                {linkedLiability ? (
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-medium text-red-700 dark:text-red-400">Liability</h4>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeLiability(activeClient!, linkedLiability.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h5 className="font-medium">{linkedLiability.name}</h5>
                                        <p className="text-sm text-muted-foreground capitalize">{linkedLiability.type}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {linkedLiability.interestRate}% interest • ${linkedLiability.monthlyPayment}/month
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                          ${Number(linkedLiability.balance || 0).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Add a liability linked to this asset
                                        const liability = {
                                          name: 'New Liability',
                                          balance: 0,
                                          monthlyPayment: 0,
                                          interestRate: 0,
                                          loanTerm: 0,
                                          type: 'other' as const
                                        };
                                        addPairedAssetLiability(activeClient!, asset, liability);
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Liability
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      {/* Show message if no assets */}
                      {clientAAssets.length === 0 && (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            No assets recorded for {clientAName}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {hasClientB && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientBName} - Assets</h3>
                    <div className="space-y-4">
                      {clientBAssets.map((asset) => {
                        const linkedLiability = clientBLiabilities.find(l => l.id === asset.linkedLiabilityId);
                        return (
                          <Card key={asset.id} className="border-2 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Asset */}
                                <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-blue-700 dark:text-blue-400">Asset</h4>
                                    {asset.linkedLiabilityId && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Paired</span>}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium">{asset.name}</h5>
                                      <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                        ${Number(asset.currentValue || 0).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Liability */}
                                {linkedLiability ? (
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-medium text-red-700 dark:text-red-400">Liability</h4>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeLiability(activeClient!, linkedLiability.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h5 className="font-medium">{linkedLiability.name}</h5>
                                        <p className="text-sm text-muted-foreground capitalize">{linkedLiability.type}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {linkedLiability.interestRate}% interest • ${linkedLiability.monthlyPayment}/month
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                          ${Number(linkedLiability.balance || 0).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Add a liability linked to this asset
                                        const liability = {
                                          name: 'New Liability',
                                          balance: 0,
                                          monthlyPayment: 0,
                                          interestRate: 0,
                                          loanTerm: 0,
                                          type: 'other' as const
                                        };
                                        addPairedAssetLiability(activeClient!, asset, liability);
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Liability
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      {/* Show message if no assets */}
                      {clientBAssets.length === 0 && (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            No assets recorded for {clientBName}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {!hasClientA && !hasClientB && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Client Data Available</h3>
                      <p className="text-muted-foreground">
                        Please add client information first to view financial position data.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="flex justify-center mt-6">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeClient) {
                      alert('Please select a client first');
                      return;
                    }
                    // Add a paired asset and liability
                    addFinancialPair(activeClient, {
                      name: 'New Asset',
                      currentValue: 0,
                      type: 'other' as const
                    }, {
                      name: 'New Liability',
                      balance: 0,
                      monthlyPayment: 0,
                      interestRate: 0,
                      loanTerm: 0,
                      type: 'other' as const
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset & Liability
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="liabilities" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Liabilities</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeClient) {
                      alert('Please select a client first');
                      return;
                    }
                    addLiability(activeClient, {
                      name: 'New Liability',
                      balance: 0,
                      monthlyPayment: 0,
                      interestRate: 0,
                      loanTerm: 0,
                      type: 'other' as const
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liability
                </Button>
              </div>
              <div className="space-y-6">
                {hasClientA && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientAName} - Liabilities</h3>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        <strong>Note:</strong> All liabilities are paired with assets and displayed alongside them in the Assets tab above.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {clientAPairs.length > 0 ? (
                        clientAPairs.map((pair) => (
                          <Card key={pair.liability.id} className="border-2 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{pair.liability.name}</h4>
                                  <p className="text-sm text-muted-foreground capitalize">{pair.liability.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pair.liability.interestRate}% interest • ${pair.liability.monthlyPayment}/month
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Paired with: {pair.asset.name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    ${Number(pair.liability.balance || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            No liabilities recorded for {clientAName}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {hasClientB && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientBName} - Liabilities</h3>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        <strong>Note:</strong> All liabilities are paired with assets and displayed alongside them in the Assets tab above.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {clientBPairs.length > 0 ? (
                        clientBPairs.map((pair) => (
                          <Card key={pair.liability.id} className="border-2 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{pair.liability.name}</h4>
                                  <p className="text-sm text-muted-foreground capitalize">{pair.liability.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pair.liability.interestRate}% interest • ${pair.liability.monthlyPayment}/month
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Paired with: {pair.asset.name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    ${Number(pair.liability.balance || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card>
                          <CardContent className="p-4 text-center text-muted-foreground">
                            No liabilities recorded for {clientBName}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {!hasClientA && !hasClientB && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Client Data Available</h3>
                      <p className="text-muted-foreground">
                        Please add client information first to view financial position data.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="flex justify-center mt-6">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeClient) {
                      alert('Please select a client first');
                      return;
                    }
                    addLiability(activeClient, {
                      name: 'New Liability',
                      balance: 0,
                      monthlyPayment: 0,
                      interestRate: 0,
                      loanTerm: 0,
                      type: 'other' as const
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liability
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="income" className="space-y-4">
              <div className="space-y-6">
                {hasClientA && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientAName} - Income</h3>
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Annual Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientA?.annualIncome || clientA?.grossSalary || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rental Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientA?.rentalIncome || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dividends</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientA?.dividends || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Other Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientA?.otherIncome || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {hasClientB && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{clientBName} - Income</h3>
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Annual Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientB?.annualIncome || clientB?.grossSalary || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rental Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientB?.rentalIncome || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dividends</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientB?.dividends || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Other Income</p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              ${(clientB?.otherIncome || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {showCombined && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Combined Household Income</h3>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Annual Income</p>
                            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                              ${combinedIncome.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Income</p>
                            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                              ${(combinedIncome / 12).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!hasClientA && !hasClientB && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Client Data Available</h3>
                      <p className="text-muted-foreground">
                        Please add client information first to view income data.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-6">
        <Button
          size="sm"
          onClick={() => {
            if (!activeClient) {
              alert('Please select a client first');
              return;
            }
            // Add a paired asset and liability
            addFinancialPair(activeClient, {
              name: 'New Asset',
              currentValue: 0,
              type: 'other' as const
            }, {
              name: 'New Liability',
              balance: 0,
              monthlyPayment: 0,
              interestRate: 0,
              loanTerm: 0,
              type: 'other' as const
            });
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Asset & Liability
        </Button>
        
        <div className="flex gap-4">
          <Button
            size="sm"
            onClick={() => {
              if (!activeClient) {
                alert('Please select a client first');
                return;
              }
              addAsset(activeClient, {
                name: 'New Asset',
                currentValue: 0,
                type: 'other' as const
              });
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
          
          <Button
            size="sm"
            onClick={() => {
              if (!activeClient) {
                alert('Please select a client first');
                return;
              }
              addLiability(activeClient, {
                name: 'New Liability',
                balance: 0,
                monthlyPayment: 0,
                interestRate: 0,
                loanTerm: 0,
                type: 'other' as const
              });
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Liability
          </Button>
          
          <Button
            size="sm"
            onClick={() => {
              if (!activeClient) {
                alert('Please select a client first');
                return;
              }
              // Add a paired asset and liability
              addFinancialPair(activeClient, {
                name: 'New Asset',
                currentValue: 0,
                type: 'other' as const
              }, {
                name: 'New Liability',
                balance: 0,
                monthlyPayment: 0,
                interestRate: 0,
                loanTerm: 0,
                type: 'other' as const
              });
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset & Liability
          </Button>
        </div>
      </div>
    </div>
  );
}

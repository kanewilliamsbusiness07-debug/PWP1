/**
 * FinCalc Pro - Financial Projections Page
 *
 * Retirement planning with deficit/surplus analysis and projections
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { calculateFinancialProjections, type FinancialInputs } from '@/lib/utils/calculateFinancialProjections';
import { convertClientToInputs } from '@/lib/utils/convertClientToInputs';
import { Calculator, TriangleAlert, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  return `$${Math.round(value).toLocaleString()}`;
};

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Math.round(value).toLocaleString();
};

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Inflation Rate (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.inflationRate ?? 2.5}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Salary Growth (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.salaryGrowthRate ?? 3.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Super Return (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.superReturn ?? 7.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Share Return (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.shareReturn ?? 7.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Property Growth (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.propertyGrowthRate ?? 4.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Withdrawal Rate (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.withdrawalRate ?? 4.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Rent Growth (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.rentGrowthRate ?? 3.0}%
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Savings Rate (%)</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
              {sharedAssumptions?.savingsRate ?? 10.0}%
            </div>
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
  onFormChange: (slot: 'A' | 'B', data: any) => void;
}) {
  // This component has been removed - projections are now calculated from client data
  return null;
}

export default function ProjectionsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Subscribe to client data
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const sharedAssumptions = useFinancialStore((state) => state.sharedAssumptions);
  const financialStore = useFinancialStore();
  const { loadRecentClients } = useClientStorage();

  // Check if we have data in each client slot for combined view
  const hasClientA = clientA && (clientA.firstName || clientA.lastName || (clientA.annualIncome ?? clientA.grossSalary ?? 0) > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.lastName || (clientB.annualIncome ?? clientB.grossSalary ?? 0) > 0);
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

  // Convert client data to FinancialInputs format
// Use shared converter to ensure inputs are consistent across pages
  // (moved to `lib/utils/convertClientToInputs.ts`)

  // Calculate projections for each client
  const calculateClientProjection = (client: any) => {
    const inputs = convertClientToInputs(client, sharedAssumptions);
    if (!inputs) return null;

    return calculateFinancialProjections(inputs);
  };

  const clientAProjection = useMemo(() => calculateClientProjection(clientA), [clientA]);
  const clientBProjection = useMemo(() => calculateClientProjection(clientB), [clientB]);

  // Combined projections
  const combinedProjection = useMemo(() => {
    if (!showCombined || !clientAProjection || !clientBProjection) return null;

    // Helper function to safely add numbers, defaulting to 0 if NaN
    const safeAdd = (a: number, b: number) => {
      const sum = (a || 0) + (b || 0);
      return isNaN(sum) ? 0 : sum;
    };

    return {
      // Current Position (summed)
      currentAge: Math.min(clientAProjection.currentAge || 0, clientBProjection.currentAge || 0),
      retirementAge: Math.max(clientAProjection.retirementAge || 65, clientBProjection.retirementAge || 65),
      currentSuper: safeAdd(clientAProjection.currentSuper, clientBProjection.currentSuper),
      currentSavings: safeAdd(clientAProjection.currentSavings, clientBProjection.currentSavings),
      currentShares: safeAdd(clientAProjection.currentShares, clientBProjection.currentShares),
      propertyEquity: safeAdd(clientAProjection.propertyEquity, clientBProjection.propertyEquity),
      currentNetWorth: safeAdd(clientAProjection.currentNetWorth, clientBProjection.currentNetWorth),
      monthlyDebtPayments: safeAdd(clientAProjection.monthlyDebtPayments, clientBProjection.monthlyDebtPayments),
      monthlyRentalIncome: safeAdd(clientAProjection.monthlyRentalIncome, clientBProjection.monthlyRentalIncome),
      currentMonthlyCashflow: safeAdd(clientAProjection.currentMonthlyCashflow, clientBProjection.currentMonthlyCashflow),
      totalAnnualIncome: safeAdd(clientAProjection.totalAnnualIncome, clientBProjection.totalAnnualIncome),

      // Future Projections
      yearsToRetirement: Math.max(clientAProjection.yearsToRetirement || 0, clientBProjection.yearsToRetirement || 0),
      futureSuper: safeAdd(clientAProjection.futureSuper, clientBProjection.futureSuper),
      futureShares: safeAdd(clientAProjection.futureShares, clientBProjection.futureShares),
      futurePropertyEquity: safeAdd(clientAProjection.futurePropertyEquity, clientBProjection.futurePropertyEquity),
      futurePropertyAssets: safeAdd(clientAProjection.futurePropertyAssets, clientBProjection.futurePropertyAssets),
      futurePropertyValue: safeAdd(clientAProjection.futurePropertyValue || 0, clientBProjection.futurePropertyValue || 0),
      futureOtherAssets: safeAdd(clientAProjection.futureOtherAssets, clientBProjection.futureOtherAssets),
      futureSavings: safeAdd(clientAProjection.futureSavings, clientBProjection.futureSavings),
      combinedNetworthAtRetirement: safeAdd(clientAProjection.futureSuper, clientBProjection.futureSuper) +
                                   safeAdd(clientAProjection.futureShares, clientBProjection.futureShares) +
                                   safeAdd(clientAProjection.futurePropertyAssets, clientBProjection.futurePropertyAssets) +
                                   safeAdd(clientAProjection.futureOtherAssets, clientBProjection.futureOtherAssets) +
                                   safeAdd(clientAProjection.futurePropertyEquity, clientBProjection.futurePropertyEquity) +
                                   safeAdd(clientAProjection.futureSavings, clientBProjection.futureSavings),

      // Retirement Income
      futureMonthlyRentalIncome: safeAdd(clientAProjection.futureMonthlyRentalIncome, clientBProjection.futureMonthlyRentalIncome),
      annualSuperWithdrawal: safeAdd(clientAProjection.annualSuperWithdrawal, clientBProjection.annualSuperWithdrawal),
      monthlySuperWithdrawal: safeAdd(clientAProjection.monthlySuperWithdrawal, clientBProjection.monthlySuperWithdrawal),
      combinedMonthlyCashflowRetirement: 
        safeAdd(clientAProjection.monthlySuperWithdrawal, clientBProjection.monthlySuperWithdrawal) +
        safeAdd(clientAProjection.futureMonthlyRentalIncome, clientBProjection.futureMonthlyRentalIncome) -
        safeAdd(clientAProjection.monthlyDebtPayments, clientBProjection.monthlyDebtPayments) -
        Math.max(clientA?.monthlyExpenses || 0, clientB?.monthlyExpenses || 0), // Use higher expense amount
      projectedAnnualPassiveIncome: safeAdd(clientAProjection.projectedAnnualPassiveIncome, clientBProjection.projectedAnnualPassiveIncome),

      // Target & Surplus/Deficit (use weighted average for surplus/deficit status)
      requiredAnnualIncome: safeAdd(clientAProjection.requiredAnnualIncome, clientBProjection.requiredAnnualIncome),
      requiredMonthlyIncome: safeAdd(clientAProjection.requiredMonthlyIncome, clientBProjection.requiredMonthlyIncome),
      monthlySurplusDeficit: safeAdd(clientAProjection.monthlySurplusDeficit, clientBProjection.monthlySurplusDeficit),
      status: (safeAdd(clientAProjection.monthlySurplusDeficit, clientBProjection.monthlySurplusDeficit)) >= 0 ? 'surplus' : 'deficit',
      percentageOfTarget: (() => {
        const totalProjected = safeAdd(clientAProjection.projectedAnnualPassiveIncome, clientBProjection.projectedAnnualPassiveIncome);
        const totalRequired = safeAdd(clientAProjection.requiredAnnualIncome, clientBProjection.requiredAnnualIncome);
        return totalRequired > 0 ? (totalProjected / totalRequired) * 100 : 0;
      })(),
    };
  }, [showCombined, clientAProjection, clientBProjection]);

  // Save projection results to global state for cross-page access
  useEffect(() => {
    if (clientAProjection) {
      const clientAResults = {
        projectedLumpSum: clientAProjection.combinedNetworthAtRetirement,
        monthlyPassiveIncome: clientAProjection.projectedAnnualPassiveIncome / 12,
        yearsToRetirement: clientAProjection.yearsToRetirement,
        requiredIncome: clientAProjection.requiredAnnualIncome,
        monthlyDeficitSurplus: clientAProjection.monthlySurplusDeficit,
        isDeficit: clientAProjection.status === 'deficit',
      };

      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        clientA: clientAResults,
      });
    }
  }, [clientAProjection]);

  useEffect(() => {
    if (clientBProjection) {
      const clientBResults = {
        projectedLumpSum: clientBProjection.combinedNetworthAtRetirement,
        monthlyPassiveIncome: clientBProjection.projectedAnnualPassiveIncome / 12,
        yearsToRetirement: clientBProjection.yearsToRetirement,
        requiredIncome: clientBProjection.requiredAnnualIncome,
        monthlyDeficitSurplus: clientBProjection.monthlySurplusDeficit,
        isDeficit: clientBProjection.status === 'deficit',
      };

      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        clientB: clientBResults,
      });
    }
  }, [clientBProjection]);

  useEffect(() => {
    if (combinedProjection) {
      const combinedResults = {
        totalProjectedLumpSum: combinedProjection.combinedNetworthAtRetirement,
        totalMonthlyIncome: combinedProjection.projectedAnnualPassiveIncome / 12,
        combinedSurplusDeficit: combinedProjection.monthlySurplusDeficit,
      };

      console.log('=== PROJECTIONS PAGE: Saving combined results to global state ===', combinedResults);
      const currentResults = useFinancialStore.getState().results || {};
      useFinancialStore.getState().setResults({
        ...currentResults,
        combined: combinedResults,
      });
    }
  }, [combinedProjection]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Financial Projections</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Retirement planning and financial projections based on your current financial position
        </p>
      </div>

      {/* Shared Assumptions */}
      <SharedAssumptionsSection />

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
              {/* Combined Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Combined Household Projection
                  </CardTitle>
                  <CardDescription>
                    Aggregated retirement projections for {clientAName} & {clientBName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Years to Retirement</p>
                      <p className="text-2xl font-bold">{formatNumber(combinedProjection?.yearsToRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(combinedProjection?.combinedNetworthAtRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Monthly Cashflow</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(combinedProjection?.combinedMonthlyCashflowRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Combined Property Portfolio</p>
                        <p className="text-xl font-bold text-purple-600">{formatCurrency(combinedProjection?.futurePropertyEquity)}</p>
                    </div>
                  </div>

                  {/* Combined Income Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Combined Income Analysis at Retirement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Required Annual Income (70% of current combined)</p>
                        <p className="text-xl font-bold">{formatCurrency(combinedProjection?.requiredAnnualIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Projected Annual Passive Income</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(combinedProjection?.projectedAnnualPassiveIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Monthly Surplus/Deficit</p>
                        <div className={`text-xl font-bold flex items-center justify-center gap-2 ${
                          combinedProjection?.status === 'deficit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {combinedProjection?.status === 'deficit' ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          {formatCurrency(Math.abs(combinedProjection?.monthlySurplusDeficit ?? 0))}
                          <span className="text-sm">{combinedProjection?.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Asset Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Combined Projected Asset Values at Retirement</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Superannuation</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(combinedProjection?.futureSuper)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Shares/Investments</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(combinedProjection?.futureShares)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Property Portfolio</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(((combinedProjection?.futurePropertyValue || 0) + (combinedProjection?.futurePropertyAssets || 0)))}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Other Assets</p>
                        <p className="text-xl font-bold text-teal-600">{formatCurrency(combinedProjection?.futureOtherAssets)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Savings/Cash</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(combinedProjection?.futureSavings)}</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Combined Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(combinedProjection?.combinedNetworthAtRetirement)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Retirement Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Combined Retirement Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Age {combinedProjection?.currentAge ?? 30}</span>
                      <span className="text-muted-foreground">Age {combinedProjection?.retirementAge ?? 65}</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, (((combinedProjection?.currentAge ?? 30) / (combinedProjection?.retirementAge ?? 65)) * 100)))} className="h-2" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {combinedProjection?.yearsToRetirement ?? 0} years
                      </p>
                      <p className="text-sm text-muted-foreground">until retirement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Add client information to see retirement projections
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-a" className="space-y-6">
          {clientAProjection ? (
            <div className="space-y-6">
              {/* Client A Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientAName} - Retirement Projection</CardTitle>
                  <CardDescription>
                    Projected financial position at retirement age {clientAProjection.retirementAge}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Years to Retirement</p>
                      <p className="text-2xl font-bold">{formatNumber(clientAProjection.yearsToRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(clientAProjection.combinedNetworthAtRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Cashflow at Retirement</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(clientAProjection.combinedMonthlyCashflowRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Property Portfolio Value</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency((clientAProjection.futurePropertyValue || 0) + (clientAProjection.futurePropertyAssets || 0))}</p>
                    </div>
                  </div>

                  {/* Income Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Income Analysis at Retirement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Required Annual Income (70% of current)</p>
                        <p className="text-xl font-bold">{formatCurrency(clientAProjection.requiredAnnualIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Projected Annual Passive Income</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(clientAProjection.projectedAnnualPassiveIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Monthly Surplus/Deficit</p>
                        <div className={`text-xl font-bold flex items-center justify-center gap-2 ${
                          clientAProjection.status === 'deficit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {clientAProjection.status === 'deficit' ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          {formatCurrency(Math.abs(clientAProjection.monthlySurplusDeficit))}
                          <span className="text-sm">{clientAProjection.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Projected Asset Values at Retirement</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Superannuation</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(clientAProjection.futureSuper)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Shares/Investments</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(clientAProjection.futureShares)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Property Portfolio</p>
                        <p className="text-xl font-bold text-purple-600">{formatCurrency((clientAProjection.futurePropertyValue || 0) + (clientAProjection.futurePropertyAssets || 0))}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Other Assets</p>
                        <p className="text-xl font-bold text-teal-600">{formatCurrency(clientAProjection.futureOtherAssets)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Savings/Cash</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(clientAProjection.futureSavings)}</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(clientAProjection.combinedNetworthAtRetirement)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client A Retirement Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Retirement Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Age {clientAProjection.currentAge}</span>
                      <span className="text-muted-foreground">Age {clientAProjection.retirementAge}</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, (clientAProjection.currentAge / clientAProjection.retirementAge) * 100))} className="h-2" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {clientAProjection.yearsToRetirement} years
                      </p>
                      <p className="text-sm text-muted-foreground">until retirement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          {clientBProjection ? (
            <div className="space-y-6">
              {/* Client B Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{clientBName} - Retirement Projection</CardTitle>
                  <CardDescription>
                    Projected financial position at retirement age {clientBProjection.retirementAge}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Years to Retirement</p>
                      <p className="text-2xl font-bold">{formatNumber(clientBProjection.yearsToRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(clientBProjection.combinedNetworthAtRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Cashflow at Retirement</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(clientBProjection.combinedMonthlyCashflowRetirement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Property Portfolio Value</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(clientBProjection.futurePropertyEquity)}</p>
                    </div>
                  </div>

                  {/* Income Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Income Analysis at Retirement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Required Annual Income (70% of current)</p>
                        <p className="text-xl font-bold">{formatCurrency(clientBProjection.requiredAnnualIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Projected Annual Passive Income</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(clientBProjection.projectedAnnualPassiveIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Monthly Surplus/Deficit</p>
                        <div className={`text-xl font-bold flex items-center justify-center gap-2 ${
                          clientBProjection.status === 'deficit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {clientBProjection.status === 'deficit' ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          {formatCurrency(Math.abs(clientBProjection.monthlySurplusDeficit))}
                          <span className="text-sm">{clientBProjection.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Projected Asset Values at Retirement</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Superannuation</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(clientBProjection.futureSuper)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Shares/Investments</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(clientBProjection.futureShares)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Property Portfolio</p>
                        <p className="text-xl font-bold text-purple-600">{formatCurrency((clientBProjection.futurePropertyValue || 0) + (clientBProjection.futurePropertyAssets || 0))}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Other Assets</p>
                        <p className="text-xl font-bold text-teal-600">{formatCurrency(clientBProjection.futureOtherAssets)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Savings/Cash</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(clientBProjection.futureSavings)}</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Net Worth at Retirement</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(clientBProjection.combinedNetworthAtRetirement)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client B Retirement Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Retirement Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Age {clientBProjection.currentAge}</span>
                      <span className="text-muted-foreground">Age {clientBProjection.retirementAge}</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, (clientBProjection.currentAge / clientBProjection.retirementAge) * 100))} className="h-2" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {clientBProjection.yearsToRetirement} years
                      </p>
                      <p className="text-sm text-muted-foreground">until retirement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      </Tabs>
    </div>
  );
}

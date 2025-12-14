/**
 * FinCalc Pro - Financial Projections Page
 *
 * Retirement planning with deficit/surplus analysis and projections
 */

'use client';

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { Calculator, TriangleAlert, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

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
          const recentClients = await loadRecentClients(2); // Load up to 2 most recent clients
          
          if (recentClients.length > 0) {
            // Load first client into slot A
            financialStore.setClientData('A', {
              ...recentClients[0],
              dateOfBirth: recentClients[0].dob ? (typeof recentClients[0].dob === 'string' ? new Date(recentClients[0].dob) : recentClients[0].dob) : undefined,
            } as any);
            
            // Load second client into slot B if available
            if (recentClients.length > 1) {
              financialStore.setClientData('B', {
                ...recentClients[1],
                dateOfBirth: recentClients[1].dob ? (typeof recentClients[1].dob === 'string' ? new Date(recentClients[1].dob) : recentClients[1].dob) : undefined,
              } as any);
            }
          }
        } catch (error) {
          console.error('Error loading recent client data:', error);
        }
      }
    };

    loadClientData();
  }, [hasClientA, hasClientB, loadRecentClients, financialStore]);

  // Get client names
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';

  // Calculate projections for each client
  const calculateClientProjection = (client: any) => {
    if (!client) return null;

    const currentAge = client.currentAge ?? 30;
    const retirementAge = client.retirementAge ?? 65;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);

    // Financial position
    const annualIncome = client.annualIncome ?? client.grossSalary ?? 0;
    const currentSuper = client.superFundValue ?? 0;
    const currentSavings = client.savingsValue ?? 0;
    const currentShares = client.sharesValue ?? 0;
    const propertyEquity = client.propertyEquity ?? 0;
    const monthlyDebtPayments = client.monthlyDebtPayments ?? 0;
    const monthlyRentalIncome = client.monthlyRentalIncome ?? (client.rentalIncome ? client.rentalIncome / 12 : 0);
    const monthlyExpenses = client.monthlyExpenses ?? 0;

    // Total current wealth
    const totalWealth = currentSuper + currentSavings + currentShares + propertyEquity;

    // Estimated future value with compound growth (simplified calculation)
    const superReturn = client.superReturn ?? 7.0;
    const shareReturn = client.shareReturn ?? 7.0;
    const propertyGrowth = client.propertyGrowthRate ?? 4.0;

    const projectedSuper = currentSuper * Math.pow(1 + superReturn / 100, yearsToRetirement);
    const projectedShares = currentShares * Math.pow(1 + shareReturn / 100, yearsToRetirement);
    const projectedProperty = propertyEquity * Math.pow(1 + propertyGrowth / 100, yearsToRetirement);

    const projectedLumpSum = projectedSuper + projectedShares + projectedProperty + currentSavings;

    // Required income at retirement (4% rule)
    const withdrawalRate = client.withdrawalRate ?? 4.0;
    const requiredIncome = projectedLumpSum * (withdrawalRate / 100);

    // Current passive income
    const currentPassiveIncome = monthlyRentalIncome * 12;

    // Deficit or surplus
    const surplus = currentPassiveIncome - requiredIncome;
    const monthlyDeficitSurplus = Math.abs(surplus) / 12;
    const isDeficit = surplus < 0;

    return {
      currentAge,
      retirementAge,
      yearsToRetirement,
      annualIncome,
      totalWealth,
      projectedLumpSum,
      requiredIncome,
      currentPassiveIncome,
      monthlyDeficitSurplus,
      isDeficit,
      projectedSuper,
      projectedShares,
      projectedProperty
    };
  };

  const clientAProjection = calculateClientProjection(clientA);
  const clientBProjection = calculateClientProjection(clientB);

  // Combined projections
  const combinedProjection = showCombined && clientAProjection && clientBProjection ? {
    currentAge: Math.min(clientAProjection.currentAge, clientBProjection.currentAge),
    retirementAge: Math.max(clientAProjection.retirementAge, clientBProjection.retirementAge),
    yearsToRetirement: Math.max(clientAProjection.yearsToRetirement, clientBProjection.yearsToRetirement),
    annualIncome: clientAProjection.annualIncome + clientBProjection.annualIncome,
    totalWealth: clientAProjection.totalWealth + clientBProjection.totalWealth,
    projectedLumpSum: clientAProjection.projectedLumpSum + clientBProjection.projectedLumpSum,
    requiredIncome: clientAProjection.requiredIncome + clientBProjection.requiredIncome,
    currentPassiveIncome: clientAProjection.currentPassiveIncome + clientBProjection.currentPassiveIncome,
    monthlyDeficitSurplus: Math.abs((clientAProjection.currentPassiveIncome + clientBProjection.currentPassiveIncome) - (clientAProjection.requiredIncome + clientBProjection.requiredIncome)) / 12,
    isDeficit: (clientAProjection.currentPassiveIncome + clientBProjection.currentPassiveIncome) < (clientAProjection.requiredIncome + clientBProjection.requiredIncome),
    projectedSuper: clientAProjection.projectedSuper + clientBProjection.projectedSuper,
    projectedShares: clientAProjection.projectedShares + clientBProjection.projectedShares,
    projectedProperty: clientAProjection.projectedProperty + clientBProjection.projectedProperty
  } : null;

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client-a" disabled={!hasClientA}>
            {clientAName}
          </TabsTrigger>
          <TabsTrigger value="client-b" disabled={!hasClientB}>
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
                      <p className="text-2xl font-bold">{combinedProjection?.yearsToRetirement ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Projected Lump Sum</p>
                      <p className="text-2xl font-bold text-green-600">${combinedProjection?.projectedLumpSum.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Required Annual Income</p>
                      <p className="text-2xl font-bold">${combinedProjection?.requiredIncome.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Position</p>
                      <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                        combinedProjection?.isDeficit ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {combinedProjection?.isDeficit ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        ${combinedProjection?.monthlyDeficitSurplus.toLocaleString() ?? 0}
                        <span className="text-sm">{combinedProjection?.isDeficit ? 'deficit' : 'surplus'}</span>
                      </div>
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
                      <p className="text-2xl font-bold">{clientAProjection.yearsToRetirement}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Projected Lump Sum</p>
                      <p className="text-2xl font-bold text-green-600">${clientAProjection.projectedLumpSum.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Required Annual Income</p>
                      <p className="text-2xl font-bold">${clientAProjection.requiredIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Position</p>
                      <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                        clientAProjection.isDeficit ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {clientAProjection.isDeficit ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        ${clientAProjection.monthlyDeficitSurplus.toLocaleString()}
                        <span className="text-sm">{clientAProjection.isDeficit ? 'deficit' : 'surplus'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Projected Asset Values</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Superannuation</p>
                        <p className="text-xl font-bold text-blue-600">${clientAProjection.projectedSuper.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Shares/Investments</p>
                        <p className="text-xl font-bold text-green-600">${clientAProjection.projectedShares.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Property Equity</p>
                        <p className="text-xl font-bold text-purple-600">${clientAProjection.projectedProperty.toLocaleString()}</p>
                      </div>
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
                      <p className="text-2xl font-bold">{clientBProjection.yearsToRetirement}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Projected Lump Sum</p>
                      <p className="text-2xl font-bold text-green-600">${clientBProjection.projectedLumpSum.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Required Annual Income</p>
                      <p className="text-2xl font-bold">${clientBProjection.requiredIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly Position</p>
                      <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                        clientBProjection.isDeficit ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {clientBProjection.isDeficit ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        ${clientBProjection.monthlyDeficitSurplus.toLocaleString()}
                        <span className="text-sm">{clientBProjection.isDeficit ? 'deficit' : 'surplus'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Projected Asset Values</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Superannuation</p>
                        <p className="text-xl font-bold text-blue-600">${clientBProjection.projectedSuper.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Shares/Investments</p>
                        <p className="text-xl font-bold text-green-600">${clientBProjection.projectedShares.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Property Equity</p>
                        <p className="text-xl font-bold text-purple-600">${clientBProjection.projectedProperty.toLocaleString()}</p>
                      </div>
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

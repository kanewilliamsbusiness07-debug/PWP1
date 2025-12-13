'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { ClientSelector } from '@/components/client-selector';
import { ClientForm } from './client-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Shared Assumptions Component
function SharedAssumptionsSection() {
  const financialStore = useFinancialStore();
  const sharedAssumptions = useFinancialStore((state) => state.sharedAssumptions);
  
  const handleChange = (field: string, value: number) => {
    financialStore.setSharedAssumptions({ [field]: value });
  };
  
  return (
    <Card className="border-2 border-purple-300 bg-purple-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared Assumptions (Apply to Both Clients)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <Label className="text-sm text-purple-700">Inflation Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.inflationRate || 2.5}
              onChange={(e) => handleChange('inflationRate', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Salary Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.salaryGrowthRate || 3.0}
              onChange={(e) => handleChange('salaryGrowthRate', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Super Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.superReturn || 7.0}
              onChange={(e) => handleChange('superReturn', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Share Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.shareReturn || 7.0}
              onChange={(e) => handleChange('shareReturn', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Property Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.propertyGrowthRate || 4.0}
              onChange={(e) => handleChange('propertyGrowthRate', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Withdrawal Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.withdrawalRate || 4.0}
              onChange={(e) => handleChange('withdrawalRate', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Rent Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={sharedAssumptions?.rentGrowthRate || 3.0}
              onChange={(e) => handleChange('rentGrowthRate', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const financialStore = useFinancialStore();
  const { loadClient } = useClientStorage();
  const { toast } = useToast();
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [formKeyA, setFormKeyA] = useState(0);
  const [formKeyB, setFormKeyB] = useState(0);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load client from query parameter
  useEffect(() => {
    const loadClientId = searchParams?.get('load');
    const slot = searchParams?.get('slot') as 'A' | 'B' | null;
    
    if (loadClientId && user && !isLoadingClient) {
      setIsLoadingClient(true);
      loadClient(loadClientId)
        .then((client) => {
          if (client) {
            const targetSlot = slot || 'A';
            financialStore.setClientData(targetSlot, {
              ...client,
              dateOfBirth: client.dob ? (typeof client.dob === 'string' ? new Date(client.dob) : client.dob) : undefined,
            } as any);
            financialStore.setActiveClient(targetSlot);
            
            if (targetSlot === 'A') {
              setFormKeyA(prev => prev + 1);
            } else {
              setFormKeyB(prev => prev + 1);
            }
            
            router.replace('/client-information');
            
            toast({
              title: 'Client loaded',
              description: `Loaded ${client.firstName} ${client.lastName} into Client ${targetSlot}`
            });
          }
        })
        .catch((error) => {
          console.error('Error loading client:', error);
          toast({
            title: 'Error',
            description: 'Failed to load client',
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsLoadingClient(false);
        });
    }
  }, [searchParams, user, loadClient, financialStore, router, toast, isLoadingClient]);

  // Helper function to create empty client data
  const getEmptyClientData = () => ({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    mobile: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    suburb: '',
    state: undefined,
    postcode: '',
    maritalStatus: 'SINGLE',
    numberOfDependants: 0,
    agesOfDependants: '',
    ownOrRent: undefined,
    annualIncome: 0,
    grossIncome: 0,
    grossSalary: 0,
    rentalIncome: 0,
    dividends: 0,
    frankedDividends: 0,
    capitalGains: 0,
    otherIncome: 0,
    assets: [{ id: 'asset-home', name: 'Home', currentValue: 0, type: 'property' as const, ownerOccupied: 'own' as const }],
    liabilities: [{ id: 'liability-home', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }],
    properties: [],
    currentAge: 0,
    retirementAge: 65,
    currentSuper: 0,
    currentSavings: 0,
    currentShares: 0,
    propertyEquity: 0,
    monthlyDebtPayments: 0,
    monthlyRentalIncome: 0,
    monthlyExpenses: 0,
    employmentIncome: 0,
    investmentIncome: 0,
    workRelatedExpenses: 0,
    vehicleExpenses: 0,
    uniformsAndLaundry: 0,
    homeOfficeExpenses: 0,
    selfEducationExpenses: 0,
    investmentExpenses: 0,
    charityDonations: 0,
    accountingFees: 0,
    rentalExpenses: 0,
    superContributions: 0,
    healthInsurance: false,
    hecs: false,
    helpDebt: 0,
    hecsBalance: 0,
    privateHealthInsurance: false,
  } as any);

  // Handle creating new clients
  const handleNewClients = () => {
    const emptyClientData = getEmptyClientData();
    financialStore.setClientData('A', emptyClientData);
    financialStore.setClientData('B', emptyClientData);
    financialStore.setIncomeData({
      grossIncome: 0,
      employmentIncome: 0,
      investmentIncome: 0,
      rentalIncome: 0,
      frankedDividends: 0,
      otherIncome: 0
    });
    financialStore.setActiveClient('A');
    setFormKeyA(prev => prev + 1);
    setFormKeyB(prev => prev + 1);
  };

  const handleClearClient = (slot: 'A' | 'B') => {
    const emptyClientData = getEmptyClientData();
    financialStore.setClientData(slot, emptyClientData);
    if (slot === 'A') {
      setFormKeyA(prev => prev + 1);
    } else {
      setFormKeyB(prev => prev + 1);
    }
    toast({
      title: 'Client cleared',
      description: `Client ${slot} has been reset`
    });
  };

  // Get client data
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dual Client Information</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Enter information for both clients side-by-side
          </p>
        </div>
        <Button onClick={handleNewClients} className="bg-yellow-500 text-white hover:bg-yellow-600 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Clients
        </Button>
      </div>

      {/* Client Selector for loading saved clients */}
      <ClientSelector />

      {/* Shared Assumptions */}
      <SharedAssumptionsSection />

      {/* Dual Client Forms - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Client A */}
        <div className="relative">
          <div className="absolute -top-3 left-4 z-10">
            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              Client A
            </span>
          </div>
          <div className="border-2 border-blue-500 rounded-lg pt-4 bg-blue-50/30">
            <div className="px-4 pb-2 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">
                {clientA?.firstName && clientA?.lastName 
                  ? `${clientA.firstName} ${clientA.lastName}`
                  : 'No client data'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleClearClient('A')}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                Clear
              </Button>
            </div>
            <ClientForm key={`A-${formKeyA}`} clientSlot="A" />
          </div>
        </div>

        {/* Client B */}
        <div className="relative">
          <div className="absolute -top-3 left-4 z-10">
            <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              Client B
            </span>
          </div>
          <div className="border-2 border-green-500 rounded-lg pt-4 bg-green-50/30">
            <div className="px-4 pb-2 flex justify-between items-center">
              <span className="text-sm text-green-700 font-medium">
                {clientB?.firstName && clientB?.lastName 
                  ? `${clientB.firstName} ${clientB.lastName}`
                  : 'No client data'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleClearClient('B')}
                className="text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                Clear
              </Button>
            </div>
            <ClientForm key={`B-${formKeyB}`} clientSlot="B" />
          </div>
        </div>
      </div>
    </div>
  );
}

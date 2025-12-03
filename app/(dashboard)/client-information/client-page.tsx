'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useClientStorage, ClientData } from '@/lib/hooks/use-client-storage';
import { RecentClients } from '@/components/recent-clients';
import { ClientSelector } from '@/components/client-selector';
import { ClientForm } from './client-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function ClientPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const financialStore = useFinancialStore();
  const { loadClient } = useClientStorage();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Handle client selection from Recent Clients component
  const handleClientLoad = async (client: ClientData) => {
    try {
      // Load full client data if we only have partial data
      let fullClientData = client;
      if (client.id) {
        const loaded = await loadClient(client.id);
        if (loaded) {
          fullClientData = loaded;
        }
      }

      // Convert date string to Date object if needed
      const clientDataForStore = {
        ...fullClientData,
        dateOfBirth: fullClientData.dob 
          ? (typeof fullClientData.dob === 'string' ? new Date(fullClientData.dob) : fullClientData.dob)
          : undefined,
      };

      // Set client data in store for slot A
      financialStore.setClientData('A', clientDataForStore as any);
      financialStore.setActiveClient('A');
    } catch (error) {
      console.error('Error loading client:', error);
    }
  };

  // Handle client selection (click on client card)
  const handleClientSelect = async (client: ClientData) => {
    await handleClientLoad(client);
  };

  // Handle creating a new client
  const handleNewClient = () => {
    // Initialize an empty client in slot A
    financialStore.setClientData('A', {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      suburb: '',
      state: undefined,
      postcode: '',
      maritalStatus: 'SINGLE',
      numberOfDependants: 0,
      agesOfDependants: '',
      ownOrRent: undefined,
      grossSalary: 0,
      rentalIncome: 0,
      dividends: 0,
      frankedDividends: 0,
      capitalGains: 0,
      otherIncome: 0,
      assets: [],
      liabilities: [],
      properties: [],
      currentAge: 0,
      retirementAge: 0,
      currentSuper: 0,
      currentSavings: 0,
      currentShares: 0,
      propertyEquity: 0,
      monthlyDebtPayments: 0,
      monthlyRentalIncome: 0,
      inflationRate: 0,
      salaryGrowthRate: 0,
      superReturn: 0,
      shareReturn: 0,
      propertyGrowthRate: 0,
      withdrawalRate: 0,
      rentGrowthRate: 0,
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
    financialStore.setActiveClient('A');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Information</h1>
          <p className="text-muted-foreground">
            Manage client personal information, financial data, and comprehensive details
          </p>
        </div>
        <Button onClick={handleNewClient} className="bg-yellow-500 text-white hover:bg-yellow-600">
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Recent Clients Panel */}
        <div className="xl:col-span-1">
          <RecentClients
            onClientSelect={handleClientSelect}
            onClientLoad={handleClientLoad}
            maxHeight="calc(100vh - 200px)"
          />
        </div>

        {/* Client Information Forms */}
        <div className="xl:col-span-3">
          <ClientSelector />
          <div className="mt-4">
            {financialStore.activeClient ? (
              <ClientForm clientSlot={financialStore.activeClient} />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      Select a client from the list to view and edit their information.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      You can search, load, or create a new client to get started.
                    </p>
                    <Button onClick={handleNewClient} className="bg-yellow-500 text-white hover:bg-yellow-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Client
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
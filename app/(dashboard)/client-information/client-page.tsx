'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { ClientSelector } from '@/components/client-selector';
import { ClientForm } from './client-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const financialStore = useFinancialStore();
  const { loadClient } = useClientStorage();
  const { toast } = useToast();
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load client from query parameter
  useEffect(() => {
    const loadClientId = searchParams?.get('load');
    if (loadClientId && user && !isLoadingClient) {
      setIsLoadingClient(true);
      loadClient(loadClientId)
        .then((client) => {
          if (client) {
            // Load client into slot A
            financialStore.setClientData('A', {
              ...client,
              dateOfBirth: client.dob ? (typeof client.dob === 'string' ? new Date(client.dob) : client.dob) : undefined,
            } as any);
            financialStore.setActiveClient('A');
            
            // Remove query parameter from URL
            router.replace('/client-information');
            
            toast({
              title: 'Client loaded',
              description: `Loaded ${client.firstName} ${client.lastName}`
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
      annualIncome: 0,
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

      <div className="space-y-6">
        {/* Client Selector Dropdown */}
        <ClientSelector />
        
        {/* Client Information Form */}
        <div>
          {financialStore.activeClient ? (
            <ClientForm clientSlot={financialStore.activeClient} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    Create a new client to get started.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "New Client" above or use the dropdown menu to load a saved client.
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
  );
}
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { ClientForm } from './client-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.inflationRate ?? 2.5}
              onChange={(e) => handleChange('inflationRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Salary Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.salaryGrowthRate ?? 3.0}
              onChange={(e) => handleChange('salaryGrowthRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Super Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.superReturn ?? 7.0}
              onChange={(e) => handleChange('superReturn', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Share Return (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.shareReturn ?? 7.0}
              onChange={(e) => handleChange('shareReturn', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Property Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.propertyGrowthRate ?? 4.0}
              onChange={(e) => handleChange('propertyGrowthRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Withdrawal Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.withdrawalRate ?? 4.0}
              onChange={(e) => handleChange('withdrawalRate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Rent Growth (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={sharedAssumptions?.rentGrowthRate ?? 3.0}
              onChange={(e) => handleChange('rentGrowthRate', e.target.value)}
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
  const { saveClient, loadClient, deleteClient } = useClientStorage();
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
    dateOfBirth: undefined,
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

  // Handle saving both clients
  const handleSaveClients = async () => {
    try {
      let savedCount = 0;
      
      // Save Client A if it has data
      if (clientA && (clientA.firstName || clientA.lastName || clientA.email)) {
        const savedClientA = await saveClient({
          ...clientA,
          dob: clientA.dateOfBirth,
        });
        if (savedClientA) {
          financialStore.setClientData('A', {
            ...clientA,
            id: savedClientA.id,
          } as any);
          savedCount++;
        }
      }
      
      // Save Client B if it has data
      if (clientB && (clientB.firstName || clientB.lastName || clientB.email)) {
        const savedClientB = await saveClient({
          ...clientB,
          dob: clientB.dateOfBirth,
        });
        if (savedClientB) {
          financialStore.setClientData('B', {
            ...clientB,
            id: savedClientB.id,
          } as any);
          savedCount++;
        }
      }
      
      if (savedCount > 0) {
        toast({
          title: 'Clients saved',
          description: `Successfully saved ${savedCount} client${savedCount > 1 ? 's' : ''}. View all clients in the Account Center.`
        });
      } else {
        toast({
          title: 'No clients to save',
          description: 'Please fill in client information before saving'
        });
      }
    } catch (error) {
      console.error('Error saving clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to save clients. Please try again.',
        variant: 'destructive'
      });
    }
  };

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
    toast({
      title: 'Clients reset',
      description: 'Both clients have been reset to start fresh'
    });
  };

  // Handle deleting both clients
  const handleDeleteClients = async () => {
    try {
      let deletedCount = 0;
      
      // Delete Client A if it exists
      if ((clientA as any)?.id) {
        const successA = await deleteClient((clientA as any).id);
        if (successA) {
          deletedCount++;
        }
      }
      
      // Delete Client B if it exists
      if ((clientB as any)?.id) {
        const successB = await deleteClient((clientB as any).id);
        if (successB) {
          deletedCount++;
        }
      }
      
      // Clear both clients from store regardless
      const emptyClientData = getEmptyClientData();
      financialStore.setClientData('A', emptyClientData);
      financialStore.setClientData('B', emptyClientData);
      setFormKeyA(prev => prev + 1);
      setFormKeyB(prev => prev + 1);
      
      if (deletedCount > 0) {
        toast({
          title: 'Clients deleted',
          description: `Successfully deleted ${deletedCount} client${deletedCount > 1 ? 's' : ''} from database`
        });
      } else {
        toast({
          title: 'Clients cleared',
          description: 'Clients have been cleared from the form'
        });
      }
    } catch (error) {
      console.error('Error deleting clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete clients. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Get client data
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Client Information</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveClients} className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Save Clients
          </Button>
          <Button onClick={handleNewClients} className="bg-yellow-500 text-white hover:bg-yellow-600 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Clients
          </Button>
          <Button onClick={handleDeleteClients} variant="destructive" className="w-full sm:w-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Clients
          </Button>
        </div>
      </div>

      {/* Shared Assumptions */}
      <SharedAssumptionsSection />

      {/* Dual Client Forms - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Client A */}
        <div>
          <ClientForm key={`A-${formKeyA}`} clientSlot="A" />
        </div>

        {/* Client B */}
        <div>
          <ClientForm key={`B-${formKeyB}`} clientSlot="B" />
        </div>
      </div>
    </div>
  );
}

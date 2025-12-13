'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { ClientForm } from './client-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
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

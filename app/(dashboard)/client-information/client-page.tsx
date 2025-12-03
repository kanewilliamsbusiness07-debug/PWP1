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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Information</h1>
          <p className="text-muted-foreground">
            Manage client personal information, financial data, and comprehensive details
          </p>
        </div>
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
                    <p className="text-sm text-muted-foreground">
                      You can search, load, or create a new client to get started.
                    </p>
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
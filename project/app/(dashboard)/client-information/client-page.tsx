'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/lib/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientSelector } from '@/components/client-selector';
import { ClientForm } from './client-form';

export function ClientPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentClients, setRecentClients] = useState([]);
  const financialStore = useFinancialStore();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadRecentClients();
  }, []);

  const loadRecentClients = async () => {
    try {
      const response = await fetch('/api/clients?recent=true&limit=10');
      if (!response.ok) throw new Error('Failed to load clients');
      const data = await response.json();
      setRecentClients(data);
    } catch (error) {
      console.error('Error loading recent clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent clients',
        variant: 'destructive'
      });
    }
  };

  const handleClientClick = async (client: any) => {
    try {
      // Load full client data
      const response = await fetch(`/api/clients/${client.id}`);
      if (!response.ok) throw new Error('Failed to load client');
      const clientData = await response.json();
      
      // Set client data in store
      financialStore.setClientData('A', {
        ...clientData,
        dateOfBirth: new Date(clientData.dob)
      } as any);
      
      financialStore.setActiveClient('A');
      
      toast({
        title: 'Client Loaded',
        description: `${clientData.firstName} ${clientData.lastName} loaded successfully`
      });
    } catch (error) {
      console.error('Error loading client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client details',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Information</h1>
          <p className="text-muted-foreground">Manage client personal and contact details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Client Search Panel */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Clients</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No clients found
                  </p>
                ) : (
                  recentClients.map((client: any) => (
                    <div
                      key={client.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{client.email || 'No email'}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientClick(client);
                              financialStore.setActiveClient('A');
                            }}
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientClick(client);
                              financialStore.setActiveClient('B');
                            }}
                          >
                            B
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
                  <p className="text-muted-foreground">Select a client to view and edit their information.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * Custom hook for client storage operations
 * Handles saving, loading, deleting, and searching clients
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ClientData {
  id?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob?: Date | string | null;
  email?: string;
  mobile?: string;
  [key: string]: any; // Allow additional fields
}

export interface UseClientStorageReturn {
  clients: ClientData[];
  isLoading: boolean;
  error: string | null;
  saveClient: (clientData: ClientData) => Promise<ClientData | null>;
  loadClient: (clientId: string) => Promise<ClientData | null>;
  deleteClient: (clientId: string) => Promise<boolean>;
  searchClients: (searchTerm: string) => Promise<ClientData[]>;
  loadRecentClients: (limit?: number) => Promise<ClientData[]>;
  refreshClients: () => Promise<void>;
}

export function useClientStorage(): UseClientStorageReturn {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Save a new client or update an existing one
   */
  const saveClient = useCallback(async (clientData: ClientData): Promise<ClientData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!clientData.firstName || !clientData.lastName) {
        throw new Error('First name and last name are required');
      }

      // Prepare data for API
      const dataToSave = {
        ...clientData,
        dob: clientData.dob ? (typeof clientData.dob === 'string' ? clientData.dob : clientData.dob.toISOString()) : null,
      };

      let savedClient: ClientData;

      if (clientData.id) {
        // Update existing client
        const response = await fetch(`/api/clients/${clientData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update client' }));
          throw new Error(errorData.error || 'Failed to update client');
        }

        savedClient = await response.json();
        toast({
          title: 'Success',
          description: 'Client information updated successfully',
        });
        
        // Dispatch event to notify other components (like Account Center) that a client was updated
        if (typeof window !== 'undefined') {
          console.log('Dispatching client-saved event for updated client:', savedClient);
          window.dispatchEvent(new CustomEvent('client-saved', { detail: savedClient }));
        }
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to create client' }));
          throw new Error(errorData.error || 'Failed to create client');
        }

        savedClient = await response.json();
        toast({
          title: 'Success',
          description: 'Client saved successfully',
        });
        
        // Dispatch event to notify other components (like Account Center) that a client was created
        if (typeof window !== 'undefined') {
          console.log('Dispatching client-saved event for new client:', savedClient);
          window.dispatchEvent(new CustomEvent('client-saved', { detail: savedClient }));
        }
      }

      // Update local state
      setClients((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === savedClient.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedClient;
          return updated;
        }
        return [savedClient, ...prev];
      });

      return savedClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the client';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Load a specific client by ID
   */
  const loadClient = useCallback(async (clientId: string): Promise<ClientData | null> => {
    if (!clientId) {
      setError('Client ID is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Client not found');
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to load client' }));
        throw new Error(errorData.error || 'Failed to load client');
      }

      const client = await response.json();
      
      // Convert date strings to Date objects
      if (client.dob) {
        client.dob = new Date(client.dob);
      }

      return client;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading the client';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Delete a client
   */
  const deleteClient = useCallback(async (clientId: string): Promise<boolean> => {
    if (!clientId) {
      setError('Client ID is required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete client' }));
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // Remove from local state
      setClients((prev) => prev.filter((c) => c.id !== clientId));

      // Dispatch event to notify other components (like Account Center) that a client was deleted
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id: clientId } }));
      }

      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the client';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Search clients by name or email
   */
  const searchClients = useCallback(async (searchTerm: string): Promise<ClientData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL('/api/clients', window.location.origin);
      if (searchTerm.trim()) {
        url.searchParams.set('search', searchTerm.trim());
      }
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to search clients');
      }

      const results = await response.json();
      
      // Convert date strings to Date objects
      const clientsWithDates = results.map((client: ClientData) => ({
        ...client,
        dob: client.dob ? new Date(client.dob) : null,
      }));

      setClients(clientsWithDates);
      return clientsWithDates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching clients';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Load recent clients
   */
  const loadRecentClients = useCallback(async (limit: number = 10): Promise<ClientData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL('/api/clients', window.location.origin);
      url.searchParams.set('recent', 'true');
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to load recent clients');
      }

      const results = await response.json();
      
      // Convert date strings to Date objects
      const clientsWithDates = results.map((client: ClientData) => ({
        ...client,
        dob: client.dob ? new Date(client.dob) : null,
      }));

      setClients(clientsWithDates);
      return clientsWithDates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading recent clients';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Refresh the clients list
   */
  const refreshClients = useCallback(async (): Promise<void> => {
    await loadRecentClients(50);
  }, [loadRecentClients]);

  return {
    clients,
    isLoading,
    error,
    saveClient,
    loadClient,
    deleteClient,
    searchClients,
    loadRecentClients,
    refreshClients,
  };
}


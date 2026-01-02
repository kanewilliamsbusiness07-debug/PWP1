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
      
      // Validate date of birth is required for new clients
      if (!clientData.id && !clientData.dob) {
        throw new Error('Date of birth is required to save a client');
      }

      // Prepare data for API
      let dobValue: string | null = null;
      if (clientData.dob) {
        if (typeof clientData.dob === 'string') {
          dobValue = clientData.dob;
        } else if (clientData.dob instanceof Date) {
          // Format as YYYY-MM-DD
          const year = clientData.dob.getFullYear();
          const month = String(clientData.dob.getMonth() + 1).padStart(2, '0');
          const day = String(clientData.dob.getDate()).padStart(2, '0');
          dobValue = `${year}-${month}-${day}`;
        }
      }
      
      const dataToSave = {
        ...clientData,
        dob: dobValue,
      };

      let savedClient: ClientData;

      if (clientData.id) {
        // Try to update existing client first
        console.log('[use-client-storage] Attempting to update existing client:', clientData.id);
        const response = await fetch(`/api/clients/${clientData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          // If client doesn't exist (404), fall back to creating a new client
          if (response.status === 404) {
            console.log('[use-client-storage] Client not found, falling back to creating new client');
            // Remove the ID so we create a new client
            const { id, ...dataWithoutId } = dataToSave;
            
            const createResponse = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(dataWithoutId),
            });

            if (!createResponse.ok) {
              let errorData: any = {};
              try {
                const errorText = await createResponse.text();
                console.error('[use-client-storage] Client create error response:', errorText);
                errorData = JSON.parse(errorText);
              } catch (parseError) {
                errorData = { error: `Failed to create client (${createResponse.status})` };
              }
              console.error('[use-client-storage] Client create error details:', errorData);
              throw new Error(errorData.error || errorData.details || 'Failed to create client');
            }

            savedClient = await createResponse.json();
            toast({
              title: 'Success',
              description: 'Client saved successfully (created new)',
            });
            
            // Dispatch event to notify other components
            if (typeof window !== 'undefined') {
              console.log('Dispatching client-saved event for new client:', savedClient);
              window.dispatchEvent(new CustomEvent('client-saved', { detail: savedClient }));
            }
          } else {
            // Other errors (401, 500, etc.)
            const errorData = await response.json().catch(() => ({ error: 'Failed to update client' }));
            throw new Error(errorData.error || 'Failed to update client');
          }
        } else {
          // Update successful
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
        }
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          let errorData: any = {};
          try {
            const errorText = await response.text();
            console.error('[use-client-storage] Client save error response:', errorText);
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            errorData = { error: `Failed to create client (${response.status})` };
          }
          console.error('[use-client-storage] Client save error details:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to create client');
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
    console.log('[useClientStorage] loadClient called with ID:', clientId);
    if (!clientId) {
      setError('Client ID is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useClientStorage] Making API call to:', `/api/clients/${clientId}`);
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include',
      });

      console.log('[useClientStorage] API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[useClientStorage] Client not found (404)');
          throw new Error('Client not found');
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to load client' }));
        console.log('[useClientStorage] API error:', errorData);
        throw new Error(errorData.error || 'Failed to load client');
      }

      const client = await response.json();
      console.log('[useClientStorage] Client loaded successfully:', `${client.firstName} ${client.lastName}`, 'ID:', client.id);
      console.log('[useClientStorage] Client assets:', client.assets);
      console.log('[useClientStorage] Client liabilities:', client.liabilities);
      
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
    console.log('=== DELETE CLIENT HOOK CALLED ===');
    console.log('Client ID:', clientId);
    console.log('Client ID type:', typeof clientId);
    
    if (!clientId) {
      console.error('No client ID provided to deleteClient');
      setError('Client ID is required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/clients/${clientId}`;
      console.log('Making DELETE request to:', url);
      console.log('Full URL will be:', window.location.origin + url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('DELETE response status:', response.status);
      console.log('DELETE response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('DELETE response text:', responseText);

      if (!response.ok) {
        // If client doesn't exist (404), treat it as success since the goal is achieved
        if (response.status === 404) {
          console.log('Client not found - treating as successful deletion (client already doesn\'t exist)');
          
          // Remove from local state anyway
          setClients((prev) => prev.filter((c) => c.id !== clientId));

          // Dispatch event to notify other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id: clientId } }));
          }

          toast({
            title: 'Client removed',
            description: 'Client has been removed (it did not exist in the database)',
          });

          return true;
        }
        
        // Other errors (401, 500, etc.)
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Failed to delete client' };
        }
        console.error('DELETE failed:', errorData);
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

      const response = await fetch(url.toString(), {
        credentials: 'include',
      });

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

      const response = await fetch(url.toString(), {
        credentials: 'include',
      });

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


/**
 * Data Sharing Utilities
 *
 * Provides utilities for synchronizing data between components,
 * validating data integrity, and managing data flow.
 */

import { useCallback, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useToast } from '@/hooks/use-toast';

export interface DataSharingOptions {
  autoSync?: boolean;
  validateOnLoad?: boolean;
  syncInterval?: number; // in milliseconds
}

export function useDataSharing(options: DataSharingOptions = {}) {
  const {
    autoSync = true,
    validateOnLoad = true,
    syncInterval = 30000 // 30 seconds
  } = options;

  const financialStore = useFinancialStore();
  const { toast } = useToast();

  // Validate data integrity
  const validateIntegrity = useCallback(() => {
    const isValid = financialStore.validateDataIntegrity();
    if (!isValid) {
      console.warn('Data integrity validation failed');
      toast({
        title: 'Data Warning',
        description: 'Some data may be out of sync. Please refresh if you notice inconsistencies.',
        variant: 'destructive'
      });
    }
    return isValid;
  }, [financialStore, toast]);

  // Force synchronization with database
  const forceSync = useCallback(async () => {
    try {
      const success = await financialStore.forceSync();
      if (success) {
        toast({
          title: 'Data Synced',
          description: 'Data has been synchronized with the database.'
        });
      } else {
        toast({
          title: 'Sync Warning',
          description: 'Data synchronization completed with warnings.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Force sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [financialStore, toast]);

  // Sync specific client data
  const syncClient = useCallback(async (clientId: string, slot: 'A' | 'B') => {
    try {
      await financialStore.syncFromDatabase(clientId, slot);
      toast({
        title: 'Client Synced',
        description: `Client ${slot} data has been synchronized.`
      });
    } catch (error) {
      console.error('Client sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: `Failed to sync Client ${slot} data.`,
        variant: 'destructive'
      });
    }
  }, [financialStore, toast]);

  // Auto-sync on component mount
  useEffect(() => {
    if (autoSync) {
      forceSync();
    }

    if (validateOnLoad) {
      validateIntegrity();
    }
  }, [autoSync, validateOnLoad, forceSync, validateIntegrity]);

  // Periodic sync
  useEffect(() => {
    if (autoSync && syncInterval > 0) {
      const interval = setInterval(() => {
        forceSync();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [autoSync, syncInterval, forceSync]);

  // Listen for data change events
  useEffect(() => {
    const handleClientSaved = () => {
      if (autoSync) {
        setTimeout(() => forceSync(), 1000); // Delay to allow DB to update
      }
    };

    const handleClientDeleted = () => {
      if (autoSync) {
        setTimeout(() => forceSync(), 1000);
      }
    };

    window.addEventListener('client-saved', handleClientSaved);
    window.addEventListener('client-deleted', handleClientDeleted);

    return () => {
      window.removeEventListener('client-saved', handleClientSaved);
      window.removeEventListener('client-deleted', handleClientDeleted);
    };
  }, [autoSync, forceSync]);

  return {
    validateIntegrity,
    forceSync,
    syncClient,
    isDataValid: financialStore.validateDataIntegrity()
  };
}

/**
 * Hook for sharing client data between components
 */
export function useClientDataSharing(clientSlot: 'A' | 'B') {
  const financialStore = useFinancialStore();
  const { toast } = useToast();

  const clientData = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;

  const updateClientData = useCallback((data: Partial<any>) => {
    financialStore.syncClientData(clientSlot, data);
    toast({
      title: 'Data Updated',
      description: `Client ${clientSlot} data has been updated.`
    });
  }, [financialStore, clientSlot, toast]);

  const loadFromDatabase = useCallback(async (clientId: string) => {
    if (clientId) {
      await financialStore.syncFromDatabase(clientId, clientSlot);
      toast({
        title: 'Data Loaded',
        description: `Client ${clientSlot} data loaded from database.`
      });
    }
  }, [financialStore, clientSlot, toast]);

  return {
    clientData,
    updateClientData,
    loadFromDatabase
  };
}
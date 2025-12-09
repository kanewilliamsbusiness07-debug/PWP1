/**
 * Recent Clients Component
 * Displays a list of saved clients with search, filter, load, and delete functionality
 */

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Trash2, User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import * as formatModule from 'date-fns/format';
const format: (date: Date | number, fmt: string) => string = (formatModule as any).default ?? (formatModule as any);
import { useClientStorage, ClientData } from '@/lib/hooks/use-client-storage';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentClientsProps {
  onClientSelect?: (client: ClientData) => void;
  onClientLoad?: (client: ClientData) => void;
  maxHeight?: string;
}

export function RecentClients({
  onClientSelect,
  onClientLoad,
  maxHeight = '600px',
}: RecentClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const { clients, isLoading, loadRecentClients, searchClients, deleteClient, refreshClients } = useClientStorage();
  const { toast } = useToast();

  // Load recent clients on mount
  useEffect(() => {
    loadRecentClients(50);
  }, [loadRecentClients]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }

    const term = searchTerm.toLowerCase().trim();
    return clients.filter((client) => {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const mobile = (client.mobile || '').toLowerCase();
      
      return (
        fullName.includes(term) ||
        email.includes(term) ||
        mobile.includes(term)
      );
    });
  }, [clients, searchTerm]);

  // Handle search with debounce
  const handleSearch = React.useCallback(
    async (term: string) => {
      setSearchTerm(term);
      if (term.trim()) {
        await searchClients(term);
      } else {
        await loadRecentClients(50);
      }
    },
    [searchClients, loadRecentClients]
  );

  // Handle client click
  const handleClientClick = (client: ClientData) => {
    if (onClientSelect) {
      onClientSelect(client);
    }
  };

  // Handle load client
  const handleLoadClient = async (client: ClientData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      if (onClientLoad) {
        onClientLoad(client);
      } else if (onClientSelect) {
        onClientSelect(client);
      }

      toast({
        title: 'Client Loaded',
        description: `${client.firstName} ${client.lastName} loaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load client',
        variant: 'destructive',
      });
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (client: ClientData, event: React.MouseEvent) => {
    event.stopPropagation();
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!clientToDelete?.id) return;

    const success = await deleteClient(clientToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      // Refresh the list
      if (searchTerm.trim()) {
        await searchClients(searchTerm);
      } else {
        await loadRecentClients(50);
      }
    }
  };

  // Format date for display
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Clients</span>
            <Badge variant="secondary">{filteredClients.length}</Badge>
          </CardTitle>
          <CardDescription>
            Search and manage your saved clients
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchTerm.trim() ? 'No clients found matching your search' : 'No clients found'}
              </p>
              {searchTerm.trim() && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    loadRecentClients(50);
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea style={{ maxHeight }}>
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                    onClick={() => handleClientClick(client)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {client.firstName} {client.lastName}
                          </h4>
                          {client.middleName && (
                            <span className="text-xs text-muted-foreground truncate">
                              {client.middleName}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {client.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.mobile && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">{client.mobile}</span>
                            </div>
                          )}
                          {client.dob && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(client.dob)}</span>
                            </div>
                          )}
                        </div>

                        {client.suburb && client.state && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {client.suburb}, {client.state} {client.postcode || ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleLoadClient(client, e)}
                          title="Load client"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClick(client, e)}
                          title="Delete client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Client?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {clientToDelete?.firstName} {clientToDelete?.lastName}
              </strong>
              ? This action cannot be undone and will permanently remove all client data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


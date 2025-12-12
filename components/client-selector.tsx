import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClientSelector() {
  const financialStore = useFinancialStore();
  const { deleteClient } = useClientStorage();
  const { toast } = useToast();
  const [selectedSavedClient, setSelectedSavedClient] = useState<string>('');
  const savedClientNames = financialStore.getAllSavedClientNames();

  const handleDeleteClient = async (name: string) => {
    const savedClient = financialStore.savedClients[name];
    if (!savedClient) return;

    // Check if client has a database ID (may exist at runtime even if not in type)
    const clientData = savedClient.data as any;
    const databaseId = clientData?.id;

    // If client has a database ID, delete from database
    if (databaseId && typeof databaseId === 'string') {
      const confirmed = confirm(`Are you sure you want to delete ${name}? This will permanently delete the client from the database.`);
      if (confirmed) {
        const success = await deleteClient(databaseId);
        if (success) {
          // Also remove from local storage
          financialStore.deleteClientByName(name);
          toast({
            title: 'Client deleted',
            description: `${name} has been deleted`
          });
        }
      }
    } else {
      // Delete from local storage only
      const confirmed = confirm(`Are you sure you want to delete ${name}?`);
      if (confirmed) {
        financialStore.deleteClientByName(name);
        toast({
          title: 'Client deleted',
          description: `${name} has been removed from saved clients`
        });
      }
    }
  };

  // Get current active client info
  const activeClient = financialStore.activeClient === 'A' ? financialStore.clientA : financialStore.clientB;
  const clientName = activeClient 
    ? `${activeClient.firstName || ''} ${activeClient.lastName || ''}`.trim() || 'Unnamed Client'
    : 'No Client Loaded';

  const handleLoadClientDirect = (name: string) => {
    // Always load to slot A for simplicity
    financialStore.loadClientByName(name, 'A');
    financialStore.setActiveClient('A');
    setSelectedSavedClient('');
  };

  return (
    <div className="space-y-4">
      {/* Client Info Box */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Client Info</h3>
              <p className="text-lg font-semibold">{clientName}</p>
            </div>
            {activeClient && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load Saved Client */}
      {savedClientNames.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Load Saved Client</h3>
              <div className="flex gap-2">
                <Select
                  value={selectedSavedClient}
                  onValueChange={setSelectedSavedClient}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a saved client" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedClientNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSavedClient && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => handleLoadClientDirect(selectedSavedClient)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(selectedSavedClient)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

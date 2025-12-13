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
import { Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClientSelector() {
  const financialStore = useFinancialStore();
  const { deleteClient } = useClientStorage();
  const { toast } = useToast();
  const [selectedSavedClient, setSelectedSavedClient] = useState<string>('');
  const [loadTarget, setLoadTarget] = useState<'A' | 'B'>('A');
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

  // Get client info for both A and B
  const clientA = financialStore.clientA;
  const clientB = financialStore.clientB;
  const clientAName = clientA 
    ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Empty'
    : 'Empty';
  const clientBName = clientB 
    ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Empty'
    : 'Empty';

  const handleLoadClient = (name: string, slot: 'A' | 'B') => {
    financialStore.loadClientByName(name, slot);
    financialStore.setActiveClient(slot);
    setSelectedSavedClient('');
    toast({
      title: 'Client loaded',
      description: `${name} loaded into Client ${slot}`
    });
  };

  return (
    <div className="space-y-4">
      {/* Current Clients Info - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <h3 className="text-xs font-medium text-blue-600">Client A</h3>
                  <p className="text-sm font-semibold text-blue-800">{clientAName}</p>
                </div>
              </div>
              {clientA?.firstName && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <div>
                  <h3 className="text-xs font-medium text-green-600">Client B</h3>
                  <p className="text-sm font-semibold text-green-800">{clientBName}</p>
                </div>
              </div>
              {clientB?.firstName && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Saved Client */}
      {savedClientNames.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Load Saved Client</h3>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedSavedClient}
                  onValueChange={setSelectedSavedClient}
                >
                  <SelectTrigger className="flex-1 min-w-[200px]">
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
                  <>
                    <Select
                      value={loadTarget}
                      onValueChange={(v) => setLoadTarget(v as 'A' | 'B')}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Client A</SelectItem>
                        <SelectItem value="B">Client B</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="default"
                      size="sm"
                      className={loadTarget === 'A' 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                      }
                      onClick={() => handleLoadClient(selectedSavedClient, loadTarget)}
                    >
                      Load to {loadTarget}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(selectedSavedClient)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

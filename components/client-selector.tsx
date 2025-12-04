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
  
  const handleLoadClient = (name: string, slot: "A" | "B") => {
    financialStore.loadClientByName(name, slot);
    setSelectedSavedClient('');
  };

  const handleDeleteClient = async (name: string) => {
    const savedClient = financialStore.savedClients[name];
    if (!savedClient) return;

    // If client has a database ID, delete from database
    if (savedClient.data.id) {
      const confirmed = confirm(`Are you sure you want to delete ${name}? This will permanently delete the client from the database.`);
      if (confirmed) {
        const success = await deleteClient(savedClient.data.id);
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

  return (
    <div className="space-y-4">
      {/* Client Slot Selector */}
      <div className="flex space-x-2 mb-4">
        <Button
          variant={financialStore.activeClient === 'A' ? 'default' : 'outline'}
          className={`flex-1 ${
            financialStore.activeClient === 'A' 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}
          onClick={() => financialStore.setActiveClient('A')}
          disabled={!financialStore.clientA}
        >
          Client A
          {financialStore.clientA && (
            <Badge variant="secondary" className="ml-2">
              {financialStore.clientA.firstName}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={financialStore.activeClient === 'B' ? 'default' : 'outline'}
          className={`flex-1 ${
            financialStore.activeClient === 'B' 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}
          onClick={() => financialStore.setActiveClient('B')}
          disabled={!financialStore.clientB}
        >
          Client B
          {financialStore.clientB && (
            <Badge variant="secondary" className="ml-2">
              {financialStore.clientB.firstName}
            </Badge>
          )}
        </Button>
      </div>

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
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadClient(selectedSavedClient, 'A')}
                    >
                      Load to A
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadClient(selectedSavedClient, 'B')}
                    >
                      Load to B
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

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/store';
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

export function ClientSelector() {
  const financialStore = useFinancialStore();
  const [selectedSavedClient, setSelectedSavedClient] = useState<string>('');
  const savedClientNames = financialStore.getAllSavedClientNames();
  
  const handleLoadClient = (name: string, slot: "A" | "B") => {
    financialStore.loadClientByName(name, slot);
    setSelectedSavedClient('');
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

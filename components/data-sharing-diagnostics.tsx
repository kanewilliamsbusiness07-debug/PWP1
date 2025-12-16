/**
 * Data Sharing Diagnostics Component
 *
 * Provides tools to diagnose and fix data sharing issues
 * between local storage, database, and component state.
 */

'use client';

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/store';
import { useDataSharing } from '@/lib/hooks/use-data-sharing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle, Database, HardDrive, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DataSharingDiagnostics() {
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const financialStore = useFinancialStore();
  const { forceSync, validateIntegrity } = useDataSharing({ autoSync: false });
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults(null);

    try {
      const results = {
        timestamp: new Date().toISOString(),
        dataIntegrity: financialStore.validateDataIntegrity(),
        storeState: {
          hasClientA: !!(financialStore.clientA?.firstName || financialStore.clientA?.lastName),
          hasClientB: !!(financialStore.clientB?.firstName || financialStore.clientB?.lastName),
          activeClient: financialStore.activeClient,
          grossIncome: financialStore.grossIncome,
          totalAssets: financialStore.cashSavings + financialStore.investments + financialStore.superBalance,
          totalLiabilities: financialStore.totalDebt,
        },
        localStorage: {
          size: typeof window !== 'undefined' ? JSON.stringify(localStorage).length : 0,
          hasFinancialStore: typeof window !== 'undefined' ? !!localStorage.getItem('financial-store') : false,
        },
        issues: [] as string[]
      };

      // Check for common issues
      if (!results.dataIntegrity) {
        results.issues.push('Data integrity validation failed - financial calculations may not match client data');
      }

      if (results.storeState.grossIncome === 0 && (results.storeState.hasClientA || results.storeState.hasClientB)) {
        results.issues.push('Client data exists but income is not synchronized to financial store');
      }

      if (results.localStorage.size > 4 * 1024 * 1024) { // 4MB
        results.issues.push('Local storage is getting large - may cause performance issues');
      }

      setDiagnosticResults(results);

      if (results.issues.length === 0) {
        toast({
          title: 'Diagnostics Complete',
          description: 'No data sharing issues detected.',
        });
      } else {
        toast({
          title: 'Issues Found',
          description: `${results.issues.length} data sharing issue(s) detected.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: 'Diagnostics Failed',
        description: 'Failed to run diagnostics. Check console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const fixIssues = async () => {
    try {
      await forceSync();
      await validateIntegrity();
      toast({
        title: 'Fix Applied',
        description: 'Data synchronization completed.',
      });
      // Re-run diagnostics
      setTimeout(() => runDiagnostics(), 1000);
    } catch (error) {
      toast({
        title: 'Fix Failed',
        description: 'Failed to apply fixes. Check console for details.',
        variant: 'destructive'
      });
    }
  };

  const clearLocalStorage = () => {
    if (confirm('Are you sure you want to clear all local data? This will reset the application state.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sharing Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isRunningDiagnostics}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>

          {diagnosticResults?.issues?.length > 0 && (
            <Button
              onClick={fixIssues}
              variant="default"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Fix Issues
            </Button>
          )}

          <Button
            onClick={clearLocalStorage}
            variant="destructive"
            size="sm"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Clear Storage
          </Button>
        </div>

        {diagnosticResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {diagnosticResults.dataIntegrity ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Data Integrity</span>
                  </div>
                  <Badge variant={diagnosticResults.dataIntegrity ? "default" : "destructive"} className="mt-2">
                    {diagnosticResults.dataIntegrity ? 'Valid' : 'Issues Found'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Store State</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Client A: {diagnosticResults.storeState.hasClientA ? 'Loaded' : 'Empty'}
                    <br />
                    Client B: {diagnosticResults.storeState.hasClientB ? 'Loaded' : 'Empty'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Local Storage</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {(diagnosticResults.localStorage.size / 1024).toFixed(1)} KB
                    <br />
                    Store: {diagnosticResults.localStorage.hasFinancialStore ? 'Present' : 'Missing'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {diagnosticResults.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issues Found:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {diagnosticResults.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {diagnosticResults.issues.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All data sharing diagnostics passed. Your data is properly synchronized.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
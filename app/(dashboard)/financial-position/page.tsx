'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Calculator, Wallet, CreditCard } from 'lucide-react';
import { useFinancialStore } from '@/lib/store/store';
import { useSyncFields } from '@/lib/hooks/use-sync-fields';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const assetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  currentValue: z.number().min(0, 'Value must be positive'),
  type: z.enum(['property', 'vehicle', 'savings', 'shares', 'super', 'other'])
});

const liabilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  balance: z.number().min(0, 'Balance must be positive'),
  monthlyPayment: z.number().min(0, 'Payment must be positive'),
  interestRate: z.number().min(0).max(100, 'Rate must be between 0-100'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year').max(100, 'Loan term cannot exceed 100 years'),
  type: z.enum(['mortgage', 'personal-loan', 'credit-card', 'hecs', 'other'])
});

const incomeSchema = z.object({
  annualIncome: z.number().min(0, 'Annual income must be positive'),
  rentalIncome: z.number().min(0, 'Income must be positive'),
  dividends: z.number().min(0, 'Dividends must be positive'),
  otherIncome: z.number().min(0, 'Income must be positive'),
  frankedDividends: z.number().min(0, 'Franked dividends must be positive'),
  capitalGains: z.number().min(0, 'Capital gains must be positive')
});

type Asset = z.infer<typeof assetSchema> & { id: string };
type Liability = z.infer<typeof liabilitySchema> & { id: string };
type Income = z.infer<typeof incomeSchema>;

export default function FinancialPositionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [activeTab, setActiveTab] = useState('assets');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Subscribe to specific store values to ensure re-renders
  const store = useFinancialStore();
  const grossIncome = useFinancialStore((state) => state.grossIncome);
  const rentalIncome = useFinancialStore((state) => state.rentalIncome);
  const investmentIncome = useFinancialStore((state) => state.investmentIncome);
  const frankedDividends = useFinancialStore((state) => state.frankedDividends);
  const otherIncome = useFinancialStore((state) => state.otherIncome);
  const capitalGains = useFinancialStore((state) => state.capitalGains);
  const cashSavings = useFinancialStore((state) => state.cashSavings);
  const investments = useFinancialStore((state) => state.investments);
  const superBalance = useFinancialStore((state) => state.superBalance);
  const totalDebt = useFinancialStore((state) => state.totalDebt);
  const activeClient = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  
  // Get current client data
  const currentClient = activeClient ? (activeClient === 'A' ? clientA : clientB) : null;
  
  type AssetsFormValues = {
    [key: string]: {
      name: string;
      currentValue: number;
      type: Asset['type'];
    };
  };

  type LiabilitiesFormValues = {
    [key: string]: {
      name: string;
      balance: number;
      monthlyPayment: number;
      interestRate: number;
      loanTerm: number;
      type: Liability['type'];
    };
  };

  const assetsForm = useForm<AssetsFormValues>({
    defaultValues: assets.reduce((acc, asset) => ({
      ...acc,
      [asset.id]: {
        name: asset.name,
        currentValue: asset.currentValue,
        type: asset.type
      }
    }), {})
  });

  const liabilitiesForm = useForm<LiabilitiesFormValues>({
    defaultValues: liabilities.reduce((acc, liability) => ({
      ...acc,
      [liability.id]: {
        name: liability.name,
        balance: liability.balance,
        monthlyPayment: liability.monthlyPayment,
        interestRate: liability.interestRate,
        loanTerm: liability.loanTerm,
        type: liability.type
      }
    }), {})
  });

  const incomeForm = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      annualIncome: grossIncome ?? 0,
      rentalIncome: rentalIncome ?? 0,
      dividends: 0,
      otherIncome: otherIncome ?? 0,
      frankedDividends: frankedDividends ?? 0,
      capitalGains: capitalGains ?? 0
    }
  });

  // Watch store and update income form when store changes (use setValue to avoid disrupting user input)
  useEffect(() => {
    // Only update if the form values differ from store to avoid infinite loops
    const currentValues = incomeForm.getValues();
    const storeAnnualIncome = grossIncome ?? 0;
    const storeRentalIncome = rentalIncome ?? 0;
    const storeDividends = (investmentIncome ?? 0) - (frankedDividends ?? 0);
    const storeOtherIncome = otherIncome ?? 0;
    const storeFrankedDividends = frankedDividends ?? 0;
    const storeCapitalGains = capitalGains ?? 0;
    
    if (currentValues.annualIncome !== storeAnnualIncome) {
      incomeForm.setValue('annualIncome', storeAnnualIncome, { shouldDirty: false });
    }
    if (currentValues.rentalIncome !== storeRentalIncome) {
      incomeForm.setValue('rentalIncome', storeRentalIncome, { shouldDirty: false });
    }
    if (Math.abs(currentValues.dividends - storeDividends) > 0.01) {
      incomeForm.setValue('dividends', storeDividends, { shouldDirty: false });
    }
    if (currentValues.otherIncome !== storeOtherIncome) {
      incomeForm.setValue('otherIncome', storeOtherIncome, { shouldDirty: false });
    }
    if (Math.abs(currentValues.frankedDividends - storeFrankedDividends) > 0.01) {
      incomeForm.setValue('frankedDividends', storeFrankedDividends, { shouldDirty: false });
    }
    if (Math.abs(currentValues.capitalGains - storeCapitalGains) > 0.01) {
      incomeForm.setValue('capitalGains', storeCapitalGains, { shouldDirty: false });
    }
  }, [grossIncome, rentalIncome, investmentIncome, frankedDividends, otherIncome, capitalGains, incomeForm]);

  // Watch store and update assets/liabilities when they change
  useEffect(() => {
    try {
      // Use client data assets/liabilities if available, otherwise use store values
      const clientAssets = currentClient?.assets || [];
      const clientLiabilities = currentClient?.liabilities || [];
      
      const storedAssets: Asset[] = clientAssets.length > 0 ? clientAssets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        currentValue: asset.currentValue,
        type: asset.type
      })) : [
        {
          id: 'cash',
          name: 'Cash Savings',
          currentValue: cashSavings ?? 0,
          type: 'savings'
        },
        {
          id: 'investments',
          name: 'Investments',
          currentValue: investments ?? 0,
          type: 'shares'
        },
        {
          id: 'super',
          name: 'Superannuation',
          currentValue: superBalance ?? 0,
          type: 'super'
        }
      ];
      
      const storedLiabilities: Liability[] = clientLiabilities.length > 0 ? clientLiabilities.map((liab: any) => ({
        id: liab.id,
        name: liab.name,
        balance: liab.balance,
        monthlyPayment: liab.monthlyPayment,
        interestRate: liab.interestRate,
        loanTerm: liab.loanTerm ?? 30,
        type: liab.type
      })) : [
        {
          id: 'total-debt',
          name: 'Total Debt',
          balance: totalDebt ?? 0,
          monthlyPayment: 0,
          interestRate: store.interestRate ?? 0,
          loanTerm: 30,
          type: 'other'
        }
      ];
      
      // Only update if values actually changed
      const assetsChanged = JSON.stringify(assets) !== JSON.stringify(storedAssets);
      const liabilitiesChanged = JSON.stringify(liabilities) !== JSON.stringify(storedLiabilities);
      
      if (assetsChanged) {
        setAssets(storedAssets);
        assetsForm.reset(
          storedAssets.reduce((acc, asset) => ({
            ...acc,
            [asset.id]: {
              name: asset.name,
              currentValue: asset.currentValue,
              type: asset.type
            }
          }), {})
        );
      }
      
      if (liabilitiesChanged) {
        setLiabilities(storedLiabilities);
        liabilitiesForm.reset(
          storedLiabilities.reduce((acc, liability) => ({
            ...acc,
            [liability.id]: {
              name: liability.name,
              balance: liability.balance,
              monthlyPayment: liability.monthlyPayment,
              interestRate: liability.interestRate,
              loanTerm: liability.loanTerm,
              type: liability.type
            }
          }), {})
        );
      }
    } catch (error) {
      console.error('Error initializing financial position:', error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading your financial data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [cashSavings, investments, superBalance, totalDebt, currentClient?.assets, currentClient?.liabilities, store.interestRate, toast, assetsForm, liabilitiesForm, assets, liabilities]);

  const debouncedUpdateStore = useDebounce((field: string, value: number) => {
    if (store?.updateField) {
      store.updateField(field as any, value);
    }
  }, 500);

  const handleIncomeChange = (field: keyof Income, value: number) => {
    // Update form state
    incomeForm.setValue(field, value);
    
    // Update store fields with type-safe keys
    switch (field) {
      case 'annualIncome':
        store.updateField('grossIncome' as const, value);
        // Also sync to client data
        if (store?.setClientData && activeClient) {
          store.setClientData(activeClient, { annualIncome: value, grossSalary: value });
        }
        break;
      case 'rentalIncome':
        store.updateField('rentalIncome' as const, value);
        if (store?.setClientData && activeClient) {
          store.setClientData(activeClient, { rentalIncome: value });
        }
        break;
      case 'dividends':
      case 'capitalGains':
        const totalInvestmentIncome = 
          Number(incomeForm.getValues('dividends')) + 
          Number(incomeForm.getValues('capitalGains'));
        store.updateField('investmentIncome' as const, totalInvestmentIncome);
        if (store?.setClientData && activeClient) {
          store.setClientData(activeClient, { 
            dividends: incomeForm.getValues('dividends'),
            capitalGains: incomeForm.getValues('capitalGains')
          });
        }
        break;
      case 'otherIncome':
        store.updateField('otherIncome' as const, value);
        if (store?.setClientData && activeClient) {
          store.setClientData(activeClient, { otherIncome: value });
        }
        break;
      case 'frankedDividends':
        store.updateField('frankedDividends' as const, value);
        if (store?.setClientData && activeClient) {
          store.setClientData(activeClient, { frankedDividends: value });
        }
        break;
    }
  };

  useSyncFields(incomeForm);

  const handleAddAsset = () => {
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: '',
      currentValue: 0,
      type: 'other'
    };
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    
    // Sync to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { assets: updatedAssets });
    }
  };

  const handleRemoveAsset = (id: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== id);
    setAssets(updatedAssets);
    
    // Sync to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { assets: updatedAssets });
    }
    
    // Update store totals
    if (store?.updateField) {
      store.updateField('cashSavings', 
        updatedAssets
          .filter(a => a.type === 'savings')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );
      store.updateField('investments',
        updatedAssets
          .filter(a => a.type === 'shares')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );
      store.updateField('superBalance',
        updatedAssets
          .filter(a => a.type === 'super')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );
    }
  };

  const handleAddLiability = () => {
    const newLiability: Liability = {
      id: `liability-${Date.now()}`,
      name: '',
      balance: 0,
      monthlyPayment: 0,
      interestRate: 0,
      loanTerm: 30,
      type: 'other'
    };
    const updatedLiabilities = [...liabilities, newLiability];
    setLiabilities(updatedLiabilities);
    
    // Sync to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { liabilities: updatedLiabilities });
    }
  };

  const handleRemoveLiability = (id: string) => {
    const updatedLiabilities = liabilities.filter(liability => liability.id !== id);
    setLiabilities(updatedLiabilities);
    
    // Sync to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { liabilities: updatedLiabilities });
    }
    
    // Update store totals
    if (store?.updateField) {
      const totalDebt = updatedLiabilities.reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
      store.updateField('totalDebt', totalDebt);
    }
  };

  const handleAssetChange = (id: string, field: keyof Asset, value: any) => {
    const updatedAssets = assets.map(asset => {
      if (asset.id === id) {
        return { ...asset, [field]: value };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // Update store totals AND sync to client data
    if (store?.updateField) {
      store.updateField('cashSavings', 
        updatedAssets
          .filter(a => a.type === 'savings')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );

      store.updateField('investments',
        updatedAssets
          .filter(a => a.type === 'shares')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );

      store.updateField('superBalance',
        updatedAssets
          .filter(a => a.type === 'super')
          .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0)
      );
    }
    
    // Sync assets to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { assets: updatedAssets });
    }
  };

  const handleLiabilityChange = (id: string, field: keyof Liability, value: any) => {
    const updatedLiabilities = liabilities.map(liability => {
      if (liability.id === id) {
        return { ...liability, [field]: value };
      }
      return liability;
    });
    setLiabilities(updatedLiabilities);

    // Update store totals
    if (store?.updateField) {
      const totalLiabilities = updatedLiabilities
        .reduce((sum, l) => sum + (Number(l.balance) || 0), 0);

      store.updateField('totalDebt', totalLiabilities);
    }
    
    // Sync liabilities to client data for cross-page synchronization
    if (store?.setClientData && activeClient) {
      store.setClientData(activeClient, { liabilities: updatedLiabilities });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading financial position...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      {/* Header with summary cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Wallet className="mr-2 h-5 w-5 text-green-500" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${assets.reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Across {assets.length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="mr-2 h-5 w-5 text-red-500" />
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${liabilities.reduce((sum, liability) => sum + (Number(liability.balance) || 0), 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Across {liabilities.length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calculator className="mr-2 h-5 w-5 text-blue-500" />
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(
                assets.reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0) -
                liabilities.reduce((sum, liability) => sum + (Number(liability.balance) || 0), 0)
              ).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Overall financial position
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Financial Position</CardTitle>
          <CardDescription>
            Manage your assets, liabilities, and income streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="assets" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="liabilities" className="flex items-center">
                <TrendingDown className="mr-2 h-4 w-4" />
                Liabilities
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Income
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Assets</h3>
                <Button onClick={handleAddAsset} className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </div>
              
              <Form {...assetsForm}>
                <form onSubmit={assetsForm.handleSubmit(() => {})} className="space-y-4">
                  <div className="grid gap-4">
                    {assets.map((asset) => (
                      <Card key={asset.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <FormField
                                  control={assetsForm.control}
                                  name={`${asset.id}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Asset Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          value={asset.name}
                                          onChange={(e) => handleAssetChange(asset.id, 'name', e.target.value)}
                                          placeholder="Enter asset name"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAsset(asset.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-3">
                              <FormField
                                control={assetsForm.control}
                                name={`${asset.id}.currentValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Value</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        {...field}
                                        value={asset.currentValue}
                                        onChange={(e) => handleAssetChange(asset.id, 'currentValue', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="font-mono"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={assetsForm.control}
                                name={`${asset.id}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                      value={asset.type}
                                      onValueChange={(value) => handleAssetChange(asset.id, 'type', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="property">Property</SelectItem>
                                        <SelectItem value="vehicle">Vehicle</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                        <SelectItem value="shares">Shares</SelectItem>
                                        <SelectItem value="super">Superannuation</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex items-end">
                                <Badge variant={asset.type === 'savings' ? 'default' : 'secondary'}>
                                  {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="liabilities" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Liabilities</h3>
                <Button onClick={handleAddLiability} className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Liability
                </Button>
              </div>
              
              <Form {...liabilitiesForm}>
                <form onSubmit={liabilitiesForm.handleSubmit(() => {})} className="space-y-4">
                  <div className="grid gap-4">
                    {liabilities.map((liability) => (
                      <Card key={liability.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <FormField
                                  control={liabilitiesForm.control}
                                  name={`${liability.id}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Liability Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          value={liability.name}
                                          onChange={(e) => handleLiabilityChange(liability.id, 'name', e.target.value)}
                                          placeholder="Enter liability name"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLiability(liability.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                              <FormField
                                control={liabilitiesForm.control}
                                name={`${liability.id}.balance`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Balance</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        {...field}
                                        value={liability.balance}
                                        onChange={(e) => handleLiabilityChange(liability.id, 'balance', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="font-mono"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={liabilitiesForm.control}
                                name={`${liability.id}.monthlyPayment`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Monthly Payment</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        {...field}
                                        value={liability.monthlyPayment}
                                        onChange={(e) => handleLiabilityChange(liability.id, 'monthlyPayment', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="font-mono"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={liabilitiesForm.control}
                                name={`${liability.id}.interestRate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Interest Rate (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        {...field}
                                        value={liability.interestRate}
                                        onChange={(e) => handleLiabilityChange(liability.id, 'interestRate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="font-mono"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={liabilitiesForm.control}
                                name={`${liability.id}.loanTerm`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Loan Term (Years)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        {...field}
                                        value={liability.loanTerm}
                                        onChange={(e) => handleLiabilityChange(liability.id, 'loanTerm', e.target.value === '' ? 30 : parseInt(e.target.value))}
                                        placeholder="30"
                                        className="font-mono"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={liabilitiesForm.control}
                                name={`${liability.id}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                      value={liability.type}
                                      onValueChange={(value) => handleLiabilityChange(liability.id, 'type', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mortgage">Mortgage</SelectItem>
                                        <SelectItem value="personal-loan">Personal Loan</SelectItem>
                                        <SelectItem value="credit-card">Credit Card</SelectItem>
                                        <SelectItem value="hecs">HECS/HELP</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="income" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <Form {...incomeForm}>
                    <form onSubmit={incomeForm.handleSubmit((data) => {
                      if (store?.updateField) {
                        Object.entries(data).forEach(([key, value]) => {
                          store.updateField(key as any, Number(value));
                        });
                        toast({
                          title: "Success",
                          description: "Income details have been saved.",
                          variant: "default"
                        });
                      }
                    })} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={incomeForm.control}
                          name="annualIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Income</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono"
                                  value={field.value}
                                  onChange={(e) => handleIncomeChange('annualIncome', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={incomeForm.control}
                          name="rentalIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rental Income</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={incomeForm.control}
                          name="dividends"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dividends</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={incomeForm.control}
                          name="frankedDividends"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Franked Dividends</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={incomeForm.control}
                          name="capitalGains"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capital Gains</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={incomeForm.control}
                          name="otherIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Income</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="any"
                                  placeholder="0.00" 
                                  className="font-mono"
                                  value={field.value}
                                  onChange={(e) => handleIncomeChange('otherIncome', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">Save Income Details</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
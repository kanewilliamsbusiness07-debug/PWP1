'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialStore } from '@/lib/store/store';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const MARITAL_STATUS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DEFACTO', label: 'De Facto' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
];

const STATES = [
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'WA', label: 'Western Australia' },
];

// Comprehensive schema including all fields
const clientSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, { message: 'First name is required' }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  dob: z.date().optional(),
  maritalStatus: z.string().optional(),
  numberOfDependants: z.number().min(0).optional(),
  agesOfDependants: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  ownOrRent: z.enum(['OWN', 'RENT']).optional(),

  // Financial Position - Income
  grossSalary: z.number().min(0).optional(),
  rentalIncome: z.number().min(0).optional(),
  dividends: z.number().min(0).optional(),
  frankedDividends: z.number().min(0).optional(),
  capitalGains: z.number().min(0).optional(),
  otherIncome: z.number().min(0).optional(),

  // Financial Position - Assets (dynamic)
  assets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentValue: z.number().min(0),
    type: z.enum(['property', 'vehicle', 'savings', 'shares', 'super', 'other']),
  })).optional(),

  // Financial Position - Liabilities (dynamic)
  liabilities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    balance: z.number().min(0),
    monthlyPayment: z.number().min(0),
    interestRate: z.number().min(0),
    type: z.enum(['mortgage', 'personal-loan', 'credit-card', 'hecs', 'other']),
  })).optional(),

  // Investment Properties
  properties: z.array(z.object({
    id: z.string(),
    address: z.string(),
    purchasePrice: z.number().min(0),
    currentValue: z.number().min(0),
    loanAmount: z.number().min(0),
    interestRate: z.number().min(0),
    loanTerm: z.number().min(1),
    weeklyRent: z.number().min(0),
    annualExpenses: z.number().min(0),
  })).optional(),

  // Projections
  currentAge: z.number().min(0).optional(),
  retirementAge: z.number().min(0).optional(),
  currentSuper: z.number().min(0).optional(),
  currentSavings: z.number().min(0).optional(),
  currentShares: z.number().min(0).optional(),
  propertyEquity: z.number().min(0).optional(),
  monthlyDebtPayments: z.number().min(0).optional(),
  monthlyRentalIncome: z.number().min(0).optional(),

  // Projection Assumptions
  inflationRate: z.number().min(0).optional(),
  salaryGrowthRate: z.number().min(0).optional(),
  superReturn: z.number().min(0).optional(),
  shareReturn: z.number().min(0).optional(),
  propertyGrowthRate: z.number().min(0).optional(),
  withdrawalRate: z.number().min(0).optional(),
  rentGrowthRate: z.number().min(0).optional(),

  // Tax Optimization
  employmentIncome: z.number().min(0).optional(),
  investmentIncome: z.number().min(0).optional(),
  workRelatedExpenses: z.number().min(0).optional(),
  vehicleExpenses: z.number().min(0).optional(),
  uniformsAndLaundry: z.number().min(0).optional(),
  homeOfficeExpenses: z.number().min(0).optional(),
  selfEducationExpenses: z.number().min(0).optional(),
  investmentExpenses: z.number().min(0).optional(),
  charityDonations: z.number().min(0).optional(),
  accountingFees: z.number().min(0).optional(),
  rentalExpenses: z.number().min(0).optional(),
  superContributions: z.number().min(0).optional(),
  healthInsurance: z.boolean().optional(),
  hecs: z.boolean().optional(),
  helpDebt: z.number().min(0).optional(),
  hecsBalance: z.number().min(0).optional(),
  privateHealthInsurance: z.boolean().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientSlot: 'A' | 'B';
}

export function ClientForm({ clientSlot }: ClientFormProps) {
  const financialStore = useFinancialStore();
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const client = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      middleName: client?.middleName || '',
      dob: client?.dateOfBirth,
      maritalStatus: client?.maritalStatus || 'SINGLE',
      numberOfDependants: client?.numberOfDependants || 0,
      agesOfDependants: client?.agesOfDependants || '',
      email: client?.email || '',
      mobile: client?.mobile || '',
      addressLine1: client?.addressLine1 || '',
      addressLine2: client?.addressLine2 || '',
      suburb: client?.suburb || '',
      state: client?.state || '',
      postcode: client?.postcode || '',
      ownOrRent: client?.ownOrRent,
      grossSalary: client?.grossSalary || 0,
      rentalIncome: client?.rentalIncome || 0,
      dividends: client?.dividends || 0,
      frankedDividends: client?.frankedDividends || 0,
      capitalGains: client?.capitalGains || 0,
      otherIncome: client?.otherIncome || 0,
      assets: client?.assets || [],
      liabilities: client?.liabilities || [],
      properties: client?.properties || [],
      currentAge: client?.currentAge || 0,
      retirementAge: client?.retirementAge || 0,
      currentSuper: client?.currentSuper || 0,
      currentSavings: client?.currentSavings || 0,
      currentShares: client?.currentShares || 0,
      propertyEquity: client?.propertyEquity || 0,
      monthlyDebtPayments: client?.monthlyDebtPayments || 0,
      monthlyRentalIncome: client?.monthlyRentalIncome || 0,
      inflationRate: client?.inflationRate || 0,
      salaryGrowthRate: client?.salaryGrowthRate || 0,
      superReturn: client?.superReturn || 0,
      shareReturn: client?.shareReturn || 0,
      propertyGrowthRate: client?.propertyGrowthRate || 0,
      withdrawalRate: client?.withdrawalRate || 0,
      rentGrowthRate: client?.rentGrowthRate || 0,
      employmentIncome: client?.employmentIncome || 0,
      investmentIncome: client?.investmentIncome || 0,
      workRelatedExpenses: client?.workRelatedExpenses || 0,
      vehicleExpenses: client?.vehicleExpenses || 0,
      uniformsAndLaundry: client?.uniformsAndLaundry || 0,
      homeOfficeExpenses: client?.homeOfficeExpenses || 0,
      selfEducationExpenses: client?.selfEducationExpenses || 0,
      investmentExpenses: client?.investmentExpenses || 0,
      charityDonations: client?.charityDonations || 0,
      accountingFees: client?.accountingFees || 0,
      rentalExpenses: client?.rentalExpenses || 0,
      superContributions: client?.superContributions || 0,
      healthInsurance: client?.healthInsurance || false,
      hecs: client?.hecs || false,
      helpDebt: client?.helpDebt || 0,
      hecsBalance: client?.hecsBalance || 0,
      privateHealthInsurance: client?.privateHealthInsurance || false,
    }
  });

  // Watch form values and auto-save to store (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((value) => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Debounce the save to avoid too many updates
      timeoutId = setTimeout(() => {
        financialStore.setClientData(clientSlot, {
          ...value,
          dateOfBirth: value.dob,
        } as any);
      }, 300);
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [form, financialStore, clientSlot]);

  // Load client data when it changes
  useEffect(() => {
    if (client) {
      form.reset({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        middleName: client.middleName || '',
        dob: client.dateOfBirth,
        maritalStatus: client.maritalStatus || 'SINGLE',
        numberOfDependants: client.numberOfDependants || 0,
        agesOfDependants: client.agesOfDependants || '',
        email: client.email || '',
        mobile: client.mobile || '',
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        suburb: client.suburb || '',
        state: client.state || '',
        postcode: client.postcode || '',
        ownOrRent: client.ownOrRent,
        grossSalary: client.grossSalary || 0,
        rentalIncome: client.rentalIncome || 0,
        dividends: client.dividends || 0,
        frankedDividends: client.frankedDividends || 0,
        capitalGains: client.capitalGains || 0,
        otherIncome: client.otherIncome || 0,
        assets: client.assets || [],
        liabilities: client.liabilities || [],
        properties: client.properties || [],
        currentAge: client.currentAge || 0,
        retirementAge: client.retirementAge || 0,
        currentSuper: client.currentSuper || 0,
        currentSavings: client.currentSavings || 0,
        currentShares: client.currentShares || 0,
        propertyEquity: client.propertyEquity || 0,
        monthlyDebtPayments: client.monthlyDebtPayments || 0,
        monthlyRentalIncome: client.monthlyRentalIncome || 0,
        inflationRate: client.inflationRate || 0,
        salaryGrowthRate: client.salaryGrowthRate || 0,
        superReturn: client.superReturn || 0,
        shareReturn: client.shareReturn || 0,
        propertyGrowthRate: client.propertyGrowthRate || 0,
        withdrawalRate: client.withdrawalRate || 0,
        rentGrowthRate: client.rentGrowthRate || 0,
        employmentIncome: client.employmentIncome || 0,
        investmentIncome: client.investmentIncome || 0,
        workRelatedExpenses: client.workRelatedExpenses || 0,
        vehicleExpenses: client.vehicleExpenses || 0,
        uniformsAndLaundry: client.uniformsAndLaundry || 0,
        homeOfficeExpenses: client.homeOfficeExpenses || 0,
        selfEducationExpenses: client.selfEducationExpenses || 0,
        investmentExpenses: client.investmentExpenses || 0,
        charityDonations: client.charityDonations || 0,
        accountingFees: client.accountingFees || 0,
        rentalExpenses: client.rentalExpenses || 0,
        superContributions: client.superContributions || 0,
        healthInsurance: client.healthInsurance || false,
        hecs: client.hecs || false,
        helpDebt: client.helpDebt || 0,
        hecsBalance: client.hecsBalance || 0,
        privateHealthInsurance: client.privateHealthInsurance || false,
      });
    }
  }, [client, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Update store
      financialStore.setClientData(clientSlot, {
        ...data,
        dateOfBirth: data.dob,
      } as any);

      // Get current client ID if editing
      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;

      // Prepare data for API
      const clientData = {
        ...data,
        dob: data.dob?.toISOString(),
      };

      // Save to database
      if (clientId) {
        // Update existing client
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        });

        if (!response.ok) {
          throw new Error('Failed to update client');
        }
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        });

        if (!response.ok) {
          throw new Error('Failed to create client');
        }

        const savedClient = await response.json();
        // Update store with saved client ID
        financialStore.setClientData(clientSlot, {
          ...data,
          dateOfBirth: data.dob,
          id: savedClient.id,
        } as any);
      }
      
      toast({
        title: 'Success',
        description: 'Client information saved successfully',
      });
    } catch (error) {
      console.error('Error saving client data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client information',
        variant: 'destructive',
      });
    }
  };

  const handleSaveByName = async () => {
    try {
      const name = saveName || `${form.getValues('firstName')} ${form.getValues('lastName')}`;
      const formData = form.getValues();
      
      // Save to store
      financialStore.saveClientByName(name, clientSlot);
      
      // Save to database
      const clientData = {
        ...formData,
        dob: formData.dob?.toISOString(),
      };

      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;

      if (clientId) {
        await fetch(`/api/clients/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        });
      } else {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        });
        
        if (response.ok) {
          const savedClient = await response.json();
          financialStore.setClientData(clientSlot, {
            ...formData,
            dateOfBirth: formData.dob,
            id: savedClient.id,
          } as any);
        }
      }

      setSaveDialogOpen(false);
      setSaveName('');
      toast({
        title: 'Client Saved',
        description: `Client "${name}" has been saved successfully`,
      });
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client',
        variant: 'destructive',
      });
    }
  };

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
    control: form.control,
    name: 'assets',
  });

  const { fields: liabilityFields, append: appendLiability, remove: removeLiability } = useFieldArray({
    control: form.control,
    name: 'liabilities',
  });

  const { fields: propertyFields, append: appendProperty, remove: removeProperty } = useFieldArray({
    control: form.control,
    name: 'properties',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client {clientSlot}</CardTitle>
            <CardDescription>Complete client information and financial data</CardDescription>
          </div>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Client</DialogTitle>
                <DialogDescription>
                  Enter a name to save this client for later retrieval
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder={`${form.getValues('firstName')} ${form.getValues('lastName')}`}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveByName}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="projections">Projections</TabsTrigger>
                <TabsTrigger value="tax">Tax</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MARITAL_STATUS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="0400 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="suburb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suburb</FormLabel>
                          <FormControl>
                            <Input placeholder="Sydney" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STATES.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode</FormLabel>
                            <FormControl>
                              <Input placeholder="2000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Financial Position Tab */}
              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Income</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="grossSalary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gross Salary</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rentalIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rental Income</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dividends"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dividends</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="frankedDividends"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Franked Dividends</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="capitalGains"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capital Gains</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="otherIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Other Income</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Assets</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendAsset({ id: `asset-${Date.now()}`, name: '', currentValue: 0, type: 'other' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {assetFields.map((field, index) => (
                        <Card key={field.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium">Asset {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAsset(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`assets.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Asset name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`assets.${index}.currentValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Value</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`assets.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="property">Property</SelectItem>
                                        <SelectItem value="vehicle">Vehicle</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                        <SelectItem value="shares">Shares</SelectItem>
                                        <SelectItem value="super">Super</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Liabilities</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendLiability({ id: `liability-${Date.now()}`, name: '', balance: 0, monthlyPayment: 0, interestRate: 0, type: 'other' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Liability
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {liabilityFields.map((field, index) => (
                        <Card key={field.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium">Liability {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLiability(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`liabilities.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Liability name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`liabilities.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="mortgage">Mortgage</SelectItem>
                                        <SelectItem value="personal-loan">Personal Loan</SelectItem>
                                        <SelectItem value="credit-card">Credit Card</SelectItem>
                                        <SelectItem value="hecs">HECS/HELP</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`liabilities.${index}.balance`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Balance</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`liabilities.${index}.monthlyPayment`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Monthly Payment</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`liabilities.${index}.interestRate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Interest Rate (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Investment Properties Tab */}
              <TabsContent value="properties" className="space-y-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Investment Properties</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendProperty({ id: `property-${Date.now()}`, address: '', purchasePrice: 0, currentValue: 0, loanAmount: 0, interestRate: 0, loanTerm: 30, weeklyRent: 0, annualExpenses: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
                <div className="space-y-4">
                  {propertyFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Property {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProperty(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`properties.${index}.address`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Investment St, Sydney NSW" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.purchasePrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Purchase Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.currentValue`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Value</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.loanAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loan Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.interestRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interest Rate (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.loanTerm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loan Term (years)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="30"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.weeklyRent`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weekly Rent</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`properties.${index}.annualExpenses`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Expenses</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Projections Tab */}
              <TabsContent value="projections" className="space-y-4 mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Position</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Age</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="retirementAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retirement Age</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentSuper"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Super</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentSavings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Savings</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentShares"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Shares</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="propertyEquity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Equity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthlyDebtPayments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Debt Payments</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthlyRentalIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rental Income</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Assumptions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="inflationRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inflation Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="salaryGrowthRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary Growth Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="superReturn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Super Return (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shareReturn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Share Return (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="propertyGrowthRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Growth Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="withdrawalRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Withdrawal Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rentGrowthRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rent Growth Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tax Optimization Tab */}
              <TabsContent value="tax" className="space-y-4 mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Income</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employmentIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Income</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="investmentIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Investment Income</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="workRelatedExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Related Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="uniformsAndLaundry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uniforms & Laundry</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="homeOfficeExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home Office Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="selfEducationExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Self Education Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="investmentExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Investment Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="charityDonations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Charity Donations</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountingFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accounting Fees</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rentalExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rental Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="superContributions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Super Contributions</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="helpDebt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HELP Debt</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hecsBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HECS Balance</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Other</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="healthInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Health Insurance</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hecs"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>HECS</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="privateHealthInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Private Health Insurance</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="bg-yellow-500 text-white hover:bg-yellow-600">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

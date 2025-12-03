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
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { clientValidationSchema } from '@/lib/utils/client-validation';
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

// Use comprehensive validation schema from utilities
const clientSchema = clientValidationSchema;

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientSlot: 'A' | 'B';
}

export function ClientForm({ clientSlot }: ClientFormProps) {
  const financialStore = useFinancialStore();
  const { toast } = useToast();
  const { saveClient } = useClientStorage();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const client = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      middleName: client?.middleName || '',
      dob: client?.dateOfBirth,
      maritalStatus: (client?.maritalStatus as 'SINGLE' | 'MARRIED' | 'DEFACTO' | 'DIVORCED' | 'WIDOWED' | undefined) || 'SINGLE',
      numberOfDependants: client?.numberOfDependants || 0,
      agesOfDependants: client?.agesOfDependants || '',
      email: client?.email || '',
      phoneNumber: client?.mobile || client?.phoneNumber || '',
      addressLine1: client?.addressLine1 || '',
      addressLine2: client?.addressLine2 || '',
      suburb: client?.suburb || '',
      state: (client?.state as 'ACT' | 'NSW' | 'NT' | 'QLD' | 'SA' | 'TAS' | 'VIC' | 'WA' | undefined) || undefined,
      postcode: client?.postcode || '',
      ownOrRent: (client?.ownOrRent as 'OWN' | 'RENT' | undefined) || undefined,
      annualIncome: client?.grossSalary || client?.grossIncome || client?.annualIncome || 0,
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

  // Store previous values for change detection (must be at component level, not inside useEffect)
  const previousValues = React.useRef<Partial<ClientFormData>>({});

  // Watch form values and auto-save to store in real-time (immediate for financial fields)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((value) => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Critical financial fields that need immediate sync across pages
      const criticalFields = [
        'annualIncome', 'rentalIncome', 'employmentIncome', 
        'currentSavings', 'currentShares', 'currentSuper',
        'dividends', 'frankedDividends', 'capitalGains', 'otherIncome',
        'workRelatedExpenses', 'investmentExpenses', 'rentalExpenses',
        'monthlyRentalIncome', 'monthlyDebtPayments'
      ];
      
      // Check if any critical field changed by comparing with previous values
      const hasCriticalChange = criticalFields.some(key => {
        const currentValue = value[key as keyof typeof value];
        const previousValue = previousValues.current[key as keyof typeof previousValues.current];
        const changed = currentValue !== previousValue;
        if (changed) {
          // Store the value, converting null to undefined for type safety
          (previousValues.current as any)[key] = currentValue ?? undefined;
        }
        return changed;
      });
      
      // Update immediately for critical fields, 100ms debounce for others
      const debounceTime = hasCriticalChange ? 0 : 100;
      
      timeoutId = setTimeout(() => {
        financialStore.setClientData(clientSlot, {
          ...value,
          dateOfBirth: value.dob,
        } as any);
      }, debounceTime);
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
        maritalStatus: (client.maritalStatus as 'SINGLE' | 'MARRIED' | 'DEFACTO' | 'DIVORCED' | 'WIDOWED' | undefined) || 'SINGLE',
        numberOfDependants: client.numberOfDependants || 0,
        agesOfDependants: client.agesOfDependants || '',
        email: client.email || '',
        phoneNumber: client.mobile || client.phoneNumber || '',
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        suburb: client.suburb || '',
        state: (client.state as 'ACT' | 'NSW' | 'NT' | 'QLD' | 'SA' | 'TAS' | 'VIC' | 'WA' | undefined) || undefined,
        postcode: client.postcode || '',
        ownOrRent: (client.ownOrRent as 'OWN' | 'RENT' | undefined) || undefined,
        annualIncome: client.grossSalary || client.grossIncome || client.annualIncome || 0,
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
    setIsSaving(true);
    try {
      // Update store first
      financialStore.setClientData(clientSlot, {
        ...data,
        dateOfBirth: data.dob,
      } as any);

      // Get current client ID if editing
      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;

      // Prepare data for API - sanitize and format
      const clientData: any = {
        ...data,
        dob: data.dob ? (data.dob instanceof Date ? data.dob.toISOString() : data.dob) : null,
        // Ensure all string fields are trimmed
        firstName: data.firstName?.trim() || '',
        lastName: data.lastName?.trim() || '',
        middleName: data.middleName?.trim() || '',
        email: data.email?.trim() || '',
        mobile: data.mobile?.trim() || '',
        addressLine1: data.addressLine1?.trim() || '',
        addressLine2: data.addressLine2?.trim() || '',
        suburb: data.suburb?.trim() || '',
        postcode: data.postcode?.trim() || '',
        agesOfDependants: data.agesOfDependants?.trim() || '',
      };

      // Use the storage hook to save
      const savedClient = await saveClient({
        ...clientData,
        id: clientId,
      });

      if (savedClient) {
        // Update store with saved client ID
        financialStore.setClientData(clientSlot, {
          ...data,
          dateOfBirth: data.dob,
          id: savedClient.id,
        } as any);
      }
    } catch (error) {
      console.error('Error saving client data:', error);
      // Error handling is done in the hook, but we can add additional handling here if needed
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveByName = async () => {
    setIsSaving(true);
    try {
      const formData = form.getValues();
      
      // Validate form before saving
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form before saving',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // Save to store
      financialStore.saveClientByName(saveName || `${formData.firstName} ${formData.lastName}`, clientSlot);
      
      // Prepare data for API
      const clientData: any = {
        ...formData,
        dob: formData.dob ? (formData.dob instanceof Date ? formData.dob.toISOString() : formData.dob) : null,
        // Sanitize string fields
        firstName: formData.firstName?.trim() || '',
        lastName: formData.lastName?.trim() || '',
        middleName: formData.middleName?.trim() || '',
        email: formData.email?.trim() || '',
        mobile: formData.mobile?.trim() || '',
        addressLine1: formData.addressLine1?.trim() || '',
        addressLine2: formData.addressLine2?.trim() || '',
        suburb: formData.suburb?.trim() || '',
        postcode: formData.postcode?.trim() || '',
        agesOfDependants: formData.agesOfDependants?.trim() || '',
      };

      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;

      // Use the storage hook to save
      const savedClient = await saveClient({
        ...clientData,
        id: clientId,
      });

      if (savedClient) {
        // Update store with saved client ID
        financialStore.setClientData(clientSlot, {
          ...formData,
          dateOfBirth: formData.dob,
          id: savedClient.id,
        } as any);

        setSaveDialogOpen(false);
        setSaveName('');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
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
                <Button 
                  variant="outline" 
                  onClick={() => setSaveDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveByName}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
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
                                selected={field.value || undefined}
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

                    <FormField
                      control={form.control}
                      name="numberOfDependants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Dependants</FormLabel>
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
                      name="agesOfDependants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ages of Dependants</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5, 8, 12" {...field} />
                          </FormControl>
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
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Unit 4" {...field} />
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
                              <Input placeholder="2000" maxLength={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ownOrRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Own or Rent</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="OWN">Own</SelectItem>
                              <SelectItem value="RENT">Rent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                        name="annualIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Income</FormLabel>
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
              <Button 
                type="submit" 
                className="bg-yellow-500 text-white hover:bg-yellow-600"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

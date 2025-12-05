'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialStore } from '@/lib/store/store';
import { useToast } from '@/hooks/use-toast';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { useRouter } from 'next/navigation';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

// Helper functions for date dropdowns
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

const generateYears = (): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const startYear = 1900;
  const years: Array<{ value: string; label: string }> = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

const generateDays = (month: number, year: number): Array<{ value: string; label: string }> => {
  const daysInMonth = getDaysInMonth(month, year);
  const days: Array<{ value: string; label: string }> = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ value: day.toString(), label: day.toString() });
  }
  return days;
};

// Use comprehensive validation schema from utilities
const clientSchema = clientValidationSchema;

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientSlot: 'A' | 'B';
}

export function ClientForm({ clientSlot }: ClientFormProps) {
  const financialStore = useFinancialStore();
  const { toast } = useToast();
  const { saveClient, deleteClient } = useClientStorage();
  const router = useRouter();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const client = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
  
  // Date of Birth state for dropdowns
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  
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
        // Ensure dob is properly formatted when saving to store
        let dateOfBirth = value.dob;
        if (value.dob && typeof value.dob === 'string') {
          // If it's a string, try to convert to Date for the store
          const date = new Date(value.dob);
          if (!isNaN(date.getTime())) {
            dateOfBirth = date;
          }
        }
        
        // Mark that we're updating from form (not external change) to prevent reset
        skipNextClientUpdateRef.current = true;
        
        financialStore.setClientData(clientSlot, {
          ...value,
          dateOfBirth: dateOfBirth,
        } as any);
        
        // Reset flag after a short delay
        setTimeout(() => {
          skipNextClientUpdateRef.current = false;
        }, 50);
      }, debounceTime);
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [form, financialStore, clientSlot]);

  // Track if user is actively changing date to prevent sync conflicts
  const isUserChangingDateRef = React.useRef(false);
  const skipNextClientUpdateRef = React.useRef(false);

  // Handle date change from dropdowns
  const handleDateChange = (day: string, month: string, year: string) => {
    if (day && month && year) {
      try {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          // Store as Date object for form validation, but will convert to string on save
          // Use shouldTouch: false to prevent triggering validation immediately
          form.setValue('dob', date, { shouldValidate: true, shouldDirty: true });
        }
      } catch (error) {
        console.error('Error creating date:', error);
      }
    } else {
      form.setValue('dob', null, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Convert date to YYYY-MM-DD string format
  const formatDateToString = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return null;
      }
    } else {
      return null;
    }
    
    // Format as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load client data when it changes (only reset if client actually changed, not on every render)
  const previousClientIdRef = React.useRef<string | null>(null);
  const previousClientDbIdRef = React.useRef<string | null>(null);
  const isInitialMountRef = React.useRef(true);
  
  useEffect(() => {
    // Only reset if we're loading a different client (by comparing a unique identifier)
    // Use database ID if available, otherwise use name-based ID
    const clientDbId = (client as any)?.id || null;
    const currentClientId = client ? `${client.firstName || ''}-${client.lastName || ''}-${clientSlot}` : null;
    
    // Check if client actually changed by comparing IDs
    // Only consider it changed if we had a previous ID and it's different (not initial mount)
    const clientIdChanged = previousClientIdRef.current !== null && previousClientIdRef.current !== currentClientId;
    const clientDbIdChanged = previousClientDbIdRef.current !== null && previousClientDbIdRef.current !== clientDbId;
    
    // Detect if this is a new/empty client (all key fields are empty)
    const isNewClient = client && 
      (!client.firstName || client.firstName === '') && 
      (!client.lastName || client.lastName === '') &&
      (!client.email || client.email === '');
    
    // Skip reset if this update is from form changes (not external client change)
    if (skipNextClientUpdateRef.current) {
      return;
    }
    
    // Only reset if:
    // 1. This is the initial mount (first load)
    // 2. The client ID actually changed (different client loaded)
    // 3. It's a new client and we had a previous client
    const shouldReset = client && (
      isInitialMountRef.current || 
      clientIdChanged || 
      clientDbIdChanged || 
      (isNewClient && previousClientIdRef.current !== null)
    );
    
    if (shouldReset) {
      isInitialMountRef.current = false;
      previousClientIdRef.current = currentClientId;
      previousClientDbIdRef.current = clientDbId;
      
      // Initialize date dropdowns from client data
      let dobValue: Date | null = null;
      if (client.dateOfBirth) {
        const dob = client.dateOfBirth instanceof Date ? client.dateOfBirth : new Date(client.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          dobValue = dob;
          setDobDay(dob.getDate().toString());
          setDobMonth((dob.getMonth() + 1).toString());
          setDobYear(dob.getFullYear().toString());
        } else {
          setDobDay('');
          setDobMonth('');
          setDobYear('');
        }
      } else {
        setDobDay('');
        setDobMonth('');
        setDobYear('');
      }
      
      form.reset({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        middleName: client.middleName || '',
        dob: dobValue,
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
      }, { keepDefaultValues: true });
    }
  }, [client, form, clientSlot]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSaving(true);
    try {
      // Validate required fields before saving
      if (!data.firstName || !data.lastName) {
        toast({
          title: 'Validation Error',
          description: 'First name and last name are required',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // Validate date of birth for new clients (required by API)
      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;
      
      if (!clientId && !data.dob) {
        toast({
          title: 'Validation Error',
          description: 'Date of birth is required to save a new client. Please fill in the date of birth field.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // Update store first
      financialStore.setClientData(clientSlot, {
        ...data,
        dateOfBirth: data.dob,
      } as any);

      // Prepare data for API - sanitize and format
      // Ensure dob is a string (YYYY-MM-DD format) for the API
      const dobString = formatDateToString(data.dob);
      
      // Prepare client data - only include fields that match the Prisma schema
      const clientData: any = {
        firstName: data.firstName?.trim() || '',
        lastName: data.lastName?.trim() || '',
        dob: dobString,
        maritalStatus: data.maritalStatus || 'SINGLE',
        numberOfDependants: data.numberOfDependants || 0,
      };

      // Add optional fields if they exist and are not empty
      if (data.middleName?.trim()) clientData.middleName = data.middleName.trim();
      if (data.email?.trim()) clientData.email = data.email.trim();
      // Map phoneNumber to mobile (schema expects 'mobile')
      const phoneNumber = data.mobile?.trim() || (data as any).phoneNumber?.trim();
      if (phoneNumber) clientData.mobile = phoneNumber;
      if (data.addressLine1?.trim()) clientData.addressLine1 = data.addressLine1.trim();
      if (data.addressLine2?.trim()) clientData.addressLine2 = data.addressLine2.trim();
      if (data.suburb?.trim()) clientData.suburb = data.suburb.trim();
      if (data.state) clientData.state = data.state;
      if (data.postcode?.trim()) clientData.postcode = data.postcode.trim();
      if (data.ownOrRent) clientData.ownOrRent = data.ownOrRent;
      if (data.agesOfDependants?.trim()) clientData.agesOfDependants = data.agesOfDependants.trim();

      // Add financial fields that exist in the schema (all optional)
      if (data.annualIncome !== undefined && data.annualIncome !== null) clientData.annualIncome = Number(data.annualIncome);
      if (data.grossSalary !== undefined && data.grossSalary !== null) clientData.grossSalary = Number(data.grossSalary);
      if (data.rentalIncome !== undefined && data.rentalIncome !== null) clientData.rentalIncome = Number(data.rentalIncome);
      // Add other numeric financial fields as needed - only those that exist in Prisma schema

      console.log('Saving client data:', { ...clientData, dob: dobString ? 'provided' : 'missing' });

      // Use the storage hook to save
      const savedClient = await saveClient({
        ...clientData,
        id: clientId,
      });

      if (savedClient) {
        console.log('Client saved successfully:', savedClient.id);
        // Update store with saved client ID
        financialStore.setClientData(clientSlot, {
          ...data,
          dateOfBirth: data.dob,
          id: savedClient.id,
        } as any);
        
        toast({
          title: 'Client Saved',
          description: `${data.firstName} ${data.lastName} has been saved successfully.`,
        });
      } else {
        console.error('Client save returned null - check error messages above');
      }
    } catch (error) {
      console.error('Error saving client data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save client. Please check all required fields.',
        variant: 'destructive',
      });
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
      // Ensure dob is a string (YYYY-MM-DD format) for the API
      const dobString = formatDateToString(formData.dob);
      
      const clientData: any = {
        ...formData,
        dob: dobString,
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
          <div className="flex gap-2">
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
            
            {client && (client as any)?.id && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this client? This action cannot be undone and will permanently remove all client information.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          const clientId = (client as any)?.id;
                          if (clientId) {
                            const success = await deleteClient(clientId);
                            if (success) {
                              // Dispatch event to notify account center to refresh
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id: clientId } }));
                              }
                              
                              // Clear the client from the store
                              const emptyClientData = {
                                firstName: '',
                                lastName: '',
                                middleName: '',
                                email: '',
                                mobile: '',
                                addressLine1: '',
                                addressLine2: '',
                                suburb: '',
                                state: undefined,
                                postcode: '',
                                maritalStatus: 'SINGLE',
                                numberOfDependants: 0,
                                agesOfDependants: '',
                                ownOrRent: undefined,
                                annualIncome: 0,
                                rentalIncome: 0,
                                dividends: 0,
                                frankedDividends: 0,
                                capitalGains: 0,
                                otherIncome: 0,
                                assets: [],
                                liabilities: [],
                                properties: [],
                                currentAge: 0,
                                retirementAge: 0,
                                currentSuper: 0,
                                currentSavings: 0,
                                currentShares: 0,
                                propertyEquity: 0,
                                monthlyDebtPayments: 0,
                                monthlyRentalIncome: 0,
                                inflationRate: 0,
                                salaryGrowthRate: 0,
                                superReturn: 0,
                                shareReturn: 0,
                                propertyGrowthRate: 0,
                                withdrawalRate: 0,
                                rentGrowthRate: 0,
                                employmentIncome: 0,
                                investmentIncome: 0,
                                workRelatedExpenses: 0,
                                vehicleExpenses: 0,
                                uniformsAndLaundry: 0,
                                homeOfficeExpenses: 0,
                                selfEducationExpenses: 0,
                                investmentExpenses: 0,
                                charityDonations: 0,
                                accountingFees: 0,
                                rentalExpenses: 0,
                                superContributions: 0,
                                healthInsurance: false,
                                hecs: false,
                                helpDebt: 0,
                                hecsBalance: 0,
                                privateHealthInsurance: false,
                              } as any;
                              
                              financialStore.setClientData(clientSlot, emptyClientData);
                              
                              // Clear active client if it was this one, otherwise keep current
                              if (financialStore.activeClient === clientSlot) {
                                // Switch to the other slot if available, otherwise set to null
                                const otherSlot = clientSlot === 'A' ? 'B' : 'A';
                                const otherClient = otherSlot === 'A' ? financialStore.clientA : financialStore.clientB;
                                if (otherClient && (otherClient.firstName || otherClient.lastName)) {
                                  financialStore.setActiveClient(otherSlot);
                                } else {
                                  financialStore.setActiveClient(undefined as any);
                                }
                              }
                              
                              setDeleteDialogOpen(false);
                              
                              toast({
                                title: 'Success',
                                description: 'Client deleted successfully',
                              });
                              
                              // Force form reset
                              setFormKey(prev => prev + 1);
                            } else {
                              toast({
                                title: 'Error',
                                description: 'Failed to delete client. Please try again.',
                                variant: 'destructive',
                              });
                            }
                          } else {
                            toast({
                              title: 'Error',
                              description: 'Client ID not found',
                              variant: 'destructive',
                            });
                          }
                        } catch (error) {
                          console.error('Error deleting client:', error);
                          toast({
                            title: 'Error',
                            description: error instanceof Error ? error.message : 'Failed to delete client. Please try again.',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
                      render={({ field }) => {
                        const availableDays = dobMonth && dobYear 
                          ? generateDays(parseInt(dobMonth), parseInt(dobYear))
                          : [];
                        
                        return (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                              <Select
                                value={dobDay}
                                onValueChange={(value) => {
                                  setDobDay(value);
                                  handleDateChange(value, dobMonth, dobYear);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableDays.map((day) => (
                                    <SelectItem key={day.value} value={day.value}>
                                      {day.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={dobMonth}
                                onValueChange={(value) => {
                                  setDobMonth(value);
                                  // Reset day if it's invalid for the new month
                                  const daysInMonth = getDaysInMonth(parseInt(value), dobYear ? parseInt(dobYear) : new Date().getFullYear());
                                  const currentDay = dobDay ? parseInt(dobDay) : 0;
                                  if (currentDay > daysInMonth) {
                                    setDobDay('');
                                    handleDateChange('', value, dobYear);
                                  } else {
                                    handleDateChange(dobDay, value, dobYear);
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MONTHS.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={dobYear}
                                onValueChange={(value) => {
                                  setDobYear(value);
                                  // Reset day if it's invalid for the new year (leap year)
                                  const daysInMonth = dobMonth ? getDaysInMonth(parseInt(dobMonth), parseInt(value)) : 31;
                                  const currentDay = dobDay ? parseInt(dobDay) : 0;
                                  if (currentDay > daysInMonth) {
                                    setDobDay('');
                                    handleDateChange('', dobMonth, value);
                                  } else {
                                    handleDateChange(dobDay, dobMonth, value);
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[200px]">
                                  {generateYears().map((year) => (
                                    <SelectItem key={year.value} value={year.value}>
                                      {year.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? undefined : (parseInt(value) || 0));
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? 0 : (parseInt(value) || 0));
                              }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9.]*"
                                        placeholder="0"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '');
                                          field.onChange(parseFloat(value) || 0);
                                        }}
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
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9.]*"
                                        placeholder="0"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '');
                                          field.onChange(parseFloat(value) || 0);
                                        }}
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
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9.]*"
                                        placeholder="0"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '');
                                          field.onChange(parseFloat(value) || 0);
                                        }}
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
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9.]*"
                                        placeholder="0"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '');
                                          field.onChange(parseFloat(value) || 0);
                                        }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="30"
                                {...field}
                                value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? undefined : (parseInt(value) || 0));
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? 0 : (parseInt(value) || 0));
                              }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9.]*"
                                    placeholder="0"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      field.onChange(parseFloat(value) || 0);
                                    }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? undefined : (parseInt(value) || 0));
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? 0 : (parseInt(value) || 0));
                              }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? undefined : (parseInt(value) || 0));
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value === '' ? 0 : (parseInt(value) || 0));
                              }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9.]*"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  // Allow empty string during typing, parse to number on blur
                                  field.onChange(value === '' ? undefined : (parseFloat(value) || 0));
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a number on blur
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  field.onChange(value === '' ? 0 : (parseFloat(value) || 0));
                                }}
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

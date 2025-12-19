'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as formatModule from 'date-fns/format';
const format: (date: Date | number, fmt: string) => string = (formatModule as any).default ?? (formatModule as any);
import { Save, Plus, Trash2 } from 'lucide-react';
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

export interface ClientFormRef {
  saveClient: () => Promise<void>;
  resetClient: () => void;
  deleteClient: () => Promise<boolean>;
}

export const ClientForm = React.forwardRef<ClientFormRef, ClientFormProps>(({ clientSlot }, ref) => {
  const financialStore = useFinancialStore();
  const { toast } = useToast();
  const { saveClient, deleteClient } = useClientStorage();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const client = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
  
  // Helper function to create empty client data
  const getEmptyClientData = () => ({
    firstName: '',
    lastName: '',
    middleName: '',
    dob: null,
    partnerDob: null,
    email: '',
    mobile: '',
    phoneNumber: '',
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
    grossIncome: 0,
    grossSalary: 0,
    rentalIncome: 0,
    dividends: 0,
    frankedDividends: 0,
    capitalGains: 0,
    otherIncome: 0,
    assets: [{ id: 'asset-home', name: 'Home', currentValue: 0, type: 'property' as const, ownerOccupied: 'own' as const }],
    liabilities: [{ id: 'liability-home', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }],
    properties: [],
    currentAge: 0,
    retirementAge: 65,
    currentSuper: 0,
    currentSavings: 0,
    currentShares: 0,
    propertyEquity: 0,
    monthlyDebtPayments: 0,
    monthlyRentalIncome: 0,
    monthlyExpenses: 0,
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
    // Assumptions
    inflationRate: 2.5,
    salaryGrowthRate: 3.0,
    superReturn: 8.0,
    shareReturn: 7.0,
    propertyGrowthRate: 5.0,
    withdrawalRate: 4.0,
    rentGrowthRate: 3.0,
    savingsRate: 10.0,
  } as any);

  // Helper function to get client display name
  const getClientDisplayName = () => {
    if (client?.firstName || client?.lastName) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return `Client ${clientSlot}`;
  };

  // Tab order for navigation
  const TAB_ORDER = ['personal', 'financial', 'properties', 'projections', 'tax'];
  
  // Function to save and move to next tab
  const handleSaveAndNext = async () => {
    // Trigger form validation and save
    const isValid = await form.trigger();
    if (isValid) {
      const data = form.getValues();
      await onSubmitInternal(data);
      // Move to next tab after successful save
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      }
    }
  };
  
  // Date of Birth state for dropdowns - Primary Person
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  
  // Date of Birth state for dropdowns - Partner
  const [partnerDobDay, setPartnerDobDay] = useState<string>('');
  const [partnerDobMonth, setPartnerDobMonth] = useState<string>('');
  const [partnerDobYear, setPartnerDobYear] = useState<string>('');
  
  // Helper to parse DOB from various formats
  const parseDob = (dob: Date | string | undefined | null): Date | null => {
    if (!dob) return null;
    if (dob instanceof Date) return isNaN(dob.getTime()) ? null : dob;
    const parsed = new Date(dob);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  
  // Check if this is a new client (no firstName or lastName)
  const isNewClient = !client?.firstName && !client?.lastName;
  
  // Parse client DOB from either 'dob' (API) or 'dateOfBirth' (store) field
  const clientDob = parseDob(client?.dob) || parseDob(client?.dateOfBirth);
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      middleName: client?.middleName || '',
      dob: clientDob,
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
      ownOrRent: (client?.ownOrRent as 'OWN' | 'RENT' | 'MORTGAGED' | undefined) || undefined,
      // For new clients, always default to 0. For existing clients, use their value or 0.
      annualIncome: isNewClient ? 0 : (client?.grossSalary || client?.grossIncome || client?.annualIncome || 0),
      rentalIncome: client?.rentalIncome || 0,
      dividends: client?.dividends || 0,
      frankedDividends: client?.frankedDividends || 0,
      capitalGains: client?.capitalGains || 0,
      otherIncome: client?.otherIncome || 0,
      // Always have at least one asset (Home) and one liability
      assets: client?.assets?.length ? client.assets : [{ id: 'asset-home', name: 'Home', currentValue: 0, type: 'property' as const, ownerOccupied: 'own' as const }],
      liabilities: client?.liabilities?.length ? client.liabilities : [{ id: 'liability-home', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }],
      properties: client?.properties || [],
      currentAge: client?.currentAge || 0,
      retirementAge: client?.retirementAge || 0,
      currentSuper: client?.currentSuper || 0,
      currentSavings: client?.currentSavings || 0,
      currentShares: client?.currentShares || 0,
      propertyEquity: client?.propertyEquity || 0,
      monthlyDebtPayments: client?.monthlyDebtPayments || 0,
      monthlyRentalIncome: client?.monthlyRentalIncome || 0,
      monthlyExpenses: client?.monthlyExpenses || 0,
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
      // Partner personal info
      partnerFirstName: client?.partnerFirstName || '',
      partnerLastName: client?.partnerLastName || '',
      partnerDob: client?.partnerDateOfBirth,
      partnerEmail: client?.partnerEmail || '',
      partnerPhoneNumber: client?.partnerPhoneNumber || '',
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
        'monthlyRentalIncome', 'monthlyDebtPayments', 'monthlyExpenses'
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

  // Handle partner date change from dropdowns
  const handlePartnerDateChange = (day: string, month: string, year: string) => {
    if (day && month && year) {
      try {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          form.setValue('partnerDob', date, { shouldValidate: true, shouldDirty: true });
        }
      } catch (error) {
        console.error('Error creating partner date:', error);
      }
    } else {
      form.setValue('partnerDob', null, { shouldValidate: true, shouldDirty: true });
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
    }
    
    // Always initialize date dropdowns from client data (whether resetting or not)
    let dobValue: Date | null = null;
    const clientDob = client?.dob || client?.dateOfBirth;
    if (clientDob) {
      const dob = clientDob instanceof Date ? clientDob : new Date(clientDob);
      if (!isNaN(dob.getTime())) {
        dobValue = dob;
        setDobDay(dob.getDate().toString());
        setDobMonth((dob.getMonth() + 1).toString());
        setDobYear(dob.getFullYear().toString());
      } else {
        setDobDay('0');
        setDobMonth('0');
        setDobYear('0');
      }
    } else {
      setDobDay('0');
      setDobMonth('0');
      setDobYear('0');
    }
    
    // Always initialize partner date dropdowns from client data
    let partnerDobValue: Date | null = null;
    if (client?.partnerDateOfBirth) {
      const partnerDob = client.partnerDateOfBirth instanceof Date ? client.partnerDateOfBirth : new Date(client.partnerDateOfBirth);
      if (!isNaN(partnerDob.getTime())) {
        partnerDobValue = partnerDob;
        setPartnerDobDay(partnerDob.getDate().toString());
        setPartnerDobMonth((partnerDob.getMonth() + 1).toString());
        setPartnerDobYear(partnerDob.getFullYear().toString());
      } else {
        setPartnerDobDay('0');
        setPartnerDobMonth('0');
        setPartnerDobYear('0');
      }
    } else {
      setPartnerDobDay('0');
      setPartnerDobMonth('0');
      setPartnerDobYear('0');
    }
    
    if (shouldReset) {
      
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
        ownOrRent: (client.ownOrRent as 'OWN' | 'RENT' | 'MORTGAGED' | undefined) || undefined,
        // For new clients, always default to 0. For existing clients, use their value or 0.
        annualIncome: isNewClient ? 0 : (client.grossSalary || client.grossIncome || client.annualIncome || 0),
        rentalIncome: client.rentalIncome || 0,
        dividends: client.dividends || 0,
        frankedDividends: client.frankedDividends || 0,
        capitalGains: client.capitalGains || 0,
        otherIncome: client.otherIncome || 0,
        // Always have at least one asset (Home) and one liability
        assets: client.assets?.length ? client.assets : [{ id: 'asset-home', name: 'Home', currentValue: 0, type: 'property' as const, ownerOccupied: 'own' as const }],
        liabilities: client.liabilities?.length ? client.liabilities : [{ id: 'liability-home', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'mortgage' as const, lender: '', loanType: 'variable' as const, paymentFrequency: 'M' as const }],
        properties: client.properties || [],
        currentAge: client.currentAge || 0,
        retirementAge: client.retirementAge || 0,
        currentSuper: client.currentSuper || 0,
        currentSavings: client.currentSavings || 0,
        currentShares: client.currentShares || 0,
        propertyEquity: client.propertyEquity || 0,
        monthlyDebtPayments: client.monthlyDebtPayments || 0,
        monthlyRentalIncome: client.monthlyRentalIncome || 0,
        monthlyExpenses: client.monthlyExpenses || 0,
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
        // Partner personal info
        partnerFirstName: client.partnerFirstName || '',
        partnerLastName: client.partnerLastName || '',
        partnerDob: partnerDobValue,
        partnerEmail: client.partnerEmail || '',
        partnerPhoneNumber: client.partnerPhoneNumber || '',
      }, { keepDefaultValues: true });
    }
  }, [client, form, clientSlot]);

  const onSubmitInternal = async (data: ClientFormData) => {
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
        partnerDateOfBirth: data.partnerDob,
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
      if (data.dividends !== undefined && data.dividends !== null) clientData.dividends = Number(data.dividends);
      if (data.frankedDividends !== undefined && data.frankedDividends !== null) clientData.frankedDividends = Number(data.frankedDividends);
      if (data.capitalGains !== undefined && data.capitalGains !== null) clientData.capitalGains = Number(data.capitalGains);
      if (data.otherIncome !== undefined && data.otherIncome !== null) clientData.otherIncome = Number(data.otherIncome);
      if (data.investmentIncome !== undefined && data.investmentIncome !== null) clientData.investmentIncome = Number(data.investmentIncome);
      if (data.monthlyRentalIncome !== undefined && data.monthlyRentalIncome !== null) clientData.monthlyRentalIncome = Number(data.monthlyRentalIncome);
      if (data.currentAge !== undefined && data.currentAge !== null) clientData.currentAge = Number(data.currentAge);
      if (data.retirementAge !== undefined && data.retirementAge !== null) clientData.retirementAge = Number(data.retirementAge);
      if (data.currentSuper !== undefined && data.currentSuper !== null) clientData.currentSuper = Number(data.currentSuper);
      if (data.currentSavings !== undefined && data.currentSavings !== null) clientData.currentSavings = Number(data.currentSavings);
      if (data.currentShares !== undefined && data.currentShares !== null) clientData.currentShares = Number(data.currentShares);
      if (data.propertyEquity !== undefined && data.propertyEquity !== null) clientData.propertyEquity = Number(data.propertyEquity);
      if (data.monthlyDebtPayments !== undefined && data.monthlyDebtPayments !== null) clientData.monthlyDebtPayments = Number(data.monthlyDebtPayments);
      if (data.monthlyExpenses !== undefined && data.monthlyExpenses !== null) clientData.monthlyExpenses = Number(data.monthlyExpenses);
      if (data.workRelatedExpenses !== undefined && data.workRelatedExpenses !== null) clientData.workRelatedExpenses = Number(data.workRelatedExpenses);
      if (data.vehicleExpenses !== undefined && data.vehicleExpenses !== null) clientData.vehicleExpenses = Number(data.vehicleExpenses);
      if (data.uniformsAndLaundry !== undefined && data.uniformsAndLaundry !== null) clientData.uniformsAndLaundry = Number(data.uniformsAndLaundry);
      if (data.homeOfficeExpenses !== undefined && data.homeOfficeExpenses !== null) clientData.homeOfficeExpenses = Number(data.homeOfficeExpenses);
      if (data.selfEducationExpenses !== undefined && data.selfEducationExpenses !== null) clientData.selfEducationExpenses = Number(data.selfEducationExpenses);
      if (data.investmentExpenses !== undefined && data.investmentExpenses !== null) clientData.investmentExpenses = Number(data.investmentExpenses);
      if (data.charityDonations !== undefined && data.charityDonations !== null) clientData.charityDonations = Number(data.charityDonations);
      if (data.accountingFees !== undefined && data.accountingFees !== null) clientData.accountingFees = Number(data.accountingFees);
      if (data.rentalExpenses !== undefined && data.rentalExpenses !== null) clientData.rentalExpenses = Number(data.rentalExpenses);
      if (data.superContributions !== undefined && data.superContributions !== null) clientData.superContributions = Number(data.superContributions);
      if (data.healthInsurance !== undefined) clientData.healthInsurance = Boolean(data.healthInsurance);
      if (data.hecs !== undefined) clientData.hecs = Boolean(data.hecs);
      if (data.helpDebt !== undefined && data.helpDebt !== null) clientData.helpDebt = Number(data.helpDebt);
      if (data.privateHealthInsurance !== undefined) clientData.privateHealthInsurance = Boolean(data.privateHealthInsurance);

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
          partnerDateOfBirth: data.partnerDob,
          id: savedClient.id,
        } as any);
        
        toast({
          title: 'Client Saved',
          description: `${data.firstName} ${data.lastName} has been saved successfully.`,
        });
      } else {
        console.error('Client save returned null - check error messages above');
        toast({
          title: 'Error',
          description: 'Failed to save client. Please check all required fields and try again.',
          variant: 'destructive',
        });
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

  // Auto-calculate projections fields from other form data
  // IMPORTANT: This effect only handles read-only calculations, NOT property/liability syncing
  useEffect(() => {
    // Use a subscription to watch all form changes and run calculations
    const subscription = form.watch(() => {
      // Calculate current age from DOB
      const dob = form.getValues('dob');
      if (dob) {
        const birthDate = new Date(dob);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          const currentAge = form.getValues('currentAge');
          if (age >= 0 && age !== currentAge) {
            form.setValue('currentAge', age, { shouldValidate: false, shouldDirty: false });
          }
        }
      }

      // Calculate current savings from assets with type 'savings'
      const assets = form.getValues('assets');
      if (assets && Array.isArray(assets)) {
        const totalSavings = assets
          .filter((asset: any) => asset.type === 'savings')
          .reduce((sum: number, asset: any) => sum + (parseFloat(asset.currentValue) || 0), 0);
        const currentSavings = form.getValues('currentSavings');
        if (totalSavings !== currentSavings) {
          form.setValue('currentSavings', totalSavings, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Calculate current shares from assets with type 'shares'
      if (assets && Array.isArray(assets)) {
        const totalShares = assets
          .filter((asset: any) => asset.type === 'shares')
          .reduce((sum: number, asset: any) => sum + (parseFloat(asset.currentValue) || 0), 0);
        const currentShares = form.getValues('currentShares');
        if (totalShares !== currentShares) {
          form.setValue('currentShares', totalShares, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Calculate current super from assets with type 'super'
      if (assets && Array.isArray(assets)) {
        const totalSuper = assets
          .filter((asset: any) => asset.type === 'super')
          .reduce((sum: number, asset: any) => sum + (parseFloat(asset.currentValue) || 0), 0);
        const currentSuper = form.getValues('currentSuper');
        if (totalSuper !== currentSuper) {
          form.setValue('currentSuper', totalSuper, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Calculate property equity from investment properties (currentValue - loanAmount)
      const properties = form.getValues('properties');
      if (properties && Array.isArray(properties)) {
        const totalEquity = properties
          .reduce((sum: number, property: any) => {
            const value = parseFloat(property.currentValue) || 0;
            const loan = parseFloat(property.loanAmount) || 0;
            return sum + (value - loan);
          }, 0);
        const propertyEquity = form.getValues('propertyEquity');
        if (totalEquity !== propertyEquity) {
          form.setValue('propertyEquity', totalEquity, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Calculate monthly rental income from investment properties (weeklyRent * 52 / 12)
      if (properties && Array.isArray(properties)) {
        const totalMonthlyRent = properties
          .reduce((sum: number, property: any) => {
            const weeklyRent = parseFloat(property.weeklyRent) || 0;
            // Weekly rent * 52 weeks / 12 months = monthly rent
            const monthlyRent = (weeklyRent * 52) / 12;
            return sum + monthlyRent;
          }, 0);
        const monthlyRentalIncome = form.getValues('monthlyRentalIncome') || 0;
        if (Math.abs(totalMonthlyRent - monthlyRentalIncome) > 0.01) {
          form.setValue('monthlyRentalIncome', Math.round(totalMonthlyRent * 100) / 100, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Calculate monthly debt payments from liabilities (accounting for payment frequency)
      const liabilities = form.getValues('liabilities');
      if (liabilities && Array.isArray(liabilities)) {
        const totalDebtPayments = liabilities
          .filter((liability: any) => liability && liability.name && liability.name.trim() !== '' && liability.balance > 0)
          .reduce((sum: number, liability: any) => {
            const payment = parseFloat(liability.monthlyPayment) || 0;
            const frequency = liability.paymentFrequency || 'M';

            // Convert to monthly based on frequency
            let monthlyPayment = 0;
            switch (frequency) {
              case 'W': // Weekly: payment * 52 weeks / 12 months
                monthlyPayment = (payment * 52) / 12;
                break;
              case 'F': // Fortnightly: payment * 26 fortnights / 12 months
                monthlyPayment = (payment * 26) / 12;
                break;
              case 'M': // Monthly: already monthly
              default:
                monthlyPayment = payment;
                break;
            }

            return sum + monthlyPayment;
          }, 0);

        const monthlyDebtPayments = form.getValues('monthlyDebtPayments') || 0;
        const roundedTotal = Math.round(totalDebtPayments * 100) / 100;
        if (Math.abs(roundedTotal - monthlyDebtPayments) > 0.01) {
          form.setValue('monthlyDebtPayments', roundedTotal, { shouldValidate: false, shouldDirty: false });
        }
      }

      // Sync annualIncome from Financials to employmentIncome in Tax section
      const annualIncome = form.getValues('annualIncome');
      if (annualIncome !== undefined && annualIncome !== null) {
        const annualIncomeValue = parseFloat(String(annualIncome)) || 0;
        const employmentIncome = form.getValues('employmentIncome');
        if (annualIncomeValue !== employmentIncome) {
          form.setValue('employmentIncome', annualIncomeValue, { shouldValidate: false, shouldDirty: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Track which asset IDs have already been synced to properties
  const syncedAssetIdsRef = React.useRef<Set<string>>(new Set());
  
  // Initialize the ref with existing property-linked assets on mount
  useEffect(() => {
    const properties = form.getValues('properties');
    if (properties && Array.isArray(properties)) {
      const linkedIds = new Set<string>();
      properties.forEach((prop: any) => {
        if (prop.linkedAssetId) {
          linkedIds.add(prop.linkedAssetId);
        }
      });
      syncedAssetIdsRef.current = linkedIds;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // Auto-create investment properties when asset type is changed to "property"
  // This is a one-way sync: assets → properties (NOT bi-directional)
  useEffect(() => {
    const subscription = form.watch(() => {
      const assets = form.getValues('assets');
      if (!assets || !Array.isArray(assets)) return;

      const currentProperties = form.getValues('properties') || [];
      const liabilities = form.getValues('liabilities') || [];

      // Filter for property assets that are NOT owner-occupied (investment properties only)
      const propertyAssets = assets.filter((asset: any) => {
        if (asset.type !== 'property') return false;
        // Skip owner-occupied properties (first asset with ownerOccupied === 'own')
        if (asset.ownerOccupied === 'own') return false;
        return true;
      });

      // Update existing linked properties with new asset/liability data
      currentProperties.forEach((prop: any, propIndex: number) => {
        if (prop.linkedAssetId) {
          const linkedAsset = assets.find((a: any) => a.id === prop.linkedAssetId);
          if (linkedAsset) {
            // Update property values from asset
            const assetIndex = assets.findIndex((a: any) => a.id === linkedAsset.id);
            const linkedLiability = liabilities[assetIndex];

            const updates: any = {};
            if (linkedAsset.name && linkedAsset.name !== prop.address) {
              updates.address = linkedAsset.name;
            }
            if (Number(linkedAsset.currentValue) !== Number(prop.currentValue)) {
              updates.currentValue = Number(linkedAsset.currentValue) || 0;
            }
            if (linkedLiability && linkedLiability.type === 'mortgage') {
              if (Number(linkedLiability.balance) !== Number(prop.loanAmount)) {
                updates.loanAmount = Number(linkedLiability.balance) || 0;
              }
              if (Number(linkedLiability.interestRate) !== Number(prop.interestRate)) {
                updates.interestRate = Number(linkedLiability.interestRate) || 0;
              }
              if (Number(linkedLiability.loanTerm) !== Number(prop.loanTerm)) {
                updates.loanTerm = Number(linkedLiability.loanTerm) || 30;
              }
            }

            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
              Object.entries(updates).forEach(([key, value]) => {
                form.setValue(`properties.${propIndex}.${key}` as any, value);
              });
            }
          }
        }
      });

      // Find property assets that don't have a corresponding property entry yet
      const newPropertyAssets = propertyAssets.filter((asset: any) => {
        // Skip empty assets (no name and no value) - don't create ghost properties
        if (!asset.name && (!asset.currentValue || Number(asset.currentValue) === 0)) {
          return false;
        }

        // Skip if already synced
        if (syncedAssetIdsRef.current.has(asset.id)) return false;

        // Skip if a property with this linkedAssetId already exists
        const alreadyExists = currentProperties.some(
          (prop: any) => prop.linkedAssetId === asset.id
        );
        return !alreadyExists;
      });

      // Create new properties for each new property-type asset
      newPropertyAssets.forEach((asset: any) => {
        // Find matching mortgage liability - check both by name match and by index position
        let matchingMortgage = liabilities.find((liability: any) =>
          liability.type === 'mortgage' &&
          liability.name &&
          asset.name &&
          liability.name.toLowerCase().includes(asset.name.toLowerCase())
        );

        // If no name match, try to find a mortgage at the same index position as the asset
        if (!matchingMortgage) {
          const assetIndex = assets.findIndex((a: any) => a.id === asset.id);
          const liabilityAtSameIndex = liabilities[assetIndex];
          if (liabilityAtSameIndex && liabilityAtSameIndex.type === 'mortgage') {
            matchingMortgage = liabilityAtSameIndex;
          }
        }

        // Check if there's an empty property we can fill instead of appending
        const emptyPropertyIndex = currentProperties.findIndex((prop: any) =>
          !prop.address &&
          (!prop.currentValue || Number(prop.currentValue) === 0) &&
          !prop.linkedAssetId
        );

        const propertyData = {
          address: asset.name || '',
          purchasePrice: Number(asset.currentValue) || 0,
          currentValue: Number(asset.currentValue) || 0,
          loanAmount: matchingMortgage ? Number(matchingMortgage.balance) || 0 : 0,
          interestRate: matchingMortgage ? Number(matchingMortgage.interestRate) || 0 : 0,
          loanTerm: matchingMortgage ? Number(matchingMortgage.loanTerm) || 30 : 30,
          weeklyRent: 0,
          annualExpenses: 0,
          linkedAssetId: asset.id,
          linkedLiabilityId: matchingMortgage?.id || undefined,
        };

        // Mark this asset as synced BEFORE updating to prevent re-triggering
        syncedAssetIdsRef.current.add(asset.id);

        if (emptyPropertyIndex >= 0) {
          // Fill the empty property slot instead of appending
          const existingId = currentProperties[emptyPropertyIndex].id;
          form.setValue(`properties.${emptyPropertyIndex}`, {
            id: existingId,
            ...propertyData,
          });
        } else {
          // No empty slot, append a new property
          appendProperty({
            id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...propertyData,
          });
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [form, appendProperty]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    saveClient: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const data = form.getValues();
        await onSubmitInternal(data);
      } else {
        throw new Error('Form validation failed');
      }
    },
    resetClient: () => {
      const emptyData = getEmptyClientData();
      form.reset(emptyData);
      // Clear date input state
      setDobDay('0');
      setDobMonth('0');
      setDobYear('0');
      setPartnerDobDay('0');
      setPartnerDobMonth('0');
      setPartnerDobYear('0');
      financialStore.setClientData(clientSlot, emptyData as any);
    },
    deleteClient: async () => {
      const currentClient = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      const clientId = (currentClient as any)?.id;
      if (clientId) {
        const success = await deleteClient(clientId);
        if (success) {
          const emptyData = getEmptyClientData();
          form.reset(emptyData);
          // Clear date input state
          setDobDay('0');
          setDobMonth('0');
          setDobYear('0');
          setPartnerDobDay('0');
          setPartnerDobMonth('0');
          setPartnerDobYear('0');
          financialStore.setClientData(clientSlot, emptyData as any);
        }
        return success;
      }
      return false;
    }
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{getClientDisplayName()}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id={`client-form-${clientSlot}`} onSubmit={form.handleSubmit(onSubmitInternal)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  {/* Primary Person Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Primary Person</h3>
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" autoComplete="given-name" {...field} />
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
                            <Input placeholder="Doe" autoComplete="family-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  id={`${field.name}-day`}
                                  type="number"
                                  placeholder="Day"
                                  min="1"
                                  max="31"
                                  value={dobDay}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setDobDay(value);
                                    handleDateChange(value, dobMonth, dobYear);
                                  }}
                                  autoComplete="bday-day"
                                />
                              </div>

                              <div>
                                <Input
                                  id={`${field.name}-month`}
                                  type="number"
                                  placeholder="Month"
                                  min="1"
                                  max="12"
                                  value={dobMonth}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setDobMonth(value);
                                    handleDateChange(dobDay, value, dobYear);
                                  }}
                                  autoComplete="bday-month"
                                />
                              </div>

                              <div>
                                <Input
                                  id={`${field.name}-year`}
                                  type="number"
                                  placeholder="Year"
                                  min="1900"
                                  max={new Date().getFullYear()}
                                  value={dobYear}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setDobYear(value);
                                    handleDateChange(dobDay, dobMonth, value);
                                  }}
                                  autoComplete="bday-year"
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" autoComplete="email" {...field} />
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
                            <Input type="tel" placeholder="0400 000 000" autoComplete="tel" {...field} />
                          </FormControl>
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
                              step="1"
                              placeholder="0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
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

                  {/* Address Section - Right Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Address</h3>
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" autoComplete="address-line1" {...field} />
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
                            <Input placeholder="Unit 4" autoComplete="address-line2" {...field} />
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
                            <Input placeholder="Sydney" autoComplete="address-level2" {...field} />
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
                              <Input placeholder="2000" maxLength={4} autoComplete="postal-code" {...field} />
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
                              <SelectItem value="MORTGAGED">Mortgaged</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Save & Continue Button */}
                <div className="flex justify-end pt-4 border-t mt-6">
                  <Button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </Button>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Monthly Expenses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="monthlyExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Total Monthly Expenses
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g., 4500"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter your total monthly expenses. This represents all living costs and should NOT include taxes, property expenses, or HECS repayments.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Assets and Liabilities - Paired Layout */}
                  <div className="space-y-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Assets & Liabilities</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          appendAsset({ id: `asset-${Date.now()}`, name: '', currentValue: 0, type: 'other' });
                          appendLiability({ id: `liability-${Date.now()}`, name: '', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'other', lender: '', loanType: 'variable', paymentFrequency: 'M' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset & Liability
                      </Button>
                    </div>
                    
                    {/* Paired Asset/Liability rows */}
                    {assetFields.map((field, index) => (
                      <div key={field.id} className={'border-t-2 border-border ' + (index === assetFields.length - 1 ? 'border-b-2' : '')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                          {/* Asset Card */}
                          <div className="bg-muted rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium text-base">
                                {index === 0 ? 'Home (Owner Occupier)' : 'Asset ' + (index + 1)}
                              </h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    removeAsset(index);
                                    if (liabilityFields[index]) {
                                      removeLiability(index);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-4">
                              {index === 0 ? (
                                <>
                                  {/* First asset - Home with own/rent dropdown */}
                                  <FormField
                                    control={form.control}
                                    name={`assets.${index}.ownerOccupied`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Ownership Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'own'}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="own">Own</SelectItem>
                                            <SelectItem value="rent">Rent</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`assets.${index}.currentValue`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Home Value</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  {/* Hidden fields to set defaults for first asset */}
                                  <input type="hidden" {...form.register(`assets.${index}.name`)} value="Home" />
                                  <input type="hidden" {...form.register(`assets.${index}.type`)} value="property" />
                                </>
                              ) : (
                                <>
                                  {/* Other assets - full fields */}
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
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                </>
                              )}
                            </div>
                          </div>

                          {/* Liability Card */}
                          <div className="bg-muted rounded-lg p-4">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-medium text-base">
                                    {index === 0 ? 'Home Loan' : 'Liability ' + (index + 1)}
                                  </h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      form.setValue('liabilities.' + index, {
                                        id: '',
                                        name: '',
                                        balance: 0,
                                        monthlyPayment: 0,
                                        interestRate: 0,
                                        loanTerm: 30,
                                        termRemaining: 0,
                                        type: 'other',
                                        lender: '',
                                        loanType: 'variable',
                                        paymentFrequency: 'M'
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="space-y-4">
                                  {/* Lender */}
                                  <FormField
                                    control={form.control}
                                    name={`liabilities.${index}.lender`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Lender</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Commonwealth Bank" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {/* Type of Loan (Fixed/Split/Variable) */}
                                  <FormField
                                    control={form.control}
                                    name={`liabilities.${index}.loanType`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Loan Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'variable'}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select loan type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                            <SelectItem value="split">Split Rate</SelectItem>
                                            <SelectItem value="variable">Variable Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {/* Liability Type */}
                                  <FormField
                                    control={form.control}
                                    name={`liabilities.${index}.type`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Liability Type</FormLabel>
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
                                  
                                  {/* Balance */}
                                  <FormField
                                    control={form.control}
                                    name={`liabilities.${index}.balance`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Balance Owing</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {/* Repayment Amount with Frequency Dropdown */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                      <FormField
                                        control={form.control}
                                        name={`liabilities.${index}.monthlyPayment`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Repayment Amount</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step="any"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <FormField
                                      control={form.control}
                                      name={`liabilities.${index}.paymentFrequency`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Freq</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value || 'M'}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="M" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="W">W</SelectItem>
                                            <SelectItem value="F">F</SelectItem>
                                            <SelectItem value="M">M</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                    />
                                  </div>
                                  
                                  {/* Loan Term and Term Remaining side by side */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={'liabilities.' + index + '.loanTerm'}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Loan Term (Years)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step="1"
                                              placeholder="30"
                                              {...field}
                                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`liabilities.${index}.termRemaining`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Term Remaining</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step="1"
                                              placeholder="25"
                                              {...field}
                                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Add Asset & Liability Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendAsset({ id: `asset-${Date.now()}`, name: '', currentValue: 0, type: 'other' });
                      appendLiability({ id: `liability-${Date.now()}`, name: '', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 0, type: 'other', lender: '', loanType: 'variable', paymentFrequency: 'M' });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset & Liability
                  </Button>
                </div>

                {/* Save & Continue Button */}
                <div className="flex justify-end pt-4 border-t mt-6">
                  <Button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </Button>
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="1"
                                placeholder="30"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                    step="any"
                                    placeholder="0"
                                    {...field}
                                    value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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

                {/* Save & Continue Button */}
                <div className="flex justify-end pt-4 border-t mt-6">
                  <Button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </Button>
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
                                step="1"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-calculated from Date of Birth</p>
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
                                step="1"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-calculated from Super assets</p>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-calculated from Investment Properties</p>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-calculated from Liabilities (adjusted for payment frequency)</p>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-calculated from Weekly Rent (×52÷12)</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                              step="any"
                              placeholder="2.5"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="3.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="8.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="7.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="5.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="4.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                              step="any"
                              placeholder="3.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="savingsRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Savings Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="10.0"
                              {...field}
                              value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t mt-6">
                  <Button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </Button>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-muted"
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Auto-synced from Annual Income (Financials)</p>
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                                step="any"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 || field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

ClientForm.displayName = 'ClientForm';


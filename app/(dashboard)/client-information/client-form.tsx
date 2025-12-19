"use client";

import * as React from "react";
import { forwardRef } from "react";
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useFinancialStore } from '@/lib/store/store';
import { useClientStorage } from '@/lib/hooks/use-client-storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import AssetsSection from './assets-section';

// Schema for client form validation
const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  phoneNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  dateOfBirth: z.date().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).default('SINGLE'),
  numberOfDependants: z.number().min(0).default(0),
  agesOfDependants: z.string().optional(),
  ownOrRent: z.enum(['own', 'rent']).optional(),
  annualIncome: z.number().min(0).default(0),
  monthlyExpenses: z.number().min(0).default(0),
  currentAge: z.number().min(0).max(120).default(30),
  retirementAge: z.number().min(0).max(120).default(65),
  assets: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    currentValue: z.number().min(0).default(0),
    type: z.enum(['Property', 'Super', 'Shares', 'Cash', 'Other']).default('Property')
  })).default([]),
  liabilities: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    balance: z.number().min(0).default(0),
    monthlyPayment: z.number().min(0).default(0),
    interestRate: z.number().min(0).default(0),
    loanTerm: z.number().min(0).default(30),
    termRemaining: z.number().min(0).default(30)
  })).default([])
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientSlot: "A" | "B";
}

export interface ClientFormRef {
  saveClient: () => Promise<void>;
  resetClient: () => void;
  deleteClient: () => Promise<boolean>;
}

export const ClientForm = forwardRef<ClientFormRef, ClientFormProps>(
  function ClientForm({ clientSlot }, ref) {
    const financialStore = useFinancialStore();
    const { saveClient: saveToStorage, deleteClient: deleteFromStorage } = useClientStorage();
    const { toast } = useToast();

    const form = useForm<ClientFormData>({
      resolver: zodResolver(clientSchema),
      defaultValues: {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        mobile: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        suburb: '',
        state: undefined,
        postcode: '',
        dateOfBirth: undefined,
        maritalStatus: 'SINGLE',
        numberOfDependants: 0,
        agesOfDependants: '',
        ownOrRent: undefined,
        annualIncome: 0,
        monthlyExpenses: 0,
        currentAge: 30,
        retirementAge: 65,
        assets: [{ id: 'asset-1', name: 'Home', currentValue: 0, type: 'Property' }],
        liabilities: [{ id: 'liability-1', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 30 }]
      }
    });

    const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
      control: form.control,
      name: 'assets'
    });

    const { fields: liabilityFields, append: appendLiability, remove: removeLiability } = useFieldArray({
      control: form.control,
      name: 'liabilities'
    });

    // Load existing client data
    React.useEffect(() => {
      const clientData = clientSlot === 'A' ? financialStore.clientA : financialStore.clientB;
      if (clientData) {
        form.reset({
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          middleName: clientData.middleName || '',
          email: clientData.email || '',
          mobile: clientData.mobile || '',
          phoneNumber: clientData.phoneNumber || '',
          addressLine1: clientData.addressLine1 || '',
          addressLine2: clientData.addressLine2 || '',
          suburb: clientData.suburb || '',
          state: clientData.state || '',
          postcode: clientData.postcode || '',
          dateOfBirth: clientData.dateOfBirth,
          maritalStatus: (clientData.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED') || 'SINGLE',
          numberOfDependants: clientData.numberOfDependants || 0,
          agesOfDependants: clientData.agesOfDependants || '',
          ownOrRent: (clientData.ownOrRent as 'own' | 'rent') || undefined,
          annualIncome: clientData.annualIncome || 0,
          monthlyExpenses: clientData.monthlyExpenses || 0,
          currentAge: clientData.currentAge || 30,
          retirementAge: clientData.retirementAge || 65,
          assets: (clientData.assets || [{ id: 'asset-1', name: 'Home', currentValue: 0, type: 'Property' }]).map(asset => ({
            id: asset.id || `asset-${Date.now()}`,
            name: asset.name || '',
            currentValue: asset.currentValue || 0,
            type: (asset.type === 'property' ? 'Property' :
                   asset.type === 'super' ? 'Super' :
                   asset.type === 'shares' ? 'Shares' :
                   asset.type === 'savings' ? 'Cash' :
                   asset.type === 'other' ? 'Other' :
                   'Property') as 'Property' | 'Super' | 'Shares' | 'Cash' | 'Other'
          })),
          liabilities: (clientData.liabilities || [{ id: 'liability-1', name: 'Home Loan', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 30 }]).map(liability => ({
            id: liability.id || `liability-${Date.now()}`,
            name: liability.name || '',
            balance: liability.balance || 0,
            monthlyPayment: liability.monthlyPayment || 0,
            interestRate: liability.interestRate || 0,
            loanTerm: liability.loanTerm || 30,
            termRemaining: liability.termRemaining || 30
          })),
        });
      }
    }, [clientSlot, financialStore.clientA, financialStore.clientB, form]);

    const saveClient = async () => {
      try {
        const data = form.getValues();
        const clientData = {
          ...data,
          id: clientSlot === 'A' ? financialStore.clientA?.id : financialStore.clientB?.id
        };
        await saveToStorage(clientData);
        financialStore.setClientData(clientSlot, clientData as any);
        toast({
          title: 'Client saved',
          description: `Client ${clientSlot} saved successfully`
        });
      } catch (error) {
        console.error('Error saving client:', error);
        toast({
          title: 'Error',
          description: 'Failed to save client',
          variant: 'destructive'
        });
        throw error;
      }
    };

    const resetClient = () => {
      form.reset();
      financialStore.setClientData(clientSlot, {});
    };

    const deleteClient = async () => {
      try {
        const clientId = clientSlot === 'A' ? financialStore.clientA?.id : financialStore.clientB?.id;
        if (clientId) {
          await deleteFromStorage(clientId);
          resetClient();
          toast({
            title: 'Client deleted',
            description: `Client ${clientSlot} deleted successfully`
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error deleting client:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete client',
          variant: 'destructive'
        });
        return false;
      }
    };

    React.useImperativeHandle(ref, () => ({
      saveClient,
      resetClient,
      deleteClient,
    }));

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Client {clientSlot}</CardTitle>
          <CardDescription>Complete client information and financial details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Michael" {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Input placeholder="+61 400 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="numberOfDependants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Dependants</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Age</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="120" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
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
                          <Input type="number" min="0" max="120" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="annualIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Income</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Expenses</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Assets Section */}
              <AssetsSection
                assetFields={assetFields}
                control={form.control}
                append={appendAsset}
                remove={removeAsset}
                setValue={form.setValue}
              />

              {/* Liabilities Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Liabilities</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendLiability({ id: `liability-${Date.now()}`, name: '', balance: 0, monthlyPayment: 0, interestRate: 0, loanTerm: 30, termRemaining: 30 })}>
                    Add Liability
                  </Button>
                </div>
                {liabilityFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium">Liability {index + 1}</h4>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeLiability(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.name`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Loan name" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.balance`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Balance</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...f} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.monthlyPayment`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Monthly Payment</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...f} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.interestRate`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Interest Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...f} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.loanTerm`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Loan Term (years)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...f} onChange={e => f.onChange(parseInt(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`liabilities.${index}.termRemaining`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Term Remaining (years)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...f} onChange={e => f.onChange(parseInt(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
);

// Add a displayName to satisfy ESLint `react/display-name` in production builds
ClientForm.displayName = 'ClientForm';
(ClientForm as any).displayName = 'ClientForm';

export default ClientForm;

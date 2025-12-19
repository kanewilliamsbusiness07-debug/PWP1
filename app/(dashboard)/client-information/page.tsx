'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFinancialStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Constants
const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' }
] as const;

const STATE_VALUES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DEFACTO', label: 'De Facto' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' }
] as const;

const MARITAL_STATUS_VALUES = ['SINGLE', 'MARRIED', 'DEFACTO', 'DIVORCED', 'WIDOWED'] as const;

// Generate years for birthday selector (100 years back from current year)
const BIRTH_YEARS = Array.from({ length: 100 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

// Schema
const clientSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, { message: 'First name is required' }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  dob: z.date({ message: 'Date of birth is required' }),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES),
  numberOfDependants: z.number().min(0),
  agesOfDependants: z.string(),
  ownOrRent: z.enum(['OWN', 'RENT'], {
    required_error: 'Please select whether you own or rent'
  }),
  email: z.string().email('Invalid email address').optional(),
  mobile: z.string().optional(),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  suburb: z.string().min(1, 'Suburb is required'),
  state: z.enum(STATE_VALUES, {
    required_error: 'Please select a state'
  }),
  postcode: z.string().regex(/^\d{4}$/, 'Invalid postcode'),

  // Assets - Real Estate
  homePrice: z.number().min(0).optional(),
  homeYear: z.number().min(1900).optional(),
  homeValue: z.number().min(0).optional(),
  investment1Price: z.number().min(0).optional(),
  investment1Year: z.number().min(1900).optional(),
  investment1Value: z.number().min(0).optional(),
  investment2Price: z.number().min(0).optional(),
  investment2Year: z.number().min(1900).optional(),
  investment2Value: z.number().min(0).optional(),
  investment3Price: z.number().min(0).optional(),
  investment3Year: z.number().min(1900).optional(),
  investment3Value: z.number().min(0).optional(),
  investment4Price: z.number().min(0).optional(),
  investment4Year: z.number().min(1900).optional(),
  investment4Value: z.number().min(0).optional(),

  // Liabilities - Mortgages
  homeFunder: z.string().optional(),
  homeBalance: z.number().min(0).optional(),
  homeRate: z.number().min(0).max(100).optional(),
  homeRepayment: z.number().min(0).optional(),
  investment1Funder: z.string().optional(),
  investment1Balance: z.number().min(0).optional(),
  investment1Rate: z.number().min(0).max(100).optional(),
  investment1Repayment: z.number().min(0).optional(),
  investment2Funder: z.string().optional(),
  investment2Balance: z.number().min(0).optional(),
  investment2Rate: z.number().min(0).max(100).optional(),
  investment2Repayment: z.number().min(0).optional(),
  investment3Funder: z.string().optional(),
  investment3Balance: z.number().min(0).optional(),
  investment3Rate: z.number().min(0).max(100).optional(),
  investment3Repayment: z.number().min(0).optional(),
  investment4Funder: z.string().optional(),
  investment4Balance: z.number().min(0).optional(),
  investment4Rate: z.number().min(0).max(100).optional(),
  investment4Repayment: z.number().min(0).optional(),

  // Assets - Other
  vehicleType: z.string().optional(),
  vehicleYear: z.number().min(1900).optional(),
  vehicleValue: z.number().min(0).optional(),
  savingsValue: z.number().min(0).optional(),
  homeContentsValue: z.number().min(0).optional(),
  superFundValue: z.number().min(0).optional(),
  superFundTime: z.number().min(0).optional(),
  sharesValue: z.number().min(0).optional(),
  sharesTotalValue: z.number().min(0).optional(),

  // Liabilities - Other
  creditCardLimit: z.number().min(0).optional(),
  creditCardBalance: z.number().min(0).optional(),
  personalLoanRepayment: z.number().min(0).optional(),
  personalLoanBalance: z.number().min(0).optional(),
  hecsRepayment: z.number().min(0).optional(),
  hecsBalance: z.number().min(0).optional()
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client extends Omit<ClientFormData, 'agesOfDependants'> {
  id?: string;
  dob: Date;
  agesOfDependants: string[];
  isDraft?: boolean;
}

interface ClientFormProps {
  clientSlot: 'A' | 'B';
  form: UseFormReturn<ClientFormData>;
  isLoading: boolean;
  saveClient: (clientSlot: 'A' | 'B') => Promise<void>;
}

const ClientForm: React.FC<ClientFormProps> = ({ clientSlot, form, isLoading, saveClient }) => {
  const store = useFinancialStore();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Client {clientSlot}</CardTitle>
            <CardDescription>Personal and contact information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit((data: ClientFormData) => {
            if (isLoading) return;

            const clientData: any = {
              firstName: data.firstName,
              lastName: data.lastName,
              middleName: data.middleName,
              dateOfBirth: data.dob,
              maritalStatus: data.maritalStatus,
              numberOfDependants: data.numberOfDependants,
              agesOfDependants: data.agesOfDependants,
              ownOrRent: data.ownOrRent,
              email: data.email,
              mobile: data.mobile,
              addressLine1: data.addressLine1,
              addressLine2: data.addressLine2,
              suburb: data.suburb,
              state: data.state,
              postcode: data.postcode,
              homePrice: data.homePrice,
              homeYear: data.homeYear,
              homeValue: data.homeValue,
              investment1Price: data.investment1Price,
              investment1Year: data.investment1Year,
              investment1Value: data.investment1Value,
              investment2Price: data.investment2Price,
              investment2Year: data.investment2Year,
              investment2Value: data.investment2Value,
              investment3Price: data.investment3Price,
              investment3Year: data.investment3Year,
              investment3Value: data.investment3Value,
              investment4Price: data.investment4Price,
              investment4Year: data.investment4Year,
              investment4Value: data.investment4Value,
              homeFunder: data.homeFunder,
              homeBalance: data.homeBalance,
              homeRate: data.homeRate,
              homeRepayment: data.homeRepayment,
              investment1Funder: data.investment1Funder,
              investment1Balance: data.investment1Balance,
              investment1Rate: data.investment1Rate,
              investment1Repayment: data.investment1Repayment,
              investment2Funder: data.investment2Funder,
              investment2Balance: data.investment2Balance,
              investment2Rate: data.investment2Rate,
              investment2Repayment: data.investment2Repayment,
              investment3Funder: data.investment3Funder,
              investment3Balance: data.investment3Balance,
              investment3Rate: data.investment3Rate,
              investment3Repayment: data.investment3Repayment,
              investment4Funder: data.investment4Funder,
              investment4Balance: data.investment4Balance,
              investment4Rate: data.investment4Rate,
              investment4Repayment: data.investment4Repayment,
              vehicleType: data.vehicleType,
              vehicleYear: data.vehicleYear,
              vehicleValue: data.vehicleValue,
              savingsValue: data.savingsValue,
              homeContentsValue: data.homeContentsValue,
              superFundValue: data.superFundValue,
              superFundTime: data.superFundTime,
              sharesValue: data.sharesValue,
              sharesTotalValue: data.sharesTotalValue,
              creditCardLimit: data.creditCardLimit,
              creditCardBalance: data.creditCardBalance,
              personalLoanRepayment: data.personalLoanRepayment,
              personalLoanBalance: data.personalLoanBalance,
              hecsRepayment: data.hecsRepayment,
              hecsBalance: data.hecsBalance
            };

            store.setClientData(clientSlot, clientData);
            saveClient(clientSlot);
          })}>
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
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth *</FormLabel>
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
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
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
                  name="agesOfDependants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ages of Dependants</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5, 8, 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownOrRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Own or Rent *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
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
                        <Input placeholder="Apt 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suburb *</FormLabel>
                      <FormControl>
                        <Input placeholder="Sydney" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AUSTRALIAN_STATES.map((state) => (
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
                      <FormLabel>Postcode *</FormLabel>
                      <FormControl>
                        <Input placeholder="2000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Assets - Real Estate */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assets - Real Estate</h3>

              {/* Home */}
              <div className="border p-4 rounded-md">
                <h4 className="text-md font-medium mb-3">Home</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="homePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Investment Properties */}
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Investment Property {index}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`investment${index}Price` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`investment${index}Year` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Year</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2023" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`investment${index}Value` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Liabilities - Mortgages */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Liabilities - Mortgages</h3>

              {/* Home Loan */}
              <div className="border p-4 rounded-md">
                <h4 className="text-md font-medium mb-3">Home Loan</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="homeFunder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lender</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeRepayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repayment</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Investment Property Loans */}
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Investment {index} Loan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`investment${index}Funder` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lender</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`investment${index}Balance` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Balance</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`investment${index}Rate` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`investment${index}Repayment` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Assets - Other */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assets - Other</h3>

              {/* Vehicle */}
              <div className="border p-4 rounded-md">
                <h4 className="text-md font-medium mb-3">Vehicle</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Car make/model" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Other Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="savingsValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Savings Value</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="homeContentsValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Contents Value</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Super and Shares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Superannuation</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="superFundValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Super Fund Value</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="superFundTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Fund</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Shares</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sharesValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sharesTotalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Value</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Liabilities - Other */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Liabilities - Other</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Credit Card</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="creditCardLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditCardBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Balance</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-medium mb-3">Personal Loan</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="personalLoanRepayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personalLoanBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Balance</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-md">
                <h4 className="text-md font-medium mb-3">HECS Debt</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hecsRepayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repayment</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                        <FormLabel>Balance</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    Saving...
                  </>
                ) : (
                  <>
                    Save Client {clientSlot}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const ClientInformationPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [activeClient, setActiveClient] = useState<'A' | 'B'>('A');
  const [clients, setClients] = useState<{ A?: Client; B?: Client }>({});
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const financialStore = useFinancialStore();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadRecentClients();
  }, []);

  const loadRecentClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=5');
      const data = await response.json();
      setRecentClients(data);
    } catch (error) {
      console.error('Error loading recent clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent clients',
        variant: 'destructive'
      });
    }
  };

  const loadClient = async (clientId: string, targetSlot: 'A' | 'B') => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load client');
      }

      const client: Client = {
        ...data,
        dob: new Date(data.dob),
        agesOfDependants: data.agesOfDependants || []
      };

      setClients((prev) => ({
        ...prev,
        [targetSlot]: client
      }));

      // Update the form with loaded data
      const form = targetSlot === 'A' ? formA : formB;
      form.reset({
        firstName: client.firstName,
        middleName: client.middleName,
        lastName: client.lastName,
        dob: client.dob,
        maritalStatus: client.maritalStatus,
        numberOfDependants: client.numberOfDependants,
        agesOfDependants: client.agesOfDependants.join(', '),
        ownOrRent: client.ownOrRent,
        email: client.email,
        mobile: client.mobile,
        addressLine1: client.addressLine1,
        addressLine2: client.addressLine2,
        suburb: client.suburb,
        state: client.state,
        postcode: client.postcode,
        homePrice: client.homePrice,
        homeYear: client.homeYear,
        homeValue: client.homeValue,
        investment1Price: client.investment1Price,
        investment1Year: client.investment1Year,
        investment1Value: client.investment1Value,
        investment2Price: client.investment2Price,
        investment2Year: client.investment2Year,
        investment2Value: client.investment2Value,
        investment3Price: client.investment3Price,
        investment3Year: client.investment3Year,
        investment3Value: client.investment3Value,
        investment4Price: client.investment4Price,
        investment4Year: client.investment4Year,
        investment4Value: client.investment4Value,
        homeFunder: client.homeFunder,
        homeBalance: client.homeBalance,
        homeRate: client.homeRate,
        homeRepayment: client.homeRepayment,
        investment1Funder: client.investment1Funder,
        investment1Balance: client.investment1Balance,
        investment1Rate: client.investment1Rate,
        investment1Repayment: client.investment1Repayment,
        investment2Funder: client.investment2Funder,
        investment2Balance: client.investment2Balance,
        investment2Rate: client.investment2Rate,
        investment2Repayment: client.investment2Repayment,
        investment3Funder: client.investment3Funder,
        investment3Balance: client.investment3Balance,
        investment3Rate: client.investment3Rate,
        investment3Repayment: client.investment3Repayment,
        investment4Funder: client.investment4Funder,
        investment4Balance: client.investment4Balance,
        investment4Rate: client.investment4Rate,
        investment4Repayment: client.investment4Repayment,
        vehicleType: client.vehicleType,
        vehicleYear: client.vehicleYear,
        vehicleValue: client.vehicleValue,
        savingsValue: client.savingsValue,
        homeContentsValue: client.homeContentsValue,
        superFundValue: client.superFundValue,
        superFundTime: client.superFundTime,
        sharesValue: client.sharesValue,
        sharesTotalValue: client.sharesTotalValue,
        creditCardLimit: client.creditCardLimit,
        creditCardBalance: client.creditCardBalance,
        personalLoanRepayment: client.personalLoanRepayment,
        personalLoanBalance: client.personalLoanBalance,
        hecsRepayment: client.hecsRepayment,
        hecsBalance: client.hecsBalance
      });

      toast({
        title: 'Client loaded',
        description: `${client.firstName} ${client.lastName} loaded into slot ${targetSlot}`
      });
    } catch (error) {
      console.error('Error loading client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client data',
        variant: 'destructive'
      });
    }
  };

  const saveClient = async (clientSlot: 'A' | 'B') => {
    const form = clientSlot === 'A' ? formA : formB;

    try {
      if (!await form.trigger()) {
        toast({
          title: 'Validation Error',
          description: 'Please correct the errors in the form before saving'
        });
        return;
      }

      setIsLoading(true);

      const data = form.getValues();
      const clientData = {
        ...data,
        agesOfDependants: data.agesOfDependants.split(',').map((age: string) => age.trim()).filter((age: string) => age !== '')
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const savedClient = await response.json();

      setClients((prev) => ({
        ...prev,
        [clientSlot]: savedClient
      }));

      toast({
        title: 'Success',
        description: 'Client information saved successfully'
      });

      // Refresh recent clients list
      loadRecentClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client information',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formA = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dob: undefined,
      ownOrRent: undefined,
      numberOfDependants: 0,
      agesOfDependants: '',
      maritalStatus: 'SINGLE',
      email: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      suburb: '',
      state: undefined,
      postcode: '',
      homePrice: undefined,
      homeYear: undefined,
      homeValue: undefined,
      investment1Price: undefined,
      investment1Year: undefined,
      investment1Value: undefined,
      investment2Price: undefined,
      investment2Year: undefined,
      investment2Value: undefined,
      investment3Price: undefined,
      investment3Year: undefined,
      investment3Value: undefined,
      investment4Price: undefined,
      investment4Year: undefined,
      investment4Value: undefined,
      homeFunder: '',
      homeBalance: undefined,
      homeRate: undefined,
      homeRepayment: undefined,
      investment1Funder: '',
      investment1Balance: undefined,
      investment1Rate: undefined,
      investment1Repayment: undefined,
      investment2Funder: '',
      investment2Balance: undefined,
      investment2Rate: undefined,
      investment2Repayment: undefined,
      investment3Funder: '',
      investment3Balance: undefined,
      investment3Rate: undefined,
      investment3Repayment: undefined,
      investment4Funder: '',
      investment4Balance: undefined,
      investment4Rate: undefined,
      investment4Repayment: undefined,
      vehicleType: '',
      vehicleYear: undefined,
      vehicleValue: undefined,
      savingsValue: undefined,
      homeContentsValue: undefined,
      superFundValue: undefined,
      superFundTime: undefined,
      sharesValue: undefined,
      sharesTotalValue: undefined,
      creditCardLimit: undefined,
      creditCardBalance: undefined,
      personalLoanRepayment: undefined,
      personalLoanBalance: undefined,
      hecsRepayment: undefined,
      hecsBalance: undefined
    }
  });

  const formB = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dob: undefined,
      ownOrRent: undefined,
      numberOfDependants: 0,
      agesOfDependants: '',
      maritalStatus: 'SINGLE',
      email: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      suburb: '',
      state: undefined,
      postcode: '',
      homePrice: undefined,
      homeYear: undefined,
      homeValue: undefined,
      investment1Price: undefined,
      investment1Year: undefined,
      investment1Value: undefined,
      investment2Price: undefined,
      investment2Year: undefined,
      investment2Value: undefined,
      investment3Price: undefined,
      investment3Year: undefined,
      investment3Value: undefined,
      investment4Price: undefined,
      investment4Year: undefined,
      investment4Value: undefined,
      homeFunder: '',
      homeBalance: undefined,
      homeRate: undefined,
      homeRepayment: undefined,
      investment1Funder: '',
      investment1Balance: undefined,
      investment1Rate: undefined,
      investment1Repayment: undefined,
      investment2Funder: '',
      investment2Balance: undefined,
      investment2Rate: undefined,
      investment2Repayment: undefined,
      investment3Funder: '',
      investment3Balance: undefined,
      investment3Rate: undefined,
      investment3Repayment: undefined,
      investment4Funder: '',
      investment4Balance: undefined,
      investment4Rate: undefined,
      investment4Repayment: undefined,
      vehicleType: '',
      vehicleYear: undefined,
      vehicleValue: undefined,
      savingsValue: undefined,
      homeContentsValue: undefined,
      superFundValue: undefined,
      superFundTime: undefined,
      sharesValue: undefined,
      sharesTotalValue: undefined,
      creditCardLimit: undefined,
      creditCardBalance: undefined,
      personalLoanRepayment: undefined,
      personalLoanBalance: undefined,
      hecsRepayment: undefined,
      hecsBalance: undefined
    }
  });

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Client Information</h1>
          <p className="text-muted-foreground">Manage client details and financial information</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActiveClient(activeClient === 'A' ? 'B' : 'A')} variant="outline">
            Switch to Client {activeClient === 'A' ? 'B' : 'A'}
          </Button>
        </div>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Clients</CardTitle>
          <CardDescription>Quick access to recently viewed clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {recentClients.map((client) => (
              <Badge
                key={client.id}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => loadClient(client.id!, activeClient)}
              >
                {client.firstName} {client.lastName}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Search</CardTitle>
          <CardDescription>Search for existing clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dual Client Forms - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Client A */}
        <div>
          <ClientForm clientSlot="A" form={formA} isLoading={isLoading} saveClient={saveClient} />
        </div>

        {/* Client B */}
        <div>
          <ClientForm clientSlot="B" form={formB} isLoading={isLoading} saveClient={saveClient} />
        </div>
      </div>
    </div>
  );
};

export default ClientInformationPage;

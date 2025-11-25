import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinancialStore } from '@/lib/store/store';

const taxFormSchema = z.object({
  grossIncome: z.number().min(0),
  workRelatedExpenses: z.number().min(0),
  investmentExpenses: z.number().min(0),
  rentalIncome: z.number().min(0),
  rentalExpenses: z.number().min(0),
  employmentIncome: z.number().min(0),
  investmentIncome: z.number().min(0),
  otherIncome: z.number().min(0),
  frankedDividends: z.number().min(0),
  capitalGains: z.number().min(0),
  vehicleExpenses: z.number().min(0),
  uniformsAndLaundry: z.number().min(0),
  homeOfficeExpenses: z.number().min(0),
  selfEducationExpenses: z.number().min(0),
  charityDonations: z.number().min(0),
  accountingFees: z.number().min(0),
  otherDeductions: z.number().min(0),
  superContributions: z.number().min(0),
  healthInsurance: z.boolean().optional(),
  hecs: z.boolean().optional(),
  helpDebt: z.number().min(0),
  hecsBalance: z.number().min(0),
  privateHealthInsurance: z.boolean()
});

type TaxFormData = z.infer<typeof taxFormSchema>;

export const useTaxForm = () => {
  const financialStore = useFinancialStore();
  
  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      grossIncome: financialStore.grossIncome ?? 0,
      workRelatedExpenses: financialStore.workRelatedExpenses ?? 0,
      investmentExpenses: financialStore.investmentExpenses ?? 0,
      rentalIncome: financialStore.rentalIncome ?? 0,
      rentalExpenses: financialStore.rentalExpenses ?? 0,
      employmentIncome: 0,
      investmentIncome: 0,
      otherIncome: 0,
      frankedDividends: 0,
      capitalGains: 0,
      vehicleExpenses: 0,
      uniformsAndLaundry: 0,
      homeOfficeExpenses: 0,
      selfEducationExpenses: 0,
      charityDonations: 0,
      accountingFees: 0,
      otherDeductions: 0,
      superContributions: 0,
      healthInsurance: false,
      hecs: false,
      helpDebt: 0,
      hecsBalance: 0,
      privateHealthInsurance: false
    }
  });

  // Watch for changes in the store and update form
  // Watch for form value changes and update store
  useEffect(() => {
    const fields = ['grossIncome', 'workRelatedExpenses', 'investmentExpenses', 'rentalIncome', 'rentalExpenses'] as const;
    
    const subscription = form.watch((value, { name }) => {
      if (name && fields.includes(name as any) && typeof value === 'number') {
        financialStore.setIncomeData({ [name]: value });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, financialStore]);

  // Sync store values with form when store changes
  useEffect(() => {
    const fields = ['grossIncome', 'workRelatedExpenses', 'investmentExpenses', 'rentalIncome', 'rentalExpenses'] as const;
    
    fields.forEach(field => {
      const storeValue = financialStore[field] ?? 0;
      form.setValue(field, storeValue, { 
        shouldDirty: true,
        shouldTouch: true
      });
    });
  }, [financialStore, form]);

  return { form };
};
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useFinancialStore } from '@/lib/store/store';

// Define relationships between fields
const fieldRelationships = {
  // Example: when grossIncome changes, update taxableIncome and superContributions
  grossIncome: ['taxableIncome', 'superContributions'],
  // Example: when rentalIncome changes, update totalIncome
  rentalIncome: ['totalIncome'],
  // Add more relationships as needed
};

export const useSyncFields = (form: UseFormReturn<any>) => {
  const financialStore = useFinancialStore();

  useEffect(() => {
    // Subscribe to form changes
    const subscription = form.watch((value, { name, type }) => {
      if (!name || type === 'blur') return;

      // Update the store with the new value
      financialStore.setIncomeData({ [name]: value });

      // Get related fields that need to be updated
      const relatedFields = fieldRelationships[name as keyof typeof fieldRelationships];
      if (!relatedFields) return;

      // Calculate and update related fields
      relatedFields.forEach(fieldName => {
        let newValue = 0;
        
        switch (fieldName) {
          case 'taxableIncome':
            newValue = calculateTaxableIncome(value, financialStore);
            break;
          case 'totalIncome':
            newValue = calculateTotalIncome(financialStore);
            break;
          // Add more cases as needed
        }

        // Update the form field
        form.setValue(fieldName, newValue, { 
          shouldValidate: true,
          shouldDirty: true 
        });

        // Update the store
        financialStore.setIncomeData({ [fieldName]: newValue });
      });
    });

    return () => subscription.unsubscribe();
  }, [form, financialStore]);
};

// Helper functions to calculate derived values
const calculateTaxableIncome = (grossIncome: number, store: any) => {
  return grossIncome - (store.workRelatedExpenses || 0) - (store.investmentExpenses || 0);
};

const calculateTotalIncome = (store: any) => {
  return (store.grossIncome || 0) + 
         (store.rentalIncome || 0) + 
         (store.investmentIncome || 0) + 
         (store.otherIncome || 0);
};
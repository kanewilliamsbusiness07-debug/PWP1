"use client";

import * as React from "react";
import { forwardRef } from "react";
import AssetsSection from './assets-section';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form } from '@/components/ui/form';

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
    React.useImperativeHandle(ref, () => ({
      async saveClient() {},
      resetClient() {},
      async deleteClient() { return false; },
    }));

    // Minimal form wiring for assets while we reintroduce the full form
    const form = useForm<any>({
      defaultValues: {
        assets: [ { id: 'asset-1' }, { id: 'asset-2' } ],
      },
    });

    const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({ control: form.control, name: 'assets' });

    return (
      <div>
        <h2>Client Form ({clientSlot})</h2>
        <p>Temporary minimal stub to allow builds while I reintroduce the full UI.</p>

        {/* Extracted assets into a separate component for safer incremental wiring */}
        <Form {...form}>
          <AssetsSection assetFields={assetFields} register={form.register} control={form.control} append={appendAsset} remove={removeAsset} setValue={form.setValue} />
        </Form>
      </div>
    );
  }
);

// Add a displayName to satisfy ESLint `react/display-name` in production builds
(ClientForm as any).displayName = 'ClientForm';

export default ClientForm;

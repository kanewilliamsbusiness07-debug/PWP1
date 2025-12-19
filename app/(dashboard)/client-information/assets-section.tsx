"use client";

import * as React from "react";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export type AssetField = { id: string; name?: string };

interface AssetsSectionProps {
  assetFields: AssetField[];
}

interface AssetsSectionPropsInternal extends AssetsSectionProps {
  register?: any;
  control?: any;
  append?: (value: any) => void;
  remove?: (index: number) => void;
  setValue?: any;
}

export function AssetsSection({ assetFields, register, control, append, remove, setValue }: AssetsSectionPropsInternal) {
  return (
    <section aria-label="assets-section" className="mt-6">
      <h3 className="text-lg font-medium">Assets & Liabilities (component)</h3>
      {assetFields.map((field, index) => (
        <div key={field.id} className="border-t-2 border-border py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                {control ? (
                  <FormField
                    control={control}
                    name={`assets.${index}.name` as any}
                    render={({ field: f }) => (
                      <FormControl>
                        <Input {...f} aria-label={`asset-name-${index}`} />
                      </FormControl>
                    )}
                  />
                ) : (
                  <Input aria-label={`asset-name-${index}`} defaultValue={field.name ?? `Asset ${index + 1}`} {...(register ? register(`assets.${index}.name`) : {})} />
                )}
                <FormMessage />
              </FormItem>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select
                value={String((field as any).type ?? 'property')}
                onValueChange={(v) => setValue && setValue(`assets.${index}.type`, v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="shares">Shares</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Current Value</label>
              <FormItem>
                <FormLabel>Current Value</FormLabel>
                {control ? (
                  <FormField
                    control={control}
                    name={`assets.${index}.currentValue` as any}
                    render={({ field: f }) => (
                      <FormControl>
                        <Input {...f} aria-label={`asset-value-${index}`} />
                      </FormControl>
                    )}
                  />
                ) : (
                  <Input aria-label={`asset-value-${index}`} defaultValue="0" {...(register ? register(`assets.${index}.currentValue`) : {})} />
                )}
                <FormMessage />
              </FormItem>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner Occupied</label>
              <FormField
                control={control}
                name={`assets.${index}.ownerOccupied`}
                render={({ field: f }) => (
                  <FormItem className="flex items-start">
                    <FormControl>
                      <div className="flex items-center">
                        <Checkbox aria-label={`asset-owner-${index}`} className="mr-2" checked={Boolean(f.value)} onCheckedChange={(v) => f.onChange(v)} />
                        <span className="text-sm">Owner occupied</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Liability Name</label>
              <FormItem>
                <FormLabel>Liability Name</FormLabel>
                {control ? (
                  <FormField
                    control={control}
                    name={`liabilities.${index}.name` as any}
                    render={({ field: f }) => (
                      <FormControl>
                        <Input {...f} aria-label={`liability-name-${index}`} />
                      </FormControl>
                    )}
                  />
                ) : (
                  <Input aria-label={`liability-name-${index}`} defaultValue={`Liability ${index + 1}`} {...(register ? register(`liabilities.${index}.name`) : {})} />
                )}
                <FormMessage />
              </FormItem>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Balance</label>
              <FormItem>
                <FormLabel>Balance</FormLabel>
                {control ? (
                  <FormField
                    control={control}
                    name={`liabilities.${index}.balance` as any}
                    render={({ field: f }) => (
                      <FormControl>
                        <Input {...f} aria-label={`liability-balance-${index}`} />
                      </FormControl>
                    )}
                  />
                ) : (
                  <Input aria-label={`liability-balance-${index}`} defaultValue="0" {...(register ? register(`liabilities.${index}.balance`) : {})} />
                )}
                <FormMessage />
              </FormItem>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Payment</label>
              <FormField
                control={control}
                name={`liabilities.${index}.monthlyPayment`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input aria-label={`liability-monthly-${index}`} value={f.value ?? ''} onChange={f.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
              <FormField
                control={control}
                name={`liabilities.${index}.interestRate`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input aria-label={`liability-interest-${index}`} value={f.value ?? ''} onChange={f.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loan Term (years)</label>
              <FormField
                control={control}
                name={`liabilities.${index}.loanTerm`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input aria-label={`liability-term-${index}`} value={f.value ?? ''} onChange={f.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Lender</label>
              <FormField
                control={control}
                name={`liabilities.${index}.lender`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input aria-label={`liability-lender-${index}`} value={f.value ?? ''} onChange={f.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loan Type</label>
              <FormField
                control={control}
                name={`liabilities.${index}.loanType`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={f.value ?? ''} onValueChange={f.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="variable">Variable</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="interest-only">Interest Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Frequency</label>
              <FormField
                control={control}
                name={`liabilities.${index}.paymentFrequency`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={f.value ?? ''} onValueChange={f.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="W">Weekly</SelectItem>
                          <SelectItem value="F">Fortnightly</SelectItem>
                          <SelectItem value="M">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">Sample note: labels may contain characters like slashes (HECS/HELP) — check parsing.</div>

          <div className="mt-2">
            <button type="button" onClick={() => remove && remove(index)} className="text-red-600">Remove</button>
          </div>
        </div>
      ))}

      <div className="mt-4">
        <button type="button" onClick={() => append && append({ id: `asset-${Date.now()}` })} className="px-3 py-1 bg-slate-100 rounded">Add Asset</button>
      </div>
    </section>
  );
}

export default AssetsSection;

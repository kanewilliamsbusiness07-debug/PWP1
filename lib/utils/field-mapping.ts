/**
 * Canonical Field Mapping System
 * 
 * This module provides field name normalization to ensure consistent
 * field names across the entire application.
 */

// Canonical field mappings
export const FIELD_MAPPINGS: Record<string, string> = {
  // Income fields -> annualIncome
  'grossSalary': 'annualIncome',
  'grossIncome': 'annualIncome',
  'employmentIncome': 'annualIncome',
  'annualIncome': 'annualIncome',
  'income': 'annualIncome',
  'gross_income': 'annualIncome',
  'gross_salary': 'annualIncome',
  'employment_income': 'annualIncome',
  
  // Rental income -> rentalIncome
  'rentalIncome': 'rentalIncome',
  'rental_income': 'rentalIncome',
  'monthlyRentalIncome': 'rentalIncome', // Will be converted to annual
  'monthly_rental_income': 'rentalIncome',
  
  // Investment income -> investmentIncome
  'investmentIncome': 'investmentIncome',
  'investment_income': 'investmentIncome',
  'dividends': 'investmentIncome',
  'frankedDividends': 'investmentIncome',
  'capitalGains': 'investmentIncome',
  
  // Other income -> otherIncome
  'otherIncome': 'otherIncome',
  'other_income': 'otherIncome',
};

/**
 * Normalize field name to canonical form
 */
export function normalizeFieldName(fieldName: string): string {
  const normalized = fieldName.trim();
  return FIELD_MAPPINGS[normalized] || normalized;
}

/**
 * Normalize an object's field names to canonical forms
 */
export function normalizeFields<T extends Record<string, any>>(data: T): T {
  const normalized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    const canonicalKey = normalizeFieldName(key);
    
    // If multiple synonyms map to the same canonical key, merge them
    if (normalized[canonicalKey] !== undefined && typeof value === 'number') {
      // For numeric fields, take the maximum value (most complete data)
      normalized[canonicalKey] = Math.max(normalized[canonicalKey], value);
    } else if (normalized[canonicalKey] === undefined) {
      normalized[canonicalKey] = value;
    }
  }
  
  // Remove synonym fields that have been normalized
  for (const [key] of Object.entries(data)) {
    const canonicalKey = normalizeFieldName(key);
    if (key !== canonicalKey && normalized[key] !== undefined) {
      delete normalized[key];
    }
  }
  
  return normalized as T;
}

/**
 * Get all synonyms for a canonical field
 */
export function getFieldSynonyms(canonicalField: string): string[] {
  return Object.entries(FIELD_MAPPINGS)
    .filter(([_, canonical]) => canonical === canonicalField)
    .map(([synonym]) => synonym);
}

/**
 * Check if a field name is a synonym
 */
export function isFieldSynonym(fieldName: string): boolean {
  return fieldName in FIELD_MAPPINGS && FIELD_MAPPINGS[fieldName] !== fieldName;
}


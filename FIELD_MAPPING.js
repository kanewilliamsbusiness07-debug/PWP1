/**
 * FIELD UNIFICATION MAPPING
 * 
 * Maps old/duplicate field names to unified canonical names
 * Use this for data migration and field name replacement
 */

export const FIELD_UNIFICATION_MAP = {
  // ============================================
  // INCOME FIELDS → annualIncome
  // ============================================
  'grossSalary': 'annualIncome',
  'grossIncome': 'annualIncome',
  'employmentIncome': 'annualIncome',
  'currentSalary': 'annualIncome',
  'yearlyIncome': 'annualIncome',
  'salary': 'annualIncome',
  'income': 'annualIncome',
  'gross_income': 'annualIncome',
  'gross_salary': 'annualIncome',
  'employment_income': 'annualIncome',
  'current_salary': 'annualIncome',
  
  // ============================================
  // CONTACT FIELDS → phoneNumber
  // ============================================
  'mobile': 'phoneNumber',
  'phone': 'phoneNumber',
  'contact_phone': 'phoneNumber',
  'mobileNumber': 'phoneNumber',
  'telephone': 'phoneNumber',
  'contactPhone': 'phoneNumber',
  
  // ============================================
  // DATE FIELDS → dateOfBirth (already mapped in code)
  // ============================================
  'dob': 'dateOfBirth',
  'birthDate': 'dateOfBirth',
  'birthday': 'dateOfBirth',
  'date_of_birth': 'dateOfBirth',
  
  // ============================================
  // ADDRESS FIELDS (already consistent)
  // ============================================
  // addressLine1, addressLine2, suburb, state, postcode - already standardized
  
  // ============================================
  // ASSET FIELDS (already consistent)
  // ============================================
  // currentSuper, currentSavings, currentShares, propertyEquity - already standardized
  
  // ============================================
  // DEDUCTION FIELDS (already consistent)
  // ============================================
  // workRelatedExpenses, vehicleExpenses, etc. - already standardized
};

/**
 * Reverse mapping: canonical name → all possible old names
 * Useful for data migration and backward compatibility
 */
export const CANONICAL_TO_OLD_NAMES = {
  'annualIncome': [
    'grossSalary',
    'grossIncome',
    'employmentIncome',
    'currentSalary',
    'yearlyIncome',
    'salary',
    'income',
  ],
  'phoneNumber': [
    'mobile',
    'phone',
    'contact_phone',
    'mobileNumber',
    'telephone',
  ],
  'dateOfBirth': [
    'dob',
    'birthDate',
    'birthday',
  ],
};

/**
 * Get the canonical field name for any field
 * @param {string} fieldName - The field name to normalize
 * @returns {string} - The canonical field name
 */
export function getCanonicalFieldName(fieldName) {
  return FIELD_UNIFICATION_MAP[fieldName] || fieldName;
}

/**
 * Migrate legacy data object to use canonical field names
 * @param {Object} oldData - Data object with old field names
 * @returns {Object} - Data object with canonical field names
 */
export function migrateLegacyData(oldData) {
  if (!oldData || typeof oldData !== 'object') {
    return oldData;
  }
  
  const migratedData = {};
  
  for (const [key, value] of Object.entries(oldData)) {
    const canonicalKey = getCanonicalFieldName(key);
    
    // If multiple old fields map to same canonical, merge them
    if (migratedData[canonicalKey] !== undefined) {
      // Use the non-zero/non-empty value, or the most recent
      if (value && (value !== 0 && value !== '' && value !== null)) {
        migratedData[canonicalKey] = value;
      }
    } else {
      migratedData[canonicalKey] = value;
    }
  }
  
  return migratedData;
}

/**
 * Check if a field name needs migration
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if field needs migration
 */
export function needsMigration(fieldName) {
  return fieldName in FIELD_UNIFICATION_MAP;
}


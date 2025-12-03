/**
 * Centralized Form Fields Configuration
 * 
 * Single source of truth for all form field names across the application.
 * Use these constants to prevent field name inconsistencies.
 */

export const FORM_FIELDS = {
  // ============================================
  // Personal Information
  // ============================================
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  MIDDLE_NAME: 'middleName',
  DATE_OF_BIRTH: 'dateOfBirth',
  MARITAL_STATUS: 'maritalStatus',
  NUMBER_OF_DEPENDANTS: 'numberOfDependants',
  AGES_OF_DEPENDANTS: 'agesOfDependants',
  
  // ============================================
  // Contact Information
  // ============================================
  EMAIL: 'email',
  PHONE_NUMBER: 'phoneNumber',
  ADDRESS_LINE_1: 'addressLine1',
  ADDRESS_LINE_2: 'addressLine2',
  SUBURB: 'suburb',
  STATE: 'state',
  POSTCODE: 'postcode',
  OWN_OR_RENT: 'ownOrRent',
  
  // ============================================
  // Financial Information - Income
  // ============================================
  ANNUAL_INCOME: 'annualIncome', // CANONICAL - Use this for all primary income fields
  RENTAL_INCOME: 'rentalIncome',
  DIVIDENDS: 'dividends',
  FRANKED_DIVIDENDS: 'frankedDividends',
  CAPITAL_GAINS: 'capitalGains',
  OTHER_INCOME: 'otherIncome',
  INVESTMENT_INCOME: 'investmentIncome',
  EMPLOYMENT_INCOME: 'employmentIncome', // DEPRECATED - use annualIncome
  MONTHLY_RENTAL_INCOME: 'monthlyRentalIncome',
  
  // ============================================
  // Financial Information - Assets
  // ============================================
  CURRENT_SUPER: 'currentSuper',
  CURRENT_SAVINGS: 'currentSavings',
  CURRENT_SHARES: 'currentShares',
  PROPERTY_EQUITY: 'propertyEquity',
  ASSETS: 'assets',
  
  // ============================================
  // Financial Information - Liabilities
  // ============================================
  TOTAL_DEBT: 'totalDebt',
  MONTHLY_DEBT_PAYMENTS: 'monthlyDebtPayments',
  LIABILITIES: 'liabilities',
  
  // ============================================
  // Financial Information - Deductions
  // ============================================
  WORK_RELATED_EXPENSES: 'workRelatedExpenses',
  VEHICLE_EXPENSES: 'vehicleExpenses',
  UNIFORMS_AND_LAUNDRY: 'uniformsAndLaundry',
  HOME_OFFICE_EXPENSES: 'homeOfficeExpenses',
  SELF_EDUCATION_EXPENSES: 'selfEducationExpenses',
  INVESTMENT_EXPENSES: 'investmentExpenses',
  CHARITY_DONATIONS: 'charityDonations',
  ACCOUNTING_FEES: 'accountingFees',
  RENTAL_EXPENSES: 'rentalExpenses',
  SUPER_CONTRIBUTIONS: 'superContributions',
  OTHER_DEDUCTIONS: 'otherDeductions',
  
  // ============================================
  // Financial Information - Tax
  // ============================================
  HEALTH_INSURANCE: 'healthInsurance',
  HECS: 'hecs',
  HELP_DEBT: 'helpDebt',
  HECS_BALANCE: 'hecsBalance',
  PRIVATE_HEALTH_INSURANCE: 'privateHealthInsurance',
  
  // ============================================
  // Projections
  // ============================================
  CURRENT_AGE: 'currentAge',
  RETIREMENT_AGE: 'retirementAge',
  INFLATION_RATE: 'inflationRate',
  SALARY_GROWTH_RATE: 'salaryGrowthRate',
  SUPER_RETURN: 'superReturn',
  SHARE_RETURN: 'shareReturn',
  PROPERTY_GROWTH_RATE: 'propertyGrowthRate',
  WITHDRAWAL_RATE: 'withdrawalRate',
  RENT_GROWTH_RATE: 'rentGrowthRate',
  
  // ============================================
  // Investment Properties
  // ============================================
  PROPERTY_ADDRESS: 'address',
  PURCHASE_PRICE: 'purchasePrice',
  CURRENT_VALUE: 'currentValue',
  LOAN_AMOUNT: 'loanAmount',
  INTEREST_RATE: 'interestRate',
  LOAN_TERM: 'loanTerm',
  WEEKLY_RENT: 'weeklyRent',
  ANNUAL_EXPENSES: 'annualExpenses',
  PROPERTIES: 'properties',
  
  // ============================================
  // Serviceability Calculator
  // ============================================
  MONTHLY_EXPENSES: 'monthlyExpenses',
  EXISTING_DEBT_PAYMENTS: 'existingDebtPayments',
  TARGET_PROPERTY_PRICE: 'targetPropertyPrice',
  DEPOSIT: 'deposit',
  EXPECTED_RENT: 'expectedRent',
  ANNUAL_PROPERTY_EXPENSES: 'annualPropertyExpenses',
  DEPRECIATION_AMOUNT: 'depreciationAmount',
  MARGINAL_TAX_RATE: 'marginalTaxRate',
} as const;

/**
 * Type helper for form field names
 */
export type FormFieldName = typeof FORM_FIELDS[keyof typeof FORM_FIELDS];

/**
 * Deprecated field names that should be migrated
 */
export const DEPRECATED_FIELDS = {
  // Income fields - use FORM_FIELDS.ANNUAL_INCOME instead
  'grossSalary': FORM_FIELDS.ANNUAL_INCOME,
  'grossIncome': FORM_FIELDS.ANNUAL_INCOME,
  'currentSalary': FORM_FIELDS.ANNUAL_INCOME,
  'employmentIncome': FORM_FIELDS.ANNUAL_INCOME,
  
  // Contact fields - use FORM_FIELDS.PHONE_NUMBER instead
  'mobile': FORM_FIELDS.PHONE_NUMBER,
  'phone': FORM_FIELDS.PHONE_NUMBER,
  
  // Date fields - use FORM_FIELDS.DATE_OF_BIRTH instead
  'dob': FORM_FIELDS.DATE_OF_BIRTH,
} as const;

/**
 * Get the canonical field name for a potentially deprecated field
 */
export function getCanonicalFieldName(fieldName: string): string {
  return DEPRECATED_FIELDS[fieldName as keyof typeof DEPRECATED_FIELDS] || fieldName;
}


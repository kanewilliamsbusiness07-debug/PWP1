/**
 * Comprehensive client validation utilities
 * Handles all validation rules for client information forms
 */

import * as z from 'zod';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Australian phone number validation (supports various formats)
const PHONE_REGEX = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;

// Australian postcode validation (4 digits)
const POSTCODE_REGEX = /^\d{4}$/;

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Optional field
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates Australian phone number
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Optional field
  // Remove spaces, dashes, and parentheses for validation
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validates Australian postcode
 */
export function validatePostcode(postcode: string): boolean {
  if (!postcode || postcode.trim() === '') return true; // Optional field
  return POSTCODE_REGEX.test(postcode.trim());
}

/**
 * Validates date is not in the future
 */
export function validateDateNotFuture(date: Date | null | undefined): boolean {
  if (!date) return true; // Optional field
  return date <= new Date();
}

/**
 * Validates date is not before 1900
 */
export function validateDateNotTooOld(date: Date | null | undefined): boolean {
  if (!date) return true; // Optional field
  return date >= new Date('1900-01-01');
}

/**
 * Validates numeric input is positive
 */
export function validatePositiveNumber(value: number | null | undefined): boolean {
  if (value === null || value === undefined) return true; // Optional field
  return value >= 0;
}

/**
 * Validates percentage is between 0 and 100
 */
export function validatePercentage(value: number | null | undefined): boolean {
  if (value === null || value === undefined) return true; // Optional field
  return value >= 0 && value <= 100;
}

/**
 * Trims whitespace from string
 */
export function trimWhitespace(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim();
}

/**
 * Sanitizes string input
 */
export function sanitizeString(value: string | null | undefined): string {
  if (!value) return '';
  return trimWhitespace(value);
}

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
}

/**
 * Comprehensive client schema with all validation rules
 */
export const clientValidationSchema = z.object({
  // Personal Information - Primary Person (Required)
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  
  // Personal Information - Primary Person (Optional)
  middleName: z.string().max(100, 'Middle name is too long').optional().or(z.literal('')),
  dob: z.date().optional().nullable(),
  
  // Personal Information - Partner/Spouse (Optional)
  partnerFirstName: z.string().max(100, 'Partner first name is too long').optional().or(z.literal('')),
  partnerLastName: z.string().max(100, 'Partner last name is too long').optional().or(z.literal('')),
  partnerDob: z.date().optional().nullable(),
  partnerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  partnerPhoneNumber: z.string().max(20, 'Partner phone number is too long').optional().or(z.literal('')),
  
  // Shared Household Information
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DEFACTO', 'DIVORCED', 'WIDOWED']).optional(),
  numberOfDependants: z.number().int().min(0, 'Number of dependants cannot be negative').max(20, 'Number of dependants is too high').optional(),
  agesOfDependants: z.string().max(200, 'Ages of dependants is too long').optional().or(z.literal('')),
  
  // Contact Information
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  // Legacy field - kept for backward compatibility during migration
  mobile: z.string().optional().or(z.literal('')),
  
  // Address Information
  addressLine1: z.string().max(200, 'Address line 1 is too long').optional().or(z.literal('')),
  addressLine2: z.string().max(200, 'Address line 2 is too long').optional().or(z.literal('')),
  suburb: z.string().max(100, 'Suburb is too long').optional().or(z.literal('')),
  state: z.enum(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']).optional(),
  postcode: z.string().max(4, 'Postcode must be 4 digits').optional().or(z.literal('')),
  ownOrRent: z.enum(['OWN', 'RENT', 'MORTGAGED']).optional(),
  
  // Financial Position - Income
  annualIncome: z.number().min(0, 'Annual income cannot be negative').max(10000000, 'Annual income is too high').optional(),
  // Legacy field names - kept for backward compatibility during migration
  grossSalary: z.number().min(0, 'Gross salary cannot be negative').max(10000000, 'Gross salary is too high').optional(),
  rentalIncome: z.number().min(0, 'Rental income cannot be negative').max(10000000, 'Rental income is too high').optional(),
  dividends: z.number().min(0, 'Dividends cannot be negative').max(10000000, 'Dividends are too high').optional(),
  frankedDividends: z.number().min(0, 'Franked dividends cannot be negative').max(10000000, 'Franked dividends are too high').optional(),
  capitalGains: z.number().min(0, 'Capital gains cannot be negative').max(10000000, 'Capital gains are too high').optional(),
  otherIncome: z.number().min(0, 'Other income cannot be negative').max(10000000, 'Other income is too high').optional(),
  
  // Financial Position - Assets (dynamic)
  assets: z.array(z.object({
    id: z.string(),
    name: z.string().max(200, 'Asset name is too long'),
    currentValue: z.number().min(0, 'Asset value cannot be negative').max(100000000, 'Asset value is too high'),
    type: z.enum(['property', 'vehicle', 'savings', 'shares', 'super', 'other']),
    ownerOccupied: z.enum(['own', 'rent']).optional(),
  })).optional(),
  
  // Financial Position - Liabilities (dynamic)
  liabilities: z.array(z.object({
    id: z.string(),
    name: z.string().max(200, 'Liability name is too long'),
    balance: z.number().min(0, 'Balance cannot be negative').max(100000000, 'Balance is too high'),
    monthlyPayment: z.number().min(0, 'Monthly payment cannot be negative').max(1000000, 'Monthly payment is too high'),
    interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
    loanTerm: z.number().int().min(0, 'Loan term cannot be negative').max(100, 'Loan term cannot exceed 100 years'),
    termRemaining: z.number().int().min(0, 'Term remaining cannot be negative').max(100, 'Term remaining cannot exceed 100 years').optional(),
    type: z.enum(['mortgage', 'personal-loan', 'credit-card', 'hecs', 'other']),
    lender: z.string().max(200, 'Lender name is too long').optional(),
    loanType: z.enum(['fixed', 'split', 'variable']).optional(),
    paymentFrequency: z.enum(['W', 'F', 'M']).optional(),
  })).optional(),
  
  // Investment Properties
  properties: z.array(z.object({
    id: z.string(),
    address: z.string().min(1, 'Address is required').max(300, 'Address is too long'),
    purchasePrice: z.number().min(0, 'Purchase price cannot be negative').max(100000000, 'Purchase price is too high'),
    currentValue: z.number().min(0, 'Current value cannot be negative').max(100000000, 'Current value is too high'),
    loanAmount: z.number().min(0, 'Loan amount cannot be negative').max(100000000, 'Loan amount is too high'),
    interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
    loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
    weeklyRent: z.number().min(0, 'Weekly rent cannot be negative').max(100000, 'Weekly rent is too high'),
    annualExpenses: z.number().min(0, 'Annual expenses cannot be negative').max(1000000, 'Annual expenses are too high'),
    linkedAssetId: z.string().optional(),
    linkedLiabilityId: z.string().optional(),
  })).optional(),
  
  // Projections
  currentAge: z.number().int().min(0, 'Age cannot be negative').max(120, 'Age is too high').optional(),
  retirementAge: z.number().int().min(0, 'Retirement age cannot be negative').max(120, 'Retirement age is too high').optional(),
  currentSuper: z.number().min(0, 'Current super cannot be negative').max(10000000, 'Current super is too high').optional(),
  currentSavings: z.number().min(0, 'Current savings cannot be negative').max(10000000, 'Current savings are too high').optional(),
  currentShares: z.number().min(0, 'Current shares cannot be negative').max(10000000, 'Current shares are too high').optional(),
  propertyEquity: z.number().min(0, 'Property equity cannot be negative').max(10000000, 'Property equity is too high').optional(),
  monthlyDebtPayments: z.number().min(0, 'Monthly debt payments cannot be negative').max(1000000, 'Monthly debt payments are too high').optional(),
  monthlyRentalIncome: z.number().min(0, 'Monthly rental income cannot be negative').max(1000000, 'Monthly rental income is too high').optional(),
  monthlyExpenses: z.number().min(0, 'Monthly expenses cannot be negative').max(1000000, 'Monthly expenses are too high').optional(),
  
  // Projection Assumptions
  inflationRate: z.number().min(0, 'Inflation rate cannot be negative').max(50, 'Inflation rate cannot exceed 50%').optional(),
  salaryGrowthRate: z.number().min(0, 'Salary growth rate cannot be negative').max(50, 'Salary growth rate cannot exceed 50%').optional(),
  superReturn: z.number().min(0, 'Super return cannot be negative').max(50, 'Super return cannot exceed 50%').optional(),
  shareReturn: z.number().min(0, 'Share return cannot be negative').max(50, 'Share return cannot exceed 50%').optional(),
  propertyGrowthRate: z.number().min(0, 'Property growth rate cannot be negative').max(50, 'Property growth rate cannot exceed 50%').optional(),
  withdrawalRate: z.number().min(0, 'Withdrawal rate cannot be negative').max(50, 'Withdrawal rate cannot exceed 50%').optional(),
  rentGrowthRate: z.number().min(0, 'Rent growth rate cannot be negative').max(50, 'Rent growth rate cannot exceed 50%').optional(),
  savingsRate: z.number().min(0, 'Savings rate cannot be negative').max(100, 'Savings rate cannot exceed 100%').optional(),
  
  // Projection Results (stored from Projections page for Summary page consistency)
  projectionResults: z.object({
    yearsToRetirement: z.number(),
    projectedLumpSum: z.number(),
    projectedPassiveIncome: z.number(),
    projectedMonthlyPassiveIncome: z.number(),
    requiredIncome: z.number(),
    monthlyDeficitSurplus: z.number(),
    isDeficit: z.boolean(),
    calculatedAt: z.string(),
  }).optional(),
  
  // Tax Optimization Results (stored from Tax Optimization page for Summary page consistency)
  taxOptimizationResults: z.object({
    currentTax: z.number(),
    optimizedTax: z.number(),
    taxSavings: z.number(),
    annualIncome: z.number(),
    taxableIncome: z.number(),
    totalDeductions: z.number(),
    marginalTaxRate: z.number(),
    averageTaxRate: z.number(),
    calculatedAt: z.string(),
  }).optional(),
  
  // Tax Optimization
  employmentIncome: z.number().min(0, 'Employment income cannot be negative').max(10000000, 'Employment income is too high').optional(),
  investmentIncome: z.number().min(0, 'Investment income cannot be negative').max(10000000, 'Investment income is too high').optional(),
  workRelatedExpenses: z.number().min(0, 'Work related expenses cannot be negative').max(1000000, 'Work related expenses are too high').optional(),
  vehicleExpenses: z.number().min(0, 'Vehicle expenses cannot be negative').max(1000000, 'Vehicle expenses are too high').optional(),
  uniformsAndLaundry: z.number().min(0, 'Uniforms and laundry cannot be negative').max(100000, 'Uniforms and laundry are too high').optional(),
  homeOfficeExpenses: z.number().min(0, 'Home office expenses cannot be negative').max(100000, 'Home office expenses are too high').optional(),
  selfEducationExpenses: z.number().min(0, 'Self education expenses cannot be negative').max(100000, 'Self education expenses are too high').optional(),
  investmentExpenses: z.number().min(0, 'Investment expenses cannot be negative').max(1000000, 'Investment expenses are too high').optional(),
  charityDonations: z.number().min(0, 'Charity donations cannot be negative').max(1000000, 'Charity donations are too high').optional(),
  accountingFees: z.number().min(0, 'Accounting fees cannot be negative').max(100000, 'Accounting fees are too high').optional(),
  rentalExpenses: z.number().min(0, 'Rental expenses cannot be negative').max(1000000, 'Rental expenses are too high').optional(),
  superContributions: z.number().min(0, 'Super contributions cannot be negative').max(1000000, 'Super contributions are too high').optional(),
  healthInsurance: z.boolean().optional(),
  hecs: z.boolean().optional(),
  helpDebt: z.number().min(0, 'HELP debt cannot be negative').max(1000000, 'HELP debt is too high').optional(),
  hecsBalance: z.number().min(0, 'HECS balance cannot be negative').max(1000000, 'HECS balance is too high').optional(),
  privateHealthInsurance: z.boolean().optional(),
});

export type ClientValidationData = z.infer<typeof clientValidationSchema>;


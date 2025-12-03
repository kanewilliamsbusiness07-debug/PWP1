# Comprehensive Field Audit
## Complete Inventory of All Input Fields Across the Project

**Generated:** 2025-12-03  
**Purpose:** Identify semantically identical fields with different names for unification

---

## Field Inventory Table

| Page/Component | Field Name | Field Type | Label Text | Purpose | Current Data Type | Notes |
|----------------|------------|------------|------------|---------|-------------------|-------|
| **CLIENT INFORMATION PAGE** |
| client-form.tsx | firstName | string | First Name | Personal Info | string | Required |
| client-form.tsx | lastName | string | Last Name | Personal Info | string | Required |
| client-form.tsx | middleName | string | Middle Name | Personal Info | string | Optional |
| client-form.tsx | dob | date | Date of Birth | Personal Info | Date \| null | Maps to dateOfBirth in store |
| client-form.tsx | maritalStatus | enum | Marital Status | Personal Info | 'SINGLE' \| 'MARRIED' \| 'DEFACTO' \| 'DIVORCED' \| 'WIDOWED' | |
| client-form.tsx | numberOfDependants | number | Number of Dependants | Personal Info | number | |
| client-form.tsx | agesOfDependants | string | Ages of Dependants | Personal Info | string | |
| client-form.tsx | email | string | Email | Contact Info | string | Optional |
| client-form.tsx | mobile | string | Mobile | Contact Info | string | ⚠️ Should be phoneNumber |
| client-form.tsx | addressLine1 | string | Address Line 1 | Address | string | |
| client-form.tsx | addressLine2 | string | Address Line 2 | Address | string | |
| client-form.tsx | suburb | string | Suburb | Address | string | |
| client-form.tsx | state | enum | State | Address | 'ACT' \| 'NSW' \| 'NT' \| 'QLD' \| 'SA' \| 'TAS' \| 'VIC' \| 'WA' | |
| client-form.tsx | postcode | string | Postcode | Address | string | |
| client-form.tsx | ownOrRent | enum | Own or Rent | Address | 'OWN' \| 'RENT' | |
| client-form.tsx | grossSalary | number | Gross Salary | Income | number | ⚠️ DUPLICATE - see income fields |
| client-form.tsx | rentalIncome | number | Rental Income | Income | number | |
| client-form.tsx | dividends | number | Dividends | Income | number | |
| client-form.tsx | frankedDividends | number | Franked Dividends | Income | number | |
| client-form.tsx | capitalGains | number | Capital Gains | Income | number | |
| client-form.tsx | otherIncome | number | Other Income | Income | number | |
| client-form.tsx | currentAge | number | Current Age | Projections | number | |
| client-form.tsx | retirementAge | number | Retirement Age | Projections | number | |
| client-form.tsx | currentSuper | number | Current Super | Assets | number | |
| client-form.tsx | currentSavings | number | Current Savings | Assets | number | |
| client-form.tsx | currentShares | number | Current Shares | Assets | number | |
| client-form.tsx | propertyEquity | number | Property Equity | Assets | number | |
| client-form.tsx | monthlyDebtPayments | number | Monthly Debt Payments | Liabilities | number | |
| client-form.tsx | monthlyRentalIncome | number | Monthly Rental Income | Income | number | |
| client-form.tsx | inflationRate | number | Inflation Rate | Assumptions | number | Percentage |
| client-form.tsx | salaryGrowthRate | number | Salary Growth Rate | Assumptions | number | Percentage |
| client-form.tsx | superReturn | number | Super Return | Assumptions | number | Percentage |
| client-form.tsx | shareReturn | number | Share Return | Assumptions | number | Percentage |
| client-form.tsx | propertyGrowthRate | number | Property Growth Rate | Assumptions | number | Percentage |
| client-form.tsx | withdrawalRate | number | Withdrawal Rate | Assumptions | number | Percentage |
| client-form.tsx | rentGrowthRate | number | Rent Growth Rate | Assumptions | number | Percentage |
| client-form.tsx | employmentIncome | number | Employment Income | Income | number | ⚠️ DUPLICATE - see income fields |
| client-form.tsx | investmentIncome | number | Investment Income | Income | number | |
| client-form.tsx | workRelatedExpenses | number | Work Related Expenses | Deductions | number | |
| client-form.tsx | vehicleExpenses | number | Vehicle Expenses | Deductions | number | |
| client-form.tsx | uniformsAndLaundry | number | Uniforms and Laundry | Deductions | number | |
| client-form.tsx | homeOfficeExpenses | number | Home Office Expenses | Deductions | number | |
| client-form.tsx | selfEducationExpenses | number | Self Education Expenses | Deductions | number | |
| client-form.tsx | investmentExpenses | number | Investment Expenses | Deductions | number | |
| client-form.tsx | charityDonations | number | Charity Donations | Deductions | number | |
| client-form.tsx | accountingFees | number | Accounting Fees | Deductions | number | |
| client-form.tsx | rentalExpenses | number | Rental Expenses | Deductions | number | |
| client-form.tsx | superContributions | number | Super Contributions | Deductions | number | |
| client-form.tsx | helpDebt | number | HELP Debt | Deductions | number | |
| client-form.tsx | hecsBalance | number | HECS Balance | Deductions | number | |
| client-form.tsx | healthInsurance | boolean | Health Insurance | Deductions | boolean | |
| client-form.tsx | hecs | boolean | HECS | Deductions | boolean | |
| client-form.tsx | privateHealthInsurance | boolean | Private Health Insurance | Deductions | boolean | |
| **FINANCIAL POSITION PAGE** |
| financial-position/page.tsx | grossSalary | number | Gross Salary | Income | number | ⚠️ DUPLICATE - see income fields |
| financial-position/page.tsx | rentalIncome | number | Rental Income | Income | number | |
| financial-position/page.tsx | dividends | number | Dividends | Income | number | |
| financial-position/page.tsx | frankedDividends | number | Franked Dividends | Income | number | |
| financial-position/page.tsx | capitalGains | number | Capital Gains | Income | number | |
| financial-position/page.tsx | otherIncome | number | Other Income | Income | number | |
| **TAX OPTIMIZATION PAGE** |
| tax-optimization/page.tsx | grossIncome | number | Gross Income | Income | number | ⚠️ DUPLICATE - see income fields |
| tax-optimization/page.tsx | employmentIncome | number | Employment Income | Income | number | ⚠️ DUPLICATE - see income fields |
| tax-optimization/page.tsx | investmentIncome | number | Investment Income | Income | number | |
| tax-optimization/page.tsx | rentalIncome | number | Rental Income | Income | number | |
| tax-optimization/page.tsx | otherIncome | number | Other Income | Income | number | |
| tax-optimization/page.tsx | frankedDividends | number | Franked Dividends | Income | number | |
| tax-optimization/page.tsx | capitalGains | number | Capital Gains | Income | number | |
| tax-optimization/page.tsx | workRelatedExpenses | number | Work Related Expenses | Deductions | number | |
| tax-optimization/page.tsx | vehicleExpenses | number | Vehicle Expenses | Deductions | number | |
| tax-optimization/page.tsx | uniformsAndLaundry | number | Uniforms and Laundry | Deductions | number | |
| tax-optimization/page.tsx | homeOfficeExpenses | number | Home Office Expenses | Deductions | number | |
| tax-optimization/page.tsx | selfEducationExpenses | number | Self Education Expenses | Deductions | number | |
| tax-optimization/page.tsx | investmentExpenses | number | Investment Expenses | Deductions | number | |
| tax-optimization/page.tsx | charityDonations | number | Charity Donations | Deductions | number | |
| tax-optimization/page.tsx | accountingFees | number | Accounting Fees | Deductions | number | |
| tax-optimization/page.tsx | otherDeductions | number | Other Deductions | Deductions | number | |
| tax-optimization/page.tsx | rentalExpenses | number | Rental Expenses | Deductions | number | |
| tax-optimization/page.tsx | superContributions | number | Super Contributions | Deductions | number | |
| tax-optimization/page.tsx | healthInsurance | boolean | Health Insurance | Deductions | boolean | |
| tax-optimization/page.tsx | hecs | boolean | HECS | Deductions | boolean | |
| tax-optimization/page.tsx | helpDebt | number | HELP Debt | Deductions | number | |
| tax-optimization/page.tsx | hecsBalance | number | HECS Balance | Deductions | number | |
| tax-optimization/page.tsx | privateHealthInsurance | boolean | Private Health Insurance | Deductions | boolean | |
| **PROJECTIONS PAGE** |
| projections/page.tsx | currentAge | number | Current Age | Projections | number | |
| projections/page.tsx | retirementAge | number | Retirement Age | Projections | number | |
| projections/page.tsx | currentSalary | number | Current Salary | Income | number | ⚠️ DUPLICATE - see income fields |
| projections/page.tsx | currentSuper | number | Current Super | Assets | number | |
| projections/page.tsx | currentSavings | number | Current Savings | Assets | number | |
| projections/page.tsx | currentShares | number | Current Shares | Assets | number | |
| projections/page.tsx | propertyEquity | number | Property Equity | Assets | number | |
| projections/page.tsx | monthlyDebtPayments | number | Monthly Debt Payments | Liabilities | number | |
| projections/page.tsx | monthlyRentalIncome | number | Monthly Rental Income | Income | number | |
| projections/page.tsx | inflationRate | number | Inflation Rate | Assumptions | number | Percentage |
| projections/page.tsx | salaryGrowthRate | number | Salary Growth Rate | Assumptions | number | Percentage |
| projections/page.tsx | superReturn | number | Super Return | Assumptions | number | Percentage |
| projections/page.tsx | shareReturn | number | Share Return | Assumptions | number | Percentage |
| projections/page.tsx | propertyGrowthRate | number | Property Growth Rate | Assumptions | number | Percentage |
| projections/page.tsx | withdrawalRate | number | Withdrawal Rate | Assumptions | number | Percentage |
| projections/page.tsx | rentGrowthRate | number | Rent Growth Rate | Assumptions | number | Percentage |
| **INVESTMENT PROPERTIES PAGE** |
| investment-properties/page.tsx | address | string | Property Address | Property Info | string | |
| investment-properties/page.tsx | purchasePrice | number | Purchase Price | Property Info | number | |
| investment-properties/page.tsx | currentValue | number | Current Value | Property Info | number | |
| investment-properties/page.tsx | loanAmount | number | Loan Amount | Property Info | number | |
| investment-properties/page.tsx | interestRate | number | Interest Rate | Property Info | number | Percentage |
| investment-properties/page.tsx | loanTerm | number | Loan Term (years) | Property Info | number | |
| investment-properties/page.tsx | weeklyRent | number | Weekly Rent | Property Info | number | |
| investment-properties/page.tsx | annualExpenses | number | Annual Expenses | Property Info | number | |
| investment-properties/page.tsx | grossIncome | number | Gross Annual Income | Serviceability | number | ⚠️ DUPLICATE - see income fields |
| investment-properties/page.tsx | monthlyExpenses | number | Monthly Expenses | Serviceability | number | |
| investment-properties/page.tsx | existingDebtPayments | number | Existing Monthly Debt Payments | Serviceability | number | |
| investment-properties/page.tsx | targetPropertyPrice | number | Target Property Price | Serviceability | number | |
| investment-properties/page.tsx | deposit | number | Available Deposit | Serviceability | number | |
| investment-properties/page.tsx | expectedRent | number | Expected Weekly Rent | Serviceability | number | |
| investment-properties/page.tsx | annualPropertyExpenses | number | Annual Property Expenses | Serviceability | number | |
| investment-properties/page.tsx | depreciationAmount | number | Annual Depreciation | Serviceability | number | |
| investment-properties/page.tsx | marginalTaxRate | number | Marginal Tax Rate | Serviceability | number | Percentage |
| **SUMMARY PAGE** |
| summary/page.tsx | recipientEmail | string | Recipient Email | Export | string | |
| summary/page.tsx | subject | string | Subject | Export | string | |
| summary/page.tsx | message | string | Message | Export | string | |
| **AUTH PAGES** |
| auth/login/page.tsx | email | string | Email | Login | string | |
| auth/login/page.tsx | password | string | Password | Login | string | |
| auth/forgot-password/page.tsx | email | string | Email | Password Reset | string | |

---

## Critical Duplicate Field Groups Identified

### 🔴 INCOME FIELDS (HIGH PRIORITY)
**Problem:** Same data collected under 4 different names:
- `grossSalary` (client-form.tsx, financial-position/page.tsx)
- `grossIncome` (tax-optimization/page.tsx, investment-properties/page.tsx, store.ts)
- `employmentIncome` (client-form.tsx, tax-optimization/page.tsx, store.ts)
- `currentSalary` (projections/page.tsx)

**Impact:** Data doesn't sync properly between pages. User enters salary in one page, it doesn't appear in another.

**Unified Name:** `annualIncome` (already exists in database schema)

---

### 🟡 CONTACT FIELDS (MEDIUM PRIORITY)
**Problem:** Phone number field uses inconsistent naming:
- `mobile` (client-form.tsx, store.ts)

**Unified Name:** `phoneNumber` (more descriptive and standard)

---

### 🟢 DATE FIELDS (LOW PRIORITY - Already Handled)
**Status:** Already mapped correctly
- `dob` (form field) → `dateOfBirth` (store/database)
- Mapping exists in client-form.tsx line 194

---

## Store/Database Field Mapping

### Zustand Store (lib/store/store.ts)
- `grossIncome` - canonical field in FinancialFields
- `employmentIncome` - separate field (should be unified)
- `grossSalary` - in ClientData interface (should be unified)

### Database Schema (prisma/schema.prisma)
- `annualIncome` - canonical field
- `grossSalary` - synonym field
- `employmentIncome` - synonym field  
- `grossIncome` - synonym field

**Note:** Database already has synonym support, but application code doesn't consistently use canonical names.

---

## Field Usage Statistics

| Field Name | Occurrences | Pages | Status |
|------------|-------------|-------|--------|
| grossSalary | 8 | 3 | ⚠️ Needs unification |
| grossIncome | 25 | 4 | ⚠️ Needs unification |
| employmentIncome | 12 | 3 | ⚠️ Needs unification |
| currentSalary | 3 | 1 | ⚠️ Needs unification |
| mobile | 5 | 1 | ⚠️ Should be phoneNumber |
| dob | 4 | 1 | ✅ Mapped to dateOfBirth |
| dateOfBirth | 6 | 2 | ✅ Canonical |

---

## Recommendations

1. **IMMEDIATE:** Unify all income fields to `annualIncome`
2. **HIGH:** Rename `mobile` to `phoneNumber` for consistency
3. **MEDIUM:** Review all percentage fields to ensure consistent naming
4. **LOW:** Consider standardizing boolean field prefixes (is/has/should)

---

## Next Steps

1. Create FIELD_MAPPING.js with old → new mappings
2. Create NAMING_CONVENTIONS.md with project standards
3. Systematically replace field names across codebase
4. Update validation schemas
5. Update store mappings
6. Test data flow between pages


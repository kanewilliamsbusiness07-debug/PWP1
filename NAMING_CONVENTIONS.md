# Project Naming Conventions
## Standard Field Names and Naming Rules

**Last Updated:** 2025-12-03  
**Purpose:** Establish project-wide naming standards to prevent field name inconsistencies

---

## Core Naming Rules

1. **Use camelCase** for all field names
2. **Be descriptive but concise** - avoid abbreviations unless universally understood
3. **Use consistent prefixes** for related fields
4. **Boolean fields** start with `is`, `has`, or `should`
5. **Array fields** use plural nouns
6. **Date fields** use descriptive names ending in `Date` or `Time`

---

## Standard Field Names (Use These Exclusively)

### Personal Information

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `firstName` | string | Yes | First/given name |
| `lastName` | string | Yes | Last/family name |
| `middleName` | string | No | Middle name |
| `dateOfBirth` | Date | No | Date of birth (not `dob`) |
| `maritalStatus` | enum | No | 'SINGLE', 'MARRIED', 'DEFACTO', 'DIVORCED', 'WIDOWED' |
| `numberOfDependants` | number | No | Number of dependants |
| `agesOfDependants` | string | No | Comma-separated ages |

### Contact Information

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `email` | string | No | Email address |
| `phoneNumber` | string | No | Phone number (not `mobile` or `phone`) |
| `addressLine1` | string | No | Street address line 1 |
| `addressLine2` | string | No | Street address line 2 |
| `suburb` | string | No | Suburb/city |
| `state` | enum | No | Australian state: 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA' |
| `postcode` | string | No | Postcode (4 digits) |
| `country` | string | No | Country (default: 'Australia') |

### Financial Information - Income

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `annualIncome` | number | No | **CANONICAL** - Annual gross income (not `grossSalary`, `grossIncome`, `employmentIncome`, `currentSalary`) |
| `rentalIncome` | number | No | Annual rental income |
| `dividends` | number | No | Annual dividends (unfranked) |
| `frankedDividends` | number | No | Annual franked dividends |
| `capitalGains` | number | No | Annual capital gains |
| `otherIncome` | number | No | Other annual income |
| `investmentIncome` | number | No | Total investment income (calculated: dividends + frankedDividends) |
| `monthlyRentalIncome` | number | No | Monthly rental income (calculated from annual) |

### Financial Information - Assets

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `currentSuper` | number | No | Current superannuation balance |
| `currentSavings` | number | No | Current cash savings |
| `currentShares` | number | No | Current share portfolio value |
| `propertyEquity` | number | No | Total property equity |
| `assets` | array | No | Array of asset objects |

### Financial Information - Liabilities

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `totalDebt` | number | No | Total debt (calculated from liabilities) |
| `monthlyDebtPayments` | number | No | Total monthly debt payments |
| `liabilities` | array | No | Array of liability objects |

### Financial Information - Deductions

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `workRelatedExpenses` | number | No | Work-related expenses |
| `vehicleExpenses` | number | No | Vehicle expenses |
| `uniformsAndLaundry` | number | No | Uniforms and laundry expenses |
| `homeOfficeExpenses` | number | No | Home office expenses |
| `selfEducationExpenses` | number | No | Self-education expenses |
| `investmentExpenses` | number | No | Investment-related expenses |
| `charityDonations` | number | No | Charity donations |
| `accountingFees` | number | No | Accounting fees |
| `rentalExpenses` | number | No | Rental property expenses |
| `superContributions` | number | No | Superannuation contributions |
| `otherDeductions` | number | No | Other deductions |

### Financial Information - Tax

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `healthInsurance` | boolean | No | Has private health insurance |
| `hecs` | boolean | No | Has HECS debt |
| `helpDebt` | number | No | HELP debt amount |
| `hecsBalance` | number | No | HECS balance |
| `privateHealthInsurance` | boolean | No | Has private health insurance |

### Projections

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `currentAge` | number | No | Current age |
| `retirementAge` | number | No | Target retirement age |
| `inflationRate` | number | No | Assumed inflation rate (%) |
| `salaryGrowthRate` | number | No | Assumed salary growth rate (%) |
| `superReturn` | number | No | Assumed super return rate (%) |
| `shareReturn` | number | No | Assumed share return rate (%) |
| `propertyGrowthRate` | number | No | Assumed property growth rate (%) |
| `withdrawalRate` | number | No | Assumed withdrawal rate (%) |
| `rentGrowthRate` | number | No | Assumed rent growth rate (%) |

### Investment Properties

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `address` | string | No | Property address |
| `purchasePrice` | number | No | Purchase price |
| `currentValue` | number | No | Current property value |
| `loanAmount` | number | No | Loan amount |
| `interestRate` | number | No | Interest rate (%) |
| `loanTerm` | number | No | Loan term (years) |
| `weeklyRent` | number | No | Weekly rent |
| `annualExpenses` | number | No | Annual property expenses |
| `properties` | array | No | Array of property objects |

---

## Field Name Patterns

### Income Fields
- ✅ `annualIncome` - Use for primary employment income
- ❌ `grossSalary`, `grossIncome`, `employmentIncome`, `currentSalary` - DEPRECATED

### Contact Fields
- ✅ `phoneNumber` - Use for phone numbers
- ❌ `mobile`, `phone`, `contact_phone` - DEPRECATED

### Date Fields
- ✅ `dateOfBirth` - Use for dates of birth
- ❌ `dob`, `birthDate` - DEPRECATED (except `dob` in forms, mapped to `dateOfBirth`)

### Percentage Fields
- Pattern: `[name]Rate` or `[name]Return`
- Examples: `inflationRate`, `salaryGrowthRate`, `superReturn`

### Boolean Fields
- Pattern: `is[Name]`, `has[Name]`, or descriptive name
- Examples: `healthInsurance`, `hecs`, `privateHealthInsurance`

### Array Fields
- Pattern: Plural noun
- Examples: `assets`, `liabilities`, `properties`

---

## Migration Guidelines

When renaming fields:

1. **Update the field name** in all forms
2. **Update validation schemas** (Zod/Yup)
3. **Update store/state** definitions
4. **Update API payloads** (if applicable)
5. **Update database mappings** (if applicable)
6. **Update localStorage keys** (if applicable)
7. **Run migration script** for existing data
8. **Test data flow** between pages

---

## Examples

### ✅ Correct Usage

```typescript
// Form field
<Input name="annualIncome" />

// State
const [annualIncome, setAnnualIncome] = useState(0);

// Validation
annualIncome: z.number().min(0)

// Store
grossIncome: annualIncome  // Store uses grossIncome internally but accepts annualIncome
```

### ❌ Incorrect Usage

```typescript
// DON'T use these
<Input name="grossSalary" />
<Input name="grossIncome" />
<Input name="employmentIncome" />
<Input name="currentSalary" />
```

---

## Enforcement

- **Linting:** Add ESLint rules to catch deprecated field names
- **TypeScript:** Use strict types to prevent incorrect field names
- **Code Review:** Check for deprecated field names in PRs
- **Documentation:** Keep this document updated with any new fields

---

## Questions?

If you're unsure about a field name:
1. Check this document first
2. Check FIELD_MAPPING.js for canonical names
3. Check existing codebase for similar fields
4. Follow the naming patterns above
5. When in doubt, be descriptive and consistent


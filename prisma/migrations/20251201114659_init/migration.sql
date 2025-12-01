-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADVISOR',
    "isMasterAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "numberOfDependants" INTEGER NOT NULL DEFAULT 0,
    "agesOfDependants" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "ownOrRent" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "annualIncome" DOUBLE PRECISION,
    "grossSalary" DOUBLE PRECISION,
    "employmentIncome" DOUBLE PRECISION,
    "grossIncome" DOUBLE PRECISION,
    "homePrice" DOUBLE PRECISION,
    "homeYear" INTEGER,
    "homeValue" DOUBLE PRECISION,
    "investment1Price" DOUBLE PRECISION,
    "investment1Year" INTEGER,
    "investment1Value" DOUBLE PRECISION,
    "investment2Price" DOUBLE PRECISION,
    "investment2Year" INTEGER,
    "investment2Value" DOUBLE PRECISION,
    "investment3Price" DOUBLE PRECISION,
    "investment3Year" INTEGER,
    "investment3Value" DOUBLE PRECISION,
    "investment4Price" DOUBLE PRECISION,
    "investment4Year" INTEGER,
    "investment4Value" DOUBLE PRECISION,
    "homeFunder" TEXT,
    "homeBalance" DOUBLE PRECISION,
    "homeRate" DOUBLE PRECISION,
    "homeRepayment" DOUBLE PRECISION,
    "investment1Funder" TEXT,
    "investment1Balance" DOUBLE PRECISION,
    "investment1Rate" DOUBLE PRECISION,
    "investment1Repayment" DOUBLE PRECISION,
    "investment2Funder" TEXT,
    "investment2Balance" DOUBLE PRECISION,
    "investment2Rate" DOUBLE PRECISION,
    "investment2Repayment" DOUBLE PRECISION,
    "investment3Funder" TEXT,
    "investment3Balance" DOUBLE PRECISION,
    "investment3Rate" DOUBLE PRECISION,
    "investment3Repayment" DOUBLE PRECISION,
    "investment4Funder" TEXT,
    "investment4Balance" DOUBLE PRECISION,
    "investment4Rate" DOUBLE PRECISION,
    "investment4Repayment" DOUBLE PRECISION,
    "vehicleType" TEXT,
    "vehicleYear" INTEGER,
    "vehicleValue" DOUBLE PRECISION,
    "savingsValue" DOUBLE PRECISION,
    "homeContentsValue" DOUBLE PRECISION,
    "superFundValue" DOUBLE PRECISION,
    "superFundTime" INTEGER,
    "sharesValue" DOUBLE PRECISION,
    "sharesTotalValue" DOUBLE PRECISION,
    "creditCardLimit" DOUBLE PRECISION,
    "creditCardBalance" DOUBLE PRECISION,
    "personalLoanRepayment" DOUBLE PRECISION,
    "personalLoanBalance" DOUBLE PRECISION,
    "hecsRepayment" DOUBLE PRECISION,
    "hecsBalance" DOUBLE PRECISION,
    "rentalIncome" DOUBLE PRECISION,
    "dividends" DOUBLE PRECISION,
    "frankedDividends" DOUBLE PRECISION,
    "capitalGains" DOUBLE PRECISION,
    "otherIncome" DOUBLE PRECISION,
    "investmentIncome" DOUBLE PRECISION,
    "monthlyRentalIncome" DOUBLE PRECISION,
    "currentAge" INTEGER,
    "retirementAge" INTEGER,
    "currentSuper" DOUBLE PRECISION,
    "currentSavings" DOUBLE PRECISION,
    "currentShares" DOUBLE PRECISION,
    "propertyEquity" DOUBLE PRECISION,
    "monthlyDebtPayments" DOUBLE PRECISION,
    "workRelatedExpenses" DOUBLE PRECISION,
    "vehicleExpenses" DOUBLE PRECISION,
    "uniformsAndLaundry" DOUBLE PRECISION,
    "homeOfficeExpenses" DOUBLE PRECISION,
    "selfEducationExpenses" DOUBLE PRECISION,
    "investmentExpenses" DOUBLE PRECISION,
    "charityDonations" DOUBLE PRECISION,
    "accountingFees" DOUBLE PRECISION,
    "rentalExpenses" DOUBLE PRECISION,
    "superContributions" DOUBLE PRECISION,
    "healthInsurance" BOOLEAN,
    "hecs" BOOLEAN,
    "helpDebt" DOUBLE PRECISION,
    "privateHealthInsurance" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "encryptedPassword" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentClientAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentClientAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mergeFields" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isLinked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldMapping" (
    "id" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "canonicalField" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailIntegration_userId_key" ON "EmailIntegration"("userId");

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_startDateTime_idx" ON "Appointment"("startDateTime");

-- CreateIndex
CREATE INDEX "RecentClientAccess_userId_accessedAt_idx" ON "RecentClientAccess"("userId", "accessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecentClientAccess_userId_clientId_key" ON "RecentClientAccess"("userId", "clientId");

-- CreateIndex
CREATE INDEX "EmailTemplate_userId_idx" ON "EmailTemplate"("userId");

-- CreateIndex
CREATE INDEX "InboundEmail_userId_idx" ON "InboundEmail"("userId");

-- CreateIndex
CREATE INDEX "InboundEmail_clientId_idx" ON "InboundEmail"("clientId");

-- CreateIndex
CREATE INDEX "InboundEmail_fromEmail_idx" ON "InboundEmail"("fromEmail");

-- CreateIndex
CREATE INDEX "InboundEmail_receivedAt_idx" ON "InboundEmail"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FieldMapping_synonym_key" ON "FieldMapping"("synonym");

-- CreateIndex
CREATE INDEX "FieldMapping_canonicalField_idx" ON "FieldMapping"("canonicalField");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailIntegration" ADD CONSTRAINT "EmailIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentClientAccess" ADD CONSTRAINT "RecentClientAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentClientAccess" ADD CONSTRAINT "RecentClientAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

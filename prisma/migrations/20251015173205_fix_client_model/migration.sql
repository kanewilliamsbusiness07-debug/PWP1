-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("addressLine1", "addressLine2", "agesOfDependants", "createdAt", "dob", "email", "firstName", "id", "isDraft", "lastName", "maritalStatus", "middleName", "mobile", "numberOfDependants", "ownOrRent", "postcode", "state", "suburb", "updatedAt", "userId") SELECT "addressLine1", "addressLine2", "agesOfDependants", "createdAt", "dob", "email", "firstName", "id", "isDraft", "lastName", "maritalStatus", "middleName", "mobile", "numberOfDependants", "ownOrRent", "postcode", "state", "suburb", "updatedAt", "userId" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_userId_idx" ON "Client"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

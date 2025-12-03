/**
 * Legacy Data Migration Utility
 * 
 * Migrates data objects from old field names to canonical field names
 */

import { FIELD_UNIFICATION_MAP } from '../../FIELD_MAPPING';

/**
 * Migrate a single data object from legacy field names to canonical names
 * @param oldData - Data object with potentially legacy field names
 * @returns Data object with canonical field names
 */
export function migrateLegacyData<T extends Record<string, any>>(oldData: T): T {
  if (!oldData || typeof oldData !== 'object' || Array.isArray(oldData)) {
    return oldData;
  }
  
  const migratedData = {} as T;
  
  for (const [key, value] of Object.entries(oldData)) {
    const canonicalKey = FIELD_UNIFICATION_MAP[key as keyof typeof FIELD_UNIFICATION_MAP] || key;
    
    // Handle multiple old fields mapping to same canonical field
    if (migratedData[canonicalKey as keyof T] !== undefined) {
      // Use the non-zero/non-empty value, preferring the most recent
      const existingValue = migratedData[canonicalKey as keyof T];
      
      if (value !== null && value !== undefined) {
        // For numbers, prefer non-zero values
        if (typeof value === 'number' && value !== 0) {
          if (typeof existingValue === 'number' && existingValue === 0) {
            migratedData[canonicalKey as keyof T] = value as T[keyof T];
          } else {
            // Use the larger value
            migratedData[canonicalKey as keyof T] = (Math.max(existingValue as number, value) as T[keyof T]);
          }
        } else if (typeof value === 'string' && value.trim() !== '') {
          if (typeof existingValue === 'string' && existingValue.trim() === '') {
            migratedData[canonicalKey as keyof T] = value as T[keyof T];
          }
        } else {
          // Use the new value
          migratedData[canonicalKey as keyof T] = value as T[keyof T];
        }
      }
    } else {
      migratedData[canonicalKey as keyof T] = value as T[keyof T];
    }
  }
  
  return migratedData;
}

/**
 * Migrate localStorage data on app initialization
 * Call this once when the app loads
 */
export function migrateLocalStorageData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storageKeys = [
      'fincalc-client-data',
      'fincalc-financial-store',
      'clientData',
      'financialData',
    ];
    
    for (const key of storageKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const migrated = migrateLegacyData(data);
          localStorage.setItem(key, JSON.stringify(migrated));
        } catch (e) {
          console.warn(`Failed to migrate localStorage key: ${key}`, e);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to migrate localStorage data', e);
  }
}

/**
 * Check if data needs migration
 */
export function needsMigration(data: Record<string, any>): boolean {
  if (!data || typeof data !== 'object') return false;
  
  return Object.keys(data).some(key => key in FIELD_UNIFICATION_MAP);
}


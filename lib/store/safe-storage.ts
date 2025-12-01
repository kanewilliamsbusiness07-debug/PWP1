import { StateStorage } from 'zustand/middleware';

export class SafeLocalStorage implements StateStorage {
  private maxRetries = 3;

  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch (err) {
      console.warn('Error reading from localStorage:', err);
      return null;
    }
  }

  setItem(name: string, value: string): void {
    let retries = 0;
    
    const trySet = () => {
      try {
        // Try to set the item
        localStorage.setItem(name, value);
      } catch (err) {
        // If we hit quota, clear old data and try again
        if (err instanceof Error && ((err as any).name === 'QuotaExceededError' || (err as any).code === 22)) {
          if (retries < this.maxRetries) {
            retries++;
            this.clearOldData();
            trySet(); // Recursive retry
          } else {
            console.error('Failed to save data after clearing storage:', err);
          }
        } else {
          console.error('Error saving to localStorage:', err);
        }
      }
    };

    trySet();
  }

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.warn('Error removing item from localStorage:', err);
    }
  }

  private clearOldData(): void {
    try {
      // Keep only essential data, remove others
      const keysToKeep = ['financial-data-storage'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // If still no space, try to remove old versions of the data
      if (localStorage.length > 0) {
        localStorage.clear();
      }
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }
}
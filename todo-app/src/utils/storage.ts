import { AppDataSchema, type AppData } from './validation';

const STORAGE_KEY = 'todo-app-data';
const BACKUP_KEY = 'todo-app-data-backup';

/**
 * Storage utility for atomic writes and corruption handling
 */

/**
 * Atomically write data to localStorage with backup
 * @throws {DOMException} If quota exceeded
 */
export async function atomicWrite(data: AppData): Promise<void> {
  try {
    const serialized = JSON.stringify(data);

    // Validate before writing
    const validationResult = AppDataSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error('Invalid data structure');
    }

    // Step 1: Save backup of current data
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (currentData) {
      localStorage.setItem(BACKUP_KEY, currentData);
    }

    // Step 2: Write new data
    localStorage.setItem(STORAGE_KEY, serialized);

    // Step 3: Verify write succeeded
    const written = localStorage.getItem(STORAGE_KEY);
    if (written !== serialized) {
      throw new Error('Write verification failed');
    }
  } catch (error) {
    // Rollback to backup if write failed
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      localStorage.setItem(STORAGE_KEY, backup);
    }

    // Re-throw to let caller handle
    throw error;
  }
}

/**
 * Read and validate data from localStorage
 * @returns {AppData | null} Parsed data or null if corrupted
 */
export function readStorage(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const validationResult = AppDataSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error('Storage corruption detected:', validationResult.error);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error('Storage read error:', error);
    return null;
  }
}

/**
 * Validate storage integrity without reading full data
 */
export function validateStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return true; // Empty is valid
    }

    const parsed = JSON.parse(raw);
    const validationResult = AppDataSchema.safeParse(parsed);

    return validationResult.success;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageUsage(): {
  used: number;
  quota: number;
  percentage: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const used = raw ? new Blob([raw]).size : 0;

    // Estimate quota (most browsers: 5-10 MB)
    // Try to detect actual quota if available
    const quota = 10 * 1024 * 1024; // 10 MB default

    return {
      used,
      quota,
      percentage: Math.round((used / quota) * 100),
    };
  } catch {
    return {
      used: 0,
      quota: 0,
      percentage: 0,
    };
  }
}

/**
 * Clear all storage data
 */
export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

/**
 * Export raw storage data for recovery
 */
export function exportRawData(): string {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw || '{}';
}

/**
 * Attempt to recover from backup
 */
export function recoverFromBackup(): boolean {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) {
      return false;
    }

    // Validate backup
    const parsed = JSON.parse(backup);
    const validationResult = AppDataSchema.safeParse(parsed);

    if (!validationResult.success) {
      return false;
    }

    // Restore from backup
    localStorage.setItem(STORAGE_KEY, backup);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if storage quota is near limit
 */
export function isStorageNearQuota(threshold: number = 90): boolean {
  const { percentage } = getStorageUsage();
  return percentage >= threshold;
}

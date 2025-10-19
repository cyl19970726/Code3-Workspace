import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AppData } from '../../utils/validation';

// These tests will fail until storage.ts is implemented (TDD Red phase)
describe('Storage Utility - Atomic Writes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('atomicWrite', () => {
    it('should write data to localStorage successfully', async () => {
      // This test will fail - storage utility not implemented yet
      const { atomicWrite } = await import('../../utils/storage');

      const testData: AppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 1,
          oldestTaskDate: '2025-10-10',
          newestTaskDate: '2025-10-10',
        },
        tasks: [
          {
            id: crypto.randomUUID(),
            description: 'Test task',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            date: '2025-10-10',
          },
        ],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first' as const,
        },
      };

      const result = await atomicWrite('todo-app-data', testData);
      expect(result).toBe(true);

      const stored = localStorage.getItem('todo-app-data');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(testData);
    });

    it('should rollback on write failure', async () => {
      const { atomicWrite } = await import('../../utils/storage');

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Quota exceeded');
      });

      const testData: AppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 0,
          oldestTaskDate: null,
          newestTaskDate: null,
        },
        tasks: [],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first' as const,
        },
      };

      const result = await atomicWrite('todo-app-data', testData);
      expect(result).toBe(false);

      // Restore original
      localStorage.setItem = originalSetItem;
    });

    it('should verify write succeeded', async () => {
      const { atomicWrite } = await import('../../utils/storage');

      const testData: AppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 0,
          oldestTaskDate: null,
          newestTaskDate: null,
        },
        tasks: [],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first' as const,
        },
      };

      await atomicWrite('todo-app-data', testData);

      const readBack = localStorage.getItem('todo-app-data');
      expect(readBack).not.toBeNull();

      const parsed = JSON.parse(readBack!);
      expect(parsed).toEqual(testData);
    });
  });

  describe('validateStorage', () => {
    it('should detect valid storage data', async () => {
      const { validateStorage } = await import('../../utils/storage');

      const validData: AppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 0,
          oldestTaskDate: null,
          newestTaskDate: null,
        },
        tasks: [],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first' as const,
        },
      };

      localStorage.setItem('todo-app-data', JSON.stringify(validData));

      const result = validateStorage('todo-app-data');
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.error).toBeNull();
    });

    it('should detect corrupted storage data', async () => {
      const { validateStorage } = await import('../../utils/storage');

      localStorage.setItem('todo-app-data', '{invalid json');

      const result = validateStorage('todo-app-data');
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('should detect missing storage data', async () => {
      const { validateStorage } = await import('../../utils/storage');

      const result = validateStorage('todo-app-data');
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should detect schema validation errors', async () => {
      const { validateStorage } = await import('../../utils/storage');

      const invalidData = {
        metadata: {
          version: '1.0.0',
          // missing required fields
        },
        tasks: 'not an array', // should be array
        preferences: {},
      };

      localStorage.setItem('todo-app-data', JSON.stringify(invalidData));

      const result = validateStorage('todo-app-data');
      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  describe('getStorageUsage', () => {
    it('should calculate storage usage correctly', async () => {
      const { getStorageUsage } = await import('../../utils/storage');

      const testData = { test: 'x'.repeat(1000) };
      localStorage.setItem('test-key', JSON.stringify(testData));

      const usage = getStorageUsage();
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.available).toBeGreaterThan(0);
      expect(usage.percentUsed).toBeGreaterThanOrEqual(0);
      expect(usage.percentUsed).toBeLessThanOrEqual(100);
    });
  });

  describe('quota exceeded handling', () => {
    it('should detect QuotaExceededError', async () => {
      const { atomicWrite } = await import('../../utils/storage');

      // Simulate quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const testData: AppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 0,
          oldestTaskDate: null,
          newestTaskDate: null,
        },
        tasks: [],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first' as const,
        },
      };

      const result = await atomicWrite('todo-app-data', testData);
      expect(result).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });
});

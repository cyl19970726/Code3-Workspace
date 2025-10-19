import { describe, it, expect } from 'vitest';
import {
  TaskSchema,
  UserPreferencesSchema,
  StorageMetadataSchema,
  AppDataSchema,
  validateTaskDescription,
  createInitialAppData,
} from '../../utils/validation';

describe('Validation Utility', () => {
  describe('validateTaskDescription', () => {
    it('should reject empty description', () => {
      expect(validateTaskDescription('')).toBe('Task description cannot be empty');
      expect(validateTaskDescription('   ')).toBe('Task description cannot be empty');
    });

    it('should accept valid description', () => {
      expect(validateTaskDescription('Valid task')).toBeNull();
      expect(validateTaskDescription('Buy groceries')).toBeNull();
    });

    it('should reject description over 500 characters', () => {
      const longDescription = 'x'.repeat(501);
      expect(validateTaskDescription(longDescription)).toBe(
        'Task description must be 500 characters or less'
      );
    });

    it('should accept description at 500 character limit', () => {
      const maxDescription = 'x'.repeat(500);
      expect(validateTaskDescription(maxDescription)).toBeNull();
    });

    it('should trim whitespace before validation', () => {
      expect(validateTaskDescription('  Valid task  ')).toBeNull();
    });
  });

  describe('TaskSchema', () => {
    it('should validate correct task data', () => {
      const validTask = {
        id: crypto.randomUUID(),
        description: 'Test task',
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        date: '2025-10-10',
      };

      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject task with invalid UUID', () => {
      const invalidTask = {
        id: 'not-a-uuid',
        description: 'Test task',
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        date: '2025-10-10',
      };

      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject task with empty description', () => {
      const invalidTask = {
        id: crypto.randomUUID(),
        description: '',
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        date: '2025-10-10',
      };

      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject task with description over 500 chars', () => {
      const invalidTask = {
        id: crypto.randomUUID(),
        description: 'x'.repeat(501),
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        date: '2025-10-10',
      };

      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject task with invalid date format', () => {
      const invalidTask = {
        id: crypto.randomUUID(),
        description: 'Test task',
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        date: '10/10/2025', // Wrong format
      };

      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should accept completed task with timestamp', () => {
      const validTask = {
        id: crypto.randomUUID(),
        description: 'Test task',
        completed: true,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        date: '2025-10-10',
      };

      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });
  });

  describe('UserPreferencesSchema', () => {
    it('should validate correct preferences', () => {
      const validPreferences = {
        lastViewedDate: '2025-10-10',
        sortOrder: 'newest-first' as const,
      };

      const result = UserPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sort order', () => {
      const invalidPreferences = {
        lastViewedDate: '2025-10-10',
        sortOrder: 'invalid-order',
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidPreferences = {
        lastViewedDate: '10/10/2025',
        sortOrder: 'newest-first',
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });
  });

  describe('StorageMetadataSchema', () => {
    it('should validate correct metadata', () => {
      const validMetadata = {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        totalTaskCount: 5,
        oldestTaskDate: '2025-10-01',
        newestTaskDate: '2025-10-10',
      };

      const result = StorageMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should accept null date fields for empty task list', () => {
      const validMetadata = {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        totalTaskCount: 0,
        oldestTaskDate: null,
        newestTaskDate: null,
      };

      const result = StorageMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should reject negative task count', () => {
      const invalidMetadata = {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        totalTaskCount: -1,
        oldestTaskDate: null,
        newestTaskDate: null,
      };

      const result = StorageMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  describe('AppDataSchema', () => {
    it('should validate complete app data', () => {
      const validAppData = {
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

      const result = AppDataSchema.safeParse(validAppData);
      expect(result.success).toBe(true);
    });

    it('should detect corrupted app data', () => {
      const corruptedData = {
        metadata: {
          version: '1.0.0',
          // missing required fields
        },
        tasks: 'not an array',
        preferences: {},
      };

      const result = AppDataSchema.safeParse(corruptedData);
      expect(result.success).toBe(false);
    });

    it('should reject app data with invalid tasks', () => {
      const invalidAppData = {
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 1,
          oldestTaskDate: '2025-10-10',
          newestTaskDate: '2025-10-10',
        },
        tasks: [
          {
            id: 'not-a-uuid',
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

      const result = AppDataSchema.safeParse(invalidAppData);
      expect(result.success).toBe(false);
    });
  });

  describe('createInitialAppData', () => {
    it('should create valid initial app data', () => {
      const initialData = createInitialAppData();

      expect(initialData.metadata.version).toBe('1.0.0');
      expect(initialData.metadata.totalTaskCount).toBe(0);
      expect(initialData.tasks).toEqual([]);
      expect(initialData.preferences.sortOrder).toBe('newest-first');
    });

    it('should set today as lastViewedDate', () => {
      const initialData = createInitialAppData();
      const today = new Date().toISOString().split('T')[0];

      expect(initialData.preferences.lastViewedDate).toBe(today);
    });

    it('should pass AppDataSchema validation', () => {
      const initialData = createInitialAppData();
      const result = AppDataSchema.safeParse(initialData);

      expect(result.success).toBe(true);
    });
  });
});

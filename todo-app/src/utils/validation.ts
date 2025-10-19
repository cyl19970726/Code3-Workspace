import { z } from 'zod';

/**
 * Task entity schema
 * Validates individual todo task data
 */
export const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * User preferences schema
 * Stores UI state preferences
 */
export const UserPreferencesSchema = z.object({
  lastViewedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sortOrder: z.enum(['newest-first', 'oldest-first']),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Storage metadata schema
 * Tracks version and data statistics
 */
export const StorageMetadataSchema = z.object({
  version: z.string(),
  lastModified: z.string().datetime(),
  totalTaskCount: z.number().int().nonnegative(),
  oldestTaskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  newestTaskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export type StorageMetadata = z.infer<typeof StorageMetadataSchema>;

/**
 * Complete app data schema
 * Represents the entire LocalStorage structure
 */
export const AppDataSchema = z.object({
  metadata: StorageMetadataSchema,
  tasks: z.array(TaskSchema),
  preferences: UserPreferencesSchema,
});

export type AppData = z.infer<typeof AppDataSchema>;

/**
 * Daily task list (computed, not persisted)
 */
export interface DailyTaskList {
  date: string;
  tasks: Task[];
  pendingCount: number;
  completedCount: number;
}

/**
 * Validate task description
 * Returns error message if invalid, null if valid
 */
export function validateTaskDescription(description: string): string | null {
  const trimmed = description.trim();

  if (trimmed.length === 0) {
    return 'Task description cannot be empty';
  }

  if (trimmed.length > 500) {
    return 'Task description must be 500 characters or less';
  }

  return null;
}

/**
 * Create initial app data structure
 */
export function createInitialAppData(): AppData {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  return {
    metadata: {
      version: '1.0.0',
      lastModified: now,
      totalTaskCount: 0,
      oldestTaskDate: null,
      newestTaskDate: null,
    },
    tasks: [],
    preferences: {
      lastViewedDate: today,
      sortOrder: 'newest-first',
    },
  };
}

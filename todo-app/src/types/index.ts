/**
 * Type definitions for the Todo application
 */

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string; // ISO timestamp
  completedAt: string | null; // ISO timestamp
  date: string; // YYYY-MM-DD
}

export interface UserPreferences {
  lastViewedDate: string; // YYYY-MM-DD
  sortOrder: 'newest-first' | 'oldest-first';
}

export interface StorageMetadata {
  version: string;
  lastModified: string; // ISO timestamp
  totalTaskCount: number;
  oldestTaskDate: string | null; // YYYY-MM-DD
  newestTaskDate: string | null; // YYYY-MM-DD
}

export interface AppData {
  metadata: StorageMetadata;
  tasks: Task[];
  preferences: UserPreferences;
}

export type SortOrder = 'newest-first' | 'oldest-first';

export interface TaskCounts {
  [date: string]: number; // YYYY-MM-DD -> count
}

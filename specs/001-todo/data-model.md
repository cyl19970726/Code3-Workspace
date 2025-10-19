# Data Model: Daily Todo Management Tool

**Last Updated**: 2025-10-10
**Status**: Phase 1 Design Complete

## Overview
This document defines the TypeScript interfaces and Zod schemas for the Daily Todo Management Tool. All data is stored in browser LocalStorage as JSON with schema validation for data integrity.

## Type Definitions

### Task
Represents a single todo task with completion tracking.

```typescript
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  completed: z.boolean(),
  createdAt: z.string().datetime(), // ISO 8601 timestamp
  completedAt: z.string().datetime().nullable(), // null if not completed
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

export type Task = z.infer<typeof TaskSchema>;
```

**Fields**:
- `id` — Unique identifier (UUIDv4), generated on creation
- `description` — Task text (1-500 characters, validated)
- `completed` — Completion status (boolean)
- `createdAt` — ISO 8601 timestamp when task was created
- `completedAt` — ISO 8601 timestamp when marked complete (null if pending)
- `date` — ISO date string (YYYY-MM-DD) for grouping tasks by day

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Review code for PR #42",
  "completed": true,
  "createdAt": "2025-10-10T09:15:00.000Z",
  "completedAt": "2025-10-10T14:30:00.000Z",
  "date": "2025-10-10"
}
```

---

### DailyTaskList
Computed view of tasks for a specific date (not persisted, derived from Task[]).

```typescript
export interface DailyTaskList {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  pendingCount: number;
  completedCount: number;
}
```

**Fields**:
- `date` — ISO date string for the day
- `tasks` — Array of tasks for this date (filtered from all tasks)
- `pendingCount` — Number of incomplete tasks (computed)
- `completedCount` — Number of completed tasks (computed)

**Derivation Logic**:
```typescript
function getDailyTaskList(allTasks: Task[], targetDate: string): DailyTaskList {
  const tasks = allTasks.filter(t => t.date === targetDate);
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return { date: targetDate, tasks, pendingCount, completedCount };
}
```

---

### UserPreferences
User settings for UI state (persisted to LocalStorage).

```typescript
export const UserPreferencesSchema = z.object({
  lastViewedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sortOrder: z.enum(['newest-first', 'oldest-first']),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
```

**Fields**:
- `lastViewedDate` — Last date user viewed (ISO date string)
- `sortOrder` — Task sorting preference (`newest-first` or `oldest-first`)

**Default Values**:
```typescript
const defaultPreferences: UserPreferences = {
  lastViewedDate: new Date().toISOString().split('T')[0], // today
  sortOrder: 'newest-first',
};
```

---

### StorageMetadata
Metadata for version tracking and data integrity (persisted to LocalStorage).

```typescript
export const StorageMetadataSchema = z.object({
  version: z.string(),
  lastModified: z.string().datetime(),
  totalTaskCount: z.number().int().nonnegative(),
  oldestTaskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  newestTaskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export type StorageMetadata = z.infer<typeof StorageMetadataSchema>;
```

**Fields**:
- `version` — Schema version (e.g., "1.0.0") for migrations
- `lastModified` — ISO 8601 timestamp of last data write
- `totalTaskCount` — Total number of tasks across all dates
- `oldestTaskDate` — Earliest task date (null if no tasks)
- `newestTaskDate` — Latest task date (null if no tasks)

**Purpose**: Track data version for future schema migrations, detect stale data, and provide quick statistics without scanning all tasks.

---

## Storage Schema

### LocalStorage Keys
- `todo-app-data` — Main application data (tasks, preferences, metadata)
- `todo-app-lock` — Tab lock identifier (string UUID of active tab)

### Storage Structure
```typescript
export const AppDataSchema = z.object({
  metadata: StorageMetadataSchema,
  tasks: z.array(TaskSchema),
  preferences: UserPreferencesSchema,
});

export type AppData = z.infer<typeof AppDataSchema>;
```

**Example LocalStorage Content**:
```json
{
  "todo-app-data": {
    "metadata": {
      "version": "1.0.0",
      "lastModified": "2025-10-10T14:35:00.000Z",
      "totalTaskCount": 3,
      "oldestTaskDate": "2025-10-09",
      "newestTaskDate": "2025-10-10"
    },
    "tasks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "description": "Review code",
        "completed": true,
        "createdAt": "2025-10-10T09:15:00.000Z",
        "completedAt": "2025-10-10T14:30:00.000Z",
        "date": "2025-10-10"
      }
    ],
    "preferences": {
      "lastViewedDate": "2025-10-10",
      "sortOrder": "newest-first"
    }
  },
  "todo-app-lock": "a3d2f8e1-c4b5-4d6e-8f9a-1b2c3d4e5f6a"
}
```

---

## Validation Rules

### Task Validation
- `id` — Must be valid UUIDv4 format
- `description` — 1-500 characters, non-empty after trim
- `date` — Must be valid ISO date (YYYY-MM-DD), no time component
- `createdAt` / `completedAt` — Must be valid ISO 8601 datetime strings
- `completedAt` — Must be null if `completed` is false

### Date Handling
- **Storage**: All dates stored in UTC as ISO strings
- **Display**: Convert to user's local timezone using date-fns
- **Validation**: date-fns `isValid()` check before storage

### Corruption Detection
```typescript
function validateAppData(raw: unknown): AppData | null {
  try {
    return AppDataSchema.parse(raw);
  } catch (error) {
    console.error('Storage corruption detected:', error);
    return null; // Trigger read-only mode
  }
}
```

---

## Data Integrity Guarantees

### Atomic Writes
All storage writes are atomic (all-or-nothing) using this pattern:
```typescript
function atomicWrite(key: string, data: AppData): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);

    // Verify write succeeded
    const readBack = localStorage.getItem(key);
    if (readBack !== serialized) {
      throw new Error('Write verification failed');
    }

    return true;
  } catch (error) {
    console.error('Atomic write failed:', error);
    return false; // Do not update in-memory state
  }
}
```

### Version Migrations
Future schema changes will use version field:
```typescript
function migrateIfNeeded(data: AppData): AppData {
  if (data.metadata.version === '1.0.0') {
    // Current version, no migration needed
    return data;
  }

  // Future: Add migration logic for v2.0.0, v3.0.0, etc.
  throw new Error(`Unsupported version: ${data.metadata.version}`);
}
```

---

## Performance Considerations

### Task Filtering
- **Strategy**: Filter tasks by date in-memory (O(n) where n = total tasks)
- **Optimization**: Store tasks sorted by date for faster range queries
- **Target**: < 10ms for filtering 1000 tasks on modern browsers

### Storage Size
- **Estimate**: ~200 bytes per task (JSON)
- **90 days @ 10 tasks/day**: ~180KB (well under 5MB quota)
- **Quota Management**: Check `localStorage.length` before writes

---

## Error Scenarios

### Quota Exceeded
```typescript
try {
  localStorage.setItem(key, data);
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // Show error: "Storage quota exceeded. Please delete old tasks."
    return false;
  }
  throw error;
}
```

### Corrupted Data
```typescript
const raw = localStorage.getItem('todo-app-data');
if (!raw) {
  // First run, initialize with empty state
  return getInitialState();
}

const parsed = JSON.parse(raw); // May throw SyntaxError
const validated = AppDataSchema.safeParse(parsed);

if (!validated.success) {
  // Corruption detected, enter read-only mode
  showErrorBanner('Storage corrupted. Read-only mode active.');
  return null;
}

return validated.data;
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Zod schema validation for all entity types
- Atomic write success/failure scenarios
- Quota exceeded error handling
- Corruption detection with invalid JSON
- Date normalization (UTC storage, local display)

### Integration Tests
- CRUD operations with storage persistence
- Multi-tab lock detection
- Read-only mode on corruption
- Data migration (when v2.0.0 released)

# LocalStorage API Documentation

This document describes the data structures stored in browser localStorage for the Daily Todo application.

## Storage Keys

The application uses the following localStorage keys:

| Key | Type | Description |
|-----|------|-------------|
| `todo-app-data` | JSON String | Main application data (tasks, metadata) |
| `todo-app-preferences` | JSON String | User preferences |
| `todo-app-lock` | JSON String | Tab lock for multi-tab detection |

---

## 1. Main Application Data (`todo-app-data`)

**Storage Key**: `todo-app-data`

**Schema Version**: `1`

### Data Structure

```typescript
interface AppData {
  version: number;           // Schema version (currently 1)
  tasks: Task[];            // Array of all tasks
  metadata: {
    createdAt: string;      // ISO 8601 timestamp
    lastModified: string;   // ISO 8601 timestamp
    totalTasks: number;     // Total count of tasks
  };
}

interface Task {
  id: string;               // UUID v4
  description: string;      // Task description (1-500 chars)
  completed: boolean;       // Completion status
  date: string;            // Date in YYYY-MM-DD format
  createdAt: string;       // ISO 8601 timestamp
  completedAt: string | null; // ISO 8601 timestamp or null
}
```

### Example Data

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "a3f2e1c4-5678-90ab-cdef-1234567890ab",
      "description": "Review pull request #42",
      "completed": false,
      "date": "2025-01-15",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "completedAt": null
    },
    {
      "id": "b4f3e2d5-6789-01bc-def0-234567890abc",
      "description": "Write documentation",
      "completed": true,
      "date": "2025-01-15",
      "createdAt": "2025-01-15T09:00:00.000Z",
      "completedAt": "2025-01-15T11:45:00.000Z"
    }
  ],
  "metadata": {
    "createdAt": "2025-01-15T08:00:00.000Z",
    "lastModified": "2025-01-15T11:45:00.000Z",
    "totalTasks": 2
  }
}
```

### Validation Rules

**Task Description**:
- Minimum length: 1 character
- Maximum length: 500 characters
- Must be non-empty string

**Task ID**:
- Must be valid UUID v4
- Must be unique across all tasks

**Task Date**:
- Must be in YYYY-MM-DD format
- Must be valid date
- Example: `2025-01-15`

**Timestamps**:
- Must be valid ISO 8601 format
- Example: `2025-01-15T10:30:00.000Z`

**Completion Status**:
- If `completed: true`, `completedAt` must be a valid timestamp
- If `completed: false`, `completedAt` must be `null`

---

## 2. User Preferences (`todo-app-preferences`)

**Storage Key**: `todo-app-preferences`

### Data Structure

```typescript
interface Preferences {
  lastViewedDate: string;  // YYYY-MM-DD format
  theme?: 'light' | 'dark'; // (Reserved for future use)
}
```

### Example Data

```json
{
  "lastViewedDate": "2025-01-15"
}
```

### Validation Rules

**lastViewedDate**:
- Must be in YYYY-MM-DD format
- Must be valid date
- Defaults to today's date if not set

---

## 3. Tab Lock (`todo-app-lock`)

**Storage Key**: `todo-app-lock`

**Purpose**: Prevents concurrent editing across multiple browser tabs.

### Data Structure

```typescript
interface TabLock {
  tabId: string;           // UUID v4 of the active tab
  timestamp: number;       // Unix timestamp in milliseconds
  heartbeat: number;       // Last heartbeat timestamp (ms)
}
```

### Example Data

```json
{
  "tabId": "c5f4e3d6-7890-12cd-ef01-345678901bcd",
  "timestamp": 1705315200000,
  "heartbeat": 1705315260000
}
```

### Lock Behavior

**Lock Acquisition**:
1. Check if lock exists in localStorage
2. If lock is older than 30 seconds (stale), acquire new lock
3. If lock is fresh and belongs to another tab, enter read-only mode
4. Update heartbeat every 5 seconds to keep lock alive

**Lock Release**:
1. Automatic on tab close (`beforeunload` event)
2. Automatic on tab visibility change (tab becomes hidden)

**Read-Only Mode Triggers**:
- Another tab has active lock
- Storage corruption detected
- Storage validation fails

---

## Storage Operations

### Atomic Writes

All write operations use atomic transaction pattern:

```typescript
// Pseudocode
function atomicWrite(data: AppData) {
  const backup = localStorage.getItem('todo-app-data');
  try {
    localStorage.setItem('todo-app-data', JSON.stringify(data));
  } catch (error) {
    // Rollback on failure
    if (backup) {
      localStorage.setItem('todo-app-data', backup);
    }
    throw error;
  }
}
```

### Data Validation

All data read from localStorage is validated using Zod schemas:

```typescript
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

const AppDataSchema = z.object({
  version: z.number(),
  tasks: z.array(TaskSchema),
  metadata: z.object({
    createdAt: z.string().datetime(),
    lastModified: z.string().datetime(),
    totalTasks: z.number(),
  }),
});
```

### Error Handling

**Storage Corruption**:
- Invalid JSON → Enter read-only mode, offer export/reset
- Schema validation fails → Enter read-only mode, offer export/reset
- Missing required fields → Attempt migration or reset

**Storage Quota Exceeded**:
- Display error message
- Offer export option to save data
- Suggest deleting old completed tasks

---

## Migration Strategy

### Version 1 → Version 2 (Future)

When schema changes are needed:

1. Check `version` field in stored data
2. Apply migration transformations
3. Update `version` to new number
4. Save migrated data atomically

Example migration:

```typescript
function migrateV1toV2(data: AppDataV1): AppDataV2 {
  return {
    ...data,
    version: 2,
    tasks: data.tasks.map(task => ({
      ...task,
      priority: 'medium', // New field with default value
    })),
  };
}
```

---

## Best Practices

### Reading Data

✅ **DO**:
- Always validate data after reading
- Handle validation errors gracefully
- Provide fallback to initial state

❌ **DON'T**:
- Assume data is always valid
- Ignore validation errors
- Directly use unvalidated data

### Writing Data

✅ **DO**:
- Use atomic write operations
- Validate data before writing
- Keep backup before modification
- Update metadata timestamps

❌ **DON'T**:
- Write partial/incomplete data
- Skip validation
- Forget to update metadata

### Multi-Tab Safety

✅ **DO**:
- Check for active locks before writing
- Update heartbeat regularly
- Release lock on tab close
- Enter read-only mode when lock detected

❌ **DON'T**:
- Force-acquire locks from other tabs
- Skip lock checks
- Allow concurrent writes

---

## Export/Import Format

### Export Format

Exported data is identical to `todo-app-data` structure, with added metadata:

```json
{
  "version": 1,
  "exportedAt": "2025-01-15T12:00:00.000Z",
  "exportedBy": "Daily Todo v1.0.0",
  "tasks": [...],
  "metadata": {...}
}
```

### Import Validation

Imported data must pass:
1. JSON parsing validation
2. Schema validation (Zod)
3. Data integrity checks (unique IDs, valid dates)

---

## Troubleshooting

### Common Issues

**Issue**: "Storage corrupted" error on app load

**Causes**:
- Manual localStorage editing
- Browser extension interference
- Incomplete write operation
- JSON syntax error

**Solutions**:
1. Export data (if possible)
2. Click "Reset" to clear storage
3. Re-import data if export succeeded

---

**Issue**: "Another tab is already open" warning

**Causes**:
- Multiple tabs open
- Previous tab didn't release lock (crash/force-close)

**Solutions**:
1. Close other tabs
2. Wait 30 seconds for stale lock to expire
3. Refresh page to acquire lock

---

**Issue**: Tasks not saving

**Causes**:
- Storage quota exceeded
- Browser privacy mode
- Tab in read-only mode

**Solutions**:
1. Check if in read-only mode (banner at top)
2. Delete old completed tasks
3. Export data and reset storage
4. Disable private browsing

---

## Security Considerations

### Data Sensitivity

- **localStorage is NOT encrypted** - stored in plain text
- Do not store sensitive information in task descriptions
- Data persists until explicitly cleared

### XSS Protection

- All user input is sanitized
- No `dangerouslySetInnerHTML` usage
- React escapes all text content automatically

### CSRF Protection

- No external API calls (local-only app)
- No authentication tokens stored

---

## Performance Considerations

### Storage Size Limits

- **Typical browser limit**: 5-10 MB per origin
- **Recommended max tasks**: 10,000 tasks
- **Estimated storage per task**: ~200 bytes

### Optimization Strategies

1. **Virtual scrolling**: Only render visible tasks (50+ tasks)
2. **Lazy loading**: Load dialogs on-demand
3. **Memoization**: Prevent unnecessary re-renders
4. **Date filtering**: Only load tasks for selected date range

---

## References

- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Zod Schema Validation](https://zod.dev/)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)

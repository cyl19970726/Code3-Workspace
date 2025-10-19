# Architecture: Daily Todo Management Tool

**Last Updated**: 2025-10-10
**Status**: Phase 1 Design Complete

## Overview
This document defines the component hierarchy, state management architecture, and module organization for the Daily Todo Management Tool.

## Component Hierarchy

```
App (Root)
├── ErrorBoundary
│   └── [Catch React errors, show fallback UI]
├── TabLockGuard
│   └── [Multi-tab detection, show warning modal]
├── StorageHealthCheck
│   └── [Detect corruption, show error banner]
└── MainLayout
    ├── Header
    │   ├── AppTitle
    │   └── DatePicker
    │       └── [Calendar navigation, current date highlight]
    ├── Content
    │   ├── ErrorBanner (conditional)
    │   │   └── [Storage error display, read-only mode warning]
    │   ├── TaskForm
    │   │   ├── Input (description)
    │   │   ├── ValidationError (conditional)
    │   │   └── SubmitButton
    │   └── TaskList
    │       ├── EmptyState (conditional)
    │       │   └── [No tasks message]
    │       ├── PendingSection
    │       │   ├── SectionHeader ("Pending")
    │       │   └── TaskItem[] (pending tasks)
    │       └── CompletedSection
    │           ├── SectionHeader ("Completed")
    │           └── TaskItem[] (completed tasks)
    └── Footer
        └── [App info, storage usage]

TaskItem (Reusable)
├── Checkbox (mark complete/incomplete)
├── TaskText (description with strike-through if completed)
├── Timestamp (completedAt if applicable)
├── EditButton → Opens TaskEditModal
├── DeleteButton → Opens ConfirmDialog
└── [Hover state, keyboard navigation]

Modals (Headless UI)
├── TaskEditModal
│   ├── Input (pre-filled description)
│   ├── CancelButton
│   └── SaveButton
├── ConfirmDialog
│   ├── Message ("Delete this task?")
│   ├── CancelButton
│   └── ConfirmButton
└── MultiTabWarning
    ├── Message ("App already open in another tab")
    └── CloseButton (closes current tab)
```

---

## Component Details

### Core Components

#### 1. App.tsx
**Responsibility**: Root component, app initialization, global error handling

```typescript
export default function App() {
  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
    setupTabLock();
  }, []);

  return (
    <ErrorBoundary>
      <TabLockGuard>
        <StorageHealthCheck>
          <MainLayout />
        </StorageHealthCheck>
      </TabLockGuard>
    </ErrorBoundary>
  );
}
```

**Dependencies**: `useStorageStore`, `useUIStore`, `tabLock.ts`

---

#### 2. TaskList.tsx
**Responsibility**: Render tasks grouped by completion status, handle sorting

```typescript
interface TaskListProps {
  tasks: Task[];
  sortOrder: 'newest-first' | 'oldest-first';
}

export function TaskList({ tasks, sortOrder }: TaskListProps) {
  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const sortedPending = sortTasks(pending, sortOrder, 'createdAt');
  const sortedCompleted = sortTasks(completed, sortOrder, 'completedAt');

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <PendingSection tasks={sortedPending} />
      <CompletedSection tasks={sortedCompleted} />
    </div>
  );
}
```

**Dependencies**: `useTaskStore`, `EmptyState`, `TaskItem`

---

#### 3. TaskItem.tsx
**Responsibility**: Display individual task, handle edit/delete/complete actions

```typescript
interface TaskItemProps {
  task: Task;
  readOnly?: boolean; // true if storage unavailable
}

export function TaskItem({ task, readOnly }: TaskItemProps) {
  const { toggleComplete, deleteTask } = useTaskStore();
  const { openModal } = useUIStore();

  const handleComplete = () => !readOnly && toggleComplete(task.id);
  const handleEdit = () => !readOnly && openModal('edit', task);
  const handleDelete = () => !readOnly && openModal('confirmDelete', task);

  return (
    <div className={task.completed ? 'line-through opacity-60' : ''}>
      <Checkbox checked={task.completed} onChange={handleComplete} disabled={readOnly} />
      <TaskText>{task.description}</TaskText>
      {task.completedAt && <Timestamp time={task.completedAt} />}
      <EditButton onClick={handleEdit} disabled={readOnly} />
      <DeleteButton onClick={handleDelete} disabled={readOnly} />
    </div>
  );
}
```

**Dependencies**: `useTaskStore`, `useUIStore`, `TaskEditModal`, `ConfirmDialog`

---

#### 4. TaskForm.tsx
**Responsibility**: Add new task form with validation

```typescript
export function TaskForm() {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addTask } = useTaskStore();
  const { currentDate, readOnly } = useUIStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate using Zod
    const result = TaskSchema.pick({ description: true }).safeParse({ description });
    if (!result.success) {
      setError('Description must be 1-500 characters');
      return;
    }

    addTask({
      description: result.data.description,
      date: currentDate,
    });

    setDescription(''); // Clear form
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a new task..."
        disabled={readOnly}
        maxLength={500}
      />
      {error && <ValidationError message={error} />}
      <SubmitButton disabled={readOnly || !description.trim()}>Add Task</SubmitButton>
    </form>
  );
}
```

**Dependencies**: `useTaskStore`, `useUIStore`, `validation.ts` (Zod schemas)

---

#### 5. DatePicker.tsx
**Responsibility**: Calendar navigation, date selection

```typescript
export function DatePicker() {
  const { currentDate, setCurrentDate } = useUIStore();

  const handlePrevDay = () => {
    const prev = addDays(parseISO(currentDate), -1);
    setCurrentDate(formatISO(prev, { representation: 'date' }));
  };

  const handleNextDay = () => {
    const next = addDays(parseISO(currentDate), 1);
    setCurrentDate(formatISO(next, { representation: 'date' }));
  };

  const handleToday = () => {
    setCurrentDate(formatISO(new Date(), { representation: 'date' }));
  };

  return (
    <div>
      <Button onClick={handlePrevDay}>← Prev</Button>
      <span>{format(parseISO(currentDate), 'MMMM d, yyyy')}</span>
      <Button onClick={handleNextDay}>Next →</Button>
      <Button onClick={handleToday}>Today</Button>
    </div>
  );
}
```

**Dependencies**: `useUIStore`, `date-fns` (parseISO, format, addDays)

---

#### 6. EmptyState.tsx
**Responsibility**: Display message when no tasks for selected date

```typescript
export function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-lg">No tasks for today.</p>
      <p className="text-sm">Add your first task above!</p>
    </div>
  );
}
```

---

#### 7. ErrorBanner.tsx
**Responsibility**: Display storage errors, read-only mode warning

```typescript
export function ErrorBanner() {
  const { storageError } = useStorageStore();

  if (!storageError) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Storage Error:</strong> {storageError.message}
      <p className="text-sm">App is now in read-only mode. Please refresh or clear browser storage.</p>
    </div>
  );
}
```

**Dependencies**: `useStorageStore`

---

#### 8. ConfirmDialog.tsx
**Responsibility**: Confirmation modal for delete action

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, message }: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel>
        <Dialog.Title>Confirm Action</Dialog.Title>
        <Dialog.Description>{message}</Dialog.Description>
        <div>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} variant="danger">Confirm</Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
```

**Dependencies**: Headless UI `Dialog`

---

## State Management (Zustand)

### Store 1: useTaskStore
**Responsibility**: Task CRUD operations, persistence

```typescript
interface TaskStore {
  tasks: Task[];

  // Actions
  addTask: (input: { description: string; date: string }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;

  // Selectors
  getTasksByDate: (date: string) => Task[];
  getDailyTaskList: (date: string) => DailyTaskList;
}

const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (input) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          description: input.description,
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
          date: input.date,
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== id) return t;

            return {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            };
          }),
        }));
      },

      getTasksByDate: (date) => {
        return get().tasks.filter(t => t.date === date);
      },

      getDailyTaskList: (date) => {
        const tasks = get().getTasksByDate(date);
        return {
          date,
          tasks,
          pendingCount: tasks.filter(t => !t.completed).length,
          completedCount: tasks.filter(t => t.completed).length,
        };
      },
    }),
    {
      name: 'todo-app-data', // LocalStorage key
      storage: createAtomicStorage(), // Custom wrapper
    }
  )
);
```

---

### Store 2: useUIStore
**Responsibility**: UI state (current date, modals, errors)

```typescript
interface UIStore {
  currentDate: string; // ISO date string
  activeModal: 'edit' | 'confirmDelete' | 'multiTabWarning' | null;
  modalData: Task | null;
  readOnly: boolean;

  // Actions
  setCurrentDate: (date: string) => void;
  openModal: (type: UIStore['activeModal'], data?: Task) => void;
  closeModal: () => void;
  setReadOnly: (readOnly: boolean) => void;
}
```

---

### Store 3: useStorageStore
**Responsibility**: Storage health monitoring, corruption detection

```typescript
interface StorageStore {
  isHealthy: boolean;
  storageError: { message: string; code: string } | null;

  // Actions
  checkStorageHealth: () => Promise<boolean>;
  reportError: (error: { message: string; code: string }) => void;
  clearError: () => void;
}
```

---

## Utility Modules

### storage.ts
**Exports**:
- `createAtomicStorage()` — Zustand storage middleware with atomic writes
- `validateStorage()` — Check for corruption using Zod schemas
- `getStorageUsage()` — Calculate used storage space

### validation.ts
**Exports**:
- `TaskSchema` — Zod schema for Task entity
- `UserPreferencesSchema` — Zod schema for UserPreferences
- `AppDataSchema` — Zod schema for entire storage structure
- `validateTaskDescription(text: string)` — Validate task input

### tabLock.ts
**Exports**:
- `acquireTabLock()` — Attempt to acquire lock (returns boolean)
- `releaseTabLock()` — Release lock on window unload
- `isLockActive()` — Check if another tab has lock
- `setupTabLockListener()` — Listen for multi-tab events

### dateUtils.ts
**Exports**:
- `formatDate(date: Date | string, format: string)` — Format date for display
- `normalizeToUTC(date: Date)` — Convert to UTC ISO string
- `getTodayISO()` — Get today's date as YYYY-MM-DD
- `isValidDateString(str: string)` — Validate YYYY-MM-DD format

---

## Data Flow

### Add Task Flow
```
User types description
    ↓
TaskForm validates (Zod)
    ↓
useTaskStore.addTask() called
    ↓
New Task object created (UUID, timestamps)
    ↓
Zustand middleware persists to LocalStorage (atomic write)
    ↓
TaskList re-renders (auto-subscription)
    ↓
TaskItem appears in pending section
```

### Complete Task Flow
```
User clicks checkbox
    ↓
useTaskStore.toggleComplete() called
    ↓
Task.completed flipped, completedAt set
    ↓
Zustand persists update (atomic write)
    ↓
TaskList re-renders
    ↓
TaskItem moves to completed section (strike-through)
```

### Storage Error Flow
```
App loads, reads LocalStorage
    ↓
JSON.parse() or Zod validation fails
    ↓
useStorageStore.reportError() called
    ↓
useUIStore.setReadOnly(true) called
    ↓
ErrorBanner displays error message
    ↓
All write buttons disabled (add, edit, delete, complete)
```

---

## File Structure

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Root component
├── components/
│   ├── TaskList.tsx
│   ├── TaskItem.tsx
│   ├── TaskForm.tsx
│   ├── DatePicker.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBanner.tsx
│   ├── ConfirmDialog.tsx
│   └── TaskEditModal.tsx
├── stores/
│   ├── useTaskStore.ts
│   ├── useUIStore.ts
│   └── useStorageStore.ts
├── utils/
│   ├── storage.ts
│   ├── validation.ts
│   ├── tabLock.ts
│   └── dateUtils.ts
├── types/
│   └── index.ts             # Re-export all types
└── styles/
    └── globals.css          # Tailwind imports

tests/
├── unit/
│   ├── storage.test.ts
│   ├── validation.test.ts
│   ├── tabLock.test.ts
│   └── dateUtils.test.ts
├── integration/
│   ├── TaskForm.test.tsx
│   ├── TaskList.test.tsx
│   └── TaskItem.test.tsx
└── e2e/
    ├── add-task.spec.ts
    ├── edit-task.spec.ts
    ├── complete-task.spec.ts
    └── multi-tab.spec.ts
```

---

## Performance Optimizations

1. **React.memo** for TaskItem (prevent re-renders)
2. **Zustand selectors** for granular subscriptions
3. **Virtual scrolling** if > 100 tasks (future enhancement)
4. **Debounced storage writes** (batch updates within 50ms)
5. **Code splitting** (lazy load DatePicker, modals)

---

## Accessibility

1. **ARIA labels** on all buttons and inputs
2. **Keyboard navigation** (Tab, Enter, Escape)
3. **Focus management** in modals (Headless UI)
4. **Screen reader announcements** for task completion
5. **Color contrast** (WCAG AA minimum)

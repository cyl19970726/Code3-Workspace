# Implementation Plan: Daily Todo Management Tool

**Branch**: `001-todo` | **Date**: 2025-10-10 | **Spec**: [spec.md](./spec.md)

## Summary
Implement a single-page web application for managing daily tasks with CRUD operations, date-based organization, completion tracking, and browser local storage persistence. Focus on simplicity, performance (<100ms operations), and robust error handling for storage failures and multi-tab scenarios.

## Technical Context
**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Framework**: React 18.2+ with Vite 5.0+ for fast development and optimal bundling
**State Management**: Zustand 4.4+ (lightweight, no boilerplate, perfect for local storage sync)
**Styling**: Tailwind CSS 3.4+ for rapid UI development and consistent design
**Date Handling**: date-fns 3.0+ (lightweight, tree-shakeable, better than moment.js)
**Storage**: Browser LocalStorage API with custom atomic write wrapper
**UI Components**: Headless UI 1.7+ (accessible, unstyled components for modals/dialogs)
**Form Validation**: Zod 3.22+ (TypeScript-first schema validation)
**Testing**: Vitest 1.0+ with React Testing Library and Playwright for E2E
**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari/Edge latest 2 versions)
**Project Type**: Single-page application (SPA) with client-side routing
**Performance Goals**:
- Task creation: < 100ms (NFR-1)
- Task list rendering: < 200ms for 100 tasks (NFR-2)
- Storage detection: < 500ms on startup (NFR-8)
**Constraints**:
- Web-only, desktop browsers (no mobile apps)
- Single-device, no cloud sync (FR-20)
- Single-tab only (FR-22)
- Atomic storage writes (NFR-7)
- 90+ days historical data (NFR-4)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

**Simplicity**:
- Projects: 1 (frontend SPA only)
- Status: ✅ PASS (within 3-project limit)

**Architecture**:
- Library-First: ✅ PASS (using React, Zustand, Tailwind, date-fns, Zod)
- Avoid custom frameworks: ✅ PASS (standard React patterns with Vite)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced: ✅ PASS
- TDD strict mode: ✅ PASS (tests before implementation)
- Test coverage target: 80%+ for critical paths (CRUD, storage, state management)

**Overall**: ✅ PASS - All constitutional requirements satisfied

---

## Phase 0: Research & Decisions

### Research Documents
See [research.md](./research.md) for detailed analysis.

### Key Decisions

**1. Frontend Framework & Build Tool**
- **Decision**: React 18.2+ with Vite 5.0+ (TypeScript)
- **Rationale**: React provides component-based architecture ideal for UI state management. Vite offers instant HMR (<50ms), optimized production builds with code splitting, and native ESM support. TypeScript ensures type safety for storage operations and data model.
- **Alternatives**:
  - Vue 3 + Vite (good, but smaller ecosystem for TypeScript utilities)
  - Svelte + SvelteKit (smaller bundle, but less mature ecosystem)
  - Plain JavaScript (no type safety, error-prone for data model)

**2. State Management Solution**
- **Decision**: Zustand 4.4+ with LocalStorage middleware
- **Rationale**: Zustand is minimal (1.2KB), has zero boilerplate, built-in LocalStorage sync, and excellent TypeScript support. Perfect for single-tab apps. Middleware allows atomic storage writes and conflict detection.
- **Alternatives**:
  - Redux Toolkit (overkill, ~20KB, too much boilerplate for simple CRUD)
  - React Context + useReducer (no built-in storage sync, manual persistence)
  - Jotai/Recoil (atomic state, but more complex for simple use case)

**3. Storage Strategy & Data Integrity**
- **Decision**: Custom LocalStorage wrapper with versioning, atomic writes, and corruption detection
- **Rationale**: LocalStorage is synchronous (meets NFR-1, NFR-2), but needs abstraction for atomicity. Version field enables migration. JSON schema validation (Zod) ensures data integrity. Try-catch for quota detection (NFR-5).
- **Alternatives**:
  - IndexedDB (async, more complex API, overkill for key-value storage)
  - SessionStorage (lost on browser close, violates FR-13)
  - Raw LocalStorage (no atomicity, no corruption detection)

**4. Date Management & Timezone Handling**
- **Decision**: date-fns 3.0+ with UTC normalization for storage, local timezone for display
- **Rationale**: Store dates as ISO 8601 UTC strings (YYYY-MM-DD) to avoid timezone bugs. date-fns is tree-shakeable (only import used functions), has locale support, and better API than moment.js. Handles DST transitions correctly.
- **Alternatives**:
  - Luxon (larger bundle ~73KB, feature-rich but overkill)
  - Day.js (smaller but less type-safe, mutable API)
  - Native Date API (error-prone for date arithmetic, no timezone utilities)

**5. Multi-Tab Detection Strategy**
- **Decision**: BroadcastChannel API + localStorage lock key + beforeunload cleanup
- **Rationale**: BroadcastChannel provides native cross-tab messaging. Fallback to storage events for older Safari. Lock key with timestamp prevents zombie tabs. Cleanup on unload prevents false positives after crashes.
- **Alternatives**:
  - localStorage events only (delayed, unreliable in Safari)
  - SharedWorker (not supported in Safari)
  - No detection (data corruption risk, violates FR-22)

**6. UI Component Library & Accessibility**
- **Decision**: Headless UI 1.7+ + Tailwind CSS 3.4+ with custom components
- **Rationale**: Headless UI provides accessible modals/dialogs (ARIA, keyboard nav) without styling lock-in. Tailwind enables rapid prototyping and consistent design tokens. Both have excellent TypeScript support. Small bundle (~15KB combined).
- **Alternatives**:
  - Material-UI (heavy ~300KB, opinionated design)
  - Chakra UI (good, but larger ~80KB, more dependencies)
  - Plain HTML + CSS (no accessibility guarantees, more dev time)

**7. Error Handling & User Feedback**
- **Decision**: Toast notifications (react-hot-toast) for user feedback + Sentry for error tracking (optional)
- **Rationale**: Toasts provide non-blocking feedback for CRUD operations and storage errors. react-hot-toast is lightweight (3KB), supports promise-based toasts. Sentry optional for production monitoring but not required for MVP.
- **Alternatives**:
  - Built-in browser alerts (blocking, poor UX)
  - Custom modal system (more complex, reinventing wheel)
  - Console.log only (user has no feedback, violates FR-21)

**Status**: ✅ Complete

---

## Phase 1: Design & Contracts

### Data Model
See [data-model.md](./data-model.md) for complete schema.

**Entities**: 4 (matching spec.md)
- **Task**: id (string UUID), description (string 1-500 chars), completed (boolean), createdAt (ISO timestamp string), completedAt (ISO timestamp string | null), date (ISO date string YYYY-MM-DD)
- **DailyTaskList**: date (ISO date string), tasks (Task[]), pendingCount (number), completedCount (number)
- **UserPreferences**: lastViewedDate (ISO date string), sortOrder ('newest-first' | 'oldest-first')
- **StorageMetadata**: version (string), lastModified (ISO timestamp string), totalTaskCount (number), oldestTaskDate (ISO date string), newestTaskDate (ISO date string)

**Storage Schema** (LocalStorage):
```typescript
{
  "todo-app-data": {
    metadata: StorageMetadata,
    tasks: Task[],
    preferences: UserPreferences
  },
  "todo-app-lock": string // tab lock key
}
```

**Key Relationships**:
- Task.date → DailyTaskList.date (tasks grouped by date)
- Task.id → unique identifier for updates/deletes
- StorageMetadata tracks data version for migrations

### Component Architecture
See [architecture.md](./architecture.md) for component hierarchy.

**Core Components**: 8
- `App.tsx` — Root component, tab detection, storage initialization
- `TaskList.tsx` — Display grouped tasks (pending/completed), handle sorting
- `TaskItem.tsx` — Individual task with edit/delete/complete actions
- `TaskForm.tsx` — Add/edit task form with validation (Zod)
- `DatePicker.tsx` — Calendar navigation, current date highlight
- `EmptyState.tsx` — No tasks message (FR-15)
- `ErrorBanner.tsx` — Storage error display (FR-21)
- `ConfirmDialog.tsx` — Delete confirmation modal (FR-5)

**Stores** (Zustand):
- `useTaskStore` — Task CRUD, completion toggling, date filtering
- `useUIStore` — Current date, modal state, error messages
- `useStorageStore` — Storage health check, corruption detection

**Utilities**:
- `storage.ts` — Atomic LocalStorage wrapper, corruption detection
- `validation.ts` — Zod schemas for Task/Preferences/Metadata
- `tabLock.ts` — Multi-tab detection and locking
- `dateUtils.ts` — Date normalization, formatting (date-fns)

### User Flows
See [flows.md](./flows.md) for detailed diagrams.

**Primary Flows**: 6
1. **Add Task Flow**: Click "Add Task" → Enter description → Validate (1-500 chars) → Save to storage → Render in pending section
2. **Edit Task Flow**: Click edit icon → Update description → Validate → Save → Re-render with updated text
3. **Complete Task Flow**: Click checkbox → Record completedAt timestamp → Move to completed section → Strike-through style
4. **Delete Task Flow**: Click delete → Confirm dialog → Remove from storage → Re-render list
5. **Date Navigation Flow**: Click date picker → Select date → Filter tasks by date → Render DailyTaskList for selected date
6. **Storage Error Flow**: Detect corruption on load → Show error banner → Enter read-only mode → Disable all write operations

### Quickstart Validation
See [quickstart.md](./quickstart.md) for test scenarios.

**Test Scenarios**: 10 (from spec.md acceptance scenarios)
1. Happy path: Open app → Add task "Review code" → Mark complete → Verify timestamp → Reload → Data persists
2. Edit flow: Add task → Click edit → Change description → Save → Verify persistence
3. Delete flow: Add task → Click delete → Confirm → Verify removal
4. Date navigation: Add tasks for today/tomorrow → Switch dates → Verify filtering
5. Completion toggle: Mark complete → Unmark → Verify status change and timestamp removal
6. Empty state: Select date with no tasks → Verify empty message
7. Multi-tab detection: Open app in 2 tabs → Second tab shows warning modal
8. Storage corruption: Corrupt localStorage data → App enters read-only mode
9. Storage quota: Fill storage → Add task → Verify quota error message
10. Long description: Enter 500 char description → Verify validation and truncation

**Status**: ✅ Complete

---

## Phase 2: Task Planning Approach

**THIS PHASE IS EXECUTED BY /tasks COMMAND - NOT BY /plan**

### Task Generation Strategy
- Load data-model.md → generate Zod schemas + TypeScript interfaces [P]
- Load architecture.md → generate component skeleton tasks [P]
- Load flows.md → generate flow-specific test tasks
- Load quickstart.md → generate integration test tasks for each scenario
- Apply TDD ordering: Tests → Core → Integration → Polish

### Estimated Tasks
- Setup: ~7 tasks (Vite project init, Tailwind config, Zustand setup, Zod schemas, ESLint/Prettier, Vitest config, Playwright setup)
- Tests: ~15 tasks [P] (10 integration tests from quickstart + 5 unit tests for utilities)
- Core: ~12 tasks (8 components + 3 stores + 1 storage utility)
- Integration: ~8 tasks (tab detection, error handling, date utilities, validation)
- Polish: ~6 tasks [P] (performance optimization, accessibility audit, documentation, E2E tests)

**Total Estimated**: ~48 tasks

### Parallel Execution Notes
- Component tests [P]: Can run in parallel (isolated components)
- Zustand stores: Sequential (useTaskStore depends on storage utility)
- Integration tests: Can run in parallel with test storage isolation
- E2E tests: Sequential (browser state dependencies)

---

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (7 tech decisions documented)
- [x] Phase 1: Design complete (data model, 8 components, 10 test scenarios)
- [ ] Phase 2: Task planning complete (/tasks command)
- [ ] Phase 3: Tasks generated
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (simplicity, architecture, testing requirements)
- [x] Post-Design Constitution Check: PASS (no architectural violations, test coverage plan OK)
- [x] All NEEDS CLARIFICATION resolved (spec.md has 10 clarifications)
- [x] Complexity deviations documented (none - staying within limits)

**Design Artifacts Generated**:
- [x] data-model.md (4 entities with TypeScript interfaces + Zod schemas)
- [x] architecture.md (8 components, 3 stores, 4 utility modules)
- [x] flows.md (6 primary user flows with state transitions)
- [x] quickstart.md (10 integration test scenarios)

---

**Next Step**: Run `/tasks` to generate detailed task breakdown from this plan

---

## Tech Stack Summary

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Framework** | React | 18.2+ | Component-based, mature ecosystem, excellent TypeScript support |
| **Build Tool** | Vite | 5.0+ | Instant HMR, optimal bundling, native ESM |
| **Language** | TypeScript | 5.3+ | Type safety for data model, catch errors at compile time |
| **State Management** | Zustand | 4.4+ | Minimal (1.2KB), LocalStorage middleware, zero boilerplate |
| **Styling** | Tailwind CSS | 3.4+ | Rapid development, consistent design, small production bundle |
| **UI Components** | Headless UI | 1.7+ | Accessible modals/dialogs, unstyled (Tailwind-compatible) |
| **Date Library** | date-fns | 3.0+ | Tree-shakeable, lightweight, timezone-aware |
| **Validation** | Zod | 3.22+ | TypeScript-first, runtime validation, schema-based |
| **Notifications** | react-hot-toast | 2.4+ | Lightweight (3KB), promise support, customizable |
| **Testing** | Vitest + RTL + Playwright | 1.0+ | Fast, native ESM, React component testing, E2E |
| **Code Quality** | ESLint + Prettier | Latest | Consistent formatting, catch common errors |

**Total Bundle Size Estimate**: ~120KB gzipped (React 40KB + Zustand 1KB + Tailwind ~10KB + date-fns ~10KB + Zod 13KB + misc ~46KB)

---

## Architecture Principles

1. **Separation of Concerns**: Components (UI) → Stores (State) → Utilities (Storage/Logic)
2. **Single Source of Truth**: Zustand store as single state container, synced with LocalStorage
3. **Immutable Updates**: All state updates via Zustand actions (no direct mutations)
4. **Error Boundaries**: React error boundaries for uncaught component errors
5. **Atomic Operations**: Storage wrapper ensures all-or-nothing writes (NFR-7)
6. **Fail-Safe Defaults**: Read-only mode on storage errors (FR-21)
7. **Progressive Enhancement**: Core CRUD works even if date picker fails to load

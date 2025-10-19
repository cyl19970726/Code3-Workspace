# Quickstart Test Scenarios: Daily Todo Management Tool

**Last Updated**: 2025-10-10
**Status**: Phase 1 Design Complete

## Overview
This document defines integration and E2E test scenarios for validating the Daily Todo Management Tool. Each scenario maps to acceptance criteria from spec.md and can be automated with Playwright or manually executed.

---

## Test Scenario 1: Happy Path (Complete User Journey)

**Objective**: Verify core CRUD operations and persistence

**Preconditions**:
- Browser has no existing todo-app-data in LocalStorage
- App is opened in single tab
- Current date is 2025-10-10

**Steps**:
1. Open app at `http://localhost:5173`
2. Verify empty state message: "No tasks for today. Add your first task!"
3. Enter task description: "Review code for PR #42"
4. Click "Add Task" button
5. Verify task appears in "Pending" section
6. Verify task has creation timestamp
7. Click checkbox to mark task complete
8. Verify task moves to "Completed" section with strike-through style
9. Verify task shows completion timestamp (e.g., "Completed at 2:30 PM")
10. Close browser tab
11. Reopen app at same URL
12. Verify task still exists in "Completed" section
13. Verify data persisted to LocalStorage

**Expected Results**:
- ✅ Empty state shown initially
- ✅ Task added to pending section within 100ms
- ✅ Completion timestamp accurate to within 1 second
- ✅ Data persists across browser sessions
- ✅ LocalStorage contains valid JSON with AppDataSchema

**Automation** (Playwright):
```typescript
test('happy path: add, complete, persist', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Empty state
  await expect(page.getByText('No tasks for today')).toBeVisible();

  // Add task
  await page.fill('input[placeholder*="Add a new task"]', 'Review code for PR #42');
  await page.click('button:has-text("Add Task")');

  // Verify pending
  const task = page.locator('[data-testid="task-item"]').first();
  await expect(task).toContainText('Review code for PR #42');
  await expect(task).not.toHaveClass(/line-through/);

  // Mark complete
  await task.locator('input[type="checkbox"]').check();
  await expect(task).toHaveClass(/line-through/);
  await expect(task).toContainText(/Completed at \d+:\d+ [AP]M/);

  // Verify persistence
  await page.reload();
  await expect(page.locator('[data-testid="task-item"]')).toContainText('Review code');
});
```

---

## Test Scenario 2: Edit Task Flow

**Objective**: Verify task description can be edited and persisted

**Preconditions**:
- One task exists: "Buy groceries" (pending)

**Steps**:
1. Open app
2. Verify "Buy groceries" task in pending section
3. Click edit icon (pencil) next to task
4. Edit modal opens with pre-filled description
5. Change description to "Buy groceries and milk"
6. Click "Save" button
7. Verify modal closes
8. Verify task description updated in UI
9. Refresh browser
10. Verify edited description persisted

**Expected Results**:
- ✅ Edit modal pre-fills with current description
- ✅ Description updates within 100ms
- ✅ Task remains in same section (pending/completed)
- ✅ Edit operation persists to LocalStorage

**Automation**:
```typescript
test('edit task description', async ({ page }) => {
  // Setup: Add initial task
  await addTask(page, 'Buy groceries');

  // Click edit
  await page.click('[data-testid="edit-button"]');

  // Edit modal
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input')).toHaveValue('Buy groceries');

  // Update description
  await modal.locator('input').fill('Buy groceries and milk');
  await modal.locator('button:has-text("Save")').click();

  // Verify update
  await expect(modal).not.toBeVisible();
  await expect(page.locator('[data-testid="task-item"]')).toContainText('Buy groceries and milk');

  // Verify persistence
  await page.reload();
  await expect(page.locator('[data-testid="task-item"]')).toContainText('Buy groceries and milk');
});
```

---

## Test Scenario 3: Delete Task Flow

**Objective**: Verify task can be permanently deleted with confirmation

**Preconditions**:
- One task exists: "Call dentist" (pending)

**Steps**:
1. Open app
2. Click delete icon (trash) next to "Call dentist" task
3. Confirm dialog opens with message: "Delete this task?"
4. Click "Cancel" button
5. Verify dialog closes, task still visible
6. Click delete icon again
7. Click "Confirm" button
8. Verify dialog closes, task removed from UI
9. Refresh browser
10. Verify task no longer exists

**Expected Results**:
- ✅ Confirmation dialog shown before delete
- ✅ Cancel prevents deletion
- ✅ Confirm removes task within 100ms
- ✅ Task permanently removed (no recycle bin)
- ✅ Delete operation persists to LocalStorage

**Automation**:
```typescript
test('delete task with confirmation', async ({ page }) => {
  await addTask(page, 'Call dentist');

  // Cancel delete
  await page.click('[data-testid="delete-button"]');
  const dialog = page.locator('[role="alertdialog"]');
  await expect(dialog).toBeVisible();
  await dialog.locator('button:has-text("Cancel")').click();
  await expect(page.locator('[data-testid="task-item"]')).toBeVisible();

  // Confirm delete
  await page.click('[data-testid="delete-button"]');
  await dialog.locator('button:has-text("Confirm")').click();
  await expect(page.locator('[data-testid="task-item"]')).not.toBeVisible();

  // Verify persistence
  await page.reload();
  await expect(page.locator('[data-testid="task-item"]')).not.toBeVisible();
});
```

---

## Test Scenario 4: Date Navigation and Filtering

**Objective**: Verify tasks are filtered by selected date

**Preconditions**:
- Two tasks exist:
  - "Task A" on 2025-10-09
  - "Task B" on 2025-10-10

**Steps**:
1. Open app (current date: 2025-10-10)
2. Verify only "Task B" visible
3. Click "← Prev" button in date picker
4. Verify date changes to 2025-10-09
5. Verify only "Task A" visible
6. Click "Next →" button
7. Verify date changes to 2025-10-10
8. Verify only "Task B" visible
9. Click "Today" button
10. Verify date returns to current date

**Expected Results**:
- ✅ Tasks filtered by selected date
- ✅ Date navigation updates displayed tasks within 200ms
- ✅ Date picker shows correct date in human-readable format
- ✅ "Today" button resets to current date

**Automation**:
```typescript
test('date navigation filters tasks', async ({ page, context }) => {
  // Set current date to 2025-10-10
  await context.addInitScript(() => {
    Date.now = () => new Date('2025-10-10T12:00:00Z').getTime();
  });

  // Add tasks for different dates
  await addTaskForDate(page, 'Task A', '2025-10-09');
  await addTaskForDate(page, 'Task B', '2025-10-10');

  // Initial state: Oct 10
  await expect(page.locator('[data-testid="task-item"]')).toHaveText('Task B');

  // Navigate to Oct 9
  await page.click('button:has-text("← Prev")');
  await expect(page.locator('[data-testid="date-display"]')).toContainText('October 9, 2025');
  await expect(page.locator('[data-testid="task-item"]')).toHaveText('Task A');

  // Navigate back to Oct 10
  await page.click('button:has-text("Next →")');
  await expect(page.locator('[data-testid="task-item"]')).toHaveText('Task B');

  // Today button
  await page.click('button:has-text("Today")');
  await expect(page.locator('[data-testid="date-display"]')).toContainText('October 10, 2025');
});
```

---

## Test Scenario 5: Toggle Task Completion

**Objective**: Verify task can be toggled between pending and completed

**Preconditions**:
- One task exists: "Submit report" (pending)

**Steps**:
1. Open app
2. Verify "Submit report" in pending section
3. Click checkbox to mark complete
4. Verify task moves to completed section
5. Verify completion timestamp appears
6. Click checkbox again to unmark
7. Verify task moves back to pending section
8. Verify completion timestamp removed
9. Refresh browser
10. Verify task still in pending section

**Expected Results**:
- ✅ Checkbox toggles completion status
- ✅ Task moves between sections within 100ms
- ✅ Completion timestamp added/removed correctly
- ✅ Toggle operation persists to LocalStorage

**Automation**:
```typescript
test('toggle task completion', async ({ page }) => {
  await addTask(page, 'Submit report');

  const task = page.locator('[data-testid="task-item"]');
  const checkbox = task.locator('input[type="checkbox"]');

  // Mark complete
  await checkbox.check();
  await expect(task).toHaveClass(/line-through/);
  await expect(task).toContainText(/Completed at/);

  // Unmark
  await checkbox.uncheck();
  await expect(task).not.toHaveClass(/line-through/);
  await expect(task).not.toContainText(/Completed at/);

  // Verify persistence
  await page.reload();
  await expect(checkbox).not.toBeChecked();
});
```

---

## Test Scenario 6: Empty State Display

**Objective**: Verify empty state message shown when no tasks for date

**Preconditions**:
- One task exists on 2025-10-09
- No tasks on 2025-10-10

**Steps**:
1. Open app (current date: 2025-10-10)
2. Verify empty state message: "No tasks for today. Add your first task!"
3. Navigate to 2025-10-09
4. Verify task visible, no empty state
5. Navigate back to 2025-10-10
6. Verify empty state reappears

**Expected Results**:
- ✅ Empty state shown when no tasks for selected date
- ✅ Empty state hidden when tasks exist
- ✅ Message encourages user to add first task

**Automation**:
```typescript
test('empty state display', async ({ page }) => {
  await addTaskForDate(page, 'Task on Oct 9', '2025-10-09');

  // Navigate to Oct 10 (no tasks)
  await page.click('button:has-text("Next →")');
  await expect(page.getByText('No tasks for today')).toBeVisible();

  // Navigate back to Oct 9 (has task)
  await page.click('button:has-text("← Prev")');
  await expect(page.getByText('No tasks for today')).not.toBeVisible();
  await expect(page.locator('[data-testid="task-item"]')).toBeVisible();
});
```

---

## Test Scenario 7: Multi-Tab Detection

**Objective**: Verify app prevents usage in multiple tabs

**Preconditions**:
- App closed in all tabs

**Steps**:
1. Open app in Tab 1
2. Verify normal operation (no warning)
3. Open app in Tab 2 (same browser)
4. Verify warning modal appears in Tab 2
5. Verify message: "App already open in another tab"
6. Attempt to add task in Tab 2
7. Verify all write operations disabled
8. Close Tab 1
9. Wait 5 seconds for lock release
10. Refresh Tab 2
11. Verify normal operation restored

**Expected Results**:
- ✅ First tab acquires lock successfully
- ✅ Second tab shows warning modal within 500ms
- ✅ All write operations disabled in second tab
- ✅ Lock released when first tab closes
- ✅ Second tab can acquire lock after refresh

**Automation**:
```typescript
test('multi-tab detection', async ({ context }) => {
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  // Tab 1 opens normally
  await page1.goto('http://localhost:5173');
  await expect(page1.locator('[role="alertdialog"]')).not.toBeVisible();

  // Tab 2 shows warning
  await page2.goto('http://localhost:5173');
  await expect(page2.locator('[role="alertdialog"]')).toBeVisible();
  await expect(page2.locator('[role="alertdialog"]')).toContainText('already open in another tab');

  // Verify write operations disabled in Tab 2
  await expect(page2.locator('button:has-text("Add Task")')).toBeDisabled();

  // Close Tab 1, wait for lock release
  await page1.close();
  await page2.waitForTimeout(5000);

  // Tab 2 can now operate normally after refresh
  await page2.reload();
  await expect(page2.locator('[role="alertdialog"]')).not.toBeVisible();
  await expect(page2.locator('button:has-text("Add Task")')).toBeEnabled();
});
```

---

## Test Scenario 8: Storage Corruption Handling

**Objective**: Verify app enters read-only mode on storage corruption

**Preconditions**:
- App has valid data in LocalStorage

**Steps**:
1. Open browser DevTools
2. Manually corrupt LocalStorage data:
   ```javascript
   localStorage.setItem('todo-app-data', '{invalid json');
   ```
3. Refresh app
4. Verify error banner appears with message: "Storage corrupted. Read-only mode active."
5. Attempt to add new task
6. Verify "Add Task" button disabled
7. Attempt to edit existing task (if any in corrupted data)
8. Verify edit/delete buttons disabled
9. Clear LocalStorage: `localStorage.clear()`
10. Refresh app
11. Verify normal operation restored (empty state)

**Expected Results**:
- ✅ Corruption detected within 500ms of startup
- ✅ Error banner shown with clear message
- ✅ All write operations disabled
- ✅ Existing tasks (if readable) shown as read-only
- ✅ Normal operation after clearing storage

**Automation**:
```typescript
test('storage corruption handling', async ({ page }) => {
  // Add valid task first
  await addTask(page, 'Valid task');

  // Corrupt storage
  await page.evaluate(() => {
    localStorage.setItem('todo-app-data', '{invalid json');
  });

  // Reload
  await page.reload();

  // Verify read-only mode
  await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-banner"]')).toContainText('Storage corrupted');
  await expect(page.locator('button:has-text("Add Task")')).toBeDisabled();

  // Clear and recover
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('[data-testid="error-banner"]')).not.toBeVisible();
  await expect(page.locator('button:has-text("Add Task")')).toBeEnabled();
});
```

---

## Test Scenario 9: Storage Quota Exceeded

**Objective**: Verify graceful handling when storage quota is full

**Preconditions**:
- LocalStorage has space available

**Steps**:
1. Open app
2. Use script to fill LocalStorage to near quota:
   ```javascript
   for (let i = 0; i < 1000; i++) {
     localStorage.setItem(`filler-${i}`, 'x'.repeat(5000));
   }
   ```
3. Attempt to add new task: "Test quota handling"
4. Verify error toast appears: "Storage quota exceeded. Please delete old tasks."
5. Verify task not added to UI
6. Delete some tasks to free space
7. Attempt to add task again
8. Verify task added successfully

**Expected Results**:
- ✅ Quota error detected on write attempt
- ✅ User-friendly error message shown
- ✅ Task not added to in-memory state
- ✅ App remains functional after clearing space

**Automation**:
```typescript
test('storage quota exceeded', async ({ page }) => {
  // Fill storage
  await page.evaluate(() => {
    for (let i = 0; i < 1000; i++) {
      localStorage.setItem(`filler-${i}`, 'x'.repeat(5000));
    }
  });

  // Attempt to add task
  await page.fill('input[placeholder*="Add a new task"]', 'Test quota');
  await page.click('button:has-text("Add Task")');

  // Verify error
  await expect(page.locator('[role="alert"]')).toContainText('Storage quota exceeded');
  await expect(page.locator('[data-testid="task-item"]')).not.toBeVisible();

  // Clear filler data
  await page.evaluate(() => {
    for (let i = 0; i < 1000; i++) {
      localStorage.removeItem(`filler-${i}`);
    }
  });

  // Retry
  await page.click('button:has-text("Add Task")');
  await expect(page.locator('[data-testid="task-item"]')).toContainText('Test quota');
});
```

---

## Test Scenario 10: Long Task Description Validation

**Objective**: Verify task description validation (1-500 chars)

**Preconditions**:
- App open with empty task list

**Steps**:
1. Leave description empty, click "Add Task"
2. Verify validation error: "Description must be 1-500 characters"
3. Enter 501 character description
4. Verify input truncated to 500 characters (maxLength attribute)
5. Click "Add Task"
6. Verify task added with 500 character description
7. Verify no validation error

**Expected Results**:
- ✅ Empty description rejected with error message
- ✅ Input field enforces 500 char maximum
- ✅ 500 char task saved successfully
- ✅ Validation error clears after valid input

**Automation**:
```typescript
test('task description validation', async ({ page }) => {
  // Empty description
  await page.click('button:has-text("Add Task")');
  await expect(page.locator('[data-testid="validation-error"]')).toContainText('1-500 characters');

  // Max length enforcement
  const longText = 'x'.repeat(600);
  await page.fill('input[placeholder*="Add a new task"]', longText);
  const inputValue = await page.locator('input[placeholder*="Add a new task"]').inputValue();
  expect(inputValue.length).toBe(500);

  // Valid 500 char task
  await page.click('button:has-text("Add Task")');
  await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="task-item"]')).toBeVisible();
});
```

---

## Test Execution Checklist

### Manual Testing (Pre-Automation)
- [ ] Scenario 1: Happy path (5 min)
- [ ] Scenario 2: Edit flow (3 min)
- [ ] Scenario 3: Delete flow (3 min)
- [ ] Scenario 4: Date navigation (4 min)
- [ ] Scenario 5: Toggle completion (3 min)
- [ ] Scenario 6: Empty state (2 min)
- [ ] Scenario 7: Multi-tab (4 min)
- [ ] Scenario 8: Storage corruption (3 min)
- [ ] Scenario 9: Storage quota (3 min)
- [ ] Scenario 10: Validation (3 min)

**Total Manual Testing Time**: ~33 minutes

### Automated Testing (Playwright)
- [ ] All scenarios automated
- [ ] CI/CD pipeline integration
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance assertions (<100ms operations)

---

## Performance Benchmarks

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Task creation | <100ms | TBD | 🟡 Pending |
| Task list render (100 tasks) | <200ms | TBD | 🟡 Pending |
| Storage detection | <500ms | TBD | 🟡 Pending |
| Date navigation | <200ms | TBD | 🟡 Pending |

---

## Browser Compatibility Matrix

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 120+ | 🟡 Not tested | Primary target |
| Firefox | 121+ | 🟡 Not tested | Secondary target |
| Safari | 17+ | 🟡 Not tested | BroadcastChannel fallback needed |
| Edge | 120+ | 🟡 Not tested | Chromium-based |

---

## Helper Functions for Tests

```typescript
// Add task helper
async function addTask(page: Page, description: string) {
  await page.fill('input[placeholder*="Add a new task"]', description);
  await page.click('button:has-text("Add Task")');
  await page.waitForSelector(`[data-testid="task-item"]:has-text("${description}")`);
}

// Add task for specific date
async function addTaskForDate(page: Page, description: string, date: string) {
  await page.evaluate(({ desc, dt }) => {
    const store = JSON.parse(localStorage.getItem('todo-app-data') || '{}');
    const task = {
      id: crypto.randomUUID(),
      description: desc,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      date: dt,
    };
    store.tasks = [...(store.tasks || []), task];
    localStorage.setItem('todo-app-data', JSON.stringify(store));
  }, { desc: description, dt: date });
  await page.reload();
}
```

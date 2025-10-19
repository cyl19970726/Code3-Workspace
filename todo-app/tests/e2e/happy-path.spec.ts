import { test, expect } from '@playwright/test';

/**
 * E2E Test: Happy Path
 * User journey: Open app → Add task → Complete → Reload → Verify persistence
 */
test.describe('Happy Path User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should complete full user journey: add task → complete → persist → reload', async ({
    page,
  }) => {
    // Step 1: Open app
    await page.goto('/');

    // Step 2: Verify app loads successfully
    await expect(page.locator('h1')).toContainText('Daily Todo');

    // Step 3: Verify empty state is shown
    await expect(
      page.getByText(/no tasks for today/i)
    ).toBeVisible();

    // Step 4: Add a new task
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await taskInput.fill('Review code for PR #42');

    const addButton = page.getByRole('button', { name: /add task/i });
    await addButton.click();

    // Step 5: Verify task appears in pending section
    await expect(
      page.getByText('Review code for PR #42')
    ).toBeVisible();

    // Step 6: Verify empty state is hidden
    await expect(
      page.getByText(/no tasks for today/i)
    ).not.toBeVisible();

    // Step 7: Verify pending section header
    await expect(
      page.getByText(/pending.*1/i)
    ).toBeVisible();

    // Step 8: Mark task as complete
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.click();

    // Step 9: Verify task moves to completed section with strike-through
    const taskText = page.getByText('Review code for PR #42');
    await expect(taskText).toHaveClass(/line-through/);

    // Step 10: Verify completion timestamp is shown
    await expect(
      page.getByText(/completed at/i)
    ).toBeVisible();

    // Step 11: Verify completed section header
    await expect(
      page.getByText(/completed.*1/i)
    ).toBeVisible();

    // Step 12: Verify pending section shows 0
    await expect(
      page.getByText(/pending.*0/i)
    ).toBeVisible();

    // Step 13: Verify success toast appears
    await expect(
      page.getByText(/task completed/i)
    ).toBeVisible({ timeout: 2000 });

    // Step 14: Reload page to verify persistence
    await page.reload();

    // Step 15: Wait for app to load
    await expect(page.locator('h1')).toContainText('Daily Todo');

    // Step 16: Verify task is still there after reload
    await expect(
      page.getByText('Review code for PR #42')
    ).toBeVisible();

    // Step 17: Verify task is still marked as completed
    const reloadedTaskText = page.getByText('Review code for PR #42');
    await expect(reloadedTaskText).toHaveClass(/line-through/);

    // Step 18: Verify checkbox is still checked
    const reloadedCheckbox = page.getByRole('checkbox').first();
    await expect(reloadedCheckbox).toBeChecked();

    // Step 19: Verify completed section still shows 1 task
    await expect(
      page.getByText(/completed.*1/i)
    ).toBeVisible();
  });

  test('should handle multiple tasks correctly', async ({ page }) => {
    await page.goto('/');

    // Add multiple tasks
    const taskInput = page.getByPlaceholder(/add a new task/i);

    await taskInput.fill('Task 1');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Task 1')).toBeVisible();

    await taskInput.fill('Task 2');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Task 2')).toBeVisible();

    await taskInput.fill('Task 3');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Task 3')).toBeVisible();

    // Verify pending section shows 3 tasks
    await expect(
      page.getByText(/pending.*3/i)
    ).toBeVisible();

    // Complete one task
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(1).click(); // Complete Task 2

    // Verify sections
    await expect(page.getByText(/pending.*2/i)).toBeVisible();
    await expect(page.getByText(/completed.*1/i)).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByText('Task 1')).toBeVisible();
    await expect(page.getByText('Task 2')).toBeVisible();
    await expect(page.getByText('Task 3')).toBeVisible();
  });

  test('should edit task correctly', async ({ page }) => {
    await page.goto('/');

    // Add a task
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await taskInput.fill('Original task');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Original task')).toBeVisible();

    // Click edit button
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Edit dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Modify description
    const editInput = page.getByLabelText(/task description/i);
    await editInput.clear();
    await editInput.fill('Updated task');

    // Save changes
    await page.getByRole('button', { name: /save/i }).click();

    // Verify updated task
    await expect(page.getByText('Updated task')).toBeVisible();
    await expect(page.getByText('Original task')).not.toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText('Updated task')).toBeVisible();
  });

  test('should delete task correctly', async ({ page }) => {
    await page.goto('/');

    // Add a task
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await taskInput.fill('Task to delete');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Task to delete')).toBeVisible();

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByText(/are you sure you want to delete this task/i)
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm|delete/i }).click();

    // Task should be removed
    await expect(page.getByText('Task to delete')).not.toBeVisible();

    // Empty state should appear
    await expect(page.getByText(/no tasks for today/i)).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByText(/no tasks for today/i)).toBeVisible();
  });

  test('should navigate between dates correctly', async ({ page }) => {
    await page.goto('/');

    // Add task for today
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await taskInput.fill('Today task');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Today task')).toBeVisible();

    // Navigate to previous day
    await page.getByRole('button', { name: /previous day/i }).click();

    // Today's task should not be visible
    await expect(page.getByText('Today task')).not.toBeVisible();

    // Empty state should appear
    await expect(page.getByText(/no tasks for/i)).toBeVisible();

    // Navigate back to today
    await page.getByRole('button', { name: /next day/i }).click();

    // Today's task should be visible again
    await expect(page.getByText('Today task')).toBeVisible();
  });
});

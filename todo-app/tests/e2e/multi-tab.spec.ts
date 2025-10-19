import { test, expect } from '@playwright/test';

/**
 * E2E Test: Multi-tab Detection
 * Scenario: Open app in 2 tabs → Second tab shows warning → Disable write operations
 */
test.describe('Multi-tab Detection', () => {
  test('should detect multi-tab and show read-only warning', async ({
    context,
  }) => {
    // Create first tab
    const page1 = await context.newPage();
    await page1.goto('/');
    await page1.evaluate(() => localStorage.clear());
    await page1.reload();

    // Wait for app to initialize in first tab
    await expect(page1.locator('h1')).toContainText('Daily Todo');

    // Verify first tab can add tasks
    const taskInput1 = page1.getByPlaceholder(/add a new task/i);
    await expect(taskInput1).toBeEnabled();

    // Create second tab (simulates multi-tab scenario)
    const page2 = await context.newPage();
    await page2.goto('/');

    // Wait for app to load in second tab
    await expect(page2.locator('h1')).toContainText('Daily Todo');

    // Second tab should detect existing lock and enter read-only mode
    await expect(
      page2.getByText(/read-only mode|another tab is already open/i)
    ).toBeVisible({ timeout: 3000 });

    // Verify second tab's input is disabled
    const taskInput2 = page2.getByPlaceholder(/add a new task/i);
    await expect(taskInput2).toBeDisabled();

    // Verify add button is disabled
    const addButton2 = page2.getByRole('button', { name: /add task/i });
    await expect(addButton2).toBeDisabled();

    // Close first tab
    await page1.close();

    // Wait a moment for second tab to detect the lock release
    await page2.waitForTimeout(2000);

    // Second tab might still be in read-only mode (by design)
    // Or it could automatically acquire the lock (implementation-dependent)
    // This test verifies the warning is shown when lock is detected
  });

  test('should show export and reset options in read-only mode', async ({
    page,
  }) => {
    await page.goto('/');

    // Simulate read-only mode by corrupting storage
    await page.evaluate(() => {
      localStorage.setItem('todo-app-data', 'invalid-json');
    });

    await page.reload();

    // Wait for error banner
    await expect(
      page.getByText(/storage corrupted|read-only mode/i)
    ).toBeVisible();

    // Verify export button is present
    await expect(
      page.getByRole('button', { name: /export/i })
    ).toBeVisible();

    // Verify reset button is present
    await expect(
      page.getByRole('button', { name: /reset/i })
    ).toBeVisible();

    // Verify all write operations are disabled
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await expect(taskInput).toBeDisabled();

    const addButton = page.getByRole('button', { name: /add task/i });
    await expect(addButton).toBeDisabled();
  });

  test('should allow recovery from storage corruption', async ({ page }) => {
    await page.goto('/');

    // Corrupt storage
    await page.evaluate(() => {
      localStorage.setItem('todo-app-data', 'invalid-json');
    });

    await page.reload();

    // Wait for error banner
    await expect(
      page.getByText(/storage corrupted|read-only mode/i)
    ).toBeVisible();

    // Click reset button
    const resetButton = page.getByRole('button', { name: /reset/i });
    await resetButton.click();

    // Handle confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('delete all your tasks');
      await dialog.accept();
    });

    // Wait for page reload
    await page.waitForLoadState('networkidle');

    // Verify app is functional again
    await expect(page.locator('h1')).toContainText('Daily Todo');

    // Verify input is enabled
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await expect(taskInput).toBeEnabled();

    // Add a task to verify functionality
    await taskInput.fill('Test task after recovery');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Test task after recovery')).toBeVisible();
  });

  test('should export data in read-only mode', async ({ page }) => {
    await page.goto('/');

    // Add some tasks first
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await taskInput.fill('Task before corruption');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Task before corruption')).toBeVisible();

    // Corrupt storage (but data is already saved)
    await page.evaluate(() => {
      localStorage.setItem('todo-app-data', 'invalid-json');
    });

    await page.reload();

    // Wait for error banner
    await expect(
      page.getByText(/storage corrupted|read-only mode/i)
    ).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download happened
    expect(download.suggestedFilename()).toContain('todo-app-backup');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should prevent operations in read-only mode', async ({ page }) => {
    await page.goto('/');

    // Corrupt storage to trigger read-only mode
    await page.evaluate(() => {
      localStorage.setItem('todo-app-data', 'invalid-json');
    });

    await page.reload();

    // Wait for read-only mode
    await expect(
      page.getByText(/storage corrupted|read-only mode/i)
    ).toBeVisible();

    // Verify all interactive elements are disabled
    const taskInput = page.getByPlaceholder(/add a new task/i);
    await expect(taskInput).toBeDisabled();

    const addButton = page.getByRole('button', { name: /add task/i });
    await expect(addButton).toBeDisabled();

    // Try to type in disabled input (should not work)
    await taskInput.fill('This should not work');
    const inputValue = await taskInput.inputValue();
    expect(inputValue).toBe('');
  });
});

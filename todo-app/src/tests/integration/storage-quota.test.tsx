import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Storage Quota Management', () => {
  let originalSetItem: typeof localStorage.setItem;

  beforeEach(() => {
    localStorage.clear();
    originalSetItem = localStorage.setItem;
  });

  afterEach(() => {
    localStorage.setItem = originalSetItem;
  });

  it('should detect QuotaExceededError and show warning', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock setItem to throw QuotaExceededError
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    // Try to add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task that exceeds quota');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    // Should show quota error
    await waitFor(() => {
      expect(
        screen.getByText(/storage quota exceeded/i)
      ).toBeInTheDocument();
    });

    // Should show help text
    expect(
      screen.getByText(/please delete old tasks or clear browser data/i)
    ).toBeInTheDocument();
  });

  it('should rollback failed write operation', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add initial task successfully
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Initial task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeInTheDocument();
    });

    // Mock setItem to fail on next write
    let callCount = 0;
    localStorage.setItem = vi.fn((key, value) => {
      callCount++;
      if (callCount > 1) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }
      originalSetItem.call(localStorage, key, value);
    });

    // Try to add another task (should fail)
    await user.type(input, 'Task that fails');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
    });

    // Original task should still be there
    expect(screen.getByText('Initial task')).toBeInTheDocument();

    // Failed task should NOT appear
    expect(screen.queryByText('Task that fails')).not.toBeInTheDocument();

    // Restore setItem and verify storage integrity
    localStorage.setItem = originalSetItem;

    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);

    // Should only have initial task
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].description).toBe('Initial task');
  });

  it('should show storage usage indicator', async () => {
    const { default: App } = await import('../../App');

    render(<App />);

    // Should show storage usage (e.g., "2.5 KB used")
    await waitFor(() => {
      expect(screen.getByText(/\d+\.?\d*\s*(B|KB|MB)\s*used/i)).toBeInTheDocument();
    });
  });

  it('should warn when storage is near quota limit', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock storage usage to return high percentage
    const mockGetStorageUsage = vi.fn().mockResolvedValue({
      used: 9000000, // 9 MB
      quota: 10000000, // 10 MB
      percentage: 90,
    });

    // Add tasks until warning appears
    const input = screen.getByPlaceholderText(/add a new task/i);

    // Simulate high storage usage
    for (let i = 0; i < 100; i++) {
      await user.type(input, `Task ${i}`.repeat(50)); // Long descriptions
      await user.click(screen.getByRole('button', { name: /add task/i }));
    }

    // Should show warning when approaching quota
    await waitFor(() => {
      expect(
        screen.getByText(/storage is almost full.*90%/i)
      ).toBeInTheDocument();
    });
  });

  it('should suggest cleanup actions when quota exceeded', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock quota exceeded
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
    });

    // Should show cleanup suggestions
    expect(
      screen.getByText(/delete old completed tasks/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/export and clear old data/i)).toBeInTheDocument();

    // Should show "Bulk Delete" button
    const bulkDeleteButton = screen.getByRole('button', {
      name: /bulk delete/i,
    });
    expect(bulkDeleteButton).toBeInTheDocument();
  });

  it('should allow bulk deletion of completed tasks', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete multiple tasks
    const input = screen.getByPlaceholderText(/add a new task/i);

    for (let i = 1; i <= 5; i++) {
      await user.type(input, `Task ${i}`);
      await user.click(screen.getByRole('button', { name: /add task/i }));
    }

    await waitFor(() => {
      expect(screen.getByText('Task 5')).toBeInTheDocument();
    });

    // Complete all tasks
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }

    await waitFor(() => {
      expect(screen.getByText(/completed.*5/i)).toBeInTheDocument();
    });

    // Click "Bulk Delete Completed" button
    const bulkDeleteButton = screen.getByRole('button', {
      name: /delete completed/i,
    });
    await user.click(bulkDeleteButton);

    // Confirm deletion
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/delete all 5 completed tasks/i)
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // All tasks should be deleted
    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks).toHaveLength(0);
  });

  it('should allow exporting data before clearing', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add some tasks
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to export');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task to export')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    // Mock download
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');

    const anchorClickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      click: anchorClickSpy,
      setAttribute: vi.fn(),
      href: '',
      download: '',
    } as any);

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(anchorClickSpy).toHaveBeenCalled();
    });

    createObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should calculate accurate storage size', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add tasks with known sizes
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'x'.repeat(100)); // 100 chars
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('x'.repeat(100))).toBeInTheDocument();
    });

    // Storage indicator should update
    const storageSizeText = screen.getByText(/\d+\.?\d*\s*(B|KB|MB)\s*used/i);
    expect(storageSizeText).toBeInTheDocument();

    // Parse size (should be > 100 bytes due to metadata)
    const sizeMatch = storageSizeText.textContent?.match(/(\d+\.?\d*)\s*(B|KB|MB)/);
    expect(sizeMatch).toBeTruthy();
    const size = parseFloat(sizeMatch![1]);
    expect(size).toBeGreaterThan(100);
  });

  it('should prevent write operations when quota is exceeded', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock quota exceeded
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    // Try to add task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
    });

    // All write buttons should be disabled
    expect(screen.getByRole('button', { name: /add task/i })).toBeDisabled();

    // Should show persistent warning
    expect(
      screen.getByText(/resolve storage issue to continue/i)
    ).toBeInTheDocument();
  });

  it('should recover after clearing storage', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock quota exceeded
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
    });

    // Clear storage
    localStorage.setItem = originalSetItem; // Restore
    localStorage.clear();

    // Click "Retry" or refresh
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Should recover
    await waitFor(() => {
      expect(
        screen.queryByText(/storage quota exceeded/i)
      ).not.toBeInTheDocument();
    });

    // Add button should be enabled again
    expect(screen.getByRole('button', { name: /add task/i })).not.toBeDisabled();
  });
});

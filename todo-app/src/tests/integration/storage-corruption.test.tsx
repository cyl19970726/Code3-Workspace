import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Storage Corruption Handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should detect corrupted JSON and enter read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Corrupt the storage
    localStorage.setItem('todo-app-data', 'invalid-json{{{');

    render(<App />);

    // Should show error banner
    await waitFor(() => {
      expect(
        screen.getByText(/storage corrupted.*read-only mode/i)
      ).toBeInTheDocument();
    });

    // Should show repair instructions
    expect(
      screen.getByText(/please clear browser data or contact support/i)
    ).toBeInTheDocument();
  });

  it('should disable all write operations in read-only mode', async () => {
    const { default: App } = await import('../../App');

    localStorage.setItem('todo-app-data', 'invalid-json');

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Add button should be disabled
    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).toBeDisabled();

    // Input should be disabled
    const input = screen.getByPlaceholderText(/add a new task/i);
    expect(input).toBeDisabled();

    // All checkboxes should be disabled
    const checkboxes = screen.queryAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });

    // All edit/delete buttons should be disabled
    const editButtons = screen.queryAllByRole('button', { name: /edit/i });
    editButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
    deleteButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should detect invalid schema and enter read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Valid JSON but invalid schema
    localStorage.setItem(
      'todo-app-data',
      JSON.stringify({
        metadata: { version: '999.0.0' }, // Invalid version
        tasks: 'not-an-array',
        preferences: {},
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });
  });

  it('should detect missing required fields and enter read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Missing required fields
    localStorage.setItem(
      'todo-app-data',
      JSON.stringify({
        tasks: [],
        // missing metadata and preferences
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });
  });

  it('should provide manual recovery option', async () => {
    const { default: App } = await import('../../App');

    localStorage.setItem('todo-app-data', 'invalid-json');

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Should show "Reset Storage" button
    const resetButton = screen.getByRole('button', { name: /reset storage/i });
    expect(resetButton).toBeInTheDocument();

    // Click reset
    await user.click(resetButton);

    // Should show confirmation dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/this will delete all your tasks/i)
    ).toBeInTheDocument();

    // Confirm reset
    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Should clear storage and reload
    await waitFor(() => {
      expect(screen.queryByText(/storage corrupted/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    // Storage should be initialized properly
    const storedData = localStorage.getItem('todo-app-data');
    expect(storedData).not.toBe('invalid-json');
    const parsed = JSON.parse(storedData!);
    expect(parsed.metadata.version).toBe('1.0.0');
  });

  it('should show corrupted data details in console', async () => {
    const { default: App } = await import('../../App');

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Should log error details
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Storage corruption detected'),
      expect.anything()
    );

    consoleErrorSpy.mockRestore();
  });

  it('should prevent navigation away without warning in read-only mode', async () => {
    const { default: App } = await import('../../App');

    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Should show persistent warning
    expect(
      screen.getByText(/do not close this tab before backing up your data/i)
    ).toBeInTheDocument();
  });

  it('should allow exporting corrupted data for recovery', async () => {
    const { default: App } = await import('../../App');

    localStorage.setItem('todo-app-data', 'invalid-json');

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Should show "Export Raw Data" button
    const exportButton = screen.getByRole('button', {
      name: /export raw data/i,
    });
    expect(exportButton).toBeInTheDocument();

    // Mock download
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');
    const downloadLinkClickSpy = vi.fn();

    await user.click(exportButton);

    // Should trigger download
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    createObjectURLSpy.mockRestore();
  });

  it('should detect partial corruption and recover valid tasks', async () => {
    const { default: App } = await import('../../App');

    // Partially corrupted data (valid structure, some invalid tasks)
    localStorage.setItem(
      'todo-app-data',
      JSON.stringify({
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          totalTaskCount: 2,
          oldestTaskDate: '2025-10-10',
          newestTaskDate: '2025-10-10',
        },
        tasks: [
          {
            id: crypto.randomUUID(),
            description: 'Valid task',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            date: '2025-10-10',
          },
          {
            id: 'invalid-uuid', // Invalid
            description: '',
            completed: 'not-boolean', // Invalid
            createdAt: 'invalid-date',
            completedAt: null,
            date: '2025-10-10',
          },
        ],
        preferences: {
          lastViewedDate: '2025-10-10',
          sortOrder: 'newest-first',
        },
      })
    );

    render(<App />);

    await waitFor(() => {
      // Should show warning but not full corruption
      expect(
        screen.getByText(/some tasks could not be loaded/i)
      ).toBeInTheDocument();
    });

    // Valid task should be shown
    expect(screen.getByText('Valid task')).toBeInTheDocument();

    // Should still allow write operations (not fully corrupted)
    const input = screen.getByPlaceholderText(/add a new task/i);
    expect(input).not.toBeDisabled();
  });

  it('should handle localStorage quota exceeded gracefully', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    // Try to add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'New task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Should show quota error
    await waitFor(() => {
      expect(
        screen.getByText(/storage quota exceeded/i)
      ).toBeInTheDocument();
    });

    // Restore original setItem
    localStorage.setItem = originalSetItem;
  });
});

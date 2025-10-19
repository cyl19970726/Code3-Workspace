import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Happy Path', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should complete full user journey: add task → complete → persist', async () => {
    // This will fail - App not implemented yet
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Step 1: Should show empty state on first load
    expect(
      screen.getByText(/no tasks for today/i)
    ).toBeInTheDocument();

    // Step 2: Add a new task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Review code for PR #42');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    // Step 3: Task should appear in pending section
    await waitFor(() => {
      expect(screen.getByText('Review code for PR #42')).toBeInTheDocument();
    });

    // Step 4: Mark task as complete
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Step 5: Task should move to completed section with strike-through
    await waitFor(() => {
      const taskElement = screen.getByText('Review code for PR #42');
      expect(taskElement).toHaveClass(/line-through/);
    });

    // Step 6: Verify completion timestamp is shown
    expect(screen.getByText(/completed at/i)).toBeInTheDocument();

    // Step 7: Verify data persisted to localStorage
    const storedData = localStorage.getItem('todo-app-data');
    expect(storedData).not.toBeNull();

    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].description).toBe('Review code for PR #42');
    expect(parsed.tasks[0].completed).toBe(true);
    expect(parsed.tasks[0].completedAt).not.toBeNull();
  });

  it('should restore tasks after page reload', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();

    // First render: add task
    const { unmount } = render(<App />);

    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Persistent task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Persistent task')).toBeInTheDocument();
    });

    // Unmount (simulate page close)
    unmount();

    // Second render: verify task persisted
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Persistent task')).toBeInTheDocument();
    });
  });
});

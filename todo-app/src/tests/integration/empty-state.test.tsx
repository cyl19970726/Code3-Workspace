import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Empty State Handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should show empty state on first load', async () => {
    const { default: App } = await import('../../App');

    render(<App />);

    // Should show empty state message
    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    // Should show helpful message
    expect(
      screen.getByText(/add your first task to get started/i)
    ).toBeInTheDocument();

    // Should not show task list
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('should hide empty state after adding first task', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Verify empty state is shown
    expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'First task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    // Empty state should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/no tasks for today/i)).not.toBeInTheDocument();
    });

    // Task list should be visible
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('First task')).toBeInTheDocument();
  });

  it('should show empty state again after deleting all tasks', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to delete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to delete')).toBeInTheDocument();
    });

    // Delete the task
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Empty state should appear again
    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('should show different empty state for past dates', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Navigate to yesterday
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Should show date-specific empty state
    await waitFor(() => {
      expect(screen.getByText(/no tasks for this date/i)).toBeInTheDocument();
    });

    // Should not show "today" in message
    expect(screen.queryByText(/no tasks for today/i)).not.toBeInTheDocument();
  });

  it('should show empty state icon/illustration', async () => {
    const { default: App } = await import('../../App');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    // Should show empty state icon (by alt text or role)
    const icon = screen.getByRole('img', { name: /empty state/i });
    expect(icon).toBeInTheDocument();
  });

  it('should show empty state when all tasks are on different dates', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Navigate to yesterday
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Add task for yesterday
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Yesterday task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Yesterday task')).toBeInTheDocument();
    });

    // Navigate to today
    const nextButton = screen.getByRole('button', { name: /next day/i });
    await user.click(nextButton);

    // Should show empty state for today
    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
      expect(screen.queryByText('Yesterday task')).not.toBeInTheDocument();
    });
  });

  it('should show completed tasks count in empty state', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to complete');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/completed.*1/i)).toBeInTheDocument();
    });

    // Should not show "no tasks" since there's a completed task
    expect(screen.queryByText(/no tasks for today/i)).not.toBeInTheDocument();
  });

  it('should focus input field in empty state', async () => {
    const { default: App } = await import('../../App');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    // Input field should be focused for quick task entry
    const input = screen.getByPlaceholderText(/add a new task/i);
    expect(input).toHaveFocus();
  });

  it('should show task count summary when navigating between dates', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add tasks for today
    const input = screen.getByPlaceholderText(/add a new task/i);

    await user.type(input, 'Task 1');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task 2');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    // Navigate to yesterday (empty)
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/no tasks for this date/i)).toBeInTheDocument();
    });

    // Should show hint about today's tasks
    expect(
      screen.getByText(/you have 2 tasks? for today/i)
    ).toBeInTheDocument();
  });

  it('should preserve empty state appearance in read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Corrupt localStorage
    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Should still show empty state (since no tasks can be loaded)
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();

    // Input should be disabled
    const input = screen.getByPlaceholderText(/add a new task/i);
    expect(input).toBeDisabled();
  });
});

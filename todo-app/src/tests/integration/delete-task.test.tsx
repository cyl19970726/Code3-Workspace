import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Delete Task Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should delete task with confirmation', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Step 1: Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to delete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to delete')).toBeInTheDocument();
    });

    // Step 2: Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Step 3: Confirmation dialog should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this task/i)
    ).toBeInTheDocument();

    // Step 4: Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Step 5: Task should be removed
    await waitFor(() => {
      expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
    });

    // Step 6: Should show empty state
    expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();

    // Step 7: Verify deletion persisted to localStorage
    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks).toHaveLength(0);
  });

  it('should cancel deletion', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to keep');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to keep')).toBeInTheDocument();
    });

    // Click delete
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel|no/i });
    await user.click(cancelButton);

    // Task should still exist
    expect(screen.getByText('Task to keep')).toBeInTheDocument();

    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks).toHaveLength(1);
  });

  it('should delete completed task', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Completed task to delete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Completed task to delete')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Delete the completed task
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Task should be removed
    await waitFor(() => {
      expect(
        screen.queryByText('Completed task to delete')
      ).not.toBeInTheDocument();
    });
  });

  it('should delete one task from multiple tasks', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add multiple tasks
    const input = screen.getByPlaceholderText(/add a new task/i);

    await user.type(input, 'Task 1');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task 2');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task 3');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    // Delete Task 2
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]); // Second delete button (Task 2)

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Task 2 should be removed, others should remain
    await waitFor(() => {
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();

    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks).toHaveLength(2);
  });

  it('should disable delete in read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Corrupt localStorage to trigger read-only mode
    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Delete button should be disabled or not present
    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
    deleteButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should show success notification after deletion', async () => {
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

    // Delete task
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await user.click(confirmButton);

    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText(/task deleted/i)).toBeInTheDocument();
    });
  });
});

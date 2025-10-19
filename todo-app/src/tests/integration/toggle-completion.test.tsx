import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Toggle Task Completion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should mark task as complete and show timestamp', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to complete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    // Mark as complete
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Should show strike-through
    await waitFor(() => {
      const taskElement = screen.getByText('Task to complete');
      expect(taskElement).toHaveClass(/line-through/);
    });

    // Should show completion timestamp
    expect(screen.getByText(/completed at/i)).toBeInTheDocument();

    // Verify persisted to storage
    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks[0].completed).toBe(true);
    expect(parsed.tasks[0].completedAt).not.toBeNull();
  });

  it('should unmark completed task', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Completed task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/completed at/i)).toBeInTheDocument();
    });

    // Unmark as complete
    await user.click(checkbox);

    // Should remove strike-through
    await waitFor(() => {
      const taskElement = screen.getByText('Completed task');
      expect(taskElement).not.toHaveClass(/line-through/);
    });

    // Should remove completion timestamp
    expect(screen.queryByText(/completed at/i)).not.toBeInTheDocument();

    // Verify persisted to storage
    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks[0].completed).toBe(false);
    expect(parsed.tasks[0].completedAt).toBeNull();
  });

  it('should separate pending and completed tasks', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add multiple tasks
    const input = screen.getByPlaceholderText(/add a new task/i);

    await user.type(input, 'Pending task 1');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Pending task 2');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task to complete');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    // Complete one task
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[2]); // Complete "Task to complete"

    // Should show section headers
    await waitFor(() => {
      expect(screen.getByText(/pending.*2/i)).toBeInTheDocument();
      expect(screen.getByText(/completed.*1/i)).toBeInTheDocument();
    });

    // Completed task should appear in completed section
    const completedSection = screen.getByText(/completed.*1/i).parentElement;
    expect(completedSection).toContainElement(
      screen.getByText('Task to complete')
    );
  });

  it('should show completion time in relative format', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Just completed');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Just completed')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Should show "just now" or "a few seconds ago"
    await waitFor(() => {
      expect(
        screen.getByText(/completed at.*just now|a few seconds ago/i)
      ).toBeInTheDocument();
    });
  });

  it('should disable completion toggle in read-only mode', async () => {
    const { default: App } = await import('../../App');

    // Corrupt localStorage
    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Checkboxes should be disabled
    const checkboxes = screen.queryAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });

  it('should maintain task order when toggling completion', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add tasks in specific order
    const input = screen.getByPlaceholderText(/add a new task/i);

    await user.type(input, 'Task A');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task B');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task C');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task C')).toBeInTheDocument();
    });

    // Complete Task B
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Task B

    await waitFor(() => {
      const taskB = screen.getByText('Task B');
      expect(taskB).toHaveClass(/line-through/);
    });

    // Verify order: Pending tasks (A, C), Completed tasks (B)
    const pendingSection = screen.getByText(/pending.*2/i).parentElement;
    const completedSection = screen.getByText(/completed.*1/i).parentElement;

    expect(pendingSection).toContainElement(screen.getByText('Task A'));
    expect(pendingSection).toContainElement(screen.getByText('Task C'));
    expect(completedSection).toContainElement(screen.getByText('Task B'));
  });

  it('should show notification on task completion', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to complete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    // Complete task
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText(/task completed/i)).toBeInTheDocument();
    });
  });

  it('should update metadata after toggling completion', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to complete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    // Complete task
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      const storedData = localStorage.getItem('todo-app-data');
      const parsed = JSON.parse(storedData!);

      // Metadata should be updated
      expect(parsed.metadata.lastModified).toBeTruthy();
      expect(new Date(parsed.metadata.lastModified).getTime()).toBeGreaterThan(
        Date.now() - 5000
      ); // Within last 5 seconds
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Edit Task Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should allow editing task description', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Step 1: Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Original task description');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Original task description')).toBeInTheDocument();
    });

    // Step 2: Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Step 3: Edit dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument();

    // Step 4: Modify description
    const editInput = screen.getByLabelText(/task description/i);
    await user.clear(editInput);
    await user.type(editInput, 'Updated task description');

    // Step 5: Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Step 6: Verify updated description is shown
    await waitFor(() => {
      expect(screen.getByText('Updated task description')).toBeInTheDocument();
    });

    expect(screen.queryByText('Original task description')).not.toBeInTheDocument();

    // Step 7: Verify changes persisted to localStorage
    const storedData = localStorage.getItem('todo-app-data');
    expect(storedData).not.toBeNull();

    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks[0].description).toBe('Updated task description');
  });

  it('should preserve completion status when editing', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add and complete a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Task to complete');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Edit the completed task
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const editInput = screen.getByLabelText(/task description/i);
    await user.clear(editInput);
    await user.type(editInput, 'Edited completed task');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify still completed after edit
    await waitFor(() => {
      const taskElement = screen.getByText('Edited completed task');
      expect(taskElement).toHaveClass(/line-through/);
    });

    const storedData = localStorage.getItem('todo-app-data');
    const parsed = JSON.parse(storedData!);
    expect(parsed.tasks[0].completed).toBe(true);
    expect(parsed.tasks[0].completedAt).not.toBeNull();
  });

  it('should cancel edit without saving changes', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Original task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Original task')).toBeInTheDocument();
    });

    // Open edit dialog
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Modify description
    const editInput = screen.getByLabelText(/task description/i);
    await user.clear(editInput);
    await user.type(editInput, 'Modified task');

    // Cancel instead of saving
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify original description unchanged
    expect(screen.getByText('Original task')).toBeInTheDocument();
    expect(screen.queryByText('Modified task')).not.toBeInTheDocument();
  });

  it('should validate edited description', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add a task
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Valid task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Valid task')).toBeInTheDocument();
    });

    // Try to edit with empty description
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const editInput = screen.getByLabelText(/task description/i);
    await user.clear(editInput);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show validation error
    expect(
      screen.getByText(/task description cannot be empty/i)
    ).toBeInTheDocument();

    // Original task should still exist
    expect(screen.getByText('Valid task')).toBeInTheDocument();
  });

  it('should disable edit in read-only mode', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();

    // Corrupt localStorage to trigger read-only mode
    localStorage.setItem('todo-app-data', 'invalid-json');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/storage corrupted/i)).toBeInTheDocument();
    });

    // Edit button should be disabled or not present
    const editButtons = screen.queryAllByRole('button', { name: /edit/i });
    editButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

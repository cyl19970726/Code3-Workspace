import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until TaskForm component is implemented (TDD Red phase)
describe('TaskForm Component', () => {
  it('should reject empty task description', async () => {
    const { default: TaskForm } = await import('../../components/TaskForm');

    const user = userEvent.setup();
    const mockOnAdd = vi.fn();

    render(<TaskForm onAddTask={mockOnAdd} />);

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    // Should show validation error
    expect(
      screen.getByText(/task description cannot be empty/i)
    ).toBeInTheDocument();

    // Should not call onAdd with empty description
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should enforce 500 character maximum', async () => {
    const { default: TaskForm } = await import('../../components/TaskForm');

    const user = userEvent.setup();
    render(<TaskForm onAddTask={vi.fn()} />);

    const input = screen.getByPlaceholderText(/add a new task/i);

    // Try to enter 600 characters
    const longText = 'x'.repeat(600);
    await user.type(input, longText);

    // Input should truncate to 500
    expect(input).toHaveValue('x'.repeat(500));
  });

  it('should accept valid task description', async () => {
    const { default: TaskForm } = await import('../../components/TaskForm');

    const user = userEvent.setup();
    const mockOnAdd = vi.fn();

    render(<TaskForm onAddTask={mockOnAdd} />);

    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Valid task description');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    // Should call onAdd with valid description
    expect(mockOnAdd).toHaveBeenCalledWith('Valid task description');

    // Should clear input after successful add
    expect(input).toHaveValue('');
  });

  it('should trim whitespace from description', async () => {
    const { default: TaskForm } = await import('../../components/TaskForm');

    const user = userEvent.setup();
    const mockOnAdd = vi.fn();

    render(<TaskForm onAddTask={mockOnAdd} />);

    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, '  Task with spaces  ');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    expect(mockOnAdd).toHaveBeenCalledWith('Task with spaces');
  });

  it('should disable add button while read-only', async () => {
    const { default: TaskForm } = await import('../../components/TaskForm');

    render(<TaskForm onAddTask={vi.fn()} readOnly={true} />);

    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/add a new task/i);
    expect(input).toBeDisabled();
  });
});

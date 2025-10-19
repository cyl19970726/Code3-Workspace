import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until TaskItem component is implemented (TDD Red phase)
describe('TaskItem Component', () => {
  const mockTask = {
    id: crypto.randomUUID(),
    description: 'Test task description',
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    date: '2025-10-10',
  };

  it('should render task description', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test task description')).toBeInTheDocument();
  });

  it('should render checkbox for completion toggle', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should show checked checkbox for completed task', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const completedTask = {
      ...mockTask,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    render(
      <TaskItem
        task={completedTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onToggle when checkbox clicked', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const mockOnToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={mockOnToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith(mockTask.id);
  });

  it('should show strike-through for completed task', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const completedTask = {
      ...mockTask,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    render(
      <TaskItem
        task={completedTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const description = screen.getByText('Test task description');
    expect(description).toHaveClass(/line-through/);
  });

  it('should show completion timestamp for completed task', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const completedAt = new Date();
    const completedTask = {
      ...mockTask,
      completed: true,
      completedAt: completedAt.toISOString(),
    };

    render(
      <TaskItem
        task={completedTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/completed at/i)).toBeInTheDocument();
  });

  it('should render edit button', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const mockOnEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={mockOnEdit}
        onDelete={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask.id);
  });

  it('should render delete button', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const mockOnDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('should disable all actions when readOnly', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        readOnly={true}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();

    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeDisabled();

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
  });

  it('should show creation time', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const createdAt = new Date('2025-10-10T10:30:00.000Z');
    const task = {
      ...mockTask,
      createdAt: createdAt.toISOString(),
    };

    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/created at/i)).toBeInTheDocument();
  });

  it('should truncate long descriptions', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const longTask = {
      ...mockTask,
      description: 'x'.repeat(500), // Max length
    };

    render(
      <TaskItem
        task={longTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const description = screen.getByText(/x{50,}/);
    expect(description).toBeInTheDocument();

    // Should show "Read more" button for long text
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
  });

  it('should expand full description when "Read more" clicked', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const longTask = {
      ...mockTask,
      description: 'x'.repeat(500),
    };

    const user = userEvent.setup();

    render(
      <TaskItem
        task={longTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const readMoreButton = screen.getByRole('button', { name: /read more/i });
    await user.click(readMoreButton);

    // Should show full 500 characters
    const description = screen.getByText('x'.repeat(500));
    expect(description).toBeInTheDocument();

    // Should show "Show less" button
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('should show hover effects on interactive elements', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });

    // Hover should add visual feedback
    await user.hover(editButton);

    expect(editButton).toHaveClass(/hover/);
  });

  it('should apply different styles for completed vs pending tasks', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    const { rerender } = render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const pendingElement = screen.getByText('Test task description');
    const pendingClasses = pendingElement.className;

    const completedTask = {
      ...mockTask,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    rerender(
      <TaskItem
        task={completedTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const completedElement = screen.getByText('Test task description');
    const completedClasses = completedElement.className;

    // Classes should differ
    expect(completedClasses).not.toBe(pendingClasses);
  });

  it('should show task ID in data attribute for testing', async () => {
    const { default: TaskItem } = await import('../../components/TaskItem');

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const taskElement = screen.getByText('Test task description').closest('[data-task-id]');
    expect(taskElement).toHaveAttribute('data-task-id', mockTask.id);
  });
});

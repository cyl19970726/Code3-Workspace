import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until App component is implemented (TDD Red phase)
describe('Integration: Date Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should navigate to previous day', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Step 1: Add task for today
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Today task');

    const addButton = screen.getByRole('button', { name: /add task/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Today task')).toBeInTheDocument();
    });

    // Step 2: Navigate to previous day
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Step 3: Should show empty state for yesterday
    await waitFor(() => {
      expect(screen.queryByText('Today task')).not.toBeInTheDocument();
      expect(screen.getByText(/no tasks for/i)).toBeInTheDocument();
    });

    // Step 4: Date display should update
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Should not show today's date
    const todayString = today.toISOString().split('T')[0];
    expect(screen.queryByText(new RegExp(todayString))).not.toBeInTheDocument();
  });

  it('should navigate to next day', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Navigate to previous day first
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Navigate back to today
    const nextButton = screen.getByRole('button', { name: /next day/i });
    await user.click(nextButton);

    // Should be back at today
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    await waitFor(() => {
      expect(screen.getByText(new RegExp(todayString))).toBeInTheDocument();
    });
  });

  it('should persist lastViewedDate preference', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    const { unmount } = render(<App />);

    // Navigate to previous day
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    await waitFor(() => {
      const storedData = localStorage.getItem('todo-app-data');
      const parsed = JSON.parse(storedData!);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      expect(parsed.preferences.lastViewedDate).toBe(yesterdayString);
    });

    // Unmount and re-render (simulate page reload)
    unmount();
    render(<App />);

    // Should open on yesterday
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    expect(screen.queryByText(new RegExp(todayString))).not.toBeInTheDocument();
  });

  it('should show tasks for selected date', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add task for today
    const input = screen.getByPlaceholderText(/add a new task/i);
    await user.type(input, 'Today task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Today task')).toBeInTheDocument();
    });

    // Navigate to previous day
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Add task for yesterday
    await user.type(input, 'Yesterday task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Yesterday task')).toBeInTheDocument();
      expect(screen.queryByText('Today task')).not.toBeInTheDocument();
    });

    // Navigate back to today
    const nextButton = screen.getByRole('button', { name: /next day/i });
    await user.click(nextButton);

    // Should show today's task only
    await waitFor(() => {
      expect(screen.getByText('Today task')).toBeInTheDocument();
      expect(screen.queryByText('Yesterday task')).not.toBeInTheDocument();
    });
  });

  it('should use date picker for quick navigation', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Click on date display to open date picker
    const dateDisplay = screen.getByRole('button', { name: /pick date/i });
    await user.click(dateDisplay);

    // Date picker should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Select a date (e.g., 7 days ago)
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - 7);

    const dayButton = screen.getByRole('button', {
      name: new RegExp(targetDate.getDate().toString()),
    });
    await user.click(dayButton);

    // Should navigate to selected date
    await waitFor(() => {
      const targetString = targetDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      expect(screen.getByText(new RegExp(targetString))).toBeInTheDocument();
    });
  });

  it('should show today indicator in date picker', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Open date picker
    const dateDisplay = screen.getByRole('button', { name: /pick date/i });
    await user.click(dateDisplay);

    // Today should be highlighted
    const today = new Date();
    const todayButton = screen.getByRole('button', {
      name: new RegExp(`${today.getDate()}.*today`, 'i'),
    });

    expect(todayButton).toHaveClass(/today/);
  });

  it('should disable next day navigation for future dates', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Next button should be disabled when viewing today (no future dates)
    const nextButton = screen.getByRole('button', { name: /next day/i });
    expect(nextButton).toBeDisabled();

    // Navigate to yesterday
    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    // Now next button should be enabled
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('should show task count per date in calendar view', async () => {
    const { default: App } = await import('../../App');

    const user = userEvent.setup();
    render(<App />);

    // Add multiple tasks for today
    const input = screen.getByPlaceholderText(/add a new task/i);

    await user.type(input, 'Task 1');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task 2');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(input, 'Task 3');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Open date picker
    const dateDisplay = screen.getByRole('button', { name: /pick date/i });
    await user.click(dateDisplay);

    // Today's date should show task count
    const today = new Date();
    const todayButton = screen.getByRole('button', {
      name: new RegExp(`${today.getDate()}.*3 tasks?`, 'i'),
    });

    expect(todayButton).toBeInTheDocument();
  });
});

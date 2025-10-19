import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// This test will fail until DatePicker component is implemented (TDD Red phase)
describe('DatePicker Component', () => {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  it('should render current date display', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    // Should show formatted date (e.g., "October 10, 2025")
    const dateDisplay = screen.getByText(
      new RegExp(today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    );
    expect(dateDisplay).toBeInTheDocument();
  });

  it('should render previous day button', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    const prevButton = screen.getByRole('button', { name: /previous day/i });
    expect(prevButton).toBeInTheDocument();
  });

  it('should render next day button', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: /next day/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('should call onDateChange with previous date when prev button clicked', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const mockOnDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={mockOnDateChange} />);

    const prevButton = screen.getByRole('button', { name: /previous day/i });
    await user.click(prevButton);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    expect(mockOnDateChange).toHaveBeenCalledWith(yesterdayISO);
  });

  it('should call onDateChange with next date when next button clicked', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const mockOnDateChange = vi.fn();
    const user = userEvent.setup();

    // Use yesterday as selected date so next is enabled
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    render(<DatePicker selectedDate={yesterdayISO} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /next day/i });
    await user.click(nextButton);

    expect(mockOnDateChange).toHaveBeenCalledWith(todayISO);
  });

  it('should disable next button when viewing today', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: /next day/i });
    expect(nextButton).toBeDisabled();
  });

  it('should enable next button when viewing past date', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    render(<DatePicker selectedDate={yesterdayISO} onDateChange={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: /next day/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('should open calendar dialog when date display clicked', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    const dateButton = screen.getByRole('button', { name: /pick date/i });
    await user.click(dateButton);

    // Calendar dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/select date/i)).toBeInTheDocument();
  });

  it('should render calendar grid in dialog', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Should show month/year header
    const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(monthYear)).toBeInTheDocument();

    // Should show day names
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should highlight selected date in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Today's date button should be highlighted
    const todayButton = screen.getByRole('button', {
      name: new RegExp(`${today.getDate()}.*selected`, 'i'),
    });

    expect(todayButton).toHaveClass(/selected|active/);
  });

  it('should show today indicator in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Today should have special indicator
    const todayButton = screen.getByRole('button', {
      name: new RegExp(`${today.getDate()}.*today`, 'i'),
    });

    expect(todayButton).toBeInTheDocument();
  });

  it('should call onDateChange when date selected in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const mockOnDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={mockOnDateChange} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Click on a different date (e.g., 15th)
    const dateButton = screen.getByRole('button', { name: /^15$/i });
    await user.click(dateButton);

    expect(mockOnDateChange).toHaveBeenCalled();

    // Should close dialog after selection
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should navigate to previous month in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    const prevMonthButton = screen.getByRole('button', { name: /previous month/i });
    await user.click(prevMonthButton);

    // Should show previous month
    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(prevMonthName)).toBeInTheDocument();
  });

  it('should navigate to next month in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    const nextMonthButton = screen.getByRole('button', { name: /next month/i });
    await user.click(nextMonthButton);

    // Should show next month
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(nextMonthName)).toBeInTheDocument();
  });

  it('should show task count per date in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    const taskCounts = {
      [todayISO]: 3,
      '2025-10-09': 1,
      '2025-10-08': 5,
    };

    render(
      <DatePicker
        selectedDate={todayISO}
        onDateChange={vi.fn()}
        taskCounts={taskCounts}
      />
    );

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Today should show "3 tasks"
    const todayButton = screen.getByRole('button', {
      name: new RegExp(`${today.getDate()}.*3 tasks?`, 'i'),
    });

    expect(todayButton).toBeInTheDocument();
  });

  it('should close calendar when clicking outside', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click on dialog backdrop
    const dialog = screen.getByRole('dialog');
    await user.click(dialog.parentElement!); // Click backdrop

    // Dialog should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close calendar when pressing Escape', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    // Dialog should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show "Today" button in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    // Start with past date
    const pastDate = '2025-09-01';

    render(<DatePicker selectedDate={pastDate} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Should show "Today" quick action button
    const todayButton = screen.getByRole('button', { name: /^today$/i });
    expect(todayButton).toBeInTheDocument();
  });

  it('should jump to today when "Today" button clicked', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const mockOnDateChange = vi.fn();
    const user = userEvent.setup();

    const pastDate = '2025-09-01';

    render(<DatePicker selectedDate={pastDate} onDateChange={mockOnDateChange} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    const todayButton = screen.getByRole('button', { name: /^today$/i });
    await user.click(todayButton);

    expect(mockOnDateChange).toHaveBeenCalledWith(todayISO);
  });

  it('should disable future dates in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Navigate to next month
    const nextMonthButton = screen.getByRole('button', { name: /next month/i });
    await user.click(nextMonthButton);

    // All dates should be disabled (future)
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(15); // 15th of next month

    const futureDateButton = screen.getByRole('button', { name: /^15$/i });
    expect(futureDateButton).toBeDisabled();
  });

  it('should format date according to locale', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    render(
      <DatePicker
        selectedDate={todayISO}
        onDateChange={vi.fn()}
        locale="en-US"
      />
    );

    // US format: "Month Day, Year"
    const dateDisplay = screen.getByText(
      new RegExp(today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    );

    expect(dateDisplay).toBeInTheDocument();
  });

  it('should show keyboard navigation hints in calendar', async () => {
    const { default: DatePicker } = await import('../../components/DatePicker');

    const user = userEvent.setup();

    render(<DatePicker selectedDate={todayISO} onDateChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pick date/i }));

    // Should show keyboard hints
    expect(
      screen.getByText(/arrow keys to navigate/i)
    ).toBeInTheDocument();
  });
});

import { format, parseISO as dateFnsParseISO, addDays as dateFnsAddDays } from 'date-fns';

/**
 * Date utilities for consistent date handling across the application
 * All dates stored as YYYY-MM-DD strings in UTC
 */

/**
 * Normalize date to UTC ISO string (YYYY-MM-DD format)
 */
export function normalizeToUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 * @param date Date object or ISO string
 * @param formatString date-fns format string
 */
export function formatDate(
  date: Date | string,
  formatString: string
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Validate if string is a valid YYYY-MM-DD date
 */
export function isValidDateString(dateString: string): boolean {
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Check if valid date
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validate ranges
  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  // Check if date is actually valid (handles leap years, etc.)
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  return true;
}

/**
 * Add days to a date string
 * @param dateString YYYY-MM-DD format
 * @param days Number of days to add (can be negative)
 */
export function addDays(dateString: string, days: number): string {
  const date = parseISO(dateString);
  const newDate = dateFnsAddDays(date, days);
  return normalizeToUTC(newDate);
}

/**
 * Parse ISO date string to Date object
 * @param dateString YYYY-MM-DD format or full ISO string
 */
export function parseISO(dateString: string): Date {
  return dateFnsParseISO(dateString);
}

/**
 * Check if date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayISO();
}

/**
 * Check if date is in the past
 */
export function isPast(dateString: string): boolean {
  return dateString < getTodayISO();
}

/**
 * Check if date is in the future
 */
export function isFuture(dateString: string): boolean {
  return dateString > getTodayISO();
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) {
    return 'just now';
  } else if (diffSec < 60) {
    return 'a few seconds ago';
  } else if (diffMin === 1) {
    return '1 minute ago';
  } else if (diffMin < 60) {
    return `${diffMin} minutes ago`;
  } else if (diffHour === 1) {
    return '1 hour ago';
  } else if (diffHour < 24) {
    return `${diffHour} hours ago`;
  } else if (diffDay === 1) {
    return 'yesterday';
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return formatDate(dateObj, 'MMM dd, yyyy');
  }
}

/**
 * Get start of month for a given date
 */
export function getStartOfMonth(dateString: string): string {
  const date = parseISO(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Get end of month for a given date
 */
export function getEndOfMonth(dateString: string): string {
  const date = parseISO(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();

  // Last day of month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(lastDay).padStart(2, '0');

  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Get array of dates in a month
 */
export function getDatesInMonth(dateString: string): string[] {
  const start = parseISO(getStartOfMonth(dateString));
  const end = parseISO(getEndOfMonth(dateString));

  const dates: string[] = [];
  let current = start;

  while (current <= end) {
    dates.push(normalizeToUTC(current));
    current = dateFnsAddDays(current, 1);
  }

  return dates;
}

/**
 * Get day name for a date
 */
export function getDayName(dateString: string, short: boolean = false): string {
  const date = parseISO(dateString);
  return formatDate(date, short ? 'EEE' : 'EEEE');
}

/**
 * Get month name for a date
 */
export function getMonthName(dateString: string, short: boolean = false): string {
  const date = parseISO(dateString);
  return formatDate(date, short ? 'MMM' : 'MMMM');
}

import { describe, it, expect } from 'vitest';

// These tests will fail until dateUtils.ts is implemented (TDD Red phase)
describe('Date Utilities', () => {
  describe('normalizeToUTC', () => {
    it('should convert date to UTC ISO string', async () => {
      const { normalizeToUTC } = await import('../../utils/dateUtils');

      const date = new Date('2025-10-10T14:30:00.000Z');
      const result = normalizeToUTC(date);

      expect(result).toBe('2025-10-10');
    });

    it('should handle different timezones correctly', async () => {
      const { normalizeToUTC } = await import('../../utils/dateUtils');

      // Date in PST (UTC-8)
      const date = new Date('2025-10-10T02:00:00.000-08:00');
      const result = normalizeToUTC(date);

      // Should normalize to UTC date
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return YYYY-MM-DD format', async () => {
      const { normalizeToUTC } = await import('../../utils/dateUtils');

      const date = new Date();
      const result = normalizeToUTC(date);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDate', () => {
    it('should format date for display', async () => {
      const { formatDate } = await import('../../utils/dateUtils');

      const date = new Date('2025-10-10T14:30:00.000Z');
      const result = formatDate(date, 'MMMM d, yyyy');

      expect(result).toBe('October 10, 2025');
    });

    it('should format ISO string dates', async () => {
      const { formatDate } = await import('../../utils/dateUtils');

      const result = formatDate('2025-10-10', 'MMM dd, yyyy');

      expect(result).toBe('Oct 10, 2025');
    });

    it('should support different formats', async () => {
      const { formatDate } = await import('../../utils/dateUtils');

      const date = '2025-10-10';

      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-10-10');
      expect(formatDate(date, 'MM/dd/yyyy')).toBe('10/10/2025');
      expect(formatDate(date, 'EEEE, MMMM d, yyyy')).toContain('2025');
    });

    it('should format time correctly', async () => {
      const { formatDate } = await import('../../utils/dateUtils');

      const datetime = new Date('2025-10-10T07:30:00.000Z');
      const result = formatDate(datetime, 'h:mm a');

      expect(result).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
    });
  });

  describe('getTodayISO', () => {
    it('should return today in YYYY-MM-DD format', async () => {
      const { getTodayISO } = await import('../../utils/dateUtils');

      const result = getTodayISO();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should match current date
      const now = new Date();
      const expected = now.toISOString().split('T')[0];
      expect(result).toBe(expected);
    });
  });

  describe('isValidDateString', () => {
    it('should validate correct YYYY-MM-DD format', async () => {
      const { isValidDateString } = await import('../../utils/dateUtils');

      expect(isValidDateString('2025-10-10')).toBe(true);
      expect(isValidDateString('2025-01-01')).toBe(true);
      expect(isValidDateString('2025-12-31')).toBe(true);
    });

    it('should reject invalid formats', async () => {
      const { isValidDateString } = await import('../../utils/dateUtils');

      expect(isValidDateString('10-10-2025')).toBe(false);
      expect(isValidDateString('2025/10/10')).toBe(false);
      expect(isValidDateString('10/10/2025')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
    });

    it('should reject invalid dates', async () => {
      const { isValidDateString } = await import('../../utils/dateUtils');

      expect(isValidDateString('2025-13-01')).toBe(false); // Invalid month
      expect(isValidDateString('2025-02-30')).toBe(false); // Invalid day
      expect(isValidDateString('2025-00-01')).toBe(false); // Invalid month
      expect(isValidDateString('2025-01-00')).toBe(false); // Invalid day
    });

    it('should validate leap years correctly', async () => {
      const { isValidDateString } = await import('../../utils/dateUtils');

      expect(isValidDateString('2024-02-29')).toBe(true); // Leap year
      expect(isValidDateString('2025-02-29')).toBe(false); // Not leap year
    });
  });

  describe('addDays', () => {
    it('should add days to a date', async () => {
      const { addDays } = await import('../../utils/dateUtils');

      const result = addDays('2025-10-10', 1);
      expect(result).toBe('2025-10-11');
    });

    it('should subtract days from a date', async () => {
      const { addDays } = await import('../../utils/dateUtils');

      const result = addDays('2025-10-10', -1);
      expect(result).toBe('2025-10-09');
    });

    it('should handle month boundaries', async () => {
      const { addDays } = await import('../../utils/dateUtils');

      const result = addDays('2025-10-31', 1);
      expect(result).toBe('2025-11-01');
    });

    it('should handle year boundaries', async () => {
      const { addDays } = await import('../../utils/dateUtils');

      const result = addDays('2025-12-31', 1);
      expect(result).toBe('2026-01-01');
    });
  });

  describe('parseISO', () => {
    it('should parse ISO date string to Date object', async () => {
      const { parseISO } = await import('../../utils/dateUtils');

      const result = parseISO('2025-10-10');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(9); // October (0-indexed)
      expect(result.getDate()).toBe(10);
    });

    it('should parse ISO datetime string', async () => {
      const { parseISO } = await import('../../utils/dateUtils');

      const result = parseISO('2025-10-10T14:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-10T14:30:00.000Z');
    });
  });
});

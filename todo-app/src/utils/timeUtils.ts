/**
 * Parses a time input string (e.g., '90', '1.5h', '90m') into minutes.
 * Returns null if the input is empty.
 * Returns NaN if the input is invalid.
 */
export function parseTimeInput(input: string): number | null {
  if (!input || input.trim() === '') return null;
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed.endsWith('h')) {
    const val = parseFloat(trimmed.replace('h', ''));
    return isNaN(val) ? NaN : Math.round(val * 60);
  } else if (trimmed.endsWith('m')) {
    const val = parseFloat(trimmed.replace('m', ''));
    return isNaN(val) ? NaN : Math.round(val);
  } else {
    // To prevent parsing like '30 abc' as 30, we check if String(parseFloat) matches the number part
    // Actually, Number(trimmed) is stricter than parseFloat
    const num = Number(trimmed);
    return isNaN(num) ? NaN : Math.round(num);
  }
}

/**
 * Validates that the parsed minutes are within the allowed bounds.
 * Returns an error string if invalid, or null if valid.
 */
export function validateTimeInput(minutes: number | null): string | null {
  if (minutes === null) return null; // Optional, so null is valid
  if (isNaN(minutes)) return 'Invalid time format';
  if (minutes < 60 || minutes > 960) return 'Time must be between 60 and 960 minutes';
  return null;
}

/**
 * Formats minutes into a human-readable string like '1h 30m'.
 */
export function formatTime(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes)) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Resolve a business date from a form/API value.
 * Date-only strings (e.g. from `<input type="date">`) become UTC midnight with
 * `new Date("YYYY-MM-DD")`, which shows as 07:00 in Thailand.
 * Match purchases: keep the calendar day and stamp the current local time.
 */
export function resolveBusinessDate(dateInput: unknown, fallback: Date = new Date()): Date {
  if (typeof dateInput === 'string' && dateInput.trim()) {
    const trimmed = dateInput.trim();
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (ymd) {
      const now = new Date();
      return new Date(
        Number(ymd[1]),
        Number(ymd[2]) - 1,
        Number(ymd[3]),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      );
    }

    if (trimmed.includes('T') || /:\d{2}/.test(trimmed)) {
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? fallback : parsed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    return dateInput;
  }

  return fallback;
}

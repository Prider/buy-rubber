const THAI_TIMEZONE_OFFSET = '+07:00';

export interface ExpenseInputData {
  category?: string;
  amount?: number | string | null;
  description?: string | null;
}

export interface ParsedExpenseDate {
  date: Date;
  year: number;
  month: string;
  day: string;
}

export interface ValidatedExpenseInput {
  category: string;
  amount: number;
  description: string | null;
}

/**
 * Parses a date string and extracts calendar parts.
 * datetime-local values have no timezone and are treated as Thailand time (UTC+7).
 */
export function parseExpenseDate(dateString?: string): ParsedExpenseDate {
  let date: Date;
  let year: number;
  let month: string;
  let day: string;

  if (dateString) {
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const hasTimezone = dateString.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(dateString);

    date = hasTimezone ? new Date(dateString) : new Date(dateString + THAI_TIMEZONE_OFFSET);

    if (dateMatch) {
      year = parseInt(dateMatch[1], 10);
      month = dateMatch[2];
      day = dateMatch[3];
    } else {
      year = date.getFullYear();
      month = String(date.getMonth() + 1).padStart(2, '0');
      day = String(date.getDate()).padStart(2, '0');
    }
  } else {
    date = new Date();
    year = date.getFullYear();
    month = String(date.getMonth() + 1).padStart(2, '0');
    day = String(date.getDate()).padStart(2, '0');
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return { date, year, month, day };
}

export function validateExpenseData(data: ExpenseInputData): ValidatedExpenseInput {
  const category = data.category?.trim();
  if (!category) {
    throw new Error('Category is required');
  }

  if (data.amount === undefined || data.amount === null || data.amount === 0) {
    throw new Error('Amount is required and must be greater than 0');
  }

  const parsedAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error(`Invalid amount: ${data.amount}`);
  }

  return {
    category,
    amount: Math.abs(parsedAmount),
    description: data.description?.trim() || null,
  };
}

/** Value for an `<input type="datetime-local">` in the viewer's local time. */
export function toDateTimeLocalValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

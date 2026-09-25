/**
 * Shared helpers for parsing sale expense payloads in API routes.
 */

export type ParsedExpenseLine = {
  type: string;
  amount: number;
  note: string | null;
};

export type ParsedExpensesResult = {
  expenses: ParsedExpenseLine[];
  expenseCost: number | null;
  expenseType: string | null;
  notes: string | null;
  error?: string;
};

/** Denormalized type label for history table (e.g. "ค่าขนส่ง (+1)"). */
export function summarizeExpenseType(expenses: Array<{ type: string }>): string | null {
  if (expenses.length === 0) return null;
  const firstType = expenses.find((e) => e.type)?.type || null;
  if (!firstType) return null;
  if (expenses.length === 1) return firstType;
  return `${firstType} (+${expenses.length - 1})`;
}

export function parseSaleExpensesFromBody(data: {
  expenses?: unknown;
  expenseType?: unknown;
  expenseCost?: unknown;
  notes?: unknown;
}): ParsedExpensesResult {
  if (Array.isArray(data.expenses)) {
    const expenses: ParsedExpenseLine[] = [];

    for (let i = 0; i < data.expenses.length; i++) {
      const raw = data.expenses[i] as {
        type?: unknown;
        amount?: unknown;
        note?: unknown;
      };
      const type = raw?.type != null ? String(raw.type).trim() : '';
      const amountRaw = raw?.amount;
      const amount =
        amountRaw === undefined || amountRaw === null || amountRaw === ''
          ? 0
          : Number(amountRaw);
      const note =
        raw?.note != null && String(raw.note).trim() ? String(raw.note).trim() : null;

      if (Number.isNaN(amount) || amount < 0) {
        return {
          expenses: [],
          expenseCost: null,
          expenseType: null,
          notes: null,
          error: `ค่าใช้จ่ายรายการที่ ${i + 1} ไม่ถูกต้อง`,
        };
      }
      if (amount > 0 && !type) {
        return {
          expenses: [],
          expenseCost: null,
          expenseType: null,
          notes: null,
          error: `กรุณาเลือกชนิดค่าใช้จ่ายรายการที่ ${i + 1}`,
        };
      }
      if (!type && amount === 0 && !note) continue;

      expenses.push({ type: type || 'อื่นๆ', amount, note });
    }

    const expenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const notes = expenses
      .map((e) => e.note)
      .filter(Boolean)
      .join('; ');

    return {
      expenses,
      expenseCost: expenseCost > 0 ? expenseCost : null,
      expenseType: summarizeExpenseType(expenses),
      notes: notes || null,
    };
  }

  // Legacy single-field payload
  const expenseCost =
    data.expenseCost === undefined || data.expenseCost === null || data.expenseCost === ''
      ? null
      : Number(data.expenseCost);

  if (expenseCost !== null && (Number.isNaN(expenseCost) || expenseCost < 0)) {
    return {
      expenses: [],
      expenseCost: null,
      expenseType: null,
      notes: null,
      error: 'ค่าใช้จ่ายไม่ถูกต้อง',
    };
  }

  const expenseType = data.expenseType ? String(data.expenseType) : null;
  const notes = data.notes ? String(data.notes) : null;
  const expenses: ParsedExpenseLine[] =
    expenseCost != null && expenseCost > 0
      ? [{ type: expenseType || 'อื่นๆ', amount: expenseCost, note: notes }]
      : expenseType || notes
        ? [{ type: expenseType || 'อื่นๆ', amount: expenseCost ?? 0, note: notes }]
        : [];

  return {
    expenses,
    expenseCost,
    expenseType,
    notes,
  };
}

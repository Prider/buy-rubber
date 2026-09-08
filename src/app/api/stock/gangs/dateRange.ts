export type GangDateRange = {
  startDate?: Date;
  endDate?: Date;
};

export type GangListWhere = {
  productTypeId: string;
  AND?: Array<Record<string, unknown>>;
};

function parseDateOrNull(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseGangDateRange(
  startRaw: string | null,
  endRaw: string | null,
): { ok: true; startDate?: Date; endDate?: Date } | { ok: false } {
  const parsedStart = parseDateOrNull(startRaw);
  const parsedEnd = parseDateOrNull(endRaw);
  const startDate = parsedStart ? startOfDay(parsedStart) : undefined;
  const endDate = parsedEnd ? endOfDay(parsedEnd) : undefined;

  if (startDate && endDate && startDate > endDate) {
    return { ok: false };
  }

  return { ok: true, startDate, endDate };
}

/** Gangs whose cycle overlaps [startDate, endDate]. Open gangs (endDate null) stay included. */
export function buildGangWhere(productTypeId: string, range: GangDateRange): GangListWhere {
  const where: GangListWhere = { productTypeId };
  const and: Array<Record<string, unknown>> = [];

  if (range.endDate) {
    and.push({ startDate: { lte: range.endDate } });
  }
  if (range.startDate) {
    and.push({
      OR: [{ endDate: null }, { endDate: { gte: range.startDate } }],
    });
  }
  if (and.length > 0) {
    where.AND = and;
  }
  return where;
}

export function gangOverlapsRange(
  gang: { startDate: Date; endDate: Date | null },
  range: GangDateRange,
): boolean {
  if (range.endDate && gang.startDate.getTime() > range.endDate.getTime()) {
    return false;
  }
  if (range.startDate && gang.endDate != null && gang.endDate.getTime() < range.startDate.getTime()) {
    return false;
  }
  return true;
}

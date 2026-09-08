import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache } from '@/lib/cache';
import { countTransactionGroupsCached } from '@/lib/purchases/transactionCountCache';
import { countTransactionGroups } from '@/lib/purchases/transactionQuery';
import type { TransactionQueryFilters } from '@/lib/purchases/transactionQuery';

vi.mock('@/lib/purchases/transactionQuery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/purchases/transactionQuery')>();
  return {
    ...actual,
    countTransactionGroups: vi.fn(),
  };
});

describe('countTransactionGroupsCached', () => {
  const filters: TransactionQueryFilters = {
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: new Date('2024-03-31T23:59:59.999Z'),
  };

  beforeEach(() => {
    cache.clear();
    vi.mocked(countTransactionGroups).mockReset();
    vi.mocked(countTransactionGroups).mockResolvedValue(3630);
  });

  it('counts once and reuses the cached total for the same filters', async () => {
    const first = await countTransactionGroupsCached(filters);
    const second = await countTransactionGroupsCached(filters);

    expect(first).toBe(3630);
    expect(second).toBe(3630);
    expect(countTransactionGroups).toHaveBeenCalledTimes(1);
  });

  it('recounts when filters change', async () => {
    await countTransactionGroupsCached(filters);
    vi.mocked(countTransactionGroups).mockResolvedValue(12);

    const searched = await countTransactionGroupsCached({
      ...filters,
      searchTerm: 'สมชาย',
      searchMemberIds: ['member-1'],
    });

    expect(searched).toBe(12);
    expect(countTransactionGroups).toHaveBeenCalledTimes(2);
  });
});

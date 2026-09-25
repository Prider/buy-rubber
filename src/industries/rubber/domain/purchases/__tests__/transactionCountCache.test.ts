import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache } from '@/shared/cache';
import { countTransactionGroupsCached } from '@/industries/rubber/domain/purchases/transactionCountCache';
import { countTransactionGroups } from '@/industries/rubber/domain/purchases/transactionQuery';
import type { TransactionQueryFilters } from '@/industries/rubber/domain/purchases/transactionQuery';

vi.mock('@/industries/rubber/domain/purchases/transactionQuery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/industries/rubber/domain/purchases/transactionQuery')>();
  return {
    ...actual,
    countTransactionGroups: vi.fn(),
  };
});

describe('countTransactionGroupsCached', () => {
  const filters: TransactionQueryFilters = {
    tenantId: 'tenant-1',
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

import { cache, CACHE_KEYS, CACHE_TTL, generateCacheKey } from '@/lib/cache';
import {
  countTransactionGroups,
  type TransactionQueryFilters,
} from '@/lib/purchases/transactionQuery';

export function transactionGroupCountCacheKey(filters: TransactionQueryFilters): string {
  return generateCacheKey(CACHE_KEYS.PURCHASE_TX_COUNT, {
    startDate: filters.startDate.toISOString(),
    endDate: filters.endDate.toISOString(),
    memberId: filters.memberId ?? '',
    search: filters.searchTerm ?? '',
    searchMemberIds: [...(filters.searchMemberIds ?? [])].sort().join(','),
  });
}

export async function countTransactionGroupsCached(
  filters: TransactionQueryFilters,
): Promise<number> {
  const key = transactionGroupCountCacheKey(filters);
  const cached = cache.get<number>(key);
  if (cached != null) {
    return cached;
  }

  const total = await countTransactionGroups(filters);
  cache.set(key, total, CACHE_TTL.PURCHASE_TX_COUNT);
  return total;
}

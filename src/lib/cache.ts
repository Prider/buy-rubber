/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Used for caching API responses to reduce database load
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Delete all keys matching a pattern (useful for cache invalidation)
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries (can be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Export singleton instance
export const cache = new Cache();

// Cache key constants
export const CACHE_KEYS = {
  DASHBOARD: 'dashboard:stats',
  PRODUCT_TYPES: 'product-types:all',
  MEMBERS: (params?: string) => `members:${params || 'default'}`,
} as const;

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  DASHBOARD_LONG: 10 * 60 * 1000, // 10 minutes
  PRODUCT_TYPES: 30 * 60 * 1000, // 30 minutes (product types don't change often)
  MEMBERS: 5 * 60 * 1000, // 5 minutes
} as const;

// Helper function to generate cache key from request params
export function generateCacheKey(prefix: string, params: Record<string, string | null>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value || ''}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}


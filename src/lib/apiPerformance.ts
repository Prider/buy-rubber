export const SLOW_API_THRESHOLD_MS = 1000;
const MAX_RECENT_REQUESTS = 500;
const MAX_SAMPLES_PER_ROUTE = 200;

export interface ApiRequestMetric {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export interface ApiRouteStats {
  routeKey: string;
  method: string;
  path: string;
  count: number;
  errorCount: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  lastStatus: number;
  lastRequestAt: string;
}

export interface ApiPerformanceSummary {
  startedAt: string;
  uptimeMs: number;
  totalRequests: number;
  totalErrors: number;
  slowRequestThresholdMs: number;
  slowRequestCount: number;
  routes: ApiRouteStats[];
  recentSlowRequests: ApiRequestMetric[];
  recentRequests: ApiRequestMetric[];
}

interface RouteAccumulator {
  method: string;
  path: string;
  count: number;
  errorCount: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
  durations: number[];
  lastStatus: number;
  lastRequestAt: string;
}

const startedAt = Date.now();
const routeStats = new Map<string, RouteAccumulator>();
const recentRequests: ApiRequestMetric[] = [];
const recentSlowRequests: ApiRequestMetric[] = [];

export function normalizeApiPath(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return ':id';
      }

      if (/^[a-z0-9_-]{16,}$/i.test(segment)) {
        return ':id';
      }

      if (/^\d+$/.test(segment)) {
        return ':id';
      }

      return segment;
    })
    .join('/');
}

function buildRouteKey(method: string, path: string): string {
  return `${method} ${path}`;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index] * 100) / 100;
}

function pushRecent(metric: ApiRequestMetric, target: ApiRequestMetric[]) {
  target.unshift(metric);
  if (target.length > MAX_RECENT_REQUESTS) {
    target.length = MAX_RECENT_REQUESTS;
  }
}

export function recordApiRequest(input: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}) {
  const method = input.method.toUpperCase();
  const path = normalizeApiPath(input.path.split('?')[0]);
  const durationMs = Math.round(input.durationMs * 100) / 100;
  const routeKey = buildRouteKey(method, path);
  const timestamp = new Date().toISOString();
  const isError = input.status >= 400;

  const metric: ApiRequestMetric = {
    method,
    path,
    status: input.status,
    durationMs,
    timestamp,
  };

  pushRecent(metric, recentRequests);
  if (durationMs >= SLOW_API_THRESHOLD_MS) {
    pushRecent(metric, recentSlowRequests);
    console.warn('[WARN] Slow API request', metric);
  }

  const current = routeStats.get(routeKey);
  if (!current) {
    routeStats.set(routeKey, {
      method,
      path,
      count: 1,
      errorCount: isError ? 1 : 0,
      minMs: durationMs,
      maxMs: durationMs,
      totalMs: durationMs,
      durations: [durationMs],
      lastStatus: input.status,
      lastRequestAt: timestamp,
    });
    return;
  }

  current.count += 1;
  current.errorCount += isError ? 1 : 0;
  current.minMs = Math.min(current.minMs, durationMs);
  current.maxMs = Math.max(current.maxMs, durationMs);
  current.totalMs += durationMs;
  current.lastStatus = input.status;
  current.lastRequestAt = timestamp;
  current.durations.push(durationMs);
  if (current.durations.length > MAX_SAMPLES_PER_ROUTE) {
    current.durations.shift();
  }
}

export function getApiPerformanceSummary(): ApiPerformanceSummary {
  const routes = Array.from(routeStats.entries())
    .map(([routeKey, stats]) => ({
      routeKey,
      method: stats.method,
      path: stats.path,
      count: stats.count,
      errorCount: stats.errorCount,
      avgMs: Math.round((stats.totalMs / stats.count) * 100) / 100,
      minMs: stats.minMs,
      maxMs: stats.maxMs,
      p95Ms: percentile(stats.durations, 95),
      lastStatus: stats.lastStatus,
      lastRequestAt: stats.lastRequestAt,
    }))
    .sort((a, b) => b.maxMs - a.maxMs || b.count - a.count);

  const totalRequests = routes.reduce((sum, route) => sum + route.count, 0);
  const totalErrors = routes.reduce((sum, route) => sum + route.errorCount, 0);

  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeMs: Date.now() - startedAt,
    totalRequests,
    totalErrors,
    slowRequestThresholdMs: SLOW_API_THRESHOLD_MS,
    slowRequestCount: recentSlowRequests.length,
    routes,
    recentSlowRequests: recentSlowRequests.slice(0, 20),
    recentRequests: recentRequests.slice(0, 20),
  };
}

export function resetApiPerformance() {
  routeStats.clear();
  recentRequests.length = 0;
  recentSlowRequests.length = 0;
}

/**
 * Benchmark key API route handlers against the current database.
 *
 * Usage:
 *   npm run perf:api
 *   npm run perf:api -- --iterations 10
 *   npm run perf:api -- --base-url http://localhost:3000
 *
 * Seed large purchase data first (optional):
 *   npm run db:seed:purchases:for:test
 */
import { performance } from 'node:perf_hooks';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

interface BenchmarkResult {
  name: string;
  mode: 'handler' | 'http';
  iterations: number;
  status: number;
  itemCount?: number;
  minMs: number;
  avgMs: number;
  maxMs: number;
  p95Ms: number;
}

function parseArgs(argv: string[]) {
  const iterationsIndex = argv.indexOf('--iterations');
  const baseUrlIndex = argv.indexOf('--base-url');
  const httpOnly = argv.includes('--http-only');
  const handlerOnly = argv.includes('--handler-only');

  return {
    iterations: iterationsIndex >= 0 ? Number(argv[iterationsIndex + 1]) || 5 : 5,
    baseUrl: baseUrlIndex >= 0 ? argv[baseUrlIndex + 1] : 'http://localhost:3000',
    useHttp: !handlerOnly,
    useHandler: !httpOnly,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index] * 100) / 100;
}

function extractItemCount(body: unknown): number | undefined {
  if (Array.isArray(body)) {
    return body.length;
  }
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.expenses)) return record.expenses.length;
  if (Array.isArray(record.transactions)) return record.transactions.length;
  if (Array.isArray(record.members)) return record.members.length;
  if (Array.isArray(record.rows)) {
    return typeof record.total === 'number' ? record.total : record.rows.length;
  }
  return undefined;
}

function summarize(name: string, mode: 'handler' | 'http', durations: number[], status: number, itemCount?: number): BenchmarkResult {
  const total = durations.reduce((sum, value) => sum + value, 0);
  return {
    name,
    mode,
    iterations: durations.length,
    status,
    itemCount,
    minMs: Math.round(Math.min(...durations) * 100) / 100,
    avgMs: Math.round((total / durations.length) * 100) / 100,
    maxMs: Math.round(Math.max(...durations) * 100) / 100,
    p95Ms: percentile(durations, 95),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getReportDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

async function measureHandler(
  name: string,
  handler: (request: NextRequest) => Promise<Response>,
  url: string,
  iterations: number,
): Promise<BenchmarkResult> {
  const durations: number[] = [];
  let status = 0;
  let itemCount: number | undefined;

  for (let i = 0; i < iterations + 1; i += 1) {
    const request = new NextRequest(url);
    const start = performance.now();
    const response = await handler(request);
    const durationMs = performance.now() - start;

    if (i === 0) {
      continue;
    }

    status = response.status;
    const body = await response.json().catch(() => null);
    itemCount = extractItemCount(body);

    durations.push(durationMs);
  }

  return summarize(name, 'handler', durations, status, itemCount);
}

async function measureHttp(
  name: string,
  url: string,
  token: string | null,
  iterations: number,
): Promise<BenchmarkResult> {
  const durations: number[] = [];
  let status = 0;
  let itemCount: number | undefined;

  for (let i = 0; i < iterations + 1; i += 1) {
    const start = performance.now();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const durationMs = performance.now() - start;

    if (i === 0) {
      await response.text();
      continue;
    }

    status = response.status;
    const body = await response.json().catch(() => null);
    itemCount = extractItemCount(body);

    durations.push(durationMs);
  }

  return summarize(name, 'http', durations, status, itemCount);
}

async function getHttpToken(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    return typeof body.token === 'string' ? body.token : null;
  } catch {
    return null;
  }
}

function printResults(results: BenchmarkResult[]) {
  console.log('\nAPI performance benchmark');
  console.log('─'.repeat(88));
  console.log(
    `${'Endpoint'.padEnd(42)} ${'Mode'.padEnd(8)} ${'Status'.padStart(6)} ${'Items'.padStart(7)} ${'Avg ms'.padStart(8)} ${'P95 ms'.padStart(8)} ${'Max ms'.padStart(8)}`,
  );
  console.log('─'.repeat(88));

  for (const result of results) {
    console.log(
      `${result.name.padEnd(42)} ${result.mode.padEnd(8)} ${String(result.status).padStart(6)} ${String(result.itemCount ?? '-').padStart(7)} ${String(result.avgMs).padStart(8)} ${String(result.p95Ms).padStart(8)} ${String(result.maxMs).padStart(8)}`,
    );
  }

  console.log('─'.repeat(88));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  const { startDate, endDate } = getReportDateRange();

  const [purchaseCount, memberCount, saleCount, expenseCount] = await Promise.all([
    prisma.purchase.count(),
    prisma.member.count(),
    prisma.sale.count(),
    prisma.expense.count(),
  ]);

  console.log('Database snapshot');
  console.log(`  purchases: ${purchaseCount.toLocaleString()}`);
  console.log(`  members:   ${memberCount.toLocaleString()}`);
  console.log(`  sales:     ${saleCount.toLocaleString()}`);
  console.log(`  expenses:  ${expenseCount.toLocaleString()}`);
  console.log(`  report range: ${startDate} → ${endDate}`);
  console.log(`  iterations: ${args.iterations} (+1 warmup)`);

  const results: BenchmarkResult[] = [];

  if (args.useHandler) {
    const { GET: getTransactions } = await import('../src/app/api/purchases/transactions/route');
    const { GET: getDashboard } = await import('../src/app/api/dashboard/route');
    const { GET: getMembers } = await import('../src/app/api/members/route');
    const { GET: getExpenses } = await import('../src/app/api/expenses/route');
    const { GET: getProductTypes } = await import('../src/app/api/product-types/route');
    const { GET: getReportGroups } = await import('../src/app/api/report-product-type-groups/route');
    const { GET: getReportSummary } = await import('../src/app/api/reports/summary/route');

    results.push(
      await measureHandler(
        'GET /api/reports/summary (daily page)',
        getReportSummary,
        `http://localhost/api/reports/summary?type=daily_purchase&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=15`,
        args.iterations,
      ),
      await measureHandler(
        'GET /api/purchases/transactions (90d page)',
        getTransactions,
        'http://localhost/api/purchases/transactions?page=1&limit=20',
        args.iterations,
      ),
      await measureHandler('GET /api/dashboard', getDashboard, 'http://localhost/api/dashboard', args.iterations),
      await measureHandler('GET /api/members', getMembers, 'http://localhost/api/members?page=1&limit=25', args.iterations),
      await measureHandler(
        'GET /api/expenses',
        getExpenses,
        `http://localhost/api/expenses?startDate=${startDate}&endDate=${endDate}&page=1&pageSize=50`,
        args.iterations,
      ),
      await measureHandler('GET /api/product-types', getProductTypes, 'http://localhost/api/product-types', args.iterations),
      await measureHandler(
        'GET /api/report-product-type-groups',
        getReportGroups,
        'http://localhost/api/report-product-type-groups',
        args.iterations,
      ),
    );
  }

  if (args.useHttp) {
    const token = await getHttpToken(args.baseUrl);
    if (!token) {
      console.warn(`\nSkipping HTTP benchmarks: could not login at ${args.baseUrl}`);
    } else {
      results.push(
        await measureHttp(
          'HTTP GET /api/reports/summary (daily page)',
          `${args.baseUrl}/api/reports/summary?type=daily_purchase&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=15`,
          token,
          args.iterations,
        ),
        await measureHttp(
          'HTTP GET /api/purchases/transactions (90d page)',
          `${args.baseUrl}/api/purchases/transactions?page=1&limit=20`,
          token,
          args.iterations,
        ),
        await measureHttp(
          'HTTP GET /api/dashboard',
          `${args.baseUrl}/api/dashboard`,
          token,
          args.iterations,
        ),
      );
    }
  }

  printResults(results);

  const slow = results.filter((result) => result.avgMs >= 1000);
  if (slow.length > 0) {
    console.log('\n⚠️  Endpoints averaging >= 1000ms with current data volume:');
    for (const result of slow) {
      console.log(`  - ${result.name}: avg ${result.avgMs}ms, p95 ${result.p95Ms}ms`);
    }
  } else {
    console.log('\n✅ All benchmarked endpoints averaged below 1000ms.');
  }

  if (purchaseCount < 10_000) {
    console.log('\nTip: seed more purchase data for heavier load testing:');
    console.log('  npm run db:seed:purchases:for:test');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

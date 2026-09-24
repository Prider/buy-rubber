import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/pendingSignupCleanup', () => ({
  deleteExpiredPendingSignups: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

function request(authorization?: string) {
  return new NextRequest('http://localhost:3000/api/cron/pending-signups', {
    headers: authorization ? { authorization } : {},
  });
}

describe('GET /api/cron/pending-signups', () => {
  const previous = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
  });

  afterEach(() => {
    process.env.CRON_SECRET = previous;
  });

  it('rejects a request without the cron secret', async () => {
    const response = await GET(request());
    expect(response.status).toBe(401);
  });

  it('deletes expired pending signups for an authorized caller', async () => {
    const deleteExpiredPendingSignups = (await import('@/lib/pendingSignupCleanup'))
      .deleteExpiredPendingSignups as ReturnType<typeof vi.fn>;
    vi.mocked(deleteExpiredPendingSignups).mockResolvedValue(2);

    const response = await GET(request('Bearer cron-secret'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, deleted: 2 });
  });
});

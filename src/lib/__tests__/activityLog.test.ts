import { describe, expect, it, vi, beforeEach } from 'vitest';
import { diffFields, activityRetentionCutoff, ACTIVITY_LOG_RETENTION_DAYS } from '@/lib/activityLogShared';
import { purgeExpiredActivityLogs, recordActivity, resetActivityPurgeClock } from '@/lib/activityLog';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('activity log', () => {
  beforeEach(() => {
    resetActivityPurgeClock();
  });

  it('keeps only changed fields', () => {
    const changes = diffFields(
      { netWeight: 100, finalPrice: 50, notes: null },
      { netWeight: 120, finalPrice: 50, notes: '' },
      ['netWeight', 'finalPrice', 'notes'],
    );

    expect(changes).toEqual({
      netWeight: { from: 100, to: 120 },
    });
  });

  it('returns null when nothing changed', () => {
    expect(diffFields({ name: 'A' }, { name: 'A' }, ['name'])).toBeNull();
  });

  it('uses a 90 day cutoff', () => {
    const now = new Date('2026-10-05T00:00:00.000Z');
    const cutoff = activityRetentionCutoff(now);
    const elapsedDays = (now.getTime() - cutoff.getTime()) / (24 * 60 * 60 * 1000);
    expect(elapsedDays).toBe(ACTIVITY_LOG_RETENTION_DAYS);
  });

  it('writes an update only when there is an actor and a diff', async () => {
    const create = vi.fn().mockResolvedValue({});
    const db = { activityLog: { create } };

    await recordActivity(db, {
      actor: null,
      action: 'update',
      entityType: 'purchase',
      entityId: 'p1',
      summary: 'แก้รับซื้อ',
      changes: { netWeight: { from: 1, to: 2 } },
    });
    await recordActivity(db, {
      actor: { userId: 'u1', username: 'admin', role: 'admin' },
      action: 'update',
      entityType: 'purchase',
      entityId: 'p1',
      summary: 'แก้รับซื้อ',
      changes: null,
    });
    await recordActivity(db, {
      actor: { userId: 'u1', username: 'admin', role: 'admin' },
      action: 'delete',
      entityType: 'purchase',
      entityId: 'p1',
      entityLabel: 'PUR-1',
      summary: 'ลบรับซื้อ PUR-1',
      changes: { purchaseNo: 'PUR-1', soft: false },
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        username: 'admin',
        action: 'delete',
        entityType: 'purchase',
        entityLabel: 'PUR-1',
        changes: JSON.stringify({ purchaseNo: 'PUR-1', soft: false }),
      }),
    });
  });

  it('purges rows older than 90 days at most once per day', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const db = { activityLog: { deleteMany } };
    const now = new Date('2026-10-05T12:00:00.000Z');

    await purgeExpiredActivityLogs(db, now);
    await purgeExpiredActivityLogs(db, new Date(now.getTime() + 60 * 60 * 1000));

    expect(deleteMany).toHaveBeenCalledTimes(1);
    const cutoff = deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    expect(now.getTime() - cutoff.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
  });
});

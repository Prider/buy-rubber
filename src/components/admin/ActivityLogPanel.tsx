'use client';

import { useEffect, useState } from 'react';
import { getApiClient } from '@/lib/apiClient';
import { PaginationControls } from '@/components/members/history/PaginationControls';
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_ENTITY_TYPES,
  ACTIVITY_FIELD_LABELS,
  ACTIVITY_LOG_RETENTION_DAYS,
  isFieldChange,
  type ActivityAction,
  type ActivityEntityType,
} from '@/lib/activityLogShared';

type ActivityItem = {
  id: string;
  username: string;
  role: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityLabel: string | null;
  summary: string;
  changes: string | null;
  createdAt: string;
};

type ActivityResponse = {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  retentionDays: number;
};

type UserOption = { id: string; username: string };

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'ใช่' : 'ไม่';
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item && 'price' in item) {
          const row = item as { name: unknown; price: unknown };
          return `${row.name} ${row.price}`;
        }
        return String(item);
      })
      .join(', ');
  }
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  if (typeof value === 'number') {
    return value.toLocaleString('th-TH');
  }
  return String(value);
}

function ChangeDetails({ raw }: { raw: string | null }) {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return <p className="text-sm text-gray-600 dark:text-gray-300">{raw}</p>;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="mt-3 space-y-1.5 text-sm">
      {entries.map(([key, value]) => {
        const label = ACTIVITY_FIELD_LABELS[key] || key;
        if (isFieldChange(value)) {
          return (
            <div key={key} className="flex flex-wrap gap-x-2 text-gray-700 dark:text-gray-200">
              <dt className="font-medium">{label}</dt>
              <dd>
                {formatValue(value.from)} → {formatValue(value.to)}
              </dd>
            </div>
          );
        }
        return (
          <div key={key} className="flex flex-wrap gap-x-2 text-gray-700 dark:text-gray-200">
            <dt className="font-medium">{label}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function ActivityLogPanel() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        const result = await getApiClient().get<{ success: boolean; users: UserOption[] }>('/api/users');
        if (!cancelled && result?.users) {
          setUsers(result.users);
        }
      } catch {
        // The history list still works when the user filter cannot be loaded.
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '20' });
        if (userId) params.set('userId', userId);
        if (action) params.set('action', action);
        if (entityType) params.set('entityType', entityType);
        const result = await getApiClient().get<ActivityResponse>(`/api/activity?${params.toString()}`);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'โหลดประวัติไม่สำเร็จ');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [action, entityType, page, userId]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize || 20)));
  const retentionDays = data?.retentionDays ?? ACTIVITY_LOG_RETENTION_DAYS;

  return (
    <section
      id="admin-tabpanel-activity"
      role="tabpanel"
      aria-labelledby="admin-tab-activity"
      className="space-y-4"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">ประวัติการสร้าง แก้ไข และลบ</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          แสดงรายการสร้าง แก้ไข และลบของผู้ใช้งาน ย้อนหลัง {retentionDays} วัน
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            ผู้ใช้
            <select
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">ทั้งหมด</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            การกระทำ
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">ทั้งหมด</option>
              {ACTIVITY_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {ACTIVITY_ACTION_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            รายการ
            <select
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">ทั้งหมด</option>
              {ACTIVITY_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_ENTITY_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
        ) : !data || data.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            ยังไม่มีประวัติการสร้าง แก้ไข หรือลบในช่วง {retentionDays} วันที่ผ่านมา
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.items.map((item) => {
              const isOpen = openId === item.id;
              const actionLabel = ACTIVITY_ACTION_LABELS[item.action] || item.action;
              const entityLabel = ACTIVITY_ENTITY_LABELS[item.entityType] || item.entityType;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 sm:flex-row sm:items-center sm:justify-between"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    <span className="min-w-0">
                      <span
                        className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.action === 'delete'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : item.action === 'create'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        }`}
                      >
                        {actionLabel}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.summary}</span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {entityLabel}
                        {item.entityLabel ? ` · ${item.entityLabel}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {item.username} · {formatWhen(item.createdAt)}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3">
                      <ChangeDetails raw={item.changes} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data && data.total > data.pageSize && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        />
      )}
    </section>
  );
}

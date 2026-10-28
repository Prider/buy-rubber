'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiClient } from '@/lib/apiClient';
import type { AssistantModelAllowanceView } from '@/lib/assistant/allowance';
import {
  ASSISTANT_PROVIDER_LABELS,
  type AssistantSettingsView,
} from '@/lib/assistant/credentials';
import type { AssistantReply } from '@/lib/assistant/types';
import { AssistantChartView, AssistantTableView } from './AssistantVisuals';
import {
  SUGGESTED_QUERIES,
  loadAssistantState,
  saveAssistantState,
  type AssistantChatMessage,
  type PersistedAssistant,
  type QueryHistoryItem,
  type SavedQuery,
} from './storage';

type PanelTab = 'chat' | 'saved' | 'history';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    if (typeof apiError === 'string' && apiError.trim()) return apiError;
  }
  return 'ไม่สามารถถามผู้ช่วยอัจฉริยะได้ในขณะนี้';
}

export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const userId = user?.id || 'shop';
  const [tab, setTab] = useState<PanelTab>('chat');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [assistantSettings, setAssistantSettings] = useState<AssistantSettingsView | null>(null);
  const [allowances, setAllowances] = useState<AssistantModelAllowanceView[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadAssistantState(window.localStorage, userId);
    setMessages(stored?.messages ?? []);
    setSavedQueries(stored?.savedQueries ?? []);
    setHistory(stored?.history ?? []);
    setLoadedFor(userId);
  }, [userId]);

  useEffect(() => {
    if (loadedFor !== userId) return;
    const state: PersistedAssistant = { messages, savedQueries, history };
    saveAssistantState(window.localStorage, userId, state);
  }, [loadedFor, userId, messages, savedQueries, history]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatusLoading(true);
    void (async () => {
      try {
        const settings = await getApiClient().get<AssistantSettingsView>('/api/assistant/settings');
        if (cancelled) return;
        setAssistantSettings(settings);
        if (!settings.hasKey) {
          setAllowances([]);
          return;
        }
        try {
          const allowance = await getApiClient().get<{ models: AssistantModelAllowanceView[] }>(
            '/api/assistant/settings/allowance',
          );
          if (!cancelled) setAllowances(allowance.models ?? []);
        } catch {
          if (!cancelled) setAllowances([]);
        }
      } catch {
        if (!cancelled) {
          setAssistantSettings(null);
          setAllowances([]);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages, thinking]);

  const ask = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query || thinking) return;

    const userMessage: AssistantChatMessage = {
      id: createId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    const prior = messages.filter((message) => message.role === 'user' || message.role === 'assistant').slice(-6);
    setMessages((current) => [...current, userMessage]);
    setHistory((current) => [
      { id: userMessage.id, query, timestamp: userMessage.timestamp },
      ...current.filter((item) => item.query !== query),
    ].slice(0, 20));
    setDraft('');
    setTab('chat');
    setThinking(true);

    try {
      const reply = await getApiClient().post<AssistantReply>(
        '/api/assistant',
        {
          query,
          history: prior.map((message) => ({ role: message.role, content: message.content })),
        },
        { timeout: 60_000 },
      );
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: reply.text,
          timestamp: new Date().toISOString(),
          charts: reply.charts,
          tables: reply.tables,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: errorMessage(error),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  const saveQuery = (query: string) => {
    setSavedQueries((current) => {
      if (current.some((item) => item.query === query)) return current;
      return [{ id: createId(), query }, ...current];
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="ปิดผู้ช่วยอัจฉริยะ"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="ถามข้อมูลร้าน"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-gray-900"
      >
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">ถามข้อมูลร้าน</h2>
            <div className="flex shrink-0 items-center">
              <Link
                href="/admin?tab=assistant"
                onClick={onClose}
                aria-label="ตั้งค่า"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ตั้งค่า
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="ปิด"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-2 flex max-w-full flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {statusLoading && !assistantSettings
                ? 'กำลังโหลด'
                : assistantSettings?.hasKey
                  ? ASSISTANT_PROVIDER_LABELS[assistantSettings.provider]
                  : 'ยังไม่ได้ตั้งค่า'}
            </span>
            {assistantSettings?.hasKey && statusLoading && allowances.length === 0 ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                กำลังตรวจโทเคน
              </span>
            ) : (
              allowances.map((row) => (
                <span
                  key={row.model}
                  title={row.detail ?? undefined}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                >
                  {allowances.length > 1 && (
                    <span className="max-w-28 truncate font-mono text-blue-700 dark:text-blue-300">{row.model}</span>
                  )}
                  <span className="truncate">{row.summary}</span>
                </span>
              ))
            )}
          </div>
          <div className="mt-3 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="tablist" aria-label="มุมมองผู้ช่วย">
            {(
              [
                ['chat', 'แชท'],
                ['saved', 'ที่บันทึก'],
                ['history', 'ประวัติ'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`min-h-9 flex-1 rounded-lg px-2 text-sm motion-safe:transition-colors motion-safe:duration-150 ${
                  tab === value
                    ? 'bg-white font-semibold text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'chat' ? (
          <>
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
              {messages.length === 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ถามรับซื้อ ขาย สต็อก สมาชิก หรือกำไรของร้านนี้
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTED_QUERIES.map((query) => (
                      <button
                        key={query}
                        type="button"
                        onClick={() => void ask(query)}
                        className="rounded-xl bg-gray-50 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] space-y-1.5 ${message.role === 'user' ? 'items-end' : ''}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <button
                        type="button"
                        onClick={() => saveQuery(message.content)}
                        className="px-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        บันทึกคำถาม
                      </button>
                    )}
                    {message.charts?.map((chart) => (
                      <AssistantChartView key={chart.title} chart={chart} />
                    ))}
                    {message.tables?.map((table) => (
                      <AssistantTableView key={table.title} table={table} />
                    ))}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-3.5 py-2.5 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    กำลังดูข้อมูลร้าน...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="px-4 pb-4 pt-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="mb-2 px-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ล้างแชท
                </button>
              )}
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="ถามข้อมูลร้าน"
                  disabled={thinking}
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60 dark:text-gray-100"
                />
                <button
                  type="submit"
                  disabled={thinking || !draft.trim()}
                  className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:active:scale-100 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96]"
                >
                  ส่ง
                </button>
              </div>
            </form>
          </>
        ) : tab === 'saved' ? (
          <QueryList
            empty="ยังไม่มีคำถามที่บันทึก"
            items={savedQueries.map((item) => ({ id: item.id, query: item.query }))}
            onUse={(query) => void ask(query)}
            onDelete={(id) => setSavedQueries((current) => current.filter((item) => item.id !== id))}
            onClear={() => setSavedQueries([])}
          />
        ) : (
          <QueryList
            empty="ยังไม่มีประวัติ"
            items={history}
            onUse={(query) => void ask(query)}
            onSave={saveQuery}
            onDelete={(id) => setHistory((current) => current.filter((item) => item.id !== id))}
            onClear={() => setHistory([])}
          />
        )}
      </aside>
    </div>
  );
}

function QueryList({
  empty,
  items,
  onUse,
  onSave,
  onDelete,
  onClear,
}: {
  empty: string;
  items: { id: string; query: string; timestamp?: string }[];
  onUse: (query: string) => void;
  onSave?: (query: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-2">
      {items.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={onClear} className="min-h-11 px-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ล้างทั้งหมด
          </button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-gray-50 px-3.5 py-3 dark:bg-gray-800">
            <p className="text-sm text-gray-800 dark:text-gray-100">{item.query}</p>
            <div className="mt-2 flex gap-3 text-xs">
              <button type="button" onClick={() => onUse(item.query)} className="min-h-11 font-medium text-blue-600">
                ถามอีกครั้ง
              </button>
              {onSave && (
                <button type="button" onClick={() => onSave(item.query)} className="min-h-11 text-gray-500">
                  บันทึก
                </button>
              )}
              <button type="button" onClick={() => onDelete(item.id)} className="min-h-11 text-gray-500">
                ลบ
              </button>
            </div>
          </div>
        ))
      )}
      {!onSave && (
        <div className="space-y-2 pt-2">
          <p className="px-1 text-xs font-medium text-gray-400">คำถามแนะนำ</p>
          {SUGGESTED_QUERIES.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onUse(query)}
              className="block w-full rounded-2xl bg-gray-50 px-3.5 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

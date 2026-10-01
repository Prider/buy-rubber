'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/platform/AuthContext';
import { getApiClient } from '@/shared/apiClient';
import type { AssistantReply } from '@/industries/rubber/domain/assistant/types';
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
  return 'ไม่สามารถถามผู้ช่วยได้ในขณะนี้';
}

export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'unknown';
  const [tab, setTab] = useState<PanelTab>('chat');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadAssistantState(window.localStorage, tenantId);
    setMessages(stored?.messages ?? []);
    setSavedQueries(stored?.savedQueries ?? []);
    setHistory(stored?.history ?? []);
    setLoadedFor(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (loadedFor !== tenantId) return;
    const state: PersistedAssistant = { messages, savedQueries, history };
    saveAssistantState(window.localStorage, tenantId, state);
  }, [loadedFor, tenantId, messages, savedQueries, history]);

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
        aria-label="ปิดผู้ช่วย"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="ถามข้อมูลร้าน"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-700 dark:bg-gray-950"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">ถามข้อมูลร้าน</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              ตอบจากข้อมูลวันนี้ เดือนนี้ และ 90 วันที่ผ่านมา
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="ปิด"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
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
              onClick={() => setTab(value)}
              className={`rounded-lg px-2 py-1.5 text-sm ${
                tab === value
                  ? 'bg-blue-600 font-semibold text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'chat' ? (
          <>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ถามเรื่องรับซื้อ ขาย สต็อก สมาชิก ค่าใช้จ่าย หรือกำไรของร้านนี้
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUERIES.map((query) => (
                      <button
                        key={query}
                        type="button"
                        onClick={() => void ask(query)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs text-gray-700 hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] space-y-2 ${message.role === 'user' ? 'items-end' : ''}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'user' && (
                        <button
                          type="button"
                          onClick={() => saveQuery(message.content)}
                          className="mt-1 text-[11px] text-blue-100 underline"
                        >
                          บันทึกคำถาม
                        </button>
                      )}
                    </div>
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
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                    กำลังดูข้อมูลร้าน...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="ถามเกี่ยวกับข้อมูลร้าน"
                  disabled={thinking}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-900/40"
                />
                <button
                  type="submit"
                  disabled={thinking || !draft.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  ส่ง
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ล้างแชท
                </button>
              )}
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
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
      {items.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={onClear} className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400">
            ล้างทั้งหมด
          </button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-800 dark:text-gray-100">{item.query}</p>
            <div className="mt-2 flex gap-3 text-xs">
              <button type="button" onClick={() => onUse(item.query)} className="font-medium text-blue-600">
                ถามอีกครั้ง
              </button>
              {onSave && (
                <button type="button" onClick={() => onSave(item.query)} className="text-gray-500">
                  บันทึก
                </button>
              )}
              <button type="button" onClick={() => onDelete(item.id)} className="text-gray-500">
                ลบ
              </button>
            </div>
          </div>
        ))
      )}
      {!onSave && (
        <div className="pt-2">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">คำถามแนะนำ</p>
          <div className="space-y-2">
            {SUGGESTED_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => onUse(query)}
                className="block w-full rounded-xl border border-dashed border-gray-200 px-3 py-2 text-left text-sm text-gray-600 hover:border-blue-300 dark:border-gray-700 dark:text-gray-300"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

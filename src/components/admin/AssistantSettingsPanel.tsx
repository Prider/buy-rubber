'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getApiClient } from '@/lib/apiClient';
import { useAlert } from '@/hooks/useAlert';
import type { AssistantAllowanceView, AssistantModelAllowanceView } from '@/lib/assistant/allowance';
import {
  ASSISTANT_DEFAULT_MODELS,
  ASSISTANT_PROVIDER_LABELS,
  ASSISTANT_PROVIDERS,
  type AssistantProvider,
  type AssistantSettingsView,
} from '@/lib/assistant/credentials';

function messageFrom(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { error?: unknown } } }).response?.data;
    if (typeof data?.error === 'string' && data.error) return data.error;
  }
  return fallback;
}

export function AssistantSettingsPanel() {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<AssistantSettingsView | null>(null);
  const [provider, setProvider] = useState<AssistantProvider>('openrouter');
  const [model, setModel] = useState(ASSISTANT_DEFAULT_MODELS.openrouter);
  const [apiKey, setApiKey] = useState('');
  const [modelAllowances, setModelAllowances] = useState<AssistantModelAllowanceView[]>([]);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealingKey, setRevealingKey] = useState(false);
  const selectionTouched = useRef(false);
  const switchRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getApiClient().get<AssistantSettingsView>('/api/assistant/settings');
        if (cancelled) return;
        setSettings(data);
        if (!selectionTouched.current) {
          setProvider(data.provider);
          setModel(data.model);
        }
      } catch (error) {
        if (!cancelled) showError('โหลดการตั้งค่าไม่สำเร็จ', messageFrom(error, 'ลองใหม่อีกครั้ง'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  useEffect(() => {
    if (!settings?.hasKey) {
      setModelAllowances([]);
      return;
    }
    let cancelled = false;
    setAllowanceLoading(true);
    void getApiClient()
      .get<{ models: AssistantModelAllowanceView[] }>('/api/assistant/settings/allowance')
      .then((data) => {
        if (!cancelled) setModelAllowances(data.models ?? []);
      })
      .catch(() => {
        if (!cancelled) setModelAllowances([]);
      })
      .finally(() => {
        if (!cancelled) setAllowanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  const busy = loading || saving || testing;

  const onProviderChange = (next: AssistantProvider) => {
    if (!ASSISTANT_PROVIDERS.includes(next) || next === provider) return;
    selectionTouched.current = true;
    setRevealedKey(null);
    const saved = settings?.accounts?.[next];
    const nextModel = saved?.hasKey ? saved.model : ASSISTANT_DEFAULT_MODELS[next];
    setProvider(next);
    setModel(nextModel);
    setApiKey('');
    if (!saved?.hasKey || next === settings?.provider) return;

    const requestId = switchRequest.current + 1;
    switchRequest.current = requestId;
    setSaving(true);
    void (async () => {
      try {
        const data = await getApiClient().put<AssistantSettingsView>('/api/assistant/settings', {
          provider: next,
          model: nextModel,
          apiKey: '',
        });
        if (switchRequest.current !== requestId) return;
        selectionTouched.current = false;
        setSettings(data);
        setProvider(data.provider);
        setModel(data.model);
        showSuccess('สลับผู้ให้บริการแล้ว', `กำลังใช้ ${ASSISTANT_PROVIDER_LABELS[data.provider]}`, {
          autoClose: true,
          autoCloseDelay: 2000,
        });
      } catch (error) {
        if (switchRequest.current !== requestId) return;
        const message = messageFrom(error, 'ลองใหม่อีกครั้ง');
        if (message !== 'กรุณาใส่ API Key') {
          selectionTouched.current = false;
          setProvider(settings?.provider ?? next);
          setModel(settings?.model ?? nextModel);
        }
        showError('สลับผู้ให้บริการไม่สำเร็จ', message);
      } finally {
        if (switchRequest.current === requestId) setSaving(false);
      }
    })();
  };

  const selectedAccount = settings?.accounts?.[provider];
  const selectedHasKey = Boolean(selectedAccount?.hasKey);

  const toggleCurrentKey = async () => {
    if (revealedKey) {
      setRevealedKey(null);
      return;
    }
    setRevealingKey(true);
    try {
      const data = await getApiClient().get<{ apiKey: string }>(
        `/api/assistant/settings/key?provider=${provider}`,
      );
      setRevealedKey(data.apiKey);
    } catch (error) {
      showError('แสดงคีย์ไม่สำเร็จ', messageFrom(error, 'ลองใหม่อีกครั้ง'));
    } finally {
      setRevealingKey(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await getApiClient().post<{
        ok: boolean;
        message: string;
        model?: string;
        allowance?: AssistantAllowanceView | null;
      }>(
        '/api/assistant/settings/test',
        { provider, model, apiKey },
        { timeout: 60_000 },
      );
      if (result.allowance && result.model) {
        const next = { model: result.model, summary: result.allowance.summary, detail: result.allowance.detail };
        setModelAllowances((current) => [next, ...current.filter((row) => row.model !== result.model)]);
      }
      if (result.ok) {
        if (result.model) setModel(result.model);
        showSuccess('เชื่อมต่อได้', result.message, { autoClose: true, autoCloseDelay: 2000 });
      } else {
        showError('เชื่อมต่อไม่ได้', result.message);
      }
    } catch (error) {
      showError('เชื่อมต่อไม่ได้', messageFrom(error, 'ตรวจอินเทอร์เน็ต ชื่อโมเดล และ API Key'));
    } finally {
      setTesting(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await getApiClient().put<AssistantSettingsView>('/api/assistant/settings', {
        provider,
        model,
        apiKey,
      });
      setSettings(data);
      setProvider(data.provider);
      setModel(data.model);
      setApiKey('');
      showSuccess('บันทึกแล้ว', 'ผู้ช่วยอัจฉริยะใช้คีย์ของร้านนี้', {
        autoClose: true,
        autoCloseDelay: 2000,
      });
    } catch (error) {
      showError('บันทึกไม่สำเร็จ', messageFrom(error, 'ลองใหม่อีกครั้ง'));
    } finally {
      setSaving(false);
    }
  };

  const clearShopKey = async () => {
    setSaving(true);
    try {
      const data = await getApiClient().delete<AssistantSettingsView>('/api/assistant/settings', {
        data: { provider },
      });
      setSettings(data);
      setProvider(data.provider);
      setModel(data.model);
      setApiKey('');
      showSuccess('ลบคีย์ของผู้ให้บริการนี้แล้ว', 'คีย์ของผู้ให้บริการอื่นยังอยู่', {
        autoClose: true,
        autoCloseDelay: 2000,
      });
    } catch (error) {
      showError('ลบไม่สำเร็จ', messageFrom(error, 'ลองใหม่อีกครั้ง'));
    } finally {
      setSaving(false);
    }
  };

  const activeProvider = settings?.hasKey ? settings.provider : null;
  const sourceLabel = activeProvider
    ? `กำลังใช้ ${ASSISTANT_PROVIDER_LABELS[activeProvider]}`
    : 'ยังไม่ได้ตั้งค่า';

  return (
    <div
      id="admin-tabpanel-assistant"
      role="tabpanel"
      aria-labelledby="admin-tab-assistant"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
            ผู้ช่วยอัจฉริยะ
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            ใส่ API Key ของร้านเพื่อถามข้อมูลร้าน คีย์ถูกเก็บไว้ในเครื่องนี้เท่านั้น
          </p>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {loading ? 'กำลังโหลด' : sourceLabel}
          </span>
          {allowanceLoading && modelAllowances.length === 0 ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-100 dark:ring-blue-900">
              กำลังตรวจโทเคน
            </span>
          ) : (
            modelAllowances.map((row) => (
              <span
                key={row.model}
                title={row.detail ?? undefined}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-100 dark:ring-blue-900"
              >
                {modelAllowances.length > 1 && (
                  <span className="max-w-40 truncate font-mono font-medium text-blue-800 dark:text-blue-200">
                    {row.model}
                  </span>
                )}
                <span className="truncate">{row.summary}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <form onSubmit={save} className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-1.5">
          <label htmlFor="assistant-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ผู้ให้บริการ
          </label>
          <select
            id="assistant-provider"
            value={provider}
            disabled={loading}
            onChange={(event) => onProviderChange(event.target.value as AssistantProvider)}
            className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
          >
            {ASSISTANT_PROVIDERS.map((item) => (
              <option key={item} value={item}>
                {ASSISTANT_PROVIDER_LABELS[item]}
              </option>
            ))}
          </select>
          {!loading && !selectedHasKey && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeProvider
                ? `ผู้ช่วยยังใช้ ${ASSISTANT_PROVIDER_LABELS[activeProvider]} อยู่ วาง API Key ของผู้ให้บริการนี้ แล้วกดบันทึก`
                : 'ผู้ให้บริการนี้ยังไม่มีคีย์ วาง API Key แล้วกดบันทึก'}
            </p>
          )}
          {!loading && selectedHasKey && activeProvider && activeProvider !== provider && (
            <p className="text-xs text-gray-500 dark:text-gray-400">กำลังสลับผู้ให้บริการ</p>
          )}
        </div>

        {selectedHasKey && selectedAccount?.keyHint && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-2 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:ring-gray-700">
            <p className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-200">
              คีย์ปัจจุบัน{' '}
              <span className="break-all font-mono">{revealedKey ?? selectedAccount.keyHint}</span>
            </p>
            <button
              type="button"
              disabled={revealingKey}
              aria-pressed={Boolean(revealedKey)}
              aria-label={revealedKey ? 'ซ่อนคีย์' : 'แสดงคีย์'}
              onClick={() => void toggleCurrentKey()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              {revealedKey ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-4.03-9-9 0-.834.114-1.64.328-2.404m1.836-3.33C6.378 3.89 8.098 3 10 3c4.97 0 9 4.03 9 9 0 1.902-.89 3.622-2.267 4.836M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="assistant-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            โมเดล
          </label>
          <input
            id="assistant-model"
            value={model}
            disabled={busy}
            onChange={(event) => setModel(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={ASSISTANT_DEFAULT_MODELS[provider]}
            className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="assistant-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <input
            id="assistant-api-key"
            type="password"
            value={apiKey}
            disabled={busy}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={selectedHasKey ? 'เว้นว่างไว้ถ้าไม่เปลี่ยนคีย์' : 'วาง API Key'}
            className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-5 dark:border-gray-700 sm:flex-row sm:justify-end">
          {selectedHasKey && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void clearShopKey()}
              className="min-h-11 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-700"
            >
              ลบคีย์ของร้าน
            </button>
          )}
          <button
            type="button"
            disabled={busy || !model.trim()}
            onClick={() => void testConnection()}
            className="min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:ring-blue-800 dark:hover:bg-blue-950/40"
          >
            {testing ? 'กำลังทดสอบ...' : 'ทดสอบ'}
          </button>
          <button
            type="submit"
            disabled={busy || !model.trim()}
            className="min-h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getApiClient } from '@/lib/apiClient';
import { useAlert } from '@/hooks/useAlert';
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getApiClient().get<AssistantSettingsView>('/api/assistant/settings');
        if (cancelled) return;
        setSettings(data);
        setProvider(data.provider);
        setModel(data.model);
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

  const busy = loading || saving || testing;

  const onProviderChange = (next: AssistantProvider) => {
    setProvider(next);
    setModel(ASSISTANT_DEFAULT_MODELS[next]);
    setApiKey('');
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await getApiClient().post<{ ok: boolean; message: string }>(
        '/api/assistant/settings/test',
        { provider, model, apiKey },
        { timeout: 60_000 },
      );
      if (result.ok) {
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
      const data = await getApiClient().delete<AssistantSettingsView>('/api/assistant/settings');
      setSettings(data);
      setProvider(data.provider);
      setModel(data.model);
      setApiKey('');
      showSuccess('ลบคีย์ของร้านแล้ว', 'ระบบจะใช้คีย์ที่มากับโปรแกรม ถ้ามี', {
        autoClose: true,
        autoCloseDelay: 2000,
      });
    } catch (error) {
      showError('ลบไม่สำเร็จ', messageFrom(error, 'ลองใหม่อีกครั้ง'));
    } finally {
      setSaving(false);
    }
  };

  const sourceLabel =
    settings?.source === 'shop'
      ? 'ใช้คีย์ของร้านนี้'
      : settings?.source === 'packaged'
        ? 'ใช้คีย์ที่มากับโปรแกรม'
        : 'ยังไม่ได้ตั้งค่า';

  return (
    <div
      id="admin-tabpanel-assistant"
      role="tabpanel"
      aria-labelledby="admin-tab-assistant"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex flex-col items-start gap-2 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
            ผู้ช่วยอัจฉริยะ
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            ใส่ API Key ของร้านเพื่อถามข้อมูลร้าน คีย์ถูกเก็บไว้ในเครื่องนี้เท่านั้น
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {loading ? 'กำลังโหลด' : sourceLabel}
        </span>
      </div>

      <form onSubmit={save} className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        {settings?.keyHint && (
          <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-200 dark:ring-gray-700">
            คีย์ปัจจุบัน <span className="font-mono">{settings.keyHint}</span>
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="assistant-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ผู้ให้บริการ
          </label>
          <select
            id="assistant-provider"
            value={provider}
            disabled={busy}
            onChange={(event) => onProviderChange(event.target.value as AssistantProvider)}
            className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
          >
            {ASSISTANT_PROVIDERS.map((item) => (
              <option key={item} value={item}>
                {ASSISTANT_PROVIDER_LABELS[item]}
              </option>
            ))}
          </select>
        </div>

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
            placeholder={settings?.source === 'shop' ? 'เว้นว่างไว้ถ้าไม่เปลี่ยนคีย์' : 'วาง API Key'}
            className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-5 dark:border-gray-700 sm:flex-row sm:justify-end">
          {settings?.source === 'shop' && (
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

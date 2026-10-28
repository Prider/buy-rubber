import { readModelAllowances, writeModelAllowance } from './credentials';

export type AssistantAllowanceUnit = 'tokens' | 'usd';

export type AssistantAllowance = {
  unit: AssistantAllowanceUnit;
  remaining: number | null;
  limit: number | null;
  resetsAt: string | null;
};

export type AssistantAllowanceView = {
  summary: string;
  detail: string | null;
};

export type AssistantModelAllowanceView = AssistantAllowanceView & {
  model: string;
};

type AllowanceProvider = 'openai' | 'anthropic' | 'openrouter' | 'proxy';

type HeaderSource = { get?: (name: string) => string | null };

const cache = new Map<string, AssistantAllowance>();

function cacheKey(provider: AllowanceProvider, apiKey: string, model: string): string {
  return `${provider}:${apiKey.length}:${apiKey.slice(-6)}:${model}`;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function headerNumber(headers: HeaderSource, name: string): number | null {
  return finiteNumber(headers.get?.(name) ?? null);
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatReset(value: string | null): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return `รีเซ็ตใน ${value}`;
  return `รีเซ็ต ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(time)}`;
}

export function describeAllowance(allowance: AssistantAllowance): AssistantAllowanceView {
  const reset = formatReset(allowance.resetsAt);
  if (allowance.unit === 'usd') {
    if (allowance.remaining == null) {
      return { summary: 'คีย์นี้ไม่ได้จำกัดเครดิต', detail: reset };
    }
    const summary = `เครดิตคงเหลือ ${formatUsd(allowance.remaining)} ดอลลาร์`;
    const limit = allowance.limit == null ? null : `จาก ${formatUsd(allowance.limit)} ดอลลาร์`;
    return { summary, detail: [limit, reset].filter(Boolean).join(' · ') || null };
  }

  if (allowance.remaining == null) {
    return { summary: 'ผู้ให้บริการไม่ได้บอกจำนวนโทเคนคงเหลือ', detail: null };
  }
  const summary = `โทเคนคงเหลือ ${formatTokens(allowance.remaining)}`;
  const limit = allowance.limit == null ? null : `จาก ${formatTokens(allowance.limit)} ในรอบนี้`;
  const windowNote = 'จำนวนนี้เป็นโควต้าของรอบปัจจุบัน';
  return { summary, detail: [limit, windowNote, reset].filter(Boolean).join(' · ') };
}

export function allowanceFromHeaders(provider: AllowanceProvider, headers: HeaderSource | undefined): AssistantAllowance | null {
  if (!headers?.get) return null;
  if (provider === 'anthropic') {
    const remaining = headerNumber(headers, 'anthropic-ratelimit-tokens-remaining');
    if (remaining == null) return null;
    return {
      unit: 'tokens',
      remaining,
      limit: headerNumber(headers, 'anthropic-ratelimit-tokens-limit'),
      resetsAt: headers.get('anthropic-ratelimit-tokens-reset'),
    };
  }
  if (provider === 'openai' || provider === 'openrouter') {
    const remaining = headerNumber(headers, 'x-ratelimit-remaining-tokens');
    if (remaining == null) return null;
    return {
      unit: 'tokens',
      remaining,
      limit: headerNumber(headers, 'x-ratelimit-limit-tokens'),
      resetsAt: headers.get('x-ratelimit-reset-tokens'),
    };
  }
  return null;
}

export function allowanceFromOpenRouterKey(body: unknown): AssistantAllowance | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const record = data as {
    limit?: unknown;
    limit_remaining?: unknown;
    effective_budget?: { limit_usd?: unknown; remaining_usd?: unknown; resets_at?: unknown };
  };
  const budget = record.effective_budget;
  const remaining = finiteNumber(budget?.remaining_usd) ?? finiteNumber(record.limit_remaining);
  const limit = finiteNumber(budget?.limit_usd) ?? finiteNumber(record.limit);
  const resetsAt = typeof budget?.resets_at === 'string' ? budget.resets_at : null;
  if (remaining == null && limit == null) return { unit: 'usd', remaining: null, limit: null, resetsAt };
  return { unit: 'usd', remaining, limit, resetsAt };
}

export function modelAllowanceRows(
  models: string[],
  readings: Record<string, AssistantAllowance | undefined>,
): AssistantModelAllowanceView[] {
  const unique = [...new Set(models.map((model) => model.trim()).filter(Boolean))];
  return unique.map((model) => {
    const reading = readings[model];
    if (!reading) return { model, summary: 'โทเคนคงเหลือ ยังไม่ทราบ', detail: null };
    return { model, ...describeAllowance(reading) };
  });
}

export function rememberResponseAllowance(
  provider: AllowanceProvider,
  apiKey: string,
  model: string,
  headers: HeaderSource | undefined,
): AssistantAllowance | null {
  const allowance = allowanceFromHeaders(provider, headers);
  const trimmed = model.trim();
  if (!allowance || !apiKey || !trimmed) return null;
  cache.set(cacheKey(provider, apiKey, trimmed), allowance);
  writeModelAllowance(apiKey, trimmed, allowance);
  return allowance;
}

export function cachedAllowance(provider: AllowanceProvider, apiKey: string, model: string): AssistantAllowance | null {
  if (!apiKey || !model.trim()) return null;
  return cache.get(cacheKey(provider, apiKey, model.trim())) ?? null;
}

function storedReadings(apiKey: string): Record<string, AssistantAllowance> {
  return Object.fromEntries(
    Object.entries(readModelAllowances(apiKey)).map(([model, allowance]) => [
      model,
      {
        unit: allowance.unit,
        remaining: allowance.remaining,
        limit: allowance.limit,
        resetsAt: allowance.resetsAt,
      },
    ]),
  );
}

async function probeModelTokens(input: {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  workspaceId?: string;
}): Promise<AssistantAllowance | null> {
  try {
    const headers: Record<string, string> =
      input.provider === 'openai'
        ? { Authorization: `Bearer ${input.apiKey}`, 'Content-Type': 'application/json' }
        : {
            'x-api-key': input.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            ...(input.workspaceId ? { 'anthropic-workspace-id': input.workspaceId } : {}),
          };
    const url = input.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.anthropic.com/v1/messages';
    const body =
      input.provider === 'openai'
        ? { model: input.model, max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }
        : { model: input.model, max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    return rememberResponseAllowance(input.provider, input.apiKey, input.model, response.headers);
  } catch {
    return cachedAllowance(input.provider, input.apiKey, input.model);
  }
}

export async function fetchModelAllowances(input: {
  provider: AllowanceProvider;
  apiKey: string;
  model: string;
  workspaceId?: string;
}): Promise<AssistantModelAllowanceView[]> {
  const saved = storedReadings(input.apiKey);
  const models = [input.model, ...Object.keys(saved)];
  if (!input.apiKey || input.provider === 'proxy') return modelAllowanceRows(models, saved);

  if (input.provider === 'openrouter') {
    let credit: AssistantAllowance | null = null;
    try {
      const response = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { Authorization: `Bearer ${input.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) credit = allowanceFromOpenRouterKey(await response.json());
    } catch {
      credit = null;
    }
    const readings = { ...saved };
    if (credit) {
      for (const model of models) {
        const trimmed = model.trim();
        if (!trimmed) continue;
        readings[trimmed] = credit;
        writeModelAllowance(input.apiKey, trimmed, credit);
      }
    }
    return modelAllowanceRows(models, readings);
  }

  const readings = { ...saved };
  const targets = [...new Set(models.map((model) => model.trim()).filter(Boolean))].slice(0, 5);
  for (const model of targets) {
    const fresh = await probeModelTokens({
      provider: input.provider,
      apiKey: input.apiKey,
      model,
      workspaceId: input.workspaceId,
    });
    if (fresh) readings[model] = fresh;
  }
  return modelAllowanceRows(models, readings);
}

import { logger } from '@/lib/logger';
import { rememberResponseAllowance } from './allowance';
import {
  rememberAssistantModel,
  rememberAssistantWorkspace,
  resolveAssistantCredentials,
  type AssistantCredentials,
} from './credentials';
import { parseAssistantPayload } from './parseResponse';
import {
  AssistantProviderError,
  failureFromResponse,
  networkProviderError,
} from './providerError';
import type { AssistantHistoryTurn, AssistantReply } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_WORKSPACES_URL =
  'https://api.anthropic.com/v1/organizations/workspaces?include_default=true&limit=20';
const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models?limit=20';

const ANTHROPIC_MODEL_REPLACEMENTS: Record<string, string> = {
  'claude-sonnet-4-5': 'claude-sonnet-5-5',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-5-5',
  'claude-opus-4-5': 'claude-opus-4-5-20251101',
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
};

export function assistantConfigured(): boolean {
  return resolveAssistantCredentials() !== null;
}

function modelList(): string[] {
  const models = [
    process.env.OPENROUTER_MODEL,
    'google/gemma-4-31b-it:free',
    'google/gemini-2.5-flash',
  ];
  return models.filter((model, index): model is string => Boolean(model) && models.indexOf(model) === index);
}

function assistantText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const content = (result as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : (part as { text?: string })?.text ?? ''))
      .join('\n')
      .trim();
  }
  return '';
}

function chatCompletionsUrl(credentials: AssistantCredentials): string {
  if (credentials.provider === 'openai') return OPENAI_URL;
  return OPENROUTER_URL;
}

async function callChatCompletions(
  credentials: AssistantCredentials,
  model: string,
  messages: { role: string; content: string }[],
  useJsonFormat: boolean,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.apiKey}`,
    'Content-Type': 'application/json',
  };
  if (credentials.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    headers['X-Title'] = 'BigLatex Assistant';
  }

  return fetch(chatCompletionsUrl(credentials), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2048,
      ...(useJsonFormat ? { response_format: { type: 'json_object' } } : {}),
      messages,
    }),
    signal: AbortSignal.timeout(45_000),
  });
}

async function askChatCompletions(
  credentials: AssistantCredentials,
  messages: { role: string; content: string }[],
): Promise<AssistantReply> {
  const models =
    credentials.source === 'packaged' && credentials.provider === 'openrouter'
      ? modelList()
      : [credentials.model];
  let lastError = 'No model succeeded';
  let lastProviderError: AssistantProviderError | null = null;

  for (const model of models) {
    for (const useJsonFormat of [true, false]) {
      let response: Response;
      try {
        response = await callChatCompletions(credentials, model, messages, useJsonFormat);
      } catch (error) {
        lastProviderError = networkProviderError(credentials.provider);
        lastError = error instanceof Error ? error.message : 'Assistant request failed';
        logger.error('Assistant request failed', { provider: credentials.provider, model, error: lastError });
        if (credentials.source !== 'packaged') throw lastProviderError;
        continue;
      }

      if (!response.ok) {
        rememberResponseAllowance(credentials.provider, credentials.apiKey, model, response.headers);
        const providerError = await failureFromResponse(response, credentials.provider);
        lastProviderError = providerError;
        lastError = `${model} ${response.status}`;
        logger.error('Assistant response error', {
          provider: credentials.provider,
          model,
          status: response.status,
          kind: providerError.kind,
        });
        const stopForShop =
          credentials.source !== 'packaged' &&
          (providerError.kind === 'auth' ||
            providerError.kind === 'quota' ||
            providerError.kind === 'rate_limit' ||
            providerError.kind === 'model');
        if (providerError.kind === 'auth' || stopForShop) throw providerError;
        continue;
      }

      rememberResponseAllowance(credentials.provider, credentials.apiKey, model, response.headers);
      const result = await response.json();
      const text = assistantText(result);
      if (!text) {
        lastError = `Empty response from ${model}`;
        continue;
      }
      return parseAssistantPayload(text);
    }
  }

  logger.error('Assistant models exhausted', { provider: credentials.provider, lastError });
  if (lastProviderError) throw lastProviderError;
  throw new Error('OPENROUTER_FAILED');
}

function anthropicText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const content = (result as { content?: { type?: string; text?: string }[] }).content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function anthropicHeaders(apiKey: string, workspaceId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  };
  if (workspaceId) headers['anthropic-workspace-id'] = workspaceId;
  return headers;
}

function anthropicModelToSend(model: string): string {
  return ANTHROPIC_MODEL_REPLACEMENTS[model] ?? model;
}

async function listAnthropicModels(apiKey: string, workspaceId?: string): Promise<string[]> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_MODELS_URL, {
      headers: anthropicHeaders(apiKey, workspaceId),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    logger.error('Assistant model lookup failed', {
      error: error instanceof Error ? error.message : 'Assistant request failed',
    });
    return [];
  }
  if (!response.ok) return [];
  const body = await response.json().catch(() => null);
  const data = body && typeof body === 'object' ? (body as { data?: unknown }).data : null;
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const id = (item as { id?: unknown }).id;
    return typeof id === 'string' && id.trim() ? [id.trim()] : [];
  });
}

function pickAvailableSonnet(models: string[], current: string): string | null {
  if (models.includes(current)) return null;
  return models.find((id) => id.startsWith('claude-sonnet-')) ?? null;
}

async function discoverAnthropicWorkspace(apiKey: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_WORKSPACES_URL, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    logger.error('Assistant workspace lookup failed', {
      error: error instanceof Error ? error.message : 'Assistant request failed',
    });
    return null;
  }
  if (!response.ok) return null;

  const body = await response.json().catch(() => null);
  const data = body && typeof body === 'object' ? (body as { data?: unknown }).data : null;
  if (!Array.isArray(data)) return null;
  const workspaces = data.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as { id?: unknown; name?: unknown };
    if (typeof record.id !== 'string' || !record.id.startsWith('wrkspc_')) return [];
    return [{ id: record.id, name: typeof record.name === 'string' ? record.name : '' }];
  });
  const preferred = workspaces.find((item) => /default/i.test(item.name)) ?? workspaces[0];
  return preferred?.id ?? null;
}

async function postAnthropic(
  credentials: AssistantCredentials,
  messages: { role: string; content: string }[],
  model: string,
  workspaceId?: string,
): Promise<Response> {
  const system = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const dialogue = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role, content: message.content }));

  return fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: anthropicHeaders(credentials.apiKey, workspaceId),
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      ...(system ? { system } : {}),
      messages: dialogue.length > 0 ? dialogue : [{ role: 'user', content: 'ตอบเป็น JSON' }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
}

async function readAnthropicReply(response: Response): Promise<AssistantReply> {
  const text = anthropicText(await response.json());
  if (!text) throw new Error('OPENROUTER_FAILED');
  return parseAssistantPayload(text);
}

async function askAnthropic(
  credentials: AssistantCredentials,
  messages: { role: string; content: string }[],
): Promise<{ reply: AssistantReply; model: string }> {
  let workspaceId = credentials.workspaceId?.trim() || undefined;
  let lookedUpWorkspace = false;
  let lookedUpModels = false;
  let model = anthropicModelToSend(credentials.model);
  let lastError: AssistantProviderError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await postAnthropic(credentials, messages, model, workspaceId);
    rememberResponseAllowance('anthropic', credentials.apiKey, model, response.headers);
    if (response.ok) {
      if (model !== credentials.model) rememberAssistantModel(credentials.apiKey, model);
      return { reply: await readAnthropicReply(response), model };
    }

    lastError = await failureFromResponse(response, 'anthropic');
    logger.error('Assistant response error', {
      provider: 'anthropic',
      model,
      status: response.status,
      kind: lastError.kind,
      detail: lastError.detail,
    });

    if (lastError.kind === 'workspace' && !lookedUpWorkspace) {
      lookedUpWorkspace = true;
      const discovered = await discoverAnthropicWorkspace(credentials.apiKey);
      if (discovered && discovered !== workspaceId) {
        workspaceId = discovered;
        rememberAssistantWorkspace(credentials.apiKey, discovered);
        continue;
      }
    }

    if (lastError.kind === 'model' && !lookedUpModels) {
      lookedUpModels = true;
      const available = await listAnthropicModels(credentials.apiKey, workspaceId);
      const fallback = pickAvailableSonnet(available, model);
      if (fallback) {
        model = fallback;
        continue;
      }
    }

    break;
  }

  throw lastError ?? new Error('OPENROUTER_FAILED');
}

async function askProxy(
  url: string,
  messages: { role: string; content: string }[],
): Promise<AssistantReply> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.LICENSE_VALIDATION_KEY) {
    headers['X-Validation-Key'] = process.env.LICENSE_VALIDATION_KEY;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const providerError = await failureFromResponse(response, 'proxy');
    logger.error('Assistant proxy response error', { status: response.status, kind: providerError.kind });
    throw providerError;
  }

  const result = await response.json();
  if (result && typeof result === 'object' && typeof (result as { text?: unknown }).text === 'string') {
    return parseAssistantPayload(JSON.stringify(result));
  }
  const text = typeof (result as { content?: unknown })?.content === 'string'
    ? (result as { content: string }).content
    : assistantText(result);
  if (!text) throw new Error('OPENROUTER_FAILED');
  return parseAssistantPayload(text);
}

export async function askShopAssistant(
  messages: { role: string; content: string }[],
): Promise<AssistantReply> {
  const credentials = resolveAssistantCredentials();
  if (!credentials) {
    throw new Error('ASSISTANT_NOT_CONFIGURED');
  }
  if (credentials.provider === 'proxy' && credentials.proxyUrl) {
    return askProxy(credentials.proxyUrl, messages);
  }
  if (credentials.provider === 'anthropic') {
    return (await askAnthropic(credentials, messages)).reply;
  }
  return askChatCompletions(credentials, messages);
}

const TEST_MESSAGES = [
  {
    role: 'system',
    content: 'Reply with one JSON object and nothing else: {"text":"ok","charts":[],"tables":[]}',
  },
  { role: 'user', content: 'ทดสอบการเชื่อมต่อ' },
];

export async function testAssistantCredentials(credentials: AssistantCredentials): Promise<{ model: string }> {
  if (credentials.provider === 'proxy' && credentials.proxyUrl) {
    await askProxy(credentials.proxyUrl, TEST_MESSAGES);
    return { model: credentials.model };
  }
  if (credentials.provider === 'anthropic') {
    return { model: (await askAnthropic(credentials, TEST_MESSAGES)).model };
  }
  await askChatCompletions({ ...credentials, source: 'shop' }, TEST_MESSAGES);
  return { model: credentials.model };
}

export function assistantMessages(
  systemPrompt: string,
  history: AssistantHistoryTurn[],
  userPrompt: string,
): { role: string; content: string }[] {
  return [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userPrompt },
  ];
}

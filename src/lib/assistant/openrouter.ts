import { logger } from '@/lib/logger';
import { resolveAssistantCredentials, type AssistantCredentials } from './credentials';
import { parseAssistantPayload } from './parseResponse';
import type { AssistantHistoryTurn, AssistantReply } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

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

  for (const model of models) {
    for (const useJsonFormat of [true, false]) {
      let response: Response;
      try {
        response = await callChatCompletions(credentials, model, messages, useJsonFormat);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Assistant request failed';
        logger.error('Assistant request failed', { provider: credentials.provider, model, error: lastError });
        continue;
      }

      if (!response.ok) {
        lastError = `${model} ${response.status}`;
        logger.error('Assistant response error', { provider: credentials.provider, model, status: response.status });
        if (response.status === 401 || response.status === 403) {
          throw new Error('OPENROUTER_AUTH');
        }
        continue;
      }

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

async function askAnthropic(
  credentials: AssistantCredentials,
  messages: { role: string; content: string }[],
): Promise<AssistantReply> {
  const system = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const dialogue = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role, content: message.content }));

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': credentials.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: credentials.model,
      max_tokens: 2048,
      temperature: 0.2,
      ...(system ? { system } : {}),
      messages: dialogue.length > 0 ? dialogue : [{ role: 'user', content: 'ตอบเป็น JSON' }],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    logger.error('Assistant response error', { provider: 'anthropic', status: response.status });
    if (response.status === 401 || response.status === 403) {
      throw new Error('OPENROUTER_AUTH');
    }
    throw new Error('OPENROUTER_FAILED');
  }

  const text = anthropicText(await response.json());
  if (!text) throw new Error('OPENROUTER_FAILED');
  return parseAssistantPayload(text);
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
    logger.error('Assistant proxy response error', { status: response.status });
    if (response.status === 401 || response.status === 403) {
      throw new Error('OPENROUTER_AUTH');
    }
    throw new Error('OPENROUTER_FAILED');
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
    return askAnthropic(credentials, messages);
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

export async function testAssistantCredentials(credentials: AssistantCredentials): Promise<void> {
  if (credentials.provider === 'proxy' && credentials.proxyUrl) {
    await askProxy(credentials.proxyUrl, TEST_MESSAGES);
    return;
  }
  if (credentials.provider === 'anthropic') {
    await askAnthropic(credentials, TEST_MESSAGES);
    return;
  }
  await askChatCompletions({ ...credentials, source: 'shop' }, TEST_MESSAGES);
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

import { logger } from '@/shared/logger';
import { parseAssistantPayload } from './parseResponse';
import type { AssistantHistoryTurn, AssistantReply } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[],
  useJsonFormat: boolean,
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'BigLatex Assistant',
    },
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

export async function askShopAssistant(
  messages: { role: string; content: string }[],
): Promise<AssistantReply> {
  let lastError = 'No OpenRouter model succeeded';

  for (const model of modelList()) {
    for (const useJsonFormat of [true, false]) {
      let response: Response;
      try {
        response = await callOpenRouter(model, messages, useJsonFormat);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'OpenRouter request failed';
        logger.error('OpenRouter request failed', { model, error: lastError });
        continue;
      }

      if (!response.ok) {
        const errorText = (await response.text()).slice(0, 500);
        lastError = `${model} ${response.status} ${errorText}`;
        logger.error('OpenRouter response error', { model, status: response.status });
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

  logger.error('OpenRouter models exhausted', { lastError });
  throw new Error('OPENROUTER_FAILED');
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

import type { AssistantCredentials } from './credentials';

export type AssistantProviderName = AssistantCredentials['provider'];

type FailureKind = 'auth' | 'quota' | 'rate_limit' | 'model' | 'workspace' | 'request' | 'unavailable' | 'network';

const QUOTA_MESSAGE: Record<AssistantProviderName, string> = {
  openai: 'โควต้า API หมด เติมเครดิตในบัญชี OpenAI ก่อนทดสอบอีกครั้ง',
  anthropic: 'โควต้า API หมด เติมเครดิตในบัญชี Anthropic ก่อนทดสอบอีกครั้ง',
  openrouter: 'โควต้า API หมด เติมเครดิตในบัญชี OpenRouter ก่อนทดสอบอีกครั้ง',
  proxy: 'โควต้า API หมด เติมเครดิตในบัญชีผู้ให้บริการ ก่อนทดสอบอีกครั้ง',
};

export class AssistantProviderError extends Error {
  readonly status: number;
  readonly kind: FailureKind;
  readonly detail: string | null;
  readonly provider: AssistantProviderName;

  constructor(status: number, kind: FailureKind, detail: string | null, provider: AssistantProviderName) {
    super('ASSISTANT_PROVIDER');
    this.name = 'AssistantProviderError';
    this.status = status;
    this.kind = kind;
    this.detail = detail;
    this.provider = provider;
  }
}

function errorSource(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>;
  return record;
}

function providerFields(body: unknown): { code: string | null; message: string | null } {
  const source = errorSource(body);
  if (!source) return { code: null, message: null };
  const code =
    typeof source.code === 'string' && source.code.trim()
      ? source.code.trim()
      : typeof source.type === 'string' && source.type.trim() && source.type !== 'error'
        ? source.type.trim()
        : null;
  const message = typeof source.message === 'string' ? source.message.trim() : null;
  return { code, message };
}

function classify(status: number, code: string | null, message: string | null): FailureKind {
  const haystack = `${code ?? ''} ${message ?? ''}`.toLowerCase();
  if (status === 401 || status === 403 || /invalid_api_key|authentication_error|permission_error/.test(haystack)) {
    return 'auth';
  }
  if (status === 0) return 'network';
  if (/workspace/.test(haystack)) return 'workspace';
  if (status === 404 || (haystack.includes('model') && haystack.includes('not_found'))) return 'model';
  if (status === 429 && /quota|billing|insufficient/.test(haystack)) return 'quota';
  if (status === 429) return 'rate_limit';
  if (status >= 500 || status === 408) return 'unavailable';
  if (status >= 400) return 'request';
  return 'unavailable';
}

function publicDetail(message: string | null): string | null {
  if (!message) return null;
  const compact = message.replace(/\s+/g, ' ').trim();
  if (!compact || /sk-[a-z0-9_-]{8,}|bearer\s+[a-z0-9._~+/-]+=*/i.test(compact)) return null;
  return compact.slice(0, 160);
}

export function networkProviderError(provider: AssistantProviderName): AssistantProviderError {
  return new AssistantProviderError(0, 'network', null, provider);
}

export async function failureFromResponse(
  response: Response,
  provider: AssistantProviderName,
): Promise<AssistantProviderError> {
  let code: string | null = null;
  let message: string | null = null;
  try {
    const fields = providerFields(await response.json());
    code = fields.code;
    message = fields.message;
  } catch {
    code = null;
    message = null;
  }
  const kind = classify(response.status, code, message);
  const detail = kind === 'request' || kind === 'model' ? publicDetail(message) : null;
  return new AssistantProviderError(response.status, kind, detail, provider);
}

export function assistantFailureMessage(error: unknown, options?: { authMessage?: string }): string | null {
  if (!(error instanceof AssistantProviderError)) return null;
  switch (error.kind) {
    case 'auth':
      return options?.authMessage ?? 'API Key ใช้ไม่ได้';
    case 'quota':
      return QUOTA_MESSAGE[error.provider];
    case 'rate_limit':
      return 'เรียกถี่เกินไป รอสักครู่แล้วลองใหม่';
    case 'model':
      return error.detail ? `ไม่พบโมเดลนี้: ${error.detail}` : 'ไม่พบโมเดลนี้';
    case 'workspace':
      return 'คีย์นี้ยังไม่ผูกกับเวิร์กสเปซ สร้างคีย์ที่เลือกเวิร์กสเปซใน Claude Console แล้วลองใหม่';
    case 'network':
      return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้';
    case 'unavailable':
      return 'ผู้ให้บริการขัดข้อง ลองใหม่อีกครั้ง';
    case 'request':
      return error.detail ? `คำขอไม่ถูกต้อง: ${error.detail}` : 'คำขอไม่ถูกต้อง ตรวจชื่อโมเดลและ API Key';
    default:
      return null;
  }
}

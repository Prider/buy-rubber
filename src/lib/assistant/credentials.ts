import fs from 'fs';
import path from 'path';

export const ASSISTANT_PROVIDERS = ['openrouter', 'openai', 'anthropic'] as const;

export type AssistantProvider = (typeof ASSISTANT_PROVIDERS)[number];

export const ASSISTANT_PROVIDER_LABELS: Record<AssistantProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'ChatGPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
};

export const ASSISTANT_DEFAULT_MODELS: Record<AssistantProvider, string> = {
  openrouter: 'google/gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-5',
};

export type AssistantCredentialSource = 'shop' | 'packaged';

export type AssistantCredentials = {
  provider: AssistantProvider | 'proxy';
  model: string;
  apiKey: string;
  proxyUrl?: string;
  source: AssistantCredentialSource;
};

export type AssistantSettingsView = {
  provider: AssistantProvider;
  model: string;
  hasKey: boolean;
  keyHint: string | null;
  source: AssistantCredentialSource | 'none';
};

type StoredAssistantConfig = {
  provider: AssistantProvider;
  model: string;
  apiKey: string;
};

export function isAssistantProvider(value: unknown): value is AssistantProvider {
  return ASSISTANT_PROVIDERS.includes(value as AssistantProvider);
}

export function maskAssistantKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '•'.repeat(Math.max(trimmed.length, 4));
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export function assistantConfigPath(): string {
  const override = process.env.ASSISTANT_CONFIG_PATH?.trim();
  if (override) return override;

  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:')) {
    let filePath = dbUrl.slice('file:'.length);
    if (filePath.startsWith('//')) {
      filePath = filePath.replace(/^\/+/, '/');
    }
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }
    const folder = path.dirname(filePath);
    const userData = path.basename(folder).toLowerCase() === 'prisma' ? path.dirname(folder) : folder;
    return path.join(userData, 'assistant.json');
  }

  return path.join(process.cwd(), 'assistant.json');
}

function readStoredConfig(): StoredAssistantConfig | null {
  try {
    const raw = fs.readFileSync(assistantConfigPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredAssistantConfig>;
    if (!isAssistantProvider(parsed.provider)) return null;
    const apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '';
    if (!apiKey) return null;
    const model =
      typeof parsed.model === 'string' && parsed.model.trim()
        ? parsed.model.trim()
        : ASSISTANT_DEFAULT_MODELS[parsed.provider];
    return { provider: parsed.provider, model, apiKey };
  } catch {
    return null;
  }
}

export function readStoredApiKey(provider?: AssistantProvider): string | null {
  const stored = readStoredConfig();
  if (!stored) return null;
  if (provider && stored.provider !== provider) return null;
  return stored.apiKey;
}

export function writeAssistantConfig(config: StoredAssistantConfig): void {
  const filePath = assistantConfigPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(config)}\n`, { encoding: 'utf8', mode: 0o600 });
}

export function clearAssistantConfig(): void {
  try {
    fs.unlinkSync(assistantConfigPath());
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
}

function packagedCredentials(): AssistantCredentials | null {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (apiKey) {
    return {
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL?.trim() || ASSISTANT_DEFAULT_MODELS.openrouter,
      apiKey,
      source: 'packaged',
    };
  }
  const proxyUrl = process.env.ASSISTANT_PROXY_URL?.trim();
  if (proxyUrl) {
    return {
      provider: 'proxy',
      model: '',
      apiKey: '',
      proxyUrl,
      source: 'packaged',
    };
  }
  return null;
}

export function resolveAssistantCredentials(): AssistantCredentials | null {
  const stored = readStoredConfig();
  if (stored) {
    return { ...stored, source: 'shop' };
  }
  return packagedCredentials();
}

export function readAssistantSettings(): AssistantSettingsView {
  const stored = readStoredConfig();
  if (stored) {
    return {
      provider: stored.provider,
      model: stored.model,
      hasKey: true,
      keyHint: maskAssistantKey(stored.apiKey),
      source: 'shop',
    };
  }

  const packaged = packagedCredentials();
  if (packaged && packaged.provider !== 'proxy') {
    return {
      provider: 'openrouter',
      model: packaged.model,
      hasKey: true,
      keyHint: maskAssistantKey(packaged.apiKey),
      source: 'packaged',
    };
  }
  if (packaged?.provider === 'proxy') {
    return {
      provider: 'openrouter',
      model: ASSISTANT_DEFAULT_MODELS.openrouter,
      hasKey: true,
      keyHint: null,
      source: 'packaged',
    };
  }

  return {
    provider: 'openrouter',
    model: ASSISTANT_DEFAULT_MODELS.openrouter,
    hasKey: false,
    keyHint: null,
    source: 'none',
  };
}

export function normalizeAssistantModel(provider: AssistantProvider, model: unknown): string | null {
  const text = typeof model === 'string' ? model.trim() : '';
  if (!text || text.length > 120 || /[\r\n]/.test(text)) return null;
  return text || ASSISTANT_DEFAULT_MODELS[provider];
}

export function normalizeAssistantKey(apiKey: unknown): string | null {
  if (typeof apiKey !== 'string') return null;
  const text = apiKey.trim();
  if (text.length < 8 || text.length > 400 || /\s/.test(text)) return null;
  return text;
}

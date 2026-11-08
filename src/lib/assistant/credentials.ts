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
  anthropic: 'claude-sonnet-5-5',
};

export type AssistantCredentialSource = 'shop' | 'packaged';

export type AssistantCredentials = {
  provider: AssistantProvider | 'proxy';
  model: string;
  apiKey: string;
  proxyUrl?: string;
  workspaceId?: string;
  source: AssistantCredentialSource;
};

export type AssistantProviderAccountView = {
  hasKey: boolean;
  keyHint: string | null;
  model: string;
};

export type AssistantSettingsView = {
  provider: AssistantProvider;
  model: string;
  hasKey: boolean;
  keyHint: string | null;
  source: AssistantCredentialSource | 'none';
  accounts: Record<AssistantProvider, AssistantProviderAccountView>;
};

export type StoredModelAllowance = {
  unit: 'tokens' | 'usd';
  remaining: number | null;
  limit: number | null;
  resetsAt: string | null;
  checkedAt: string;
};

type StoredProviderAccount = {
  model: string;
  apiKey: string;
  workspaceId?: string;
  allowances?: Record<string, StoredModelAllowance>;
};

type StoredAssistantConfig = StoredProviderAccount & {
  provider: AssistantProvider;
};

type StoredAssistantFile = {
  provider?: AssistantProvider;
  providers?: Partial<Record<AssistantProvider, Partial<StoredProviderAccount>>>;
  model?: string;
  apiKey?: string;
  workspaceId?: string;
  allowances?: unknown;
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

function accountFrom(
  provider: AssistantProvider,
  value: (Partial<Omit<StoredProviderAccount, 'allowances'>> & { allowances?: unknown }) | undefined,
): StoredProviderAccount | null {
  const apiKey = typeof value?.apiKey === 'string' ? value.apiKey.trim() : '';
  if (!apiKey) return null;
  const model =
    typeof value?.model === 'string' && value.model.trim()
      ? value.model.trim()
      : ASSISTANT_DEFAULT_MODELS[provider];
  const workspaceId = provider === 'anthropic' ? normalizeAssistantWorkspace(value?.workspaceId) : null;
  const allowances = readStoredAllowances(value?.allowances);
  return {
    model,
    apiKey,
    ...(workspaceId ? { workspaceId } : {}),
    ...(allowances ? { allowances } : {}),
  };
}

type AssistantLibrary = {
  active: AssistantProvider;
  accounts: Partial<Record<AssistantProvider, StoredProviderAccount>>;
  packagedModel: string | null;
};

function packagedOpenRouter(): { apiKey: string; model: string } | null {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL?.trim() || ASSISTANT_DEFAULT_MODELS.openrouter,
  };
}

function canUseWithoutShopAccount(provider: AssistantProvider): boolean {
  if (provider !== 'openrouter') return false;
  return Boolean(packagedOpenRouter() || process.env.ASSISTANT_PROXY_URL?.trim());
}

function readLibrary(): AssistantLibrary | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(assistantConfigPath(), 'utf8')) as StoredAssistantFile;
    const accounts: Partial<Record<AssistantProvider, StoredProviderAccount>> = {};
    const hasProviderMap = Boolean(parsed.providers && typeof parsed.providers === 'object');
    if (hasProviderMap && parsed.providers) {
      for (const provider of ASSISTANT_PROVIDERS) {
        const account = accountFrom(provider, parsed.providers[provider]);
        if (account) accounts[provider] = account;
      }
    } else if (isAssistantProvider(parsed.provider)) {
      const account = accountFrom(parsed.provider, parsed);
      if (account) accounts[parsed.provider] = account;
    }
    const requested = isAssistantProvider(parsed.provider) ? parsed.provider : null;
    const active =
      requested && (accounts[requested] || (hasProviderMap && canUseWithoutShopAccount(requested)))
        ? requested
        : ASSISTANT_PROVIDERS.find((provider) => accounts[provider]);
    if (!active) return null;
    const packagedModel =
      hasProviderMap && !accounts[active] && typeof parsed.model === 'string' && parsed.model.trim()
        ? parsed.model.trim()
        : null;
    return { active, accounts, packagedModel };
  } catch {
    return null;
  }
}

function writeLibrary(
  active: AssistantProvider,
  accounts: Partial<Record<AssistantProvider, StoredProviderAccount>>,
  packagedModel: string | null,
): void {
  const nextActive =
    accounts[active] || canUseWithoutShopAccount(active)
      ? active
      : ASSISTANT_PROVIDERS.find((provider) => accounts[provider]);
  if (!nextActive) {
    clearAssistantConfig();
    return;
  }
  const file: StoredAssistantFile = { provider: nextActive, providers: accounts };
  if (!accounts[nextActive] && packagedModel) file.model = packagedModel;
  const filePath = assistantConfigPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(file)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

export function readStoredApiKey(provider?: AssistantProvider): string | null {
  const library = readLibrary();
  if (!library) return null;
  return library.accounts[provider ?? library.active]?.apiKey ?? null;
}

export function readRevealableApiKey(provider: AssistantProvider): string | null {
  const stored = readStoredApiKey(provider);
  if (stored) return stored;
  if (provider !== 'openrouter') return null;
  return process.env.OPENROUTER_API_KEY?.trim() || null;
}

export function rememberAssistantModel(apiKey: string, model: string): void {
  const library = readLibrary();
  const account = library?.accounts.anthropic;
  const normalized = normalizeAssistantModel('anthropic', model);
  if (!library || !account || account.apiKey !== apiKey || !normalized || account.model === normalized) return;
  account.model = normalized;
  writeLibrary(library.active, library.accounts, library.packagedModel);
}

export function rememberAssistantWorkspace(apiKey: string, workspaceId: string): void {
  const library = readLibrary();
  const account = library?.accounts.anthropic;
  const normalized = normalizeAssistantWorkspace(workspaceId);
  if (!library || !account || account.apiKey !== apiKey || !normalized || account.workspaceId === normalized) return;
  account.workspaceId = normalized;
  writeLibrary(library.active, library.accounts, library.packagedModel);
}

function finiteStoredNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function readStoredAllowances(value: unknown): Record<string, StoredModelAllowance> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = Object.entries(value as Record<string, unknown>).flatMap(([model, item]) => {
    if (!model.trim() || model.length > 120 || !item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const unit = record.unit === 'tokens' || record.unit === 'usd' ? record.unit : null;
    if (!unit) return [];
    return [[model, {
      unit,
      remaining: finiteStoredNumber(record.remaining),
      limit: finiteStoredNumber(record.limit),
      resetsAt: typeof record.resetsAt === 'string' ? record.resetsAt : null,
      checkedAt: typeof record.checkedAt === 'string' ? record.checkedAt : new Date(0).toISOString(),
    }] as const];
  });
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

export function readModelAllowances(apiKey: string): Record<string, StoredModelAllowance> {
  const library = readLibrary();
  const account = library
    ? ASSISTANT_PROVIDERS.map((provider) => library.accounts[provider]).find((item) => item?.apiKey === apiKey)
    : null;
  return account?.allowances ?? {};
}

export function writeModelAllowance(
  apiKey: string,
  model: string,
  allowance: Omit<StoredModelAllowance, 'checkedAt'>,
): void {
  const library = readLibrary();
  const trimmed = model.trim();
  if (!library || !trimmed || trimmed.length > 120) return;
  const provider = ASSISTANT_PROVIDERS.find((item) => library.accounts[item]?.apiKey === apiKey);
  const account = provider ? library.accounts[provider] : null;
  if (!provider || !account) return;
  account.allowances = {
    ...account.allowances,
    [trimmed]: { ...allowance, checkedAt: new Date().toISOString() },
  };
  writeLibrary(library.active, library.accounts, library.packagedModel);
}

export function removeAssistantProvider(provider: AssistantProvider): void {
  const library = readLibrary();
  if (!library) return;
  delete library.accounts[provider];
  writeLibrary(library.active, library.accounts, library.packagedModel);
}

export function setActiveAssistantProvider(provider: AssistantProvider, model: string): boolean {
  const library: AssistantLibrary = readLibrary() ?? { active: provider, accounts: {}, packagedModel: null };
  const account = library.accounts[provider];
  if (account) {
    account.model = model;
    writeLibrary(provider, library.accounts, null);
    return true;
  }
  if (!canUseWithoutShopAccount(provider)) return false;
  writeLibrary(provider, library.accounts, model);
  return true;
}

export function writeAssistantConfig(config: StoredAssistantConfig): void {
  const library: AssistantLibrary = readLibrary() ?? {
    active: config.provider,
    accounts: {},
    packagedModel: null,
  };
  const previous = library.accounts[config.provider];
  const sameKey = previous?.apiKey === config.apiKey;
  library.accounts[config.provider] = {
    model: config.model,
    apiKey: config.apiKey,
    ...(config.workspaceId
      ? { workspaceId: config.workspaceId }
      : sameKey && previous?.workspaceId
        ? { workspaceId: previous.workspaceId }
        : {}),
    ...(config.allowances
      ? { allowances: config.allowances }
      : sameKey && previous?.allowances
        ? { allowances: previous.allowances }
        : {}),
  };
  writeLibrary(config.provider, library.accounts, null);
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
  const library = readLibrary();
  if (library) {
    const account = library.accounts[library.active];
    if (account) return { provider: library.active, ...account, source: 'shop' };
    if (library.active === 'openrouter') {
      const packaged = packagedCredentials();
      if (packaged?.provider === 'openrouter') {
        return { ...packaged, model: library.packagedModel || packaged.model };
      }
      if (packaged?.provider === 'proxy') return packaged;
    }
    return null;
  }
  return packagedCredentials();
}

function emptyAccounts(): Record<AssistantProvider, AssistantProviderAccountView> {
  return {
    openrouter: { hasKey: false, keyHint: null, model: ASSISTANT_DEFAULT_MODELS.openrouter },
    openai: { hasKey: false, keyHint: null, model: ASSISTANT_DEFAULT_MODELS.openai },
    anthropic: { hasKey: false, keyHint: null, model: ASSISTANT_DEFAULT_MODELS.anthropic },
  };
}

function accountViews(): Record<AssistantProvider, AssistantProviderAccountView> {
  const views = emptyAccounts();
  const library = readLibrary();
  if (library) {
    for (const provider of ASSISTANT_PROVIDERS) {
      const account = library.accounts[provider];
      if (!account) continue;
      views[provider] = { hasKey: true, keyHint: maskAssistantKey(account.apiKey), model: account.model };
    }
  }
  if (!views.openrouter.hasKey) {
    const packaged = packagedOpenRouter();
    if (packaged) {
      views.openrouter = {
        hasKey: true,
        keyHint: maskAssistantKey(packaged.apiKey),
        model: library?.active === 'openrouter' && library.packagedModel ? library.packagedModel : packaged.model,
      };
    } else if (process.env.ASSISTANT_PROXY_URL?.trim()) {
      views.openrouter = {
        hasKey: true,
        keyHint: null,
        model: library?.active === 'openrouter' && library.packagedModel
          ? library.packagedModel
          : ASSISTANT_DEFAULT_MODELS.openrouter,
      };
    }
  }
  return views;
}

export function readAssistantSettings(): AssistantSettingsView {
  const accounts = accountViews();
  const library = readLibrary();
  const storedAccount = library ? library.accounts[library.active] : null;
  if (library && storedAccount) {
    return {
      provider: library.active,
      model: storedAccount.model,
      hasKey: true,
      keyHint: maskAssistantKey(storedAccount.apiKey),
      source: 'shop',
      accounts,
    };
  }

  const packaged = packagedCredentials();
  const usePackaged = packaged && (!library || library.active === 'openrouter');
  if (usePackaged && packaged.provider !== 'proxy') {
    return {
      provider: 'openrouter',
      model: library?.packagedModel || packaged.model,
      hasKey: true,
      keyHint: maskAssistantKey(packaged.apiKey),
      source: 'packaged',
      accounts,
    };
  }
  if (usePackaged && packaged.provider === 'proxy') {
    return {
      provider: 'openrouter',
      model: library?.packagedModel || ASSISTANT_DEFAULT_MODELS.openrouter,
      hasKey: true,
      keyHint: null,
      source: 'packaged',
      accounts,
    };
  }

  return {
    provider: 'openrouter',
    model: ASSISTANT_DEFAULT_MODELS.openrouter,
    hasKey: false,
    keyHint: null,
    source: 'none',
    accounts,
  };
}

export function normalizeAssistantModel(provider: AssistantProvider, model: unknown): string | null {
  const text = typeof model === 'string' ? model.trim() : '';
  if (!text || text.length > 120 || /[\r\n]/.test(text)) return null;
  return text || ASSISTANT_DEFAULT_MODELS[provider];
}

export function normalizeAssistantWorkspace(workspaceId: unknown): string | null {
  if (typeof workspaceId !== 'string') return null;
  const text = workspaceId.trim();
  if (!/^wrkspc_[A-Za-z0-9]{8,80}$/.test(text)) return null;
  return text;
}

export function normalizeAssistantKey(apiKey: unknown): string | null {
  if (typeof apiKey !== 'string') return null;
  const text = apiKey.trim();
  if (text.length < 8 || text.length > 400 || /\s/.test(text)) return null;
  return text;
}

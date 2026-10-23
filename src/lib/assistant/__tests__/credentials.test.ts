import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAssistantConfig,
  maskAssistantKey,
  readAssistantSettings,
  resolveAssistantCredentials,
  writeAssistantConfig,
} from '../credentials';

const filePath = path.join(os.tmpdir(), `assistant-credentials-${process.pid}.json`);

describe('assistant credentials', () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousModel = process.env.OPENROUTER_MODEL;
  const previousProxy = process.env.ASSISTANT_PROXY_URL;
  const previousPath = process.env.ASSISTANT_CONFIG_PATH;

  afterEach(() => {
    clearAssistantConfig();
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = previousModel;
    if (previousProxy === undefined) delete process.env.ASSISTANT_PROXY_URL;
    else process.env.ASSISTANT_PROXY_URL = previousProxy;
    if (previousPath === undefined) delete process.env.ASSISTANT_CONFIG_PATH;
    else process.env.ASSISTANT_CONFIG_PATH = previousPath;
  });

  it('prefers the shop key over the packaged key and never returns the raw key in settings', () => {
    process.env.ASSISTANT_CONFIG_PATH = filePath;
    process.env.OPENROUTER_API_KEY = 'packaged-key-value';
    writeAssistantConfig({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-shop-secret-key',
    });

    const resolved = resolveAssistantCredentials();
    const view = readAssistantSettings();

    expect(resolved).toMatchObject({ provider: 'openai', model: 'gpt-4o-mini', source: 'shop' });
    expect(view.source).toBe('shop');
    expect(view.keyHint).toBe(maskAssistantKey('sk-shop-secret-key'));
    expect(JSON.stringify(view)).not.toContain('sk-shop-secret-key');
    expect(fs.readFileSync(filePath, 'utf8')).toContain('sk-shop-secret-key');
  });

  it('falls back to the packaged OpenRouter key after the shop key is removed', () => {
    process.env.ASSISTANT_CONFIG_PATH = filePath;
    process.env.OPENROUTER_API_KEY = 'packaged-key-value';
    process.env.OPENROUTER_MODEL = 'vendor/model';
    delete process.env.ASSISTANT_PROXY_URL;
    writeAssistantConfig({ provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' });
    clearAssistantConfig();

    expect(resolveAssistantCredentials()).toMatchObject({
      provider: 'openrouter',
      model: 'vendor/model',
      source: 'packaged',
    });
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, GET, PUT } from '../route';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

vi.mock('@/lib/sessionToken', () => ({
  getBearerToken: vi.fn(() => 'token'),
  getVerifiedUserFromToken: vi.fn(() => ({ userId: 'user-1', username: 'admin', role: 'admin' })),
}));

const filePath = path.join(os.tmpdir(), `assistant-settings-${process.pid}.json`);

function request(method: string, body?: unknown) {
  return new NextRequest('http://localhost:3000/api/assistant/settings', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('assistant settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASSISTANT_CONFIG_PATH = filePath;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.ASSISTANT_PROXY_URL;
    fs.rmSync(filePath, { force: true });
    vi.mocked(getBearerToken).mockReturnValue('token');
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'user-1',
      username: 'admin',
      role: 'admin',
    });
  });

  it('saves a shop key and returns only a hint', async () => {
    const response = await PUT(
      request('PUT', { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ provider: 'anthropic', source: 'shop', hasKey: true });
    expect(JSON.stringify(data)).not.toContain('sk-ant-secret-key');
  });

  it('rejects a viewer', async () => {
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'user-2',
      username: 'staff',
      role: 'viewer',
    });

    const response = await GET(request('GET'));
    expect(response.status).toBe(403);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('switches provider without asking for a key that is already saved', async () => {
    await PUT(request('PUT', { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }));
    await PUT(request('PUT', { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' }));

    const response = await PUT(request('PUT', { provider: 'openai', model: 'gpt-4o', apiKey: '' }));
    const data = await response.json();
    const stored = fs.readFileSync(filePath, 'utf8');

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ provider: 'openai', model: 'gpt-4o', source: 'shop', hasKey: true });
    expect(data.accounts.openai.hasKey).toBe(true);
    expect(data.accounts.anthropic.hasKey).toBe(true);
    expect(stored).toContain('sk-openai-secret');
    expect(stored).toContain('sk-ant-secret-key');
    expect(JSON.stringify(data)).not.toContain('sk-openai-secret');
  });

  it('switches to the packaged OpenRouter key and can switch back', async () => {
    process.env.OPENROUTER_API_KEY = 'packaged-key-value';
    await PUT(request('PUT', { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' }));

    const response = await PUT(request('PUT', { provider: 'openrouter', model: 'vendor/model', apiKey: '' }));
    const data = await response.json();
    const stored = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      provider: string;
      providers: { anthropic?: { apiKey?: string }; openrouter?: { apiKey?: string } };
    };

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ provider: 'openrouter', model: 'vendor/model', source: 'packaged', hasKey: true });
    expect(data.accounts.anthropic.hasKey).toBe(true);
    expect(data.accounts.openrouter.hasKey).toBe(true);
    expect(stored.provider).toBe('openrouter');
    expect(stored.providers.anthropic?.apiKey).toBe('sk-ant-secret-key');
    expect(stored.providers.openrouter).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain('packaged-key-value');
    expect(JSON.stringify(data)).not.toContain('sk-ant-secret-key');

    const back = await PUT(request('PUT', { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: '' }));
    const backData = await back.json();
    expect(back.status).toBe(200);
    expect(backData).toMatchObject({ provider: 'anthropic', source: 'shop', hasKey: true });
  });

  it('keeps the current provider when the selected one has no key', async () => {
    await PUT(request('PUT', { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' }));

    const response = await PUT(request('PUT', { provider: 'openai', model: 'gpt-4o-mini', apiKey: '' }));
    const current = await GET(request('GET'));
    const data = await current.json();

    expect(response.status).toBe(400);
    expect(data.provider).toBe('anthropic');
    expect(data.accounts.openai.hasKey).toBe(false);
  });

  it('removes the shop key', async () => {
    await PUT(request('PUT', { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }));
    const response = await DELETE(request('DELETE'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('none');
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

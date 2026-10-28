import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSettings, PUT } from '../route';
import { GET as getKey } from '../key/route';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

vi.mock('@/lib/sessionToken', () => ({
  getBearerToken: vi.fn(() => 'token'),
  getVerifiedUserFromToken: vi.fn(() => ({ userId: 'user-1', username: 'admin', role: 'admin' })),
}));

const filePath = path.join(os.tmpdir(), `assistant-key-${process.pid}.json`);

function request(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('assistant key reveal', () => {
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

  it('returns the saved key to the owner and keeps it out of the settings view', async () => {
    await PUT(
      request('http://localhost:3000/api/assistant/settings', 'PUT', {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        apiKey: 'sk-ant-secret-key',
      }),
    );

    const settings = await getSettings(request('http://localhost:3000/api/assistant/settings'));
    const revealed = await getKey(request('http://localhost:3000/api/assistant/settings/key?provider=anthropic'));
    const data = await revealed.json();

    expect(revealed.status).toBe(200);
    expect(data).toEqual({ apiKey: 'sk-ant-secret-key' });
    expect(JSON.stringify(await settings.json())).not.toContain('sk-ant-secret-key');
  });

  it('returns the packaged OpenRouter key when that provider has no shop key', async () => {
    process.env.OPENROUTER_API_KEY = 'packaged-key-value';

    const revealed = await getKey(request('http://localhost:3000/api/assistant/settings/key?provider=openrouter'));
    const data = await revealed.json();

    expect(revealed.status).toBe(200);
    expect(data).toEqual({ apiKey: 'packaged-key-value' });
  });

  it('rejects a viewer', async () => {
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'user-2',
      username: 'staff',
      role: 'viewer',
    });

    const revealed = await getKey(request('http://localhost:3000/api/assistant/settings/key?provider=openai'));
    expect(revealed.status).toBe(403);
  });
});

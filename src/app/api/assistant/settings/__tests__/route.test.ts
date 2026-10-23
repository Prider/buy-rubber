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

  it('removes the shop key', async () => {
    await PUT(request('PUT', { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }));
    const response = await DELETE(request('DELETE'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('none');
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

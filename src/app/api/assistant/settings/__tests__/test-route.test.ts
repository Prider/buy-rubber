import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../test/route';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

vi.mock('@/lib/sessionToken', () => ({
  getBearerToken: vi.fn(() => 'token'),
  getVerifiedUserFromToken: vi.fn(() => ({ userId: 'user-1', username: 'admin', role: 'admin' })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/assistant/settings/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/assistant/settings/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBearerToken).mockReturnValue('token');
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'user-1',
      username: 'admin',
      role: 'admin',
    });
  });

  it('reports an OpenAI quota failure instead of a generic connection error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'You exceeded your current quota, please check your plan and billing details.',
            type: 'insufficient_quota',
            code: 'insufficient_quota',
          },
        }),
      })),
    );

    const response = await POST(
      request({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: false,
      message: 'โควต้า API หมด เติมเครดิตในบัญชี OpenAI ก่อนทดสอบอีกครั้ง',
      allowance: null,
    });
    expect(JSON.stringify(data)).not.toContain('sk-openai-secret');
  });

  it('finds a workspace and uses the dated Claude model id', async () => {
    const calls: { url: string; init?: { headers?: Record<string, string>; body?: string } }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: { headers?: Record<string, string>; body?: string }) => {
        calls.push({ url: String(url), init });
        if (String(url).includes('/organizations/workspaces')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: [{ id: 'wrkspc_01TESTWORKSPACE', name: 'Default' }] }),
          };
        }
        const model = JSON.parse(init?.body || '{}').model;
        if (calls.filter((call) => call.url.includes('/v1/messages')).length === 1) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                type: 'invalid_request_error',
                message: 'This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header.',
              },
            }),
          };
        }
        expect(model).toBe('claude-sonnet-5-5');
        expect(init?.headers?.['anthropic-workspace-id']).toBe('wrkspc_01TESTWORKSPACE');
        return {
          ok: true,
          status: 200,
          json: async () => ({ content: [{ type: 'text', text: '{"text":"ok","charts":[],"tables":[]}' }] }),
        };
      }),
    );

    const response = await POST(
      request({ provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-secret-key' }),
    );
    const data = await response.json();

    expect(data).toEqual({
      ok: true,
      message: 'เชื่อมต่อได้ ใช้โมเดล claude-sonnet-5-5',
      model: 'claude-sonnet-5-5',
      allowance: null,
    });
    expect(calls.some((call) => call.url.includes('/organizations/workspaces'))).toBe(true);
  });

  it('uses a Sonnet model the account actually lists when the requested one is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: { body?: string }) => {
        if (String(url).includes('/v1/models')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: [{ id: 'claude-sonnet-4-6' }, { id: 'claude-haiku-4-5-20251001' }] }),
          };
        }
        const requested = JSON.parse(init?.body || '{}').model;
        if (requested === 'claude-sonnet-5-5') {
          return {
            ok: false,
            status: 404,
            json: async () => ({ error: { type: 'not_found_error', message: 'model: claude-sonnet-5-5' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ content: [{ type: 'text', text: '{"text":"ok","charts":[],"tables":[]}' }] }),
        };
      }),
    );

    const response = await POST(
      request({ provider: 'anthropic', model: 'claude-sonnet-5-5', apiKey: 'sk-ant-secret-key' }),
    );
    const data = await response.json();

    expect(data).toEqual({
      ok: true,
      message: 'เชื่อมต่อได้ ใช้โมเดล claude-sonnet-4-6',
      model: 'claude-sonnet-4-6',
      allowance: null,
    });
  });

  it('returns the tokens still available in this rate-limit window', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            ({
              'x-ratelimit-remaining-tokens': '8000',
              'x-ratelimit-limit-tokens': '10000',
            })[name] ?? null,
        },
        json: async () => ({
          choices: [{ message: { content: '{"text":"ok","charts":[],"tables":[]}' } }],
        }),
      })),
    );

    const response = await POST(
      request({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }),
    );
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.allowance.summary).toBe('โทเคนคงเหลือ 8,000');
    expect(data.allowance.detail).toContain('จาก 10,000 ในรอบนี้');
  });

  it('reports a network failure when the provider cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('fetch failed');
      }),
    );

    const response = await POST(
      request({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-secret' }),
    );
    const data = await response.json();

    expect(data.message).toBe('เชื่อมต่ออินเทอร์เน็ตไม่ได้');
  });
});

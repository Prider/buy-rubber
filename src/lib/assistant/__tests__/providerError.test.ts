import { describe, expect, it } from 'vitest';
import { assistantFailureMessage, failureFromResponse } from '../providerError';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('assistant provider errors', () => {
  it('names an OpenAI quota failure', async () => {
    const error = await failureFromResponse(
      jsonResponse(429, {
        error: {
          message: 'You exceeded your current quota, please check your plan and billing details.',
          type: 'insufficient_quota',
          code: 'insufficient_quota',
        },
      }),
      'openai',
    );

    expect(assistantFailureMessage(error)).toBe('โควต้า API หมด เติมเครดิตในบัญชี OpenAI ก่อนทดสอบอีกครั้ง');
  });

  it('names a rate limit when the quota code is absent', async () => {
    const error = await failureFromResponse(
      jsonResponse(429, { error: { message: 'Rate limit reached', code: 'rate_limit_exceeded' } }),
      'openai',
    );

    expect(assistantFailureMessage(error)).toBe('เรียกถี่เกินไป รอสักครู่แล้วลองใหม่');
  });

  it('names a missing model and a rejected key', async () => {
    const missing = await failureFromResponse(
      jsonResponse(404, { error: { message: 'The model does not exist', code: 'model_not_found' } }),
      'openai',
    );
    const rejected = await failureFromResponse(jsonResponse(401, { error: { message: 'Incorrect API key' } }), 'openai');

    expect(assistantFailureMessage(missing)).toBe('ไม่พบโมเดลนี้: The model does not exist');
    expect(assistantFailureMessage(rejected)).toBe('API Key ใช้ไม่ได้');
  });

  it('treats a missing Anthropic workspace separately from a missing model', async () => {
    const workspace = await failureFromResponse(
      jsonResponse(400, {
        error: {
          type: 'invalid_request_error',
          message:
            'This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID of the workspace to use.',
        },
      }),
      'anthropic',
    );
    const missingWorkspace = await failureFromResponse(
      jsonResponse(404, { error: { type: 'not_found_error', message: 'Workspace wrkspc_missing not found.' } }),
      'anthropic',
    );
    const missingModel = await failureFromResponse(
      jsonResponse(404, { error: { type: 'not_found_error', message: 'model: claude-sonnet-4-5' } }),
      'anthropic',
    );

    expect(assistantFailureMessage(workspace)).toBe(
      'คีย์นี้ยังไม่ผูกกับเวิร์กสเปซ สร้างคีย์ที่เลือกเวิร์กสเปซใน Claude Console แล้วลองใหม่',
    );
    expect(assistantFailureMessage(missingWorkspace)).toBe(assistantFailureMessage(workspace));
    expect(assistantFailureMessage(missingModel)).toBe('ไม่พบโมเดลนี้: model: claude-sonnet-4-5');
  });

  it('keeps a short request detail and drops secrets', async () => {
    const safe = await failureFromResponse(
      jsonResponse(400, { error: { message: 'response_format is not supported with this model', type: 'invalid_request_error' } }),
      'openai',
    );
    const secret = await failureFromResponse(
      jsonResponse(400, { error: { message: 'bad key sk-test-secret' } }),
      'openai',
    );

    expect(assistantFailureMessage(safe)).toBe('คำขอไม่ถูกต้อง: response_format is not supported with this model');
    expect(assistantFailureMessage(secret)).toBe('คำขอไม่ถูกต้อง ตรวจชื่อโมเดลและ API Key');
    expect(assistantFailureMessage(secret)).not.toContain('sk-test-secret');
  });
});

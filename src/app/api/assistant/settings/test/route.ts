import { NextRequest, NextResponse } from 'next/server';
import {
  ASSISTANT_DEFAULT_MODELS,
  isAssistantProvider,
  normalizeAssistantKey,
  normalizeAssistantModel,
  readStoredApiKey,
  resolveAssistantCredentials,
  type AssistantCredentials,
  type AssistantProvider,
} from '@/lib/assistant/credentials';
import { testAssistantCredentials } from '@/lib/assistant/openrouter';
import { isAdminLike } from '@/types/user';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  const user = token ? getVerifiedUserFromToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (!isAdminLike(user.role)) {
    return NextResponse.json({ error: 'เฉพาะเจ้าของเท่านั้น' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isAssistantProvider(body?.provider)) {
    return NextResponse.json({ error: 'เลือกผู้ให้บริการไม่ถูกต้อง' }, { status: 400 });
  }

  const provider = body.provider as AssistantProvider;
  const model = normalizeAssistantModel(provider, body?.model || ASSISTANT_DEFAULT_MODELS[provider]);
  if (!model) {
    return NextResponse.json({ error: 'ระบุชื่อโมเดล' }, { status: 400 });
  }

  const submittedKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
  if (submittedKey && !normalizeAssistantKey(submittedKey)) {
    return NextResponse.json({ error: 'API Key ไม่ถูกต้อง' }, { status: 400 });
  }

  const storedKey = submittedKey ? null : readStoredApiKey(provider);
  const active = !submittedKey && !storedKey ? resolveAssistantCredentials() : null;
  const apiKey =
    (submittedKey ? normalizeAssistantKey(submittedKey) : null) ||
    storedKey ||
    (active && active.provider === provider ? active.apiKey : '');
  if (!apiKey) {
    return NextResponse.json({ error: 'กรุณาใส่ API Key' }, { status: 400 });
  }

  const credentials: AssistantCredentials = {
    provider,
    model,
    apiKey,
    source: 'shop',
  };

  try {
    await testAssistantCredentials(credentials);
    return NextResponse.json({ ok: true, message: 'เชื่อมต่อได้' });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'OPENROUTER_AUTH') {
      return NextResponse.json({ ok: false, message: 'API Key ใช้ไม่ได้' }, { status: 200 });
    }
    return NextResponse.json(
      { ok: false, message: 'เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ต ชื่อโมเดล และ API Key' },
      { status: 200 },
    );
  }
}

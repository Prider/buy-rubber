import { NextRequest, NextResponse } from 'next/server';
import {
  ASSISTANT_DEFAULT_MODELS,
  clearAssistantConfig,
  isAssistantProvider,
  normalizeAssistantKey,
  normalizeAssistantModel,
  readAssistantSettings,
  readStoredApiKey,
  writeAssistantConfig,
  type AssistantProvider,
} from '@/lib/assistant/credentials';
import { isAdminLike } from '@/types/user';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireOwner(request: NextRequest): NextResponse | null {
  const token = getBearerToken(request);
  const user = token ? getVerifiedUserFromToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (!isAdminLike(user.role)) {
    return NextResponse.json({ error: 'เฉพาะเจ้าของเท่านั้น' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = requireOwner(request);
  if (denied) return denied;
  return NextResponse.json(readAssistantSettings());
}

export async function PUT(request: NextRequest) {
  const denied = requireOwner(request);
  if (denied) return denied;

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
  const apiKey = submittedKey ? normalizeAssistantKey(submittedKey) : readStoredApiKey(provider);
  if (submittedKey && !normalizeAssistantKey(submittedKey)) {
    return NextResponse.json({ error: 'API Key ไม่ถูกต้อง' }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'กรุณาใส่ API Key' }, { status: 400 });
  }

  writeAssistantConfig({ provider, model, apiKey });
  return NextResponse.json(readAssistantSettings());
}

export async function DELETE(request: NextRequest) {
  const denied = requireOwner(request);
  if (denied) return denied;
  clearAssistantConfig();
  return NextResponse.json(readAssistantSettings());
}

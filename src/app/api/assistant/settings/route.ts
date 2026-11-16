import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import {
  ASSISTANT_DEFAULT_MODELS,
  isAssistantProvider,
  normalizeAssistantKey,
  normalizeAssistantModel,
  readAssistantSettings,
  removeAssistantProvider,
  setActiveAssistantProvider,
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
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  const denied = requireOwner(request);
  if (denied) return denied;
  return NextResponse.json(readAssistantSettings());
}

export async function PUT(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

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
  if (submittedKey) {
    const apiKey = normalizeAssistantKey(submittedKey);
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key ไม่ถูกต้อง' }, { status: 400 });
    }
    writeAssistantConfig({ provider, model, apiKey });
    return NextResponse.json(readAssistantSettings());
  }

  if (!setActiveAssistantProvider(provider, model)) {
    return NextResponse.json({ error: 'กรุณาใส่ API Key' }, { status: 400 });
  }
  return NextResponse.json(readAssistantSettings());
}

export async function DELETE(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  const denied = requireOwner(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const provider = isAssistantProvider(body?.provider) ? body.provider : readAssistantSettings().provider;
  removeAssistantProvider(provider);
  return NextResponse.json(readAssistantSettings());
}

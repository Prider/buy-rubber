import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { isAssistantProvider, readRevealableApiKey, type AssistantProvider } from '@/lib/assistant/credentials';
import { isAdminLike } from '@/types/user';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  const token = getBearerToken(request);
  const user = token ? getVerifiedUserFromToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (!isAdminLike(user.role)) {
    return NextResponse.json({ error: 'เฉพาะเจ้าของเท่านั้น' }, { status: 403 });
  }

  const provider = request.nextUrl.searchParams.get('provider');
  if (!isAssistantProvider(provider)) {
    return NextResponse.json({ error: 'เลือกผู้ให้บริการไม่ถูกต้อง' }, { status: 400 });
  }

  const apiKey = readRevealableApiKey(provider as AssistantProvider);
  if (!apiKey) {
    return NextResponse.json({ error: 'ผู้ให้บริการนี้ยังไม่มีคีย์' }, { status: 404 });
  }
  return NextResponse.json({ apiKey });
}

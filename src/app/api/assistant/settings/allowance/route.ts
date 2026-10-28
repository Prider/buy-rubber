import { NextRequest, NextResponse } from 'next/server';
import { fetchModelAllowances } from '@/lib/assistant/allowance';
import { resolveAssistantCredentials } from '@/lib/assistant/credentials';
import { isAdminLike } from '@/types/user';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  const user = token ? getVerifiedUserFromToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (!isAdminLike(user.role)) {
    return NextResponse.json({ error: 'เฉพาะเจ้าของเท่านั้น' }, { status: 403 });
  }

  const credentials = resolveAssistantCredentials();
  if (!credentials || credentials.provider === 'proxy' || !credentials.apiKey) {
    return NextResponse.json({ models: [] });
  }

  const models = await fetchModelAllowances({
    provider: credentials.provider,
    apiKey: credentials.apiKey,
    model: credentials.model,
    workspaceId: credentials.workspaceId,
  });
  return NextResponse.json({ models });
}

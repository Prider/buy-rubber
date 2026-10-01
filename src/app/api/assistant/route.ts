import { NextRequest, NextResponse } from 'next/server';
import { askShopAssistant, assistantMessages } from '@/industries/rubber/domain/assistant/openrouter';
import { assistantSystemPrompt, assistantUserPrompt, normalizeHistory } from '@/industries/rubber/domain/assistant/prompt';
import { allowAssistantRequest } from '@/industries/rubber/domain/assistant/rateLimit';
import { buildShopSnapshot } from '@/industries/rubber/domain/assistant/snapshot';
import { logger } from '@/shared/logger';
import { requireTenantAuth } from '@/platform/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 1000) : '';
    if (!query) {
      return NextResponse.json({ error: 'กรุณาพิมพ์คำถาม' }, { status: 400 });
    }

    if (!allowAssistantRequest(auth.auth.tenantId)) {
      return NextResponse.json(
        { error: 'ถามถี่เกินไป รอสักครู่แล้วลองใหม่' },
        { status: 429 },
      );
    }

    const snapshot = await buildShopSnapshot(auth.auth.tenantId);
    const reply = await askShopAssistant(
      assistantMessages(
        assistantSystemPrompt(snapshot.period.today),
        normalizeHistory(body?.history),
        assistantUserPrompt(query, snapshot),
      ),
    );

    return NextResponse.json(reply);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'OPENROUTER_AUTH') {
      return NextResponse.json(
        { error: 'คีย์ OpenRouter ใช้ไม่ได้' },
        { status: 502 },
      );
    }
    logger.error('POST /api/assistant - Failed', error);
    return NextResponse.json(
      { error: 'ไม่สามารถถามผู้ช่วยได้ในขณะนี้' },
      { status: 502 },
    );
  }
}

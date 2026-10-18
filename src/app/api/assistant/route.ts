import { NextRequest, NextResponse } from 'next/server';
import { askShopAssistant, assistantConfigured, assistantMessages } from '@/lib/assistant/openrouter';
import { assistantSystemPrompt, assistantUserPrompt, normalizeHistory } from '@/lib/assistant/prompt';
import { allowAssistantRequest } from '@/lib/assistant/rateLimit';
import { buildShopSnapshot } from '@/lib/assistant/snapshot';
import { logger } from '@/lib/logger';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    const user = token ? getVerifiedUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'เฉพาะเจ้าของเท่านั้น' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 1000) : '';
    if (!query) {
      return NextResponse.json({ error: 'กรุณาพิมพ์คำถาม' }, { status: 400 });
    }

    if (!allowAssistantRequest(user.userId)) {
      return NextResponse.json(
        { error: 'ถามถี่เกินไป รอสักครู่แล้วลองใหม่' },
        { status: 429 },
      );
    }

    if (!assistantConfigured()) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่าผู้ช่วย' },
        { status: 503 },
      );
    }

    const snapshot = await buildShopSnapshot(query);
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
        { error: 'คีย์ผู้ช่วยใช้ไม่ได้' },
        { status: 502 },
      );
    }
    if (code === 'ASSISTANT_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่าผู้ช่วย' },
        { status: 503 },
      );
    }
    logger.error('POST /api/assistant - Failed', error);
    return NextResponse.json(
      { error: 'ไม่สามารถถามผู้ช่วยได้ในขณะนี้' },
      { status: 502 },
    );
  }
}

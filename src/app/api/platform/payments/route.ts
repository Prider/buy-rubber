import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requirePlatformAuth } from '@/platform/tenant';
import { bytesToDataUrl } from '@/platform/promptPayQr';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAuth(request);
  if (!auth.ok) return auth.response;

  const rows = await prisma.paymentRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      tenant: {
        select: { id: true, slug: true, name: true, plan: true, status: true },
      },
    },
    take: 200,
  });

  return NextResponse.json({
    payments: rows.map((row) => ({
      id: row.id,
      status: row.status,
      amount: row.amount,
      rejectReason: row.rejectReason,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      slipDataUrl: bytesToDataUrl(row.slipImage, row.slipMimeType),
      tenant: row.tenant,
    })),
  });
}

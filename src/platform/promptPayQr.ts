import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';

export async function promptPayQrDataUrl(
  promptPayId: string,
  amount?: number,
): Promise<string | null> {
  const id = promptPayId.replace(/[\s-]/g, '');
  if (!id) {
    return null;
  }

  try {
    const payload = generatePayload(id, amount && amount > 0 ? { amount } : {});
    return QRCode.toDataURL(payload, { margin: 1, width: 280 });
  } catch {
    return null;
  }
}

export function bytesToDataUrl(bytes: Uint8Array | Buffer | null | undefined, mimeType?: string | null): string | null {
  if (!bytes || bytes.length === 0) {
    return null;
  }
  const mime = mimeType || 'image/png';
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

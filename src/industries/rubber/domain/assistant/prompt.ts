import type { AssistantHistoryTurn, ShopSnapshot } from './types';

export function assistantSystemPrompt(today: string): string {
  return `You are the analytics assistant for a Thai rubber-trading shop (รับซื้อยาง / ขายยาง). Today is ${today} in Asia/Bangkok.

Answer only from the shop snapshot in the user message.

Rules:
- Reply in Thai. Keep member names, company names, product names, and numbers as they appear in the snapshot.
- Use the snapshot numbers. If a figure is missing or the question is outside today, this month, or the last 90 days, say so. Do not invent numbers.
- Breakdown lists are for the current month. last90Days blocks are totals only. recentPurchases and recentSales are the latest 20 rows.
- monthNet = month revenue − cost of goods − expenses − service fees. Missing cost of goods is treated as zero.
- Do not mention bank accounts, ID cards, phone numbers, passwords, or payment slips. They are not in the snapshot.
- When a chart or table makes the answer easier, include it. Otherwise use empty arrays.

Respond with one JSON object and nothing else:
{
  "text": "คำตอบภาษาไทย",
  "charts": [
    {
      "type": "bar",
      "title": "ชื่อกราฟ",
      "data": [{ "name": "รายการ", "value": 100 }]
    }
  ],
  "tables": [
    {
      "title": "ชื่อตาราง",
      "headers": ["คอลัมน์"],
      "rows": [["ค่า"]]
    }
  ]
}

Chart type must be bar, pie, line, or area.`;
}

export function assistantUserPrompt(query: string, snapshot: ShopSnapshot): string {
  return `คำถาม: ${query}\n\nข้อมูลร้าน:\n${JSON.stringify(snapshot)}`;
}

export function normalizeHistory(value: unknown): AssistantHistoryTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: AssistantHistoryTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (record.role !== 'user' && record.role !== 'assistant') continue;
    if (typeof record.content !== 'string') continue;
    const content = record.content.trim().slice(0, 1500);
    if (!content) continue;
    turns.push({ role: record.role, content });
  }
  return turns.slice(-6);
}

import {
  ASSISTANT_CHART_TYPES,
  type AssistantChart,
  type AssistantChartType,
  type AssistantReply,
  type AssistantTable,
} from './types';

const MAX_CHARTS = 4;
const MAX_POINTS = 24;
const MAX_TABLES = 3;
const MAX_ROWS = 20;
const MAX_COLUMNS = 8;

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const tryParse = (value: string) => JSON.parse(value) as unknown;

  try {
    return tryParse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return tryParse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function clip(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function chartType(value: unknown): AssistantChartType {
  return ASSISTANT_CHART_TYPES.includes(value as AssistantChartType) ? (value as AssistantChartType) : 'bar';
}

function sanitizeCharts(value: unknown): AssistantChart[] {
  if (!Array.isArray(value)) return [];

  const charts: AssistantChart[] = [];
  for (const item of value) {
    if (charts.length >= MAX_CHARTS || !item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const data = Array.isArray(record.data)
      ? record.data.flatMap((point) => {
          if (!point || typeof point !== 'object') return [];
          const row = point as Record<string, unknown>;
          const amount = finiteNumber(row.value);
          const name = clip(row.name, 80);
          if (amount === null || !name) return [];
          return [{ name, value: amount }];
        }).slice(0, MAX_POINTS)
      : [];
    if (data.length === 0) continue;
    charts.push({
      type: chartType(record.type),
      title: clip(record.title, 120) || 'กราฟ',
      data,
    });
  }
  return charts;
}

function sanitizeTables(value: unknown): AssistantTable[] {
  if (!Array.isArray(value)) return [];

  const tables: AssistantTable[] = [];
  for (const item of value) {
    if (tables.length >= MAX_TABLES || !item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const headers = Array.isArray(record.headers)
      ? record.headers.map((header) => clip(header, 40)).filter(Boolean).slice(0, MAX_COLUMNS)
      : [];
    if (headers.length === 0) continue;
    const rows = Array.isArray(record.rows)
      ? record.rows.flatMap((row) => {
          if (!Array.isArray(row)) return [];
          return [row.slice(0, headers.length).map((cell) => clip(cell, 80))];
        }).slice(0, MAX_ROWS)
      : [];
    tables.push({
      title: clip(record.title, 120) || 'ตาราง',
      headers,
      rows,
    });
  }
  return tables;
}

export function parseAssistantPayload(raw: string): AssistantReply {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      text: raw.trim().slice(0, 4000) || 'ไม่พบคำตอบจากผู้ช่วย',
      charts: [],
      tables: [],
    };
  }

  const record = parsed as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  return {
    text: (text || 'ดูตัวเลขจากข้อมูลร้านด้านล่าง').slice(0, 4000),
    charts: sanitizeCharts(record.charts),
    tables: sanitizeTables(record.tables),
  };
}

import type { AssistantChart, AssistantTable } from '@/lib/assistant/types';

export const SUGGESTED_QUERIES = [
  'วันนี้รับซื้อไปเท่าไหร่ แยกตามชนิดยาง',
  'สมาชิกคนไหนมียอดรับซื้อสูงสุดเดือนนี้',
  'ขายให้บริษัทไหนมากที่สุด',
  'สต็อกแต่ละชนิดเหลือกี่กิโล',
  'ค่าใช้จ่ายเดือนนี้หมวดไหนสูงสุด',
  'กำไรเดือนนี้เป็นเท่าไหร่',
  'สมาชิกคนไหนไม่มารับซื้อเกิน 30 วัน',
  'ยอดรับซื้อที่ยังไม่จ่ายเดือนนี้มีเท่าไหร่',
];

export type AssistantChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  charts?: AssistantChart[];
  tables?: AssistantTable[];
};

export type SavedQuery = {
  id: string;
  query: string;
};

export type QueryHistoryItem = {
  id: string;
  query: string;
  timestamp: string;
};

export type PersistedAssistant = {
  messages: AssistantChatMessage[];
  savedQueries: SavedQuery[];
  history: QueryHistoryItem[];
};

const MAX_MESSAGES = 40;
const MAX_HISTORY = 20;

export function assistantStorageKey(userId: string): string {
  return `biglatex-assistant:${userId || 'shop'}`;
}

export function loadAssistantState(storage: Storage, userId: string): PersistedAssistant | null {
  try {
    const raw = storage.getItem(assistantStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAssistant;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages.slice(-MAX_MESSAGES),
      savedQueries: Array.isArray(parsed.savedQueries) ? parsed.savedQueries : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : [],
    };
  } catch {
    return null;
  }
}

export function saveAssistantState(storage: Storage, userId: string, state: PersistedAssistant): void {
  try {
    storage.setItem(
      assistantStorageKey(userId),
      JSON.stringify({
        messages: state.messages.slice(-MAX_MESSAGES),
        savedQueries: state.savedQueries,
        history: state.history.slice(0, MAX_HISTORY),
      }),
    );
  } catch {
    // Ignore quota and private-mode failures.
  }
}

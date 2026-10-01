import { describe, expect, it } from 'vitest';
import { assistantStorageKey, loadAssistantState, saveAssistantState } from '../storage';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('assistant storage', () => {
  it('keeps chats for different shops apart', () => {
    const storage = memoryStorage();
    saveAssistantState(storage, 'tenant-a', {
      messages: [{ id: '1', role: 'user', content: 'ร้านเอ', timestamp: '2026-10-01T00:00:00.000Z' }],
      savedQueries: [],
      history: [],
    });
    saveAssistantState(storage, 'tenant-b', {
      messages: [{ id: '2', role: 'user', content: 'ร้านบี', timestamp: '2026-10-01T00:00:00.000Z' }],
      savedQueries: [],
      history: [],
    });

    expect(assistantStorageKey('tenant-a')).not.toBe(assistantStorageKey('tenant-b'));
    expect(loadAssistantState(storage, 'tenant-a')?.messages[0].content).toBe('ร้านเอ');
    expect(loadAssistantState(storage, 'tenant-b')?.messages[0].content).toBe('ร้านบี');
  });
});

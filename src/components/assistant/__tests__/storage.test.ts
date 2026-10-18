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
  it('keeps chats for different users apart', () => {
    const storage = memoryStorage();
    saveAssistantState(storage, 'user-a', {
      messages: [{ id: '1', role: 'user', content: 'ร้านเอ', timestamp: '2026-10-01T00:00:00.000Z' }],
      savedQueries: [],
      history: [],
    });
    saveAssistantState(storage, 'user-b', {
      messages: [{ id: '2', role: 'user', content: 'ร้านบี', timestamp: '2026-10-01T00:00:00.000Z' }],
      savedQueries: [],
      history: [],
    });

    expect(loadAssistantState(storage, 'user-a')?.messages[0].content).toBe('ร้านเอ');
    expect(loadAssistantState(storage, 'user-b')?.messages[0].content).toBe('ร้านบี');
    expect(assistantStorageKey('user-a')).not.toBe(assistantStorageKey('user-b'));
  });
});

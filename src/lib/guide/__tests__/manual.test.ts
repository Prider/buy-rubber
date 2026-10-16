import { describe, expect, it } from 'vitest';
import {
  GUIDE_PHASES,
  GUIDE_SHORTCUTS,
  GUIDE_TOPICS,
  searchTopics,
  topicById,
} from '../manual';

describe('user guide topics', () => {
  it('links every shortcut, phase, and next step to a real topic', () => {
    for (const phase of GUIDE_PHASES) {
      expect(topicById(phase.topicId)?.title).toBeTruthy();
    }
    for (const shortcut of GUIDE_SHORTCUTS) {
      expect(topicById(shortcut.topicId)?.title).toBeTruthy();
    }
    for (const topic of GUIDE_TOPICS) {
      if (topic.nextId) {
        expect(topicById(topic.nextId)?.id).toBe(topic.nextId);
      }
    }
  });

  it('finds topics from the words staff actually type', () => {
    expect(searchTopics('')).toEqual([]);
    expect(searchTopics('   ')).toEqual([]);
    expect(searchTopics('รับซื้อ')[0]?.id).toBe('purchase');
    expect(searchTopics('สำรอง').some((topic) => topic.id === 'backup')).toBe(true);
    expect(searchTopics('admin123').some((topic) => topic.id === 'first-time')).toBe(true);
    expect(searchTopics('ไม่มีหัวข้อนี้จริงๆ')).toEqual([]);
  });
});

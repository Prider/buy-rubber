import { existsSync } from 'node:fs';
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

  it('shows a clip instead of a still on the member steps', () => {
    const members = topicById('members');
    const video = members?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/member-entry.mp4',
      poster: '/guide/member-entry.jpg',
    });
    expect(existsSync('public/guide/member-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/member-entry.jpg')).toBe(true);
  });

  it('shows a clip instead of a still on the purchase steps', () => {
    const purchase = topicById('purchase');
    const video = purchase?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/purchase-entry.mp4',
      poster: '/guide/purchase-entry.jpg',
    });
    expect(existsSync('public/guide/purchase-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/purchase-entry.jpg')).toBe(true);
  });

  it('shows a clip instead of a still on the stock steps', () => {
    const stock = topicById('stock');
    const video = stock?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/stock-entry.mp4',
      poster: '/guide/stock-entry.jpg',
    });
    expect(existsSync('public/guide/stock-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/stock-entry.jpg')).toBe(true);
  });

  it('shows a clip instead of a still on the history steps', () => {
    const history = topicById('history');
    const video = history?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/history-entry.mp4',
      poster: '/guide/history-entry.jpg',
    });
    expect(existsSync('public/guide/history-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/history-entry.jpg')).toBe(true);
  });

  it('shows a clip on the first-day setup steps', () => {
    const setup = topicById('setup');
    const video = setup?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/setup-entry.mp4',
      poster: '/guide/setup-entry.jpg',
    });
    expect(existsSync('public/guide/setup-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/setup-entry.jpg')).toBe(true);
  });

  it('shows a clip instead of a still on the sales steps', () => {
    const sales = topicById('sales');
    const video = sales?.blocks.find((block) => block.kind === 'video');
    expect(video).toMatchObject({
      kind: 'video',
      src: '/guide/sales-entry.mp4',
      poster: '/guide/sales-entry.jpg',
    });
    expect(existsSync('public/guide/sales-entry.mp4')).toBe(true);
    expect(existsSync('public/guide/sales-entry.jpg')).toBe(true);
  });

  it('finds topics from the words staff actually type', () => {
    expect(searchTopics('')).toEqual([]);
    expect(searchTopics('   ')).toEqual([]);
    expect(searchTopics('รับซื้อ')[0]?.id).toBe('purchase');
    expect(searchTopics('สำรอง').some((topic) => topic.id === 'backup')).toBe(true);
    expect(searchTopics('admin123').some((topic) => topic.id === 'first-time')).toBe(true);
    expect(searchTopics('ผู้ช่วยอัจฉริยะ').some((topic) => topic.id === 'assistant')).toBe(true);
    expect(searchTopics('ไม่มีหัวข้อนี้จริงๆ')).toEqual([]);
  });
});

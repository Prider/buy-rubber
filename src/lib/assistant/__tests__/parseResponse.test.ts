import { describe, expect, it } from 'vitest';
import { parseAssistantPayload } from '../parseResponse';

describe('parseAssistantPayload', () => {
  it('reads a JSON object', () => {
    const reply = parseAssistantPayload(
      JSON.stringify({
        text: 'กำไร 450 บาท',
        charts: [{ type: 'bar', title: 'กำไร', data: [{ name: 'ขาย', value: 450 }] }],
        tables: [{ title: 'สรุป', headers: ['รายการ', 'บาท'], rows: [['ขาย', '450']] }],
      }),
    );

    expect(reply.text).toBe('กำไร 450 บาท');
    expect(reply.charts).toEqual([{ type: 'bar', title: 'กำไร', data: [{ name: 'ขาย', value: 450 }] }]);
    expect(reply.tables[0].headers).toEqual(['รายการ', 'บาท']);
  });

  it('reads JSON wrapped in a code fence and drops invalid charts', () => {
    const reply = parseAssistantPayload(`\`\`\`json
{"text":"ดูตาราง","charts":[{"type":"scatter","title":"","data":[{"name":"","value":"no"},{"name":"ยาง","value":2}]}],"tables":[]}
\`\`\``);

    expect(reply.text).toBe('ดูตาราง');
    expect(reply.charts).toEqual([{ type: 'bar', title: 'กราฟ', data: [{ name: 'ยาง', value: 2 }] }]);
  });

  it('keeps plain text when the model does not return JSON', () => {
    const reply = parseAssistantPayload('ยังไม่มีข้อมูลเดือนนี้');
    expect(reply.text).toBe('ยังไม่มีข้อมูลเดือนนี้');
    expect(reply.charts).toEqual([]);
    expect(reply.tables).toEqual([]);
  });
});

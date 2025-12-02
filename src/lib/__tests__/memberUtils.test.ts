import { describe, it, expect } from 'vitest';
import { generateMemberCode, validateMemberData } from '../memberUtils';
import { Member } from '@/types/member';

describe('generateMemberCode', () => {
  it('should generate M001 when no members exist', () => {
    const members: Member[] = [];
    const code = generateMemberCode(members);
    expect(code).toBe('M001');
  });

  it('should generate M002 when M001 exists', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M001',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M002');
  });

  it('should generate next code based on highest number', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M001',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
      {
        id: 'member-2',
        code: 'M005',
        name: 'Test Member 2',
        isActive: true,
      } as Member,
      {
        id: 'member-3',
        code: 'M003',
        name: 'Test Member 3',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M006');
  });

  it('should handle large numbers correctly', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M999',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M1000');
  });

  it('should ignore codes that do not match M### format', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M001',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
      {
        id: 'member-2',
        code: 'ABC123',
        name: 'Test Member 2',
        isActive: true,
      } as Member,
      {
        id: 'member-3',
        code: 'M999',
        name: 'Test Member 3',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M1000');
  });

  it('should handle members with invalid code format', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'INVALID',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
      {
        id: 'member-2',
        code: 'M001',
        name: 'Test Member 2',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M002');
  });

  it('should handle empty code strings', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: '',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
      {
        id: 'member-2',
        code: 'M001',
        name: 'Test Member 2',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M002');
  });

  it('should pad numbers with zeros correctly', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M001',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M002');
    expect(code.length).toBe(4); // M + 3 digits
  });

  it('should handle single digit numbers', () => {
    const members: Member[] = [
      {
        id: 'member-1',
        code: 'M009',
        name: 'Test Member 1',
        isActive: true,
      } as Member,
    ];
    const code = generateMemberCode(members);
    expect(code).toBe('M010');
  });
});

describe('validateMemberData', () => {
  const mockMembers: Member[] = [
    {
      id: 'member-1',
      code: 'M001',
      name: 'John Doe',
      isActive: true,
    } as Member,
    {
      id: 'member-2',
      code: 'M002',
      name: 'Jane Smith',
      isActive: true,
    } as Member,
  ];

  describe('Name validation', () => {
    it('should return error when name is empty', () => {
      const result = validateMemberData({ name: '' }, mockMembers);
      expect(result).toBe('กรุณากรอกชื่อ-นามสกุล');
    });

    it('should return error when name is only whitespace', () => {
      const result = validateMemberData({ name: '   ' }, mockMembers);
      expect(result).toBe('กรุณากรอกชื่อ-นามสกุล');
    });

    it('should return null when name is valid and unique', () => {
      const result = validateMemberData({ name: 'New Member' }, mockMembers);
      expect(result).toBeNull();
    });

    it('should return null when name has leading/trailing whitespace but is valid', () => {
      const result = validateMemberData({ name: '  New Member  ' }, mockMembers);
      expect(result).toBeNull();
    });
  });

  describe('Duplicate name validation', () => {
    it('should return error when name already exists', () => {
      const result = validateMemberData({ name: 'John Doe' }, mockMembers);
      expect(result).toBe('ชื่อ "John Doe" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should return error when name exists with different case', () => {
      const result = validateMemberData({ name: 'JOHN DOE' }, mockMembers);
      expect(result).toBe('ชื่อ "JOHN DOE" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should return error when name exists with mixed case', () => {
      const result = validateMemberData({ name: 'jOhN dOe' }, mockMembers);
      expect(result).toBe('ชื่อ "jOhN dOe" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should return null when name is unique', () => {
      const result = validateMemberData({ name: 'Unique Name' }, mockMembers);
      expect(result).toBeNull();
    });
  });

  describe('Editing member validation', () => {
    it('should return null when editing member with same name', () => {
      const editingMember = mockMembers[0];
      const result = validateMemberData(
        { name: 'John Doe' },
        mockMembers,
        editingMember
      );
      expect(result).toBeNull();
    });

    it('should return null when editing member with same name in different case', () => {
      const editingMember = mockMembers[0];
      const result = validateMemberData(
        { name: 'JOHN DOE' },
        mockMembers,
        editingMember
      );
      expect(result).toBeNull();
    });

    it('should return error when editing member with duplicate name from another member', () => {
      const editingMember = mockMembers[0];
      const result = validateMemberData(
        { name: 'Jane Smith' },
        mockMembers,
        editingMember
      );
      expect(result).toBe('ชื่อ "Jane Smith" มีอยู่ในระบบแล้ว (รหัส: M002)\nกรุณาใช้ชื่ออื่น');
    });

    it('should return null when editing member with new unique name', () => {
      const editingMember = mockMembers[0];
      const result = validateMemberData(
        { name: 'New Unique Name' },
        mockMembers,
        editingMember
      );
      expect(result).toBeNull();
    });

    it('should skip the editing member when checking for duplicates by id', () => {
      const editingMember = mockMembers[0];
      const result = validateMemberData(
        { name: 'John Doe' },
        mockMembers,
        editingMember
      );
      expect(result).toBeNull();
    });

    it('should skip the editing member when checking for duplicates by code', () => {
      const editingMember = { ...mockMembers[0], id: 'different-id' };
      const result = validateMemberData(
        { name: 'John Doe' },
        mockMembers,
        editingMember
      );
      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty members array', () => {
      const result = validateMemberData({ name: 'New Member' }, []);
      expect(result).toBeNull();
    });

    it('should handle members with same name but different codes', () => {
      const membersWithDuplicates: Member[] = [
        {
          id: 'member-1',
          code: 'M001',
          name: 'John Doe',
          isActive: true,
        } as Member,
        {
          id: 'member-2',
          code: 'M002',
          name: 'John Doe',
          isActive: true,
        } as Member,
      ];
      const result = validateMemberData({ name: 'John Doe' }, membersWithDuplicates);
      expect(result).toBe('ชื่อ "John Doe" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should handle null editingMember', () => {
      const result = validateMemberData({ name: 'John Doe' }, mockMembers, null);
      expect(result).toBe('ชื่อ "John Doe" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should handle undefined editingMember', () => {
      const result = validateMemberData({ name: 'John Doe' }, mockMembers, undefined);
      expect(result).toBe('ชื่อ "John Doe" มีอยู่ในระบบแล้ว (รหัส: M001)\nกรุณาใช้ชื่ออื่น');
    });

    it('should handle names with special characters', () => {
      const result = validateMemberData({ name: 'Member@#$%' }, mockMembers);
      expect(result).toBeNull();
    });

    it('should handle names with numbers', () => {
      const result = validateMemberData({ name: 'Member 123' }, mockMembers);
      expect(result).toBeNull();
    });

    it('should handle Thai characters in names', () => {
      const result = validateMemberData({ name: 'สมาชิกทดสอบ' }, mockMembers);
      expect(result).toBeNull();
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(200);
      const result = validateMemberData({ name: longName }, mockMembers);
      expect(result).toBeNull();
    });
  });
});


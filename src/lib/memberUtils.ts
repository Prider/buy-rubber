import { Member } from '@/types/member';

export const generateMemberCode = (members: Member[]): string => {
  // Extract all existing codes that start with 'M' followed by numbers
  const existingCodes = members
    .map(m => m.code)
    .filter(code => /^M\d+$/.test(code)) // Match format M001, M002, etc.
    .map(code => parseInt(code.substring(1))) // Extract the number part
    .filter(num => !isNaN(num)); // Filter out invalid numbers

  // Find the highest number
  const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
  
  // Generate next code with padding (M001, M002, etc.)
  const nextNumber = maxNumber + 1;
  return `M${String(nextNumber).padStart(3, '0')}`;
};

export const validateMemberData = (data: { name: string }, members: Member[], editingMember?: Member | null): string | null => {
  if (!data.name.trim()) {
    return 'กรุณากรอกชื่อ-นามสกุล';
  }

  if (editingMember && editingMember.name.toLowerCase() === data.name.toLowerCase()) {
    return null;
  }

  // Check for duplicate name
  const duplicateMember = members.find(member => {
    if (
      editingMember &&
      (member.id === editingMember.id || member.code === editingMember.code)
    ) {
      return false; // Skip the member being edited
    }
    return member.name.toLowerCase() === data.name.toLowerCase();
  });

  if (duplicateMember) {
    return `ชื่อ "${data.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicateMember.code})\nกรุณาใช้ชื่ออื่น`;
  }

  return null;
};

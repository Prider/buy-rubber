import { Member } from '@/types/member';

export const generateMemberCode = (): string => {
  // Generate a random 3-digit number (001-999)
  // Format: M001, M002, ..., M999
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return `M${String(randomNumber).padStart(3, '0')}`;
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

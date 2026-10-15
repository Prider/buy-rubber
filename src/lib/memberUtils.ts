import { Member } from '@/types/member';

export const THAI_BANKS = [
  'ธนาคารกรุงเทพ',
  'ธนาคารกสิกรไทย',
  'ธนาคารกรุงไทย',
  'ธนาคารไทยพาณิชย์',
  'ธนาคารกรุงศรีอยุธยา',
  'ธนาคารทหารไทยธนชาต',
  'ธนาคารออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)',
  'ธนาคารอาคารสงเคราะห์',
  'ธนาคารซีไอเอ็มบี ไทย',
  'ธนาคารยูโอบี',
  'ธนาคารแลนด์ แอนด์ เฮ้าส์',
  'ธนาคารเกียรตินาคินภัทร',
  'ธนาคารทิสโก้',
  'ธนาคารไอซีบีซี (ไทย)',
] as const;

export const isValidThaiNationalId = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(id[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(id[12]);
};

export const formatThaiNationalId = (id?: string | null): string => {
  const digits = (id ?? '').replace(/\D/g, '');
  if (digits.length !== 13) return id?.trim() || '';
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
};

export const generateMemberCode = (): string => {
  // Generate a random 3-digit number (001-999)
  // Format: M001, M002, ..., M999
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return `M${String(randomNumber).padStart(3, '0')}`;
};

export const validateMemberData = (
  data: { name: string; idCard?: string; bankAccount?: string },
  members: Member[],
  editingMember?: Member | null
): string | null => {
  if (!data.name.trim()) {
    return 'กรุณากรอกชื่อ-นามสกุล';
  }

  const idCard = data.idCard?.trim() ?? '';
  if (idCard) {
    if (!/^\d{13}$/.test(idCard)) {
      return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }
    if (!isValidThaiNationalId(idCard)) {
      return 'เลขบัตรประชาชนไม่ถูกต้อง';
    }
  }

  const bankAccount = data.bankAccount?.trim() ?? '';
  if (bankAccount && !/^\d{8,15}$/.test(bankAccount)) {
    return 'เลขบัญชีต้องเป็นตัวเลข 8–15 หลัก';
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

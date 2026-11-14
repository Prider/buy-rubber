import { DestinationCompany } from '@/types/destinationCompany';
import { getThaiPhoneError } from '@/lib/memberUtils';

export const generateDestinationCompanyCode = (): string => {
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return `C${String(randomNumber).padStart(3, '0')}`;
};

export const validateDestinationCompanyData = (
  data: { name: string; phone?: string | null },
  companies: DestinationCompany[],
  editingCompany?: DestinationCompany | null,
): string | null => {
  if (!data.name.trim()) {
    return 'กรุณากรอกชื่อบริษัท';
  }

  const phoneError = getThaiPhoneError(data.phone ?? '');
  if (phoneError) {
    return phoneError;
  }

  if (editingCompany && editingCompany.name.toLowerCase() === data.name.toLowerCase()) {
    return null;
  }

  const duplicate = companies.find((company) => {
    if (
      editingCompany &&
      (company.id === editingCompany.id || company.code === editingCompany.code)
    ) {
      return false;
    }
    return company.name.toLowerCase() === data.name.toLowerCase();
  });

  if (duplicate) {
    return `ชื่อ "${data.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicate.code})\nกรุณาใช้ชื่ออื่น`;
  }

  return null;
};

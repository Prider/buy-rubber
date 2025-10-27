export interface Member {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  ownerPercent: number;
  tapperPercent: number;
  tapperName?: string;
  advanceBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberFormData {
  name: string;
  code: string;
  phone: string;
  address: string;
  ownerPercent: number;
  tapperPercent: number;
  tapperName: string;
}

export interface MemberFormProps {
  isOpen: boolean;
  editingMember: Member | null;
  formData: MemberFormData;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  onFormDataChange: (data: Partial<MemberFormData>) => void;
  isLoading?: boolean;
}

export interface MemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  isLoading: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseMembersReturn {
  members: Member[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  loadMembers: (page?: number, search?: string) => Promise<void>;
  createMember: (data: MemberFormData) => Promise<void>;
  updateMember: (id: string, data: MemberFormData) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
}

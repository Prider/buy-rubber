export interface DestinationCompany {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DestinationCompanyFormData {
  name: string;
  code: string;
  phone: string;
  address: string;
}

export interface DestinationCompanyFormProps {
  isOpen: boolean;
  editingCompany: DestinationCompany | null;
  formData: DestinationCompanyFormData;
  onSubmit: (data: DestinationCompanyFormData) => Promise<void>;
  onCancel: () => void;
  onFormDataChange: (data: Partial<DestinationCompanyFormData>) => void;
  isLoading?: boolean;
}

export interface DestinationCompanyTableProps {
  companies: DestinationCompany[];
  onEdit: (company: DestinationCompany) => void;
  onDelete: (company: DestinationCompany) => void;
  onReactivate?: (company: DestinationCompany) => void;
  isLoading: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DeleteDestinationCompanyResponse {
  message: string;
  note?: string;
  softDelete?: boolean;
}

export interface UseDestinationCompaniesReturn {
  companies: DestinationCompany[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  loadCompanies: (page?: number, search?: string) => Promise<void>;
  createCompany: (data: DestinationCompanyFormData) => Promise<void>;
  updateCompany: (id: string, data: DestinationCompanyFormData) => Promise<void>;
  deleteCompany: (id: string) => Promise<DeleteDestinationCompanyResponse>;
  reactivateCompany: (id: string) => Promise<void>;
}

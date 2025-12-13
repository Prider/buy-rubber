// Types for purchase transactions
export interface PurchaseTransaction {
  purchaseNo: string;
  date: string;
  createdAt: string;
  sortTime?: number;
  purchases: Array<{
    id: string;
    purchaseNo: string;
    date: string;
    member: {
      id: string;
      code: string;
      name: string;
    };
    productType: {
      id: string;
      name: string;
      code: string;
    };
    netWeight: number;
    finalPrice: number;
    totalAmount: number;
  }>;
  serviceFees: Array<{
    id: string;
    category: string;
    amount: number;
    notes?: string | null;
  }>;
  totalAmount: number;
  member: {
    id: string;
    code: string;
    name: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CartItem {
  id: string;
  type: 'purchase' | 'serviceFee';
  date: string;
  memberName?: string;
  memberCode?: string;
  productTypeName?: string;
  netWeight?: number;
  finalPrice?: number;
  totalAmount: number;
  category?: string;
}


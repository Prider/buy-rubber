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
    memberId?: string;
    productTypeId?: string;
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
    grossWeight?: number;
    containerWeight?: number;
    netWeight: number;
    basePrice?: number;
    bonusPrice?: number;
    rubberPercent?: number | null;
    moisturePercent?: number | null;
    moistureUnit?: string | null;
    notes?: string | null;
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

export type PurchaseLine = PurchaseTransaction['purchases'][number];

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
  moisturePercent?: number;
  moistureUnit?: string | null;
  finalPrice?: number;
  totalAmount: number;
  category?: string;
}


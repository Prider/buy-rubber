export const ASSISTANT_CHART_TYPES = ['bar', 'pie', 'line', 'area'] as const;

export type AssistantChartType = (typeof ASSISTANT_CHART_TYPES)[number];

export type AssistantChartPoint = {
  name: string;
  value: number;
};

export type AssistantChart = {
  type: AssistantChartType;
  title: string;
  data: AssistantChartPoint[];
};

export type AssistantTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type AssistantReply = {
  text: string;
  charts: AssistantChart[];
  tables: AssistantTable[];
};

export type AssistantHistoryTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type ShopSnapshot = {
  period: {
    timezone: 'Asia/Bangkok';
    today: string;
    monthStart: string;
    last90DaysStart: string;
    breakdown: 'current month';
    recentRows: 'latest 20, not limited to 90 days';
    quietMembers: 'last purchase more than 30 days ago';
    neverPurchased: 'active members with no purchase';
  };
  members: {
    total: number;
    active: number;
  };
  purchases: {
    today: Totals;
    month: Totals;
    last90Days: Totals;
    unpaidThisMonth: { count: number; amount: number };
    unpaidByMemberThisMonth: UnpaidMember[];
    byProductTypeThisMonth: ProductTotals[];
    topMembersThisMonth: MemberTotals[];
  };
  sales: {
    today: SaleTotals;
    month: SaleTotals;
    last90Days: SaleTotals;
    byProductTypeThisMonth: ProductTotals[];
    byDestinationThisMonth: DestinationTotals[];
  };
  stock: StockRow[];
  expenses: {
    today: { count: number; amount: number };
    month: { count: number; amount: number };
    byCategoryThisMonth: { category: string; count: number; amount: number }[];
  };
  serviceFees: {
    monthAmount: number;
  };
  pricesToday: { productType: string; pricePerKg: number }[];
  profit: {
    monthRevenue: number;
    monthCostOfGoods: number;
    monthGrossProfit: number;
    monthExpenses: number;
    monthServiceFees: number;
    monthNet: number;
    note: string;
  };
  recentPurchases: RecentPurchase[];
  recentSales: RecentSale[];
  quietMembers: QuietMember[];
  neverPurchased: { code: string; member: string }[];
  memberBrief: MemberBrief | null;
};

export type Totals = {
  count: number;
  kg: number;
  amount: number;
};

export type SaleTotals = Totals & {
  costOfGoods: number;
  grossProfit: number;
};

export type ProductTotals = {
  productType: string;
  count: number;
  kg: number;
  amount: number;
};

export type MemberTotals = {
  code: string;
  member: string;
  count: number;
  kg: number;
  amount: number;
};

export type UnpaidMember = {
  code: string;
  member: string;
  count: number;
  amount: number;
};

export type DestinationTotals = {
  company: string;
  count: number;
  kg: number;
  amount: number;
};

export type StockRow = {
  productType: string;
  kg: number;
  avgCostPerKg: number;
};

export type RecentPurchase = {
  date: string;
  purchaseNo: string;
  member: string;
  productType: string;
  kg: number;
  amount: number;
};

export type RecentSale = {
  date: string;
  saleNo: string;
  company: string;
  productType: string;
  kg: number;
  amount: number;
};

export type QuietMember = {
  code: string;
  member: string;
  lastPurchaseDate: string | null;
  daysSince: number | null;
  amount: number;
};

export type MemberProductBrief = {
  productType: string;
  count: number;
  kg: number;
  amount: number;
  avgRubberPercent: number | null;
  avgFinalPrice: number;
};

export type MemberBrief = {
  code: string;
  member: string;
  advanceBalance: number;
  unpaidCount: number;
  unpaidAmount: number;
  last12Months: MemberProductBrief[];
};

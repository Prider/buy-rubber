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
  member: string;
  count: number;
  kg: number;
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

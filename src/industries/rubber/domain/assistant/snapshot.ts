import { prisma } from '@/platform/prisma';
import type {
  DestinationTotals,
  MemberTotals,
  ProductTotals,
  RecentPurchase,
  RecentSale,
  SaleTotals,
  ShopSnapshot,
  StockRow,
  Totals,
} from './types';

const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function thailandBounds(now = new Date()) {
  const thailandTime = new Date(now.getTime() + THAILAND_OFFSET_MS);
  const startOfThailandDayUtc = (year: number, month: number, day: number) => {
    const utc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    utc.setTime(utc.getTime() - THAILAND_OFFSET_MS);
    return utc;
  };

  const today = startOfThailandDayUtc(
    thailandTime.getUTCFullYear(),
    thailandTime.getUTCMonth(),
    thailandTime.getUTCDate(),
  );
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const monthStart = startOfThailandDayUtc(thailandTime.getUTCFullYear(), thailandTime.getUTCMonth(), 1);
  const nextMonth = startOfThailandDayUtc(thailandTime.getUTCFullYear(), thailandTime.getUTCMonth() + 1, 1);
  const rangeStart = new Date(today.getTime() - 89 * DAY_MS);

  return { today, tomorrow, monthStart, nextMonth, rangeStart };
}

function round2(value: number | null | undefined): number {
  return Math.round((value ?? 0) * 100) / 100;
}

function isoDateInThailand(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function purchaseTotals(row: {
  _count: number;
  _sum: { dryWeight: number | null; totalAmount: number | null };
}): Totals {
  return {
    count: row._count,
    kg: round2(row._sum.dryWeight),
    amount: round2(row._sum.totalAmount),
  };
}

function saleTotals(row: {
  _count: number;
  _sum: { weight: number | null; totalAmount: number | null; costOfGoods: number | null };
}): SaleTotals {
  const amount = round2(row._sum.totalAmount);
  const costOfGoods = round2(row._sum.costOfGoods);
  return {
    count: row._count,
    kg: round2(row._sum.weight),
    amount,
    costOfGoods,
    grossProfit: round2(amount - costOfGoods),
  };
}

export async function buildShopSnapshot(tenantId: string, now = new Date()): Promise<ShopSnapshot> {
  const { today, tomorrow, monthStart, nextMonth, rangeStart } = thailandBounds(now);
  const purchaseWindow = (start: Date, end: Date) => ({
    tenantId,
    date: { gte: start, lt: end },
  });
  const saleWindow = purchaseWindow;

  const [
    todayPurchases,
    monthPurchases,
    rangePurchases,
    unpaidMonthPurchases,
    purchasesByProduct,
    purchasesByMember,
    recentPurchases,
    todaySales,
    monthSales,
    rangeSales,
    salesByProduct,
    salesByCompany,
    recentSales,
    stockPositions,
    todayExpenses,
    monthExpenses,
    expensesByCategory,
    monthServiceFees,
    todayPrices,
    productTypes,
    memberTotal,
    activeMembers,
  ] = await Promise.all([
    prisma.purchase.aggregate({
      where: purchaseWindow(today, tomorrow),
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
    }),
    prisma.purchase.aggregate({
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
    }),
    prisma.purchase.aggregate({
      where: purchaseWindow(rangeStart, tomorrow),
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
    }),
    prisma.purchase.aggregate({
      where: { ...purchaseWindow(monthStart, nextMonth), isPaid: false },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.purchase.groupBy({
      by: ['productTypeId'],
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 20,
    }),
    prisma.purchase.groupBy({
      by: ['memberId'],
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    }),
    prisma.purchase.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        date: true,
        purchaseNo: true,
        dryWeight: true,
        totalAmount: true,
        member: { select: { name: true } },
        productType: { select: { name: true } },
      },
    }),
    prisma.sale.aggregate({
      where: saleWindow(today, tomorrow),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.aggregate({
      where: saleWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.aggregate({
      where: saleWindow(rangeStart, tomorrow),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.groupBy({
      by: ['productTypeId'],
      where: saleWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 20,
    }),
    prisma.sale.groupBy({
      by: ['companyName'],
      where: saleWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    }),
    prisma.sale.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        date: true,
        saleNo: true,
        companyName: true,
        weight: true,
        totalAmount: true,
        productType: { select: { name: true } },
      },
    }),
    prisma.stockPosition.findMany({
      where: { tenantId },
      select: {
        quantityKg: true,
        avgCostPerKg: true,
        productType: { select: { name: true } },
      },
    }),
    prisma.expense.aggregate({
      where: purchaseWindow(today, tomorrow),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 15,
    }),
    prisma.serviceFee.aggregate({
      where: purchaseWindow(monthStart, nextMonth),
      _sum: { amount: true },
    }),
    prisma.productPrice.findMany({
      where: purchaseWindow(today, tomorrow),
      select: {
        price: true,
        productType: { select: { name: true } },
      },
    }),
    prisma.productType.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
    prisma.member.count({ where: { tenantId } }),
    prisma.member.count({ where: { tenantId, isActive: true } }),
  ]);

  const memberIds = purchasesByMember.map((row) => row.memberId);
  const members = await prisma.member.findMany({
    where: { tenantId, id: { in: memberIds } },
    select: { id: true, name: true },
  });
  const memberNames = new Map(members.map((member) => [member.id, member.name]));
  const productNames = new Map(productTypes.map((productType) => [productType.id, productType.name]));

  const purchaseProducts: ProductTotals[] = purchasesByProduct.map((row) => ({
    productType: productNames.get(row.productTypeId) || 'ไม่ระบุ',
    count: row._count,
    kg: round2(row._sum.dryWeight),
    amount: round2(row._sum.totalAmount),
  }));

  const topMembers: MemberTotals[] = purchasesByMember.map((row) => ({
    member: memberNames.get(row.memberId) || 'ไม่ระบุ',
    count: row._count,
    kg: round2(row._sum.dryWeight),
    amount: round2(row._sum.totalAmount),
  }));

  const saleProducts: ProductTotals[] = salesByProduct.map((row) => ({
    productType: productNames.get(row.productTypeId) || 'ไม่ระบุ',
    count: row._count,
    kg: round2(row._sum.weight),
    amount: round2(row._sum.totalAmount),
  }));

  const destinations: DestinationTotals[] = salesByCompany.map((row) => ({
    company: row.companyName || 'ไม่ระบุ',
    count: row._count,
    kg: round2(row._sum.weight),
    amount: round2(row._sum.totalAmount),
  }));

  const stock: StockRow[] = stockPositions
    .map((row) => ({
      productType: row.productType.name,
      kg: round2(row.quantityKg),
      avgCostPerKg: round2(row.avgCostPerKg),
    }))
    .sort((left, right) => left.productType.localeCompare(right.productType, 'th'));

  const recentPurchaseRows: RecentPurchase[] = recentPurchases.map((row) => ({
    date: isoDateInThailand(row.date),
    purchaseNo: row.purchaseNo,
    member: row.member.name,
    productType: row.productType.name,
    kg: round2(row.dryWeight),
    amount: round2(row.totalAmount),
  }));

  const recentSaleRows: RecentSale[] = recentSales.map((row) => ({
    date: isoDateInThailand(row.date),
    saleNo: row.saleNo,
    company: row.companyName,
    productType: row.productType.name,
    kg: round2(row.weight),
    amount: round2(row.totalAmount),
  }));

  const monthSale = saleTotals(monthSales);
  const monthExpenseAmount = round2(monthExpenses._sum.amount);
  const monthServiceFeeAmount = round2(monthServiceFees._sum.amount);

  return {
    period: {
      timezone: 'Asia/Bangkok',
      today: isoDateInThailand(today),
      monthStart: isoDateInThailand(monthStart),
      last90DaysStart: isoDateInThailand(rangeStart),
      breakdown: 'current month',
      recentRows: 'latest 20, not limited to 90 days',
    },
    members: {
      total: memberTotal,
      active: activeMembers,
    },
    purchases: {
      today: purchaseTotals(todayPurchases),
      month: purchaseTotals(monthPurchases),
      last90Days: purchaseTotals(rangePurchases),
      unpaidThisMonth: {
        count: unpaidMonthPurchases._count,
        amount: round2(unpaidMonthPurchases._sum.totalAmount),
      },
      byProductTypeThisMonth: purchaseProducts,
      topMembersThisMonth: topMembers,
    },
    sales: {
      today: saleTotals(todaySales),
      month: monthSale,
      last90Days: saleTotals(rangeSales),
      byProductTypeThisMonth: saleProducts,
      byDestinationThisMonth: destinations,
    },
    stock,
    expenses: {
      today: { count: todayExpenses._count, amount: round2(todayExpenses._sum.amount) },
      month: { count: monthExpenses._count, amount: monthExpenseAmount },
      byCategoryThisMonth: expensesByCategory.map((row) => ({
        category: row.category,
        count: row._count,
        amount: round2(row._sum.amount),
      })),
    },
    serviceFees: {
      monthAmount: monthServiceFeeAmount,
    },
    pricesToday: todayPrices.map((row) => ({
      productType: row.productType.name,
      pricePerKg: round2(row.price),
    })),
    profit: {
      monthRevenue: monthSale.amount,
      monthCostOfGoods: monthSale.costOfGoods,
      monthGrossProfit: monthSale.grossProfit,
      monthExpenses: monthExpenseAmount,
      monthServiceFees: monthServiceFeeAmount,
      monthNet: round2(monthSale.amount - monthSale.costOfGoods - monthExpenseAmount - monthServiceFeeAmount),
      note: 'Sales without a recorded cost of goods are treated as zero cost.',
    },
    recentPurchases: recentPurchaseRows,
    recentSales: recentSaleRows,
  };
}

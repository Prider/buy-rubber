import { prisma } from '@/lib/prisma';
import type {
  DestinationTotals,
  MemberBrief,
  MemberTotals,
  ProductTotals,
  QuietMember,
  RecentPurchase,
  RecentSale,
  SaleTotals,
  ShopSnapshot,
  StockRow,
  Totals,
  UnpaidMember,
} from './types';

const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUIET_DAYS = 30;
const QUIET_LIMIT = 20;

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
  const yearStart = new Date(today.getTime() - 365 * DAY_MS);

  return { today, tomorrow, monthStart, nextMonth, rangeStart, yearStart };
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

export function queryTokens(query: string): string[] {
  return Array.from(new Set(
    query.split(/[^A-Za-z0-9_-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && /[A-Za-z]/.test(token)),
  ));
}

type MemberName = { id: string; code: string; name: string };

export async function buildShopSnapshot(query = '', now = new Date()): Promise<ShopSnapshot> {
  const { today, tomorrow, monthStart, nextMonth, rangeStart, yearStart } = thailandBounds(now);
  const purchaseWindow = (start: Date, end: Date) => ({
    date: { gte: start, lt: end },
  });

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
    lastPurchaseByMember,
    unpaidByMember,
    neverPurchased,
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
      where: {},
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
      where: purchaseWindow(today, tomorrow),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.aggregate({
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.aggregate({
      where: purchaseWindow(rangeStart, tomorrow),
      _count: true,
      _sum: { weight: true, totalAmount: true, costOfGoods: true },
    }),
    prisma.sale.groupBy({
      by: ['productTypeId'],
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 20,
    }),
    prisma.sale.groupBy({
      by: ['companyName'],
      where: purchaseWindow(monthStart, nextMonth),
      _count: true,
      _sum: { weight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    }),
    prisma.sale.findMany({
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
      select: { id: true, name: true },
    }),
    prisma.member.count(),
    prisma.member.count({ where: { isActive: true } }),
    prisma.purchase.groupBy({
      by: ['memberId'],
      _max: { date: true },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.purchase.groupBy({
      by: ['memberId'],
      where: { ...purchaseWindow(monthStart, nextMonth), isPaid: false },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.member.findMany({
      where: { isActive: true, purchases: { none: {} } },
      select: { code: true, name: true },
      take: QUIET_LIMIT,
    }),
  ]);

  const quietBefore = new Date(today.getTime() - QUIET_DAYS * DAY_MS);
  const staleIds = lastPurchaseByMember
    .filter((row) => row._max.date != null && row._max.date.getTime() < quietBefore.getTime())
    .sort((left, right) => (left._max.date?.getTime() ?? 0) - (right._max.date?.getTime() ?? 0))
    .slice(0, QUIET_LIMIT);

  const nameIds = Array.from(new Set([
    ...purchasesByMember.map((row) => row.memberId),
    ...unpaidByMember.map((row) => row.memberId),
    ...staleIds.map((row) => row.memberId),
  ]));

  const tokens = queryTokens(query);
  const [namedMembers, codedMembers] = await Promise.all([
    nameIds.length
      ? prisma.member.findMany({
          where: { id: { in: nameIds } },
          select: { id: true, code: true, name: true },
        })
      : Promise.resolve([] as MemberName[]),
    tokens.length
      ? prisma.member.findMany({
          where: { code: { in: tokens } },
          select: { id: true, code: true, name: true, advanceBalance: true },
        })
      : Promise.resolve([] as Array<MemberName & { advanceBalance: number }>),
  ]);

  const memberById = new Map(namedMembers.map((member) => [member.id, member]));
  const productNames = new Map(productTypes.map((productType) => [productType.id, productType.name]));
  const labelFor = (memberId: string) => {
    const member = memberById.get(memberId);
    return {
      code: member?.code || '',
      member: member?.name || 'ไม่ระบุ',
    };
  };

  const purchaseProducts: ProductTotals[] = purchasesByProduct.map((row) => ({
    productType: productNames.get(row.productTypeId) || 'ไม่ระบุ',
    count: row._count,
    kg: round2(row._sum.dryWeight),
    amount: round2(row._sum.totalAmount),
  }));

  const topMembers: MemberTotals[] = purchasesByMember.map((row) => ({
    ...labelFor(row.memberId),
    count: row._count,
    kg: round2(row._sum.dryWeight),
    amount: round2(row._sum.totalAmount),
  }));

  const unpaidMembers: UnpaidMember[] = unpaidByMember
    .map((row) => ({
      ...labelFor(row.memberId),
      count: row._count,
      amount: round2(row._sum.totalAmount),
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 10);

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

  const quietFromPurchases: QuietMember[] = staleIds.map((row) => {
    const last = row._max.date;
    const daysSince = last == null ? null : Math.floor((today.getTime() - last.getTime()) / DAY_MS);
    return {
      ...labelFor(row.memberId),
      lastPurchaseDate: last ? isoDateInThailand(last) : null,
      daysSince,
      amount: round2(row._sum.totalAmount),
    };
  });

  const quietMembers = quietFromPurchases.slice(0, QUIET_LIMIT);

  const briefSource = codedMembers.sort((left, right) => right.code.length - left.code.length)[0] ?? null;
  const memberBrief = briefSource
    ? await buildMemberBrief(briefSource, productNames, yearStart, tomorrow)
    : null;

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
      quietMembers: 'last purchase more than 30 days ago',
      neverPurchased: 'active members with no purchase',
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
      unpaidByMemberThisMonth: unpaidMembers,
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
    quietMembers,
    neverPurchased: neverPurchased.slice(0, QUIET_LIMIT).map((member) => ({
      code: member.code,
      member: member.name,
    })),
    memberBrief,
  };
}

async function buildMemberBrief(
  member: MemberName & { advanceBalance: number },
  productNames: Map<string, string>,
  yearStart: Date,
  tomorrow: Date,
): Promise<MemberBrief> {
  const [byProduct, unpaid] = await Promise.all([
    prisma.purchase.groupBy({
      by: ['productTypeId'],
      where: { memberId: member.id, date: { gte: yearStart, lt: tomorrow } },
      _count: true,
      _sum: { dryWeight: true, totalAmount: true },
      _avg: { rubberPercent: true, finalPrice: true },
    }),
    prisma.purchase.aggregate({
      where: { memberId: member.id, isPaid: false },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    code: member.code,
    member: member.name,
    advanceBalance: round2(member.advanceBalance),
    unpaidCount: unpaid._count,
    unpaidAmount: round2(unpaid._sum.totalAmount),
    last12Months: byProduct.map((row) => ({
      productType: productNames.get(row.productTypeId) || 'ไม่ระบุ',
      count: row._count,
      kg: round2(row._sum.dryWeight),
      amount: round2(row._sum.totalAmount),
      avgRubberPercent: row._avg.rubberPercent == null ? null : round2(row._avg.rubberPercent),
      avgFinalPrice: round2(row._avg.finalPrice),
    })),
  };
}

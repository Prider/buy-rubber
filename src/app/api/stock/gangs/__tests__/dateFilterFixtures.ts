export function dt(isoDate: string) {
  return new Date(isoDate);
}

export type DateFilterGangFixture = {
  gangNo: number;
  label: string;
  startDate: Date;
  endDate: Date | null;
  soldKg: number;
  cogs: number;
  saleNosJson: string;
  salesCount: number;
  saleAmounts: Record<string, number>;
};

/**
 * Sequential gang cycles spanning Jan–Sep 2026, used to test วันที่เริ่มต้น / วันที่สิ้นสุด.
 * Only gang 12 is still open (the current cycle).
 */
export const DATE_FILTER_GANG_FIXTURES: DateFilterGangFixture[] = [
  {
    gangNo: 1,
    label: 'closed January',
    startDate: dt('2026-01-05T08:00:00'),
    endDate: dt('2026-01-28T16:00:00'),
    soldKg: 100,
    cogs: 4000,
    saleNosJson: JSON.stringify(['SAL-01']),
    salesCount: 1,
    saleAmounts: { 'SAL-01': 5200 },
  },
  {
    gangNo: 2,
    label: 'closed February',
    startDate: dt('2026-02-02T08:00:00'),
    endDate: dt('2026-02-25T16:00:00'),
    soldKg: 110,
    cogs: 4400,
    saleNosJson: JSON.stringify(['SAL-02']),
    salesCount: 1,
    saleAmounts: { 'SAL-02': 5610 },
  },
  {
    gangNo: 3,
    label: 'closed March',
    startDate: dt('2026-03-03T08:00:00'),
    endDate: dt('2026-03-22T16:00:00'),
    soldKg: 90,
    cogs: 3600,
    saleNosJson: JSON.stringify(['SAL-03']),
    salesCount: 1,
    saleAmounts: { 'SAL-03': 4680 },
  },
  {
    gangNo: 4,
    label: 'April into May (straddle)',
    startDate: dt('2026-04-18T08:00:00'),
    endDate: dt('2026-05-06T16:00:00'),
    soldKg: 80,
    cogs: 3200,
    saleNosJson: JSON.stringify(['SAL-04a', 'SAL-04b']),
    salesCount: 2,
    saleAmounts: { 'SAL-04a': 2100, 'SAL-04b': 2200 },
  },
  {
    gangNo: 5,
    label: 'fully May',
    startDate: dt('2026-05-10T08:00:00'),
    endDate: dt('2026-05-29T16:00:00'),
    soldKg: 120,
    cogs: 4800,
    saleNosJson: JSON.stringify(['SAL-05']),
    salesCount: 1,
    saleAmounts: { 'SAL-05': 6240 },
  },
  {
    gangNo: 6,
    label: 'fully June',
    startDate: dt('2026-06-02T08:00:00'),
    endDate: dt('2026-06-20T16:00:00'),
    soldKg: 70,
    cogs: 2800,
    saleNosJson: JSON.stringify(['SAL-06']),
    salesCount: 1,
    saleAmounts: { 'SAL-06': 3640 },
  },
  {
    gangNo: 7,
    label: 'June into July (straddle start)',
    startDate: dt('2026-06-22T08:00:00'),
    endDate: dt('2026-07-04T16:00:00'),
    soldKg: 95,
    cogs: 3800,
    saleNosJson: JSON.stringify(['SAL-07']),
    salesCount: 1,
    saleAmounts: { 'SAL-07': 4940 },
  },
  {
    gangNo: 8,
    label: 'fully July',
    startDate: dt('2026-07-08T08:00:00'),
    endDate: dt('2026-07-21T16:00:00'),
    soldKg: 130,
    cogs: 5200,
    saleNosJson: JSON.stringify(['SAL-08a', 'SAL-08b']),
    salesCount: 2,
    saleAmounts: { 'SAL-08a': 3400, 'SAL-08b': 3600 },
  },
  {
    gangNo: 9,
    label: 'July into August (straddle end)',
    startDate: dt('2026-07-26T08:00:00'),
    endDate: dt('2026-08-05T16:00:00'),
    soldKg: 85,
    cogs: 3400,
    saleNosJson: JSON.stringify(['SAL-09']),
    salesCount: 1,
    saleAmounts: { 'SAL-09': 4420 },
  },
  {
    gangNo: 10,
    label: 'fully August',
    startDate: dt('2026-08-08T08:00:00'),
    endDate: dt('2026-08-19T16:00:00'),
    soldKg: 105,
    cogs: 4200,
    saleNosJson: JSON.stringify(['SAL-10']),
    salesCount: 1,
    saleAmounts: { 'SAL-10': 5460 },
  },
  {
    gangNo: 11,
    label: 'August into September (straddle)',
    startDate: dt('2026-08-24T08:00:00'),
    endDate: dt('2026-09-03T16:00:00'),
    soldKg: 60,
    cogs: 2400,
    saleNosJson: JSON.stringify(['SAL-11']),
    salesCount: 1,
    saleAmounts: { 'SAL-11': 3120 },
  },
  {
    gangNo: 12,
    label: 'open since early September',
    startDate: dt('2026-09-04T08:00:00'),
    endDate: null,
    soldKg: 40,
    cogs: 1600,
    saleNosJson: JSON.stringify(['SAL-12']),
    salesCount: 1,
    saleAmounts: { 'SAL-12': 2080 },
  },
];

export function fixtureGangNos(gangs: DateFilterGangFixture[]): number[] {
  return gangs.map((g) => g.gangNo);
}

export function salesForGangs(gangs: DateFilterGangFixture[]): { saleNo: string; totalAmount: number }[] {
  const sales: { saleNo: string; totalAmount: number }[] = [];
  for (const gang of gangs) {
    for (const [saleNo, totalAmount] of Object.entries(gang.saleAmounts)) {
      sales.push({ saleNo, totalAmount });
    }
  }
  return sales;
}

export function toApiGangRecord(gang: DateFilterGangFixture) {
  return {
    gangNo: gang.gangNo,
    startDate: gang.startDate,
    endDate: gang.endDate,
    soldKg: gang.soldKg,
    cogs: gang.cogs,
    saleNosJson: gang.saleNosJson,
    salesCount: gang.salesCount,
  };
}

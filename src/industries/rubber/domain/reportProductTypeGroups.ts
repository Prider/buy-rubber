export type ReportProductTypeGroupKind = 'purchase' | 'sale';

export function parseReportProductTypeGroupKind(
  value: unknown,
  fallback: ReportProductTypeGroupKind = 'purchase',
): ReportProductTypeGroupKind {
  return value === 'sale' || value === 'purchase' ? value : fallback;
}

export interface ReportProductTypeGroupRecord {
  id: string;
  name: string | null;
  kind?: ReportProductTypeGroupKind;
  sortOrder: number;
  isActive: boolean;
  productTypes: Array<{ id: string; code: string; name: string; isActive?: boolean }>;
}

export type ReportGroupKind = 'daily_purchase' | 'sell_summary';

const DAILY_PURCHASE_GROUP_PREFIX = 'daily_purchase:group:';
const SELL_SUMMARY_GROUP_PREFIX = 'sell_summary:group:';

export function isDailyPurchaseReport(reportType: string): boolean {
  return reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
}

export function isSellSummaryReport(reportType: string): boolean {
  return reportType === 'sell_summary' || reportType.startsWith('sell_summary:');
}

export function getDailyPurchaseGroupId(reportType: string): string | null {
  if (!reportType.startsWith(DAILY_PURCHASE_GROUP_PREFIX)) {
    return null;
  }
  return reportType.slice(DAILY_PURCHASE_GROUP_PREFIX.length);
}

export function getSellSummaryGroupId(reportType: string): string | null {
  if (!reportType.startsWith(SELL_SUMMARY_GROUP_PREFIX)) {
    return null;
  }
  return reportType.slice(SELL_SUMMARY_GROUP_PREFIX.length);
}

export function getSelectedGroupId(reportType: string): string | null {
  return getDailyPurchaseGroupId(reportType) ?? getSellSummaryGroupId(reportType);
}

export function buildDailyPurchaseGroupReportType(groupId: string): string {
  return `${DAILY_PURCHASE_GROUP_PREFIX}${groupId}`;
}

export function buildSellSummaryGroupReportType(groupId: string): string {
  return `${SELL_SUMMARY_GROUP_PREFIX}${groupId}`;
}

export function buildGroupReportType(kind: ReportGroupKind, groupId: string): string {
  return kind === 'sell_summary'
    ? buildSellSummaryGroupReportType(groupId)
    : buildDailyPurchaseGroupReportType(groupId);
}

export function resolveGroupProductTypeIds(group: ReportProductTypeGroupRecord): string[] {
  return group.productTypes.map((productType) => productType.id);
}

export function getGroupLabel(group: ReportProductTypeGroupRecord): string {
  if (group.name?.trim()) {
    return group.name.trim();
  }

  const names = group.productTypes.map((productType) => productType.name).filter(Boolean);
  return names.length > 0 ? names.join(' + ') : 'กลุ่มรายงาน';
}

export interface ReportGroupOption {
  id: string;
  label: string;
  reportType: string;
}

export function buildReportGroupOptions(
  groups: ReportProductTypeGroupRecord[],
  kind: ReportGroupKind = 'daily_purchase',
): ReportGroupOption[] {
  return groups
    .filter((group) => group.isActive && group.productTypes.length > 0)
    .map((group) => ({
      id: group.id,
      label: getGroupLabel(group),
      reportType: buildGroupReportType(kind, group.id),
    }));
}

export function findReportGroupById(
  groups: ReportProductTypeGroupRecord[],
  groupId: string,
): ReportProductTypeGroupRecord | undefined {
  return groups.find((group) => group.id === groupId);
}

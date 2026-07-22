export interface ReportProductTypeGroupRecord {
  id: string;
  name: string | null;
  sortOrder: number;
  isActive: boolean;
  productTypes: Array<{ id: string; code: string; name: string; isActive?: boolean }>;
}

export function isDailyPurchaseReport(reportType: string): boolean {
  return reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
}

export function getDailyPurchaseGroupId(reportType: string): string | null {
  if (!reportType.startsWith('daily_purchase:group:')) {
    return null;
  }
  return reportType.slice('daily_purchase:group:'.length);
}

export function buildDailyPurchaseGroupReportType(groupId: string): string {
  return `daily_purchase:group:${groupId}`;
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
): ReportGroupOption[] {
  return groups
    .filter((group) => group.isActive && group.productTypes.length > 0)
    .map((group) => ({
      id: group.id,
      label: getGroupLabel(group),
      reportType: buildDailyPurchaseGroupReportType(group.id),
    }));
}

export function findReportGroupById(
  groups: ReportProductTypeGroupRecord[],
  groupId: string,
): ReportProductTypeGroupRecord | undefined {
  return groups.find((group) => group.id === groupId);
}

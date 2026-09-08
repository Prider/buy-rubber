import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import {
  buildReportGroupOptions,
  findReportGroupById,
  getDailyPurchaseGroupId,
  getGroupLabel,
  ReportProductTypeGroupRecord,
  resolveGroupProductTypeIds,
} from '@/lib/reportProductTypeGroups';

export type ReportType = 'daily_purchase' | 'member_summary' | 'expense_summary' | string;

export const REPORT_PAGE_SIZE = 15;

interface ExpenseCategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface ReportTotals {
  count: number;
  totalAmount: number;
  totalWeight: number;
}

interface ReportSummaryResponse {
  type: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  truncated?: boolean;
  rows: unknown[];
  totals: ReportTotals;
  categorySummary?: ExpenseCategorySummary[];
}

const EMPTY_TOTALS: ReportTotals = { count: 0, totalAmount: 0, totalWeight: 0 };

function summaryTypeFor(reportType: ReportType): 'daily_purchase' | 'member_summary' | 'expense_summary' {
  if (reportType === 'member_summary' || reportType === 'expense_summary') {
    return reportType;
  }
  return 'daily_purchase';
}

export function useReportData(reportGroupRecords: ReportProductTypeGroupRecord[] = []) {
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily_purchase');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[] | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseCategorySummary[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [totals, setTotals] = useState<ReportTotals>(EMPTY_TOTALS);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        const response = await axios.get('/api/product-types');
        const activeTypes = response.data.filter((pt: ProductType) => pt.isActive);
        setProductTypes(activeTypes);
      } catch (error) {
        logger.error('Failed to load product types', error);
      }
    };
    loadProductTypes();
  }, []);

  const resetResults = useCallback(() => {
    setData(null);
    setExpenseSummary([]);
    setTotals(EMPTY_TOTALS);
    setTotalPages(1);
    setTotalCount(0);
  }, []);

  const handleSetReportType = useCallback((type: ReportType) => {
    setReportType(type);
    resetResults();
  }, [resetResults]);

  const handleSetStartDate = useCallback((date: string) => {
    setStartDate(date);
    resetResults();
  }, [resetResults]);

  const handleSetEndDate = useCallback((date: string) => {
    setEndDate(date);
    resetResults();
  }, [resetResults]);

  const reportGroups = useMemo(
    () => buildReportGroupOptions(reportGroupRecords),
    [reportGroupRecords]
  );

  const buildParams = useCallback(
    (page: number, exportingRows = false) => {
      const params: Record<string, string | number | boolean> = {
        type: summaryTypeFor(reportType),
        startDate,
        endDate,
        page,
        pageSize: REPORT_PAGE_SIZE,
      };

      if (exportingRows) {
        params.export = 1;
      }

      const groupId = getDailyPurchaseGroupId(reportType);
      if (groupId) {
        const group = findReportGroupById(reportGroupRecords, groupId);
        const productTypeIds = group ? resolveGroupProductTypeIds(group) : [];
        if (productTypeIds.length > 0) {
          params.productTypeIds = productTypeIds.join(',');
        }
      }

      return params;
    },
    [endDate, reportGroupRecords, reportType, startDate],
  );

  const applyResponse = useCallback((body: ReportSummaryResponse) => {
    setData(Array.isArray(body.rows) ? body.rows : []);
    setTotals(body.totals ?? EMPTY_TOTALS);
    setTotalPages(Math.max(1, body.totalPages || 1));
    setTotalCount(body.total ?? 0);
    setExpenseSummary(body.categorySummary ?? []);
  }, []);

  const generateReport = useCallback(async (page = 1) => {
    if (data !== null) {
      setPaging(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get<ReportSummaryResponse>('/api/reports/summary', {
        params: buildParams(page),
      });
      applyResponse(response.data);
    } catch (error) {
      logger.error('Failed to generate report', error);
    } finally {
      setLoading(false);
      setPaging(false);
    }
  }, [applyResponse, buildParams, data]);

  const fetchExportRows = useCallback(async () => {
    setExporting(true);
    try {
      const response = await axios.get<ReportSummaryResponse>('/api/reports/summary', {
        params: buildParams(1, true),
      });
      return {
        rows: (Array.isArray(response.data.rows) ? response.data.rows : []) as unknown as any[],
        expenseSummary: response.data.categorySummary ?? [],
        totals: response.data.totals ?? totals,
      };
    } catch (error) {
      logger.error('Failed to export report', error);
      return null;
    } finally {
      setExporting(false);
    }
  }, [buildParams, totals]);

  const getTotalAmount = useCallback(() => totals.totalAmount || 0, [totals.totalAmount]);

  const getTotalWeight = useCallback(() => totals.totalWeight || 0, [totals.totalWeight]);

  const getReportTitle = useCallback(() => {
    const groupId = getDailyPurchaseGroupId(reportType);
    if (groupId) {
      const group = findReportGroupById(reportGroupRecords, groupId);
      if (group) {
        return `รายงานรับซื้อประจำวัน - ${getGroupLabel(group)}`;
      }
      return 'รายงานรับซื้อประจำวัน';
    }

    switch (reportType) {
      case 'daily_purchase':
        return 'รายงานรับซื้อประจำวัน';
      case 'member_summary':
        return 'สรุปรายสมาชิกที่รับซื้อยาง';
      case 'expense_summary':
        return 'รายงานค่าใช้จ่ายที่เกิดขึ้น';
      default:
        return 'รายงาน';
    }
  }, [reportType, reportGroupRecords]);

  return {
    loading,
    paging,
    exporting,
    reportType,
    setReportType: handleSetReportType,
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,
    data,
    expenseSummary,
    productTypes,
    reportGroups,
    totals,
    totalPages,
    totalCount,
    generateReport,
    fetchExportRows,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  };
}

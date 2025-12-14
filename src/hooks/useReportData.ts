import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';

export type ReportType = 'daily_purchase' | 'member_summary' | 'expense_summary' | string; // string for product-type-specific reports like 'daily_purchase:productTypeId'

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

export function useReportData() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily_purchase');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[] | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseCategorySummary[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Load product types on mount
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

  const handleSetReportType = useCallback((type: ReportType) => {
    setReportType(type);
    setData(null);
    setExpenseSummary([]);
  }, []);

  const handleSetStartDate = useCallback((date: string) => {
    setStartDate(date);
    setData(null);
    setExpenseSummary([]);
  }, []);

  const handleSetEndDate = useCallback((date: string) => {
    setEndDate(date);
    setData(null);
    setExpenseSummary([]);
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      // Check if this is a product-type-specific daily purchase report
      const isProductTypeSpecific = reportType.startsWith('daily_purchase:');
      const productTypeId = isProductTypeSpecific ? reportType.split(':')[1] : null;
      
      if (reportType === 'daily_purchase' || isProductTypeSpecific) {
        const params: { startDate: string; endDate: string; productTypeId?: string } = { startDate, endDate };
        if (productTypeId) {
          params.productTypeId = productTypeId;
        }
        response = await axios.get('/api/purchases', { params });
        setData(response.data);
        setExpenseSummary([]);
      } else {
      switch (reportType) {
        case 'member_summary':
          response = await axios.get('/api/purchases', {
            params: { startDate, endDate },
          });
          // Group by member
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const grouped = response.data.reduce((acc: any, p: any) => {
            const key = p.memberId;
            if (!acc[key]) {
              acc[key] = {
                member: p.member,
                count: 0,
                totalWeight: 0,
                totalAmount: 0,
              };
            }
            acc[key].count++;
            acc[key].totalWeight += p.dryWeight;
            acc[key].totalAmount += p.totalAmount;
            return acc;
          }, {});
          setData(Object.values(grouped));
          setExpenseSummary([]);
          break;
        case 'expense_summary':
          response = await axios.get('/api/expenses', {
            params: {
              startDate,
              endDate,
              page: 1,
              pageSize: 1000,
            },
          });
          setData(response.data.expenses || []);
          if (response.data.expenses) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const categorySummary = response.data.expenses.reduce((acc: Record<string, ExpenseCategorySummary>, expense: any) => {
              if (!acc[expense.category]) {
                acc[expense.category] = {
                  category: expense.category,
                  totalAmount: 0,
                  count: 0,
                };
              }
              acc[expense.category].totalAmount += expense.amount;
              acc[expense.category].count += 1;
              return acc;
            }, {});
            setExpenseSummary((Object.values(categorySummary) as ExpenseCategorySummary[]).sort((a, b) => b.totalAmount - a.totalAmount));
          } else {
            setExpenseSummary([]);
          }
          break;
        default:
          break;
      }
      }
    } catch (error) {
      logger.error('Failed to generate report', error);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate]);

  const getTotalAmount = useCallback(() => {
    if (!data || !Array.isArray(data)) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
    if (isDailyPurchase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
    } else if (reportType === 'member_summary') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
    } else if (reportType === 'expense_summary') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    }
    return 0;
  }, [data, reportType]);

  const getTotalWeight = useCallback(() => {
    if (!data || !Array.isArray(data)) return 0;
    const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
    if (isDailyPurchase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.reduce((sum: number, item: any) => sum + (item.dryWeight || 0), 0);
    } else if (reportType === 'member_summary') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.reduce((sum: number, item: any) => sum + (item.totalWeight || 0), 0);
    }
    return 0;
  }, [data, reportType]);

  const getReportTitle = useCallback(() => {
    if (reportType.startsWith('daily_purchase:')) {
      const productTypeId = reportType.split(':')[1];
      const productType = productTypes.find(pt => pt.id === productTypeId);
      if (productType) {
        return `รายงานรับซื้อประจำวัน - ${productType.name}`;
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
  }, [reportType, productTypes]);

  return {
    loading,
    reportType,
    setReportType: handleSetReportType,
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,
    data,
    expenseSummary,
    productTypes,
    generateReport,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  };
}


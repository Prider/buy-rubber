import { useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';

export type ReportType = 'daily_purchase' | 'member_summary' | 'expense_summary';

interface ExpenseCategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}

export function useReportData() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily_purchase');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseCategorySummary[]>([]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'daily_purchase':
          response = await axios.get('/api/purchases', {
            params: { startDate, endDate },
          });
          setData(response.data);
          setExpenseSummary([]);
          break;
        case 'member_summary':
          response = await axios.get('/api/purchases', {
            params: { startDate, endDate },
          });
          // Group by member
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
            setExpenseSummary(Object.values(categorySummary).sort((a, b) => b.totalAmount - a.totalAmount));
          } else {
            setExpenseSummary([]);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error('Failed to generate report', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    if (!data) return 0;
    if (reportType === 'daily_purchase') {
      return data.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
    } else if (reportType === 'member_summary') {
      return data.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
    } else if (reportType === 'expense_summary') {
      return data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    }
    return 0;
  };

  const getTotalWeight = () => {
    if (!data) return 0;
    if (reportType === 'daily_purchase') {
      return data.reduce((sum: number, item: any) => sum + item.dryWeight, 0);
    } else if (reportType === 'member_summary') {
      return data.reduce((sum: number, item: any) => sum + item.totalWeight, 0);
    }
    return 0;
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily_purchase':
        return 'รายงานรับซื้อประจำวัน';
      case 'member_summary':
        return 'สรุปรายสมาชิก';
      case 'expense_summary':
        return 'รายงานค่าใช้จ่าย';
      default:
        return 'รายงาน';
    }
  };

  return {
    loading,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    expenseSummary,
    generateReport,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  };
}


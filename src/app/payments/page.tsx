'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadPayments();
  }, [router]);

  const loadPayments = async () => {
    try {
      const response = await axios.get('/api/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จ่ายเงิน</h1>
            <p className="text-gray-600 mt-1">รายการจ่ายชำระหนี้</p>
          </div>
          <button className="btn btn-primary">+ บันทึกการจ่ายเงิน</button>
        </div>

        {/* Payments Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่</th>
                    <th>สมาชิก</th>
                    <th>ยอดเงินรวม</th>
                    <th>หักเงินล่วงหน้า</th>
                    <th>ยอดจ่ายสุทธิ</th>
                    <th>รายการ</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-medium">{payment.paymentNo}</td>
                      <td>{formatDate(payment.date)}</td>
                      <td>{payment.member?.name}</td>
                      <td className="font-semibold">
                        {formatCurrency(payment.totalAmount)}
                      </td>
                      <td className="text-red-600">
                        -{formatCurrency(payment.advanceDeduct)}
                      </td>
                      <td className="font-semibold text-green-600">
                        {formatCurrency(payment.netAmount)}
                      </td>
                      <td>{payment.items?.length || 0} รายการ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">ยังไม่มีรายการจ่ายเงิน</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


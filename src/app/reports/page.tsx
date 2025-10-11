'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily_purchase');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

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
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Generate report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-600 mt-1">รายงานและวิเคราะห์กิจการ</p>
        </div>

        {/* Filter */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">ประเภทรายงาน</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input"
              >
                <option value="daily_purchase">รายงานรับซื้อประจำวัน</option>
                <option value="member_summary">สรุปรายสมาชิก</option>
                <option value="payment_summary">สรุปการจ่ายเงิน</option>
                <option value="advance_summary">สรุปเงินล่วงหน้า</option>
              </select>
            </div>

            <div>
              <label className="label">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Result */}
        {data && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">ผลลัพธ์</h2>
            {reportType === 'daily_purchase' && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>เลขที่</th>
                      <th>สมาชิก</th>
                      <th>น้ำหนัก (กก.)</th>
                      <th>ยอดเงิน</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          {new Date(item.date).toLocaleDateString('th-TH')}
                        </td>
                        <td>{item.purchaseNo}</td>
                        <td>{item.member?.name}</td>
                        <td>{formatNumber(item.dryWeight)}</td>
                        <td>{formatCurrency(item.totalAmount)}</td>
                        <td>
                          {item.isPaid ? (
                            <span className="text-green-600">จ่ายแล้ว</span>
                          ) : (
                            <span className="text-orange-600">ค้างจ่าย</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'member_summary' && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>สมาชิก</th>
                      <th>จำนวนครั้ง</th>
                      <th>น้ำหนักรวม (กก.)</th>
                      <th>ยอดเงินรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item: any) => (
                      <tr key={item.member?.id}>
                        <td>{item.member?.name}</td>
                        <td>{item.count}</td>
                        <td>{formatNumber(item.totalWeight)}</td>
                        <td className="font-semibold text-green-600">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}


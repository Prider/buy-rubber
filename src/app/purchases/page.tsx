'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

export default function PurchasesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadPurchases();
  }, [router]);

  const loadPurchases = async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Load purchases error:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">รับซื้อน้ำยาง</h1>
            <p className="text-gray-600 mt-1">จัดการรายการรับซื้อน้ำยาง</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + บันทึกการรับซื้อ
          </button>
        </div>

        {/* Purchases Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่</th>
                    <th>สมาชิก</th>
                    <th>ประเภท</th>
                    <th>น้ำหนักแห้ง (กก.)</th>
                    <th>%ยาง</th>
                    <th>ราคา/กก.</th>
                    <th>ยอดเงิน</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="font-medium">{purchase.purchaseNo}</td>
                      <td>{formatDate(purchase.date)}</td>
                      <td>{purchase.member?.name}</td>
                      <td>{purchase.productType?.name}</td>
                      <td>{formatNumber(purchase.dryWeight)}</td>
                      <td>
                        {purchase.rubberPercent
                          ? formatNumber(purchase.rubberPercent, 1) + '%'
                          : '-'}
                      </td>
                      <td>{formatNumber(purchase.finalPrice)}</td>
                      <td className="font-semibold text-green-600">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                      <td>
                        {purchase.isPaid ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            จ่ายแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            ค้างจ่าย
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">ยังไม่มีรายการรับซื้อ</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal - To be implemented */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">บันทึกการรับซื้อ</h2>
            <p className="text-gray-600">
              ฟอร์มบันทึกการรับซื้อ (จะพัฒนาในขั้นตอนถัดไป)
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="mt-4 btn btn-secondary"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}


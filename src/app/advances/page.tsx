'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdvancesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    memberId: '',
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [advancesRes, membersRes] = await Promise.all([
        axios.get('/api/advances'),
        axios.get('/api/members?active=true'),
      ]);
      setAdvances(advancesRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/advances', formData);
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        memberId: '',
        amount: 0,
        notes: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              เบิกเงินล่วงหน้า
            </h1>
            <p className="text-gray-600 mt-1">รายการเบิกเงินล่วงหน้าสมาชิก</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + เบิกเงินล่วงหน้า
          </button>
        </div>

        {/* Advances Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : advances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่</th>
                    <th>สมาชิก</th>
                    <th>จำนวนเงิน</th>
                    <th>คงเหลือ</th>
                    <th>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((advance) => (
                    <tr key={advance.id}>
                      <td className="font-medium">{advance.advanceNo}</td>
                      <td>{formatDate(advance.date)}</td>
                      <td>{advance.member?.name}</td>
                      <td className="font-semibold text-orange-600">
                        {formatCurrency(advance.amount)}
                      </td>
                      <td className="font-semibold">
                        {formatCurrency(advance.remaining)}
                      </td>
                      <td className="text-sm text-gray-600">
                        {advance.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">ยังไม่มีรายการเบิกเงินล่วงหน้า</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">บันทึกเบิกเงินล่วงหน้า</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">วันที่</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">สมาชิก</label>
                <select
                  value={formData.memberId}
                  onChange={(e) =>
                    setFormData({ ...formData, memberId: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">เลือกสมาชิก</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.code} - {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="label">หมายเหตุ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}


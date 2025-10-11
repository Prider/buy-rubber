'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PricesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    locationId: '',
    basePrice: 50,
    priceRules: [
      { minPercent: 0, maxPercent: 29.99, adjustment: -5 },
      { minPercent: 30, maxPercent: 34.99, adjustment: 0 },
      { minPercent: 35, maxPercent: 100, adjustment: 5 },
    ],
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
      const [pricesRes, locsRes] = await Promise.all([
        axios.get('/api/prices'),
        axios.get('/api/locations'),
      ]);
      setPrices(pricesRes.data);
      setLocations(locsRes.data || []);
      if (locsRes.data?.length > 0) {
        setFormData((prev) => ({ ...prev, locationId: locsRes.data[0].id }));
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/prices', formData);
      setShowForm(false);
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
              ตั้งราคาประกาศ
            </h1>
            <p className="text-gray-600 mt-1">
              จัดการราคาประกาศและกฎการปรับราคา
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + ตั้งราคาใหม่
          </button>
        </div>

        {/* Prices List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="card text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : prices.length > 0 ? (
            prices.map((price) => (
              <div key={price.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(price.date)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {price.location?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">ราคาพื้นฐาน</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(price.basePrice)}/กก.
                    </p>
                  </div>
                </div>

                {price.priceRules && price.priceRules.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      กฎการปรับราคาตาม %ยาง
                    </h4>
                    <div className="space-y-2">
                      {price.priceRules.map((rule: any) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <span className="text-sm text-gray-700">
                            %ยาง {rule.minPercent} - {rule.maxPercent}%
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              rule.adjustment > 0
                                ? 'text-green-600'
                                : rule.adjustment < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {rule.adjustment > 0 && '+'}
                            {rule.adjustment} บาท/กก.
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">ยังไม่มีราคาประกาศ</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">ตั้งราคาประกาศใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="label">ราคาพื้นฐาน (บาท/กก.)</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePrice: parseFloat(e.target.value),
                      })
                    }
                    className="input"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">กฎการปรับราคา</h3>
                {formData.priceRules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="number"
                      value={rule.minPercent}
                      onChange={(e) => {
                        const newRules = [...formData.priceRules];
                        newRules[index].minPercent = parseFloat(e.target.value);
                        setFormData({ ...formData, priceRules: newRules });
                      }}
                      className="input"
                      placeholder="% ต่ำสุด"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={rule.maxPercent}
                      onChange={(e) => {
                        const newRules = [...formData.priceRules];
                        newRules[index].maxPercent = parseFloat(e.target.value);
                        setFormData({ ...formData, priceRules: newRules });
                      }}
                      className="input"
                      placeholder="% สูงสุด"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={rule.adjustment}
                      onChange={(e) => {
                        const newRules = [...formData.priceRules];
                        newRules[index].adjustment = parseFloat(e.target.value);
                        setFormData({ ...formData, priceRules: newRules });
                      }}
                      className="input"
                      placeholder="ปรับ ± บาท"
                      step="0.01"
                    />
                  </div>
                ))}
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


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency, formatDate } from '@/lib/utils';
import { paymentRequestLabel } from '@/lib/tenantProfile';

interface ShopProfile {
  slug: string;
  name: string;
  email: string | null;
  plan: string;
  tenantStatus: string;
}

interface PaymentStatus {
  key: string;
  label: string;
  tone: 'green' | 'amber' | 'red' | 'gray';
}

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const TONE_CLASS: Record<PaymentStatus['tone'], string> = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

export default function ShopProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const res = await fetch('/api/tenant/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.message || 'โหลดโปรไฟล์ไม่สำเร็จ');
      setLoading(false);
      return;
    }
    setShop(data.shop);
    setPaymentStatus(data.paymentStatus);
    setPayments(data.payments || []);
    setEmail(data.shop?.email || '');
    setLoading(false);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    load();
  }, [user, isLoading, router]);

  const saveEmail = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'บันทึกอีเมลไม่สำเร็จ');
        return;
      }
      setNotice('บันทึกอีเมลแล้ว');
      setShop((prev) => (prev ? { ...prev, email: data.email } : prev));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลดโปรไฟล์..." />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                โปรไฟล์ร้าน
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">ข้อมูลร้าน สถานะชำระเงิน และประวัติสลิป</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 font-semibold shadow-lg shadow-green-600/20 hover:-translate-y-0.5 transition-transform"
        >
          ไปหน้าแดชบอร์ด POS
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลร้าน</h2>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">รหัสร้าน (slug)</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{shop?.slug || '-'}</p>
            <p className="text-sm text-gray-500">{shop?.name}</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">อีเมล</span>
            <div className="mt-1 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@email.com"
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
              />
              <button
                type="button"
                disabled={saving}
                onClick={saveEmail}
                className="rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกอีเมล'}
              </button>
            </div>
          </label>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">สถานะชำระเงิน</h2>
          {paymentStatus && (
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${TONE_CLASS[paymentStatus.tone]}`}>
              {paymentStatus.label}
            </span>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            แพ็คเกจปัจจุบัน: {shop?.plan === 'premium' ? 'Premium' : 'ทดลองใช้ฟรี'}
          </p>
          {(shop?.tenantStatus === 'not_yet_payment' || shop?.tenantStatus === 'pending_payment' || shop?.tenantStatus === 'rejected' || shop?.plan === 'freemium') && (
            <button
              type="button"
              onClick={() => router.push('/signup/payment')}
              className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold"
            >
              {shop?.plan === 'freemium' ? 'อัปเกรด Premium' : 'ไปหน้าชำระเงิน'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ประวัติการชำระเงิน</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-500">ยังไม่มีประวัติสลิปชำระเงิน</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-medium px-6 py-3">วันที่ส่งสลิป</th>
                  <th className="text-left font-medium px-6 py-3">ยอดชำระ</th>
                  <th className="text-left font-medium px-6 py-3">สถานะ</th>
                  <th className="text-left font-medium px-6 py-3">ตรวจสอบเมื่อ</th>
                  <th className="text-left font-medium px-6 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-100">{formatDate(row.createdAt)}</td>
                    <td className="px-6 py-3">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-3">{paymentRequestLabel(row.status)}</td>
                    <td className="px-6 py-3 text-gray-500">{row.reviewedAt ? formatDate(row.reviewedAt) : '-'}</td>
                    <td className="px-6 py-3 text-red-600">{row.rejectReason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

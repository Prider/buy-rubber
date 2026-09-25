'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/platform/AuthContext';
import GamerLoader from '@/shared/ui/GamerLoader';
import { formatCurrency, formatDate } from '@/shared/utils';
import { paymentRequestLabel } from '@/platform/tenantProfile';

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

  const paymentLabel = shop?.plan === 'freemium'
    ? 'อัปเกรด Premium'
    : shop?.tenantStatus === 'not_yet_payment' || shop?.tenantStatus === 'pending_payment' || shop?.tenantStatus === 'rejected'
      ? 'ไปหน้าชำระเงิน'
      : 'ชำระเงิน';

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">
              <span className="animate-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                โปรไฟล์ร้าน
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">ข้อมูลร้าน สถานะชำระเงิน และประวัติสลิป</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลร้าน</h2>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">รหัสร้าน (slug)</p>
            <p className="mt-1 break-all text-xl font-bold text-gray-900 dark:text-white">{shop?.slug || '-'}</p>
            <p className="text-sm text-gray-500">{shop?.name}</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">อีเมล</span>
            <div className="mt-1 flex flex-col gap-2 xl:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@email.com"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                disabled={saving}
                onClick={saveEmail}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-medium disabled:opacity-50 dark:border-gray-600 xl:w-auto"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกอีเมล'}
              </button>
            </div>
          </label>
        </div>

        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">สถานะชำระเงิน</h2>
          {paymentStatus && (
            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${TONE_CLASS[paymentStatus.tone]}`}>
              {paymentStatus.label}
            </span>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            แพ็คเกจปัจจุบัน: {shop?.plan === 'premium' ? 'Premium' : 'ทดลองใช้ฟรี'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/signup/payment')}
            className="mt-auto w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
          >
            {paymentLabel}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ประวัติการชำระเงิน</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-4 py-10 text-sm text-gray-500 sm:px-6">ยังไม่มีประวัติสลิปชำระเงิน</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 md:hidden">
              {payments.map((row) => (
                <li key={row.id} className="space-y-2 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(row.createdAt)}</p>
                    <p className="shrink-0 font-semibold text-gray-900 dark:text-white">{formatCurrency(row.amount)}</p>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{paymentRequestLabel(row.status)}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-gray-500">ตรวจสอบเมื่อ</dt>
                    <dd className="text-gray-700 dark:text-gray-300">{row.reviewedAt ? formatDate(row.reviewedAt) : '-'}</dd>
                    <dt className="text-gray-500">หมายเหตุ</dt>
                    <dd className={row.rejectReason ? 'text-red-600' : 'text-gray-500'}>{row.rejectReason || '-'}</dd>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium lg:px-6">วันที่ส่งสลิป</th>
                    <th className="px-4 py-3 text-left font-medium lg:px-6">ยอดชำระ</th>
                    <th className="px-4 py-3 text-left font-medium lg:px-6">สถานะ</th>
                    <th className="px-4 py-3 text-left font-medium lg:px-6">ตรวจสอบเมื่อ</th>
                    <th className="hidden px-6 py-3 text-left font-medium lg:table-cell">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row) => (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 lg:px-6">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-3 lg:px-6">{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-3 lg:px-6">{paymentRequestLabel(row.status)}</td>
                        <td className="px-4 py-3 text-gray-500 lg:px-6">{row.reviewedAt ? formatDate(row.reviewedAt) : '-'}</td>
                        <td className={`hidden px-6 py-3 lg:table-cell ${row.rejectReason ? 'text-red-600' : 'text-gray-500'}`}>
                          {row.rejectReason || '-'}
                        </td>
                      </tr>
                      <tr className="lg:hidden">
                        <td colSpan={4} className="px-4 pb-3 text-sm">
                          <span className="text-gray-500">หมายเหตุ </span>
                          <span className={row.rejectReason ? 'text-red-600' : 'text-gray-500'}>{row.rejectReason || '-'}</span>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

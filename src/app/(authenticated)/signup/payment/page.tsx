'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillingInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
  premiumPriceThb: number;
  qrDataUrl: string | null;
}

export default function PaymentPage() {
  const router = useRouter();
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetch('/api/billing/info')
      .then((res) => res.json())
      .then(setInfo)
      .catch(() => setError('โหลดข้อมูลบัญชีไม่สำเร็จ'));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    let cancelled = false;
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/payments/slip', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setApproved(data.plan === 'premium' && data.tenantStatus === 'active');
      } catch {
        // The payment form stays usable if status cannot be loaded.
      }
    };

    loadStatus();
    const timer = setInterval(loadStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const copyAccount = async () => {
    if (!info?.accountNumber) return;
    await navigator.clipboard.writeText(info.accountNumber.replace(/-/g, ''));
  };

  const submit = async () => {
    if (!file) {
      setError('กรุณาอัปโหลดสลิปการโอนเงิน');
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('slip', file);
      const res = await fetch('/api/payments/slip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'อัปโหลดไม่สำเร็จ');
        return;
      }
      setDone(true);
    } catch {
      setError('อัปโหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="hidden text-2xl font-bold text-gray-900 dark:text-white lg:block">ชำระเงินแพ็คเกจ Premium</h1>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          กลับไปหน้าโปรไฟล์
        </button>
      </div>
      <div className="rounded-3xl border bg-white p-6 shadow-xl dark:bg-gray-800 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done ? (
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold">
              {approved ? 'แพ็คเกจ Premium ได้รับการอนุมัติแล้ว' : 'ส่งสลิปแล้ว รอเจ้าของแพลตฟอร์มตรวจสอบ'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {approved
                ? 'สามารถใช้งานระบบ POS ได้ทันที'
                : 'เมื่ออนุมัติแล้วจะใช้งานระบบ POS ได้ทันที'}
            </p>
            {!approved && (
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-green-600 text-white px-6 py-3 font-semibold"
              >
                ไปหน้าสถานะ
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 space-y-1 text-sm">
              <p>ธนาคาร: {info?.bankName || '-'}</p>
              <p>ชื่อบัญชี: {info?.accountName || '-'}</p>
              <p className="flex items-center gap-2">
                เลขบัญชี: {info?.accountNumber || '-'}
                <button type="button" onClick={copyAccount} className="text-green-600 text-xs">
                  คัดลอก
                </button>
              </p>
              <p>ยอดชำระ: {info?.premiumPriceThb?.toLocaleString('th-TH')} บาท</p>
            </div>
            {info?.qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={info.qrDataUrl} alt="PromptPay QR" className="w-56 h-56 bg-white rounded-xl p-2" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'กำลังส่งสลิป...' : 'อัปโหลดสลิป'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

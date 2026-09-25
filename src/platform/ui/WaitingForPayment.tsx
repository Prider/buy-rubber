'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/platform/AuthContext';

export default function WaitingForPayment({
  status,
}: {
  status: 'not_yet_payment' | 'pending_payment' | 'rejected';
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const load = async () => {
      const res = await fetch('/api/tenant/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await res.json();
      if (me.tenantStatus === 'active') {
        window.location.href = '/dashboard';
        return;
      }
      const slipRes = await fetch('/api/payments/slip', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const slip = await slipRes.json();
      setRejectReason(slip.request?.rejectReason || null);
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
      <h1 className="text-2xl font-bold">
        {status === 'not_yet_payment' ? 'ยังไม่ได้ชำระเงิน' : 'รอตรวจสอบสลิป'}
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        {status === 'not_yet_payment'
          ? 'กรุณาโอนเงินและอัปโหลดสลิปเพื่อเปิดใช้งาน Premium'
          : status === 'rejected'
            ? 'สลิปไม่ผ่านการตรวจสอบ กรุณาอัปโหลดใหม่'
            : 'เรากำลังตรวจสอบสลิปการโอนเงิน เมื่ออนุมัติแล้วจะใช้งานระบบ POS ได้ทันที'}
      </p>
      {rejectReason && <p className="text-sm text-red-600">{rejectReason}</p>}
      <button
        type="button"
        onClick={() => router.push('/signup/payment')}
        className="rounded-xl bg-green-600 text-white px-6 py-3 font-semibold"
      >
        {status === 'rejected' ? 'อัปโหลดสลิปใหม่' : status === 'not_yet_payment' ? 'ไปหน้าชำระเงิน' : 'ดูหน้าชำระเงิน'}
      </button>
      <button
        type="button"
        onClick={() => router.push('/profile')}
        className="block mx-auto rounded-xl border border-gray-200 dark:border-gray-600 px-6 py-3 font-semibold"
      >
        ดูโปรไฟล์ร้าน
      </button>
      <button type="button" onClick={() => logout()} className="block mx-auto text-sm text-gray-500">
        ออกจากระบบ
      </button>
    </div>
  );
}

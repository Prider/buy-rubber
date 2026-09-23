'use client';

import { useEffect, useState } from 'react';

interface PaymentRow {
  id: string;
  status: string;
  amount: number;
  rejectReason: string | null;
  createdAt: string;
  slipDataUrl: string | null;
  tenant: { slug: string; name: string; status: string; plan: string };
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('platform_token') || ''}` };
}

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    const res = await fetch('/api/platform/payments', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/platform/login';
      return;
    }
    const data = await res.json();
    setPayments(data.payments || []);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, action: 'approve' | 'reject') => {
    setError('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/platform/payments/${id}/review`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason: reason[id] || '' }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'ไม่สำเร็จ');
        return;
      }
      await load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ตรวจสอบสลิปชำระเงิน</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {payments.length === 0 && <p className="text-gray-500">ยังไม่มีรายการ</p>}
      <div className="space-y-4">
        {payments.map((row) => (
          <div key={row.id} className="bg-white dark:bg-gray-800 rounded-2xl border p-4 grid md:grid-cols-[1fr_220px] gap-4">
            <div>
              <p className="font-semibold">{row.tenant.name} ({row.tenant.slug})</p>
              <p className="text-sm text-gray-500">
                {row.status} · {row.amount.toLocaleString('th-TH')} บาท · {new Date(row.createdAt).toLocaleString('th-TH')}
              </p>
              {row.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'approve')}
                    className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm disabled:opacity-50"
                  >
                    อนุมัติ Premium
                  </button>
                  <input
                    value={reason[row.id] || ''}
                    onChange={(e) => setReason((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="เหตุผลถ้าปฏิเสธ"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'reject')}
                    className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              )}
              {row.rejectReason && <p className="text-sm text-red-600 mt-2">{row.rejectReason}</p>}
            </div>
            {row.slipDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.slipDataUrl} alt="slip" className="w-full max-h-56 object-contain rounded-xl bg-gray-100" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

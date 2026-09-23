'use client';

import { useEffect, useState } from 'react';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  plan: string;
  status: string;
  statusLabel: string;
  statusTone: 'green' | 'amber' | 'red' | 'gray';
  userCount: number;
  createdAt: string;
}

const TONE_CLASS: Record<TenantRow['statusTone'], string> = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-700',
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('platform_token') || ''}` };
}

export default function PlatformTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/platform/tenants', { headers: authHeader() })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/platform/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setTenants(data.tenants || []);
      })
      .catch(() => setError('โหลดรายชื่อร้านไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  const counts = tenants.reduce(
    (acc, tenant) => {
      acc.total += 1;
      if (tenant.status === 'pending_payment') acc.pending += 1;
      else if (tenant.status === 'rejected') acc.rejected += 1;
      else acc.active += 1;
      return acc;
    },
    { total: 0, active: 0, pending: 0, rejected: 0 },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ร้านค้า</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Summary label="ทั้งหมด" value={counts.total} />
        <Summary label="ใช้งานได้" value={counts.active} />
        <Summary label="รอตรวจสอบสลิป" value={counts.pending} />
        <Summary label="สลิปไม่ผ่าน" value={counts.rejected} />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-gray-500">กำลังโหลด...</p>}
      {!loading && tenants.length === 0 && <p className="text-gray-500">ยังไม่มีร้านค้า</p>}
      {!loading && tenants.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">ร้าน</th>
                <th className="px-4 py-3 font-medium">อีเมล</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">ผู้ใช้</th>
                <th className="px-4 py-3 font-medium">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{tenant.name}</p>
                    <p className="text-gray-500">{tenant.slug}</p>
                  </td>
                  <td className="px-4 py-3">{tenant.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tenant.statusTone]}`}>
                      {tenant.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{tenant.userCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(tenant.createdAt).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

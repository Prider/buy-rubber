'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

export default function SalesPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ขายยาง</h1>
          <p className="text-gray-600 mt-1">บันทึกการขายสินค้ายาง</p>
        </div>
        <div className="card text-center py-12">
          <p className="text-gray-500">ระบบขายยาง (อยู่ระหว่างพัฒนา)</p>
        </div>
      </div>
    </Layout>
  );
}


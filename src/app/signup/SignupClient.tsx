'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DarkModeToggle from '@/components/DarkModeToggle';
import Logo from '@/components/Logo';
import { generateSlipHTMLFromItems } from '@/components/purchases/utils/slipGenerator';
import type { CartItem } from '@/components/purchases/types';

type Plan = 'freemium' | 'premium';

const SAMPLE_ITEMS: CartItem[] = [
  {
    id: 'preview-1',
    type: 'purchase',
    date: new Date().toISOString(),
    memberName: 'คุณสมชาย',
    memberCode: 'M001',
    productTypeName: 'ยางจอก',
    netWeight: 12.5,
    finalPrice: 55,
    totalAmount: 687.5,
  },
];

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const plan: Plan | null = planParam === 'premium' || planParam === 'freemium' ? planParam : null;

  const [step, setStep] = useState(1);
  const [slug, setSlug] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [slugMessage, setSlugMessage] = useState('');
  const [slugOk, setSlugOk] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plan) {
      router.replace('/landing#pricing');
    }
  }, [plan, router]);

  useEffect(() => {
    if (!slug) {
      setSlugOk(false);
      setSlugMessage('');
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/signup/slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSlugOk(Boolean(data.available));
      setSlugMessage(data.message || (data.available ? 'รหัสร้านนี้ใช้ได้' : ''));
    }, 350);
    return () => clearTimeout(handle);
  }, [slug]);

  const previewHtml = useMemo(
    () =>
      generateSlipHTMLFromItems(SAMPLE_ITEMS, {
        purchaseNo: 'PREVIEW-001',
        memberName: 'คุณสมชาย',
        memberCode: 'M001',
        companyName: companyName || 'ชื่อร้านของคุณ',
        companyAddress: companyAddress || 'ที่อยู่ร้าน',
        paperSize: '80mm',
      }),
    [companyName, companyAddress],
  );

  const handleSubmit = async () => {
    if (!plan) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          slug,
          username,
          password,
          companyName,
          companyAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'สมัครไม่สำเร็จ');
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      if (plan === 'premium') {
        router.push('/signup/payment');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('สมัครไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">สมัครใช้งาน</h1>
              <p className="text-sm text-gray-500">
                แพ็คเกจ {plan === 'premium' ? 'Premium' : 'ทดลองใช้ฟรี'} · ขั้นตอน {step}/2
              </p>
            </div>
          </div>
          <DarkModeToggle />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200/70 dark:border-gray-700 p-6 md:p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">รหัสร้าน (ใช้ตอนเข้าสู่ระบบ)</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                  placeholder="my-shop"
                />
                {slugMessage && (
                  <p className={`mt-1 text-sm ${slugOk ? 'text-green-600' : 'text-red-600'}`}>{slugMessage}</p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ชื่อผู้ใช้ผู้ดูแลร้าน</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                  placeholder="admin"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">รหัสผ่าน</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                />
              </label>
              <button
                type="button"
                disabled={!slugOk || username.length < 2 || password.length < 6}
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50"
              >
                ถัดไป: ตัวอย่างสลิป
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ชื่อร้านบนสลิป</span>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ที่อยู่ร้าน</span>
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                    rows={3}
                  />
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border py-3">
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={loading || !companyName.trim()}
                    onClick={handleSubmit}
                    className="flex-1 rounded-xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50"
                  >
                    {loading ? 'กำลังสร้างร้าน...' : plan === 'premium' ? 'ไปหน้าชำระเงิน' : 'สร้างร้านและเข้าสู่ระบบ'}
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 overflow-auto max-h-[480px]">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

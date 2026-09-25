'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DarkModeToggle from '@/shared/ui/DarkModeToggle';
import Logo from '@/shared/ui/Logo';
import { generateSlipHTMLFromItems } from '@/industries/rubber/ui/purchases/utils/slipGenerator';
import type { CartItem } from '@/industries/rubber/ui/purchases/types';
import { slipWidthPxFor } from '@/shared/slipPaper';

type Plan = 'freemium' | 'premium';

const SLIP_PREVIEW_SIZE = '80mm' as const;
const SLIP_PREVIEW_WIDTH_PX = slipWidthPxFor(SLIP_PREVIEW_SIZE);
const SLIP_PREVIEW_STAGE_WIDTH = 480;
const SLIP_PREVIEW_IFRAME_HEIGHT = 560;
const SLIP_PREVIEW_SCALE = SLIP_PREVIEW_STAGE_WIDTH / SLIP_PREVIEW_WIDTH_PX;
const SLIP_PREVIEW_STAGE_HEIGHT = Math.round(SLIP_PREVIEW_IFRAME_HEIGHT * SLIP_PREVIEW_SCALE);

const PENDING_KEY = 'signup_pending_verification';

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
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [slugMessage, setSlugMessage] = useState('');
  const [slugOk, setSlugOk] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!plan) {
      router.replace('/landing#pricing');
    }
  }, [plan, router]);

  useEffect(() => {
    if (!plan) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { plan?: string; slug?: string; email?: string; cooldownUntil?: number };
      if (saved.plan !== plan || !saved.slug || !saved.email) return;
      setSlug(saved.slug);
      setEmail(saved.email);
      setStep(3);
      const remaining = Math.ceil(((saved.cooldownUntil || 0) - Date.now()) / 1000);
      setCooldown(remaining > 0 ? remaining : 0);
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, [plan]);

  useEffect(() => {
    if (step !== 3 || cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, cooldown > 0]);

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

  const previewHtml = useMemo(() => {
    const html = generateSlipHTMLFromItems(SAMPLE_ITEMS, {
      purchaseNo: 'PREVIEW-001',
      memberName: 'คุณสมชาย',
      memberCode: 'M001',
      companyName: companyName || 'ชื่อร้านของคุณ',
      companyAddress: companyAddress || 'ที่อยู่ร้าน',
      paperSize: SLIP_PREVIEW_SIZE,
    });
    return html.replace(
      '</style>',
      `@media screen { html, body { min-height: 0 !important; height: auto !important; display: block !important; padding-top: 12px !important; } }</style>`,
    );
  }, [companyName, companyAddress]);

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
          email,
          companyName,
          companyAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'สมัครไม่สำเร็จ');
        return;
      }
      const seconds = Number(data.cooldownSeconds) || 60;
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        plan,
        slug,
        email: data.email || email,
        cooldownUntil: Date.now() + seconds * 1000,
      }));
      setCooldown(seconds);
      setResendMessage('');
      setStep(3);
    } catch {
      setError('สมัครไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!plan || cooldown > 0) return;
    setError('');
    setResendMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email }),
      });
      const data = await res.json();
      if (res.status === 429) {
        const seconds = Number(data.retryAfterSeconds) || 60;
        setCooldown(seconds);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.message || 'ส่งอีเมลไม่สำเร็จ');
        return;
      }
      const seconds = Number(data.cooldownSeconds) || 60;
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        plan,
        slug,
        email,
        cooldownUntil: Date.now() + seconds * 1000,
      }));
      setCooldown(seconds);
      setCode('');
      setResendMessage('ส่งรหัสยืนยันอีกครั้งแล้ว');
    } catch {
      setError('ส่งอีเมลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!plan || !/^\d{4}$/.test(code)) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token || !data.user) {
        setError(data.message || 'รหัสยืนยันไม่ถูกต้อง');
        return;
      }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      sessionStorage.removeItem(PENDING_KEY);
      window.location.assign(data.next || '/dashboard');
    } catch {
      setError('ไม่สามารถยืนยันรหัสได้');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4 sm:px-8 lg:px-12">
      <div className={`mx-auto py-8 lg:py-10 ${step === 2 ? 'w-full max-w-[1440px]' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">สมัครใช้งาน</h1>
              <p className="text-sm lg:text-base text-gray-500">
                แพ็คเกจ {plan === 'premium' ? 'Premium' : 'ทดลองใช้ฟรี'}
                {step < 3 ? ` · ขั้นตอน ${step}/2` : ' · ยืนยันอีเมล'}
              </p>
            </div>
          </div>
          <DarkModeToggle />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200/70 dark:border-gray-700 p-6 md:p-8 lg:p-10">
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
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">อีเมล</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3"
                  placeholder="shop@email.com"
                />
              </label>
              <button
                type="button"
                disabled={!slugOk || username.length < 2 || password.length < 6 || !email.includes('@')}
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50"
              >
                ถัดไป: ตัวอย่างสลิป
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(420px,1fr)_minmax(520px,1fr)] gap-8 xl:gap-12 items-start">
              <div className="space-y-6">
                <label className="block">
                  <span className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300">ชื่อร้านบนสลิป</span>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3.5 text-base lg:text-lg"
                    placeholder="เช่น ร้านยางสวนไทย"
                  />
                </label>
                <label className="block">
                  <span className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300">ที่อยู่ร้าน</span>
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3.5 text-base lg:text-lg"
                    rows={6}
                    placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                  />
                </label>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border py-3.5 text-base font-medium">
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={loading || !companyName.trim()}
                    onClick={handleSubmit}
                    className="flex-1 rounded-xl bg-green-600 text-white py-3.5 text-base font-semibold disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่งอีเมล...' : 'ส่งอีเมลยืนยัน'}
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-5 lg:p-8 md:sticky md:top-8">
                <p className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300 mb-5">ตัวอย่างสลิป</p>
                <div className="flex justify-center">
                  <div
                    className="relative shrink-0 overflow-hidden rounded-md bg-white shadow-lg"
                    style={{
                      width: SLIP_PREVIEW_STAGE_WIDTH,
                      height: SLIP_PREVIEW_STAGE_HEIGHT,
                    }}
                  >
                    <iframe
                      title="ตัวอย่างสลิป"
                      srcDoc={previewHtml}
                      className="absolute top-0 left-0 bg-white"
                      style={{
                        width: SLIP_PREVIEW_WIDTH_PX,
                        height: SLIP_PREVIEW_IFRAME_HEIGHT,
                        border: 'none',
                        transform: `scale(${SLIP_PREVIEW_SCALE})`,
                        transformOrigin: 'top left',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ตรวจสอบอีเมลของคุณ</h2>
              <p className="text-gray-600 dark:text-gray-300">
                เราส่งรหัส 4 หลักไปที่ <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-gray-500">รหัสใช้ได้ 15 นาที</p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 px-4 py-3 text-center text-2xl tracking-[0.4em]"
                placeholder="0000"
              />
              {resendMessage && (
                <p className="text-sm text-green-600">{resendMessage}</p>
              )}
              <button
                type="button"
                disabled={loading || code.length !== 4}
                onClick={handleConfirm}
                className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50"
              >
                {loading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส'}
              </button>
              <button
                type="button"
                disabled={loading || cooldown > 0}
                onClick={handleResend}
                className="w-full rounded-xl border py-3 font-semibold disabled:opacity-50"
              >
                {cooldown > 0 ? `ส่งอีกครั้งใน ${cooldown} วินาที` : 'ส่งรหัสอีกครั้ง'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

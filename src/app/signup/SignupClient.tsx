'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DarkModeToggle from '@/shared/ui/DarkModeToggle';
import Logo from '@/shared/ui/Logo';
import { generateSlipHTMLFromItems } from '@/industries/rubber/ui/purchases/utils/slipGenerator';
import type { CartItem } from '@/industries/rubber/ui/purchases/types';
import { slipWidthPxFor } from '@/shared/slipPaper';

type Plan = 'freemium' | 'premium';

const SLIP_PREVIEW_SIZE = '80mm' as const;
const SLIP_PREVIEW_WIDTH_PX = slipWidthPxFor(SLIP_PREVIEW_SIZE);
const SLIP_PREVIEW_IFRAME_HEIGHT = 380;

const PENDING_KEY = 'signup_pending_verification';
const PAYMENT_KEY = 'signup_at_payment';

interface BillingInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
  premiumPriceThb: number;
  qrDataUrl: string | null;
}

const inputClassName =
  'mt-1.5 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-green-400 dark:focus:bg-gray-800 dark:focus:ring-green-400/20';

const pageClassName =
  'flex min-h-[100dvh] items-stretch justify-center bg-white dark:bg-gray-950 md:items-center md:bg-slate-200 md:p-5 dark:md:bg-slate-950 lg:p-8 min-[1440px]:bg-gradient-to-br min-[1440px]:from-slate-200 min-[1440px]:via-slate-300 min-[1440px]:to-slate-400 min-[1440px]:p-10 dark:min-[1440px]:from-slate-950 dark:min-[1440px]:via-slate-900 dark:min-[1440px]:to-black';

const shellClassName =
  'flex min-h-[100dvh] w-full flex-col bg-white dark:bg-gray-900 md:h-[calc(100dvh-2.5rem)] md:min-h-0 md:max-w-[860px] md:overflow-hidden md:rounded-[2rem] md:shadow-2xl md:ring-1 md:ring-slate-900/10 dark:md:ring-white/10 lg:h-[calc(100dvh-4rem)] lg:max-w-[1120px] lg:rounded-[2.5rem]';

const phoneShellClassName =
  'min-[1440px]:h-[min(844px,calc(100dvh-5rem))] min-[1440px]:max-w-[390px] min-[1440px]:rounded-[2.75rem] min-[1440px]:shadow-[0_40px_80px_-24px_rgba(15,23,42,0.55)] min-[1440px]:ring-[12px] min-[1440px]:ring-slate-900 dark:min-[1440px]:ring-black';

const slipShellClassName =
  'md:max-w-[1120px] lg:max-w-[1200px] min-[1440px]:h-[calc(100dvh-4rem)] min-[1440px]:max-w-[1200px] min-[1440px]:rounded-[2.5rem] min-[1440px]:ring-1 min-[1440px]:ring-slate-900/10 dark:min-[1440px]:ring-white/10';

function previewCap(viewportWidth: number) {
  if (viewportWidth >= 1024) return 240;
  if (viewportWidth >= 768) return 220;
  return 200;
}

function SlipPreview({ html }: { html: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(302);

  useEffect(() => {
    const update = () => {
      const parent = frameRef.current?.parentElement?.clientWidth ?? 302;
      setWidth(Math.max(180, Math.min(parent, previewCap(window.innerWidth))));
    };
    update();
    const observer = new ResizeObserver(update);
    if (frameRef.current?.parentElement) observer.observe(frameRef.current.parentElement);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const scale = width / SLIP_PREVIEW_WIDTH_PX;
  const height = Math.round(SLIP_PREVIEW_IFRAME_HEIGHT * scale);

  return (
    <div ref={frameRef} className="relative mx-auto overflow-hidden rounded-md bg-white shadow-lg" style={{ width, height }}>
      <iframe
        title="ตัวอย่างสลิป"
        srcDoc={html}
        className="absolute left-0 top-0 bg-white"
        style={{
          width: SLIP_PREVIEW_WIDTH_PX,
          height: SLIP_PREVIEW_IFRAME_HEIGHT,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}

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
  const [verifying, setVerifying] = useState(false);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [paid, setPaid] = useState(false);

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
      setVerifying(true);
      setStep(2);
      const remaining = Math.ceil(((saved.cooldownUntil || 0) - Date.now()) / 1000);
      setCooldown(remaining > 0 ? remaining : 0);
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, [plan]);

  useEffect(() => {
    if (!verifying || cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [verifying, cooldown > 0]);

  useEffect(() => {
    if (plan !== 'premium' || verifying) return;
    if (sessionStorage.getItem(PAYMENT_KEY) === '1' && localStorage.getItem('auth_token')) {
      setStep(3);
    }
  }, [plan, verifying]);

  useEffect(() => {
    if (step !== 3) return;
    fetch('/api/billing/info')
      .then((res) => res.json())
      .then(setBilling)
      .catch(() => setError('โหลดข้อมูลบัญชีไม่สำเร็จ'));
  }, [step]);

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
      setVerifying(true);
    } catch {
      setError('สมัครไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!slipFile) {
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
      form.append('slip', slipFile);
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
      sessionStorage.removeItem(PAYMENT_KEY);
      setPaid(true);
    } catch {
      setError('อัปโหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const copyAccount = async () => {
    if (!billing?.accountNumber) return;
    await navigator.clipboard.writeText(billing.accountNumber.replace(/-/g, ''));
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
      setVerifying(false);
      if (plan === 'premium') {
        sessionStorage.setItem(PAYMENT_KEY, '1');
        setStep(3);
        return;
      }
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

  const planLabel = plan === 'premium' ? 'Premium' : 'ทดลองใช้ฟรี';
  const totalSteps = plan === 'premium' ? 3 : 2;
  const shownStep = verifying ? 2 : step;
  const stepLabel = `ขั้นตอน ${shownStep}/${totalSteps}`;
  const wideSlip = step === 2 && !verifying;

  return (
    <div className={pageClassName}>
      <div className={`${shellClassName} ${wideSlip ? slipShellClassName : phoneShellClassName}`}>
        <header className="flex items-center justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-5 lg:px-8">
          <DarkModeToggle />
        </header>

        <main className={`flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 md:px-10 lg:px-12 lg:pb-10 ${wideSlip ? '' : 'min-[1440px]:px-5 min-[1440px]:pb-[max(1.25rem,env(safe-area-inset-bottom))]'}`}>
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          <div className={`flex flex-col items-center pb-6 pt-2 text-center md:pb-8 md:pt-2 ${step === 2 && !verifying ? '' : 'lg:hidden min-[1440px]:flex'}`}>
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-green-50 to-emerald-100 shadow-sm ring-1 ring-green-100 dark:from-gray-800 dark:to-gray-800 dark:ring-gray-700 md:h-28 md:w-28 md:rounded-[2rem]">
              <Logo className="h-12 w-auto md:h-16" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">สมัครใช้งาน</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">{planLabel} · {stepLabel}</p>
          </div>

          {step === 1 && (
            <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 min-[1440px]:block">
              <div className="hidden flex-col items-center text-center lg:flex min-[1440px]:hidden">
                <div className="mb-5 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-50 to-emerald-100 shadow-sm ring-1 ring-green-100 dark:from-gray-800 dark:ring-gray-700">
                  <Logo className="h-[4.5rem] w-auto" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">สมัครใช้งาน</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{planLabel} · {stepLabel}</p>
              </div>
              <div className="mx-auto w-full max-w-xl space-y-4 lg:mx-0 lg:max-w-none">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  รหัสร้าน (ใช้ตอนเข้าสู่ระบบ)
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className={inputClassName}
                    placeholder="my-shop"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  {slugMessage && (
                    <p className={`mt-1 text-sm font-medium ${slugOk ? 'text-green-600' : 'text-red-600'}`}>{slugMessage}</p>
                  )}
                </label>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ชื่อผู้ใช้ผู้ดูแลร้าน
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClassName}
                    placeholder="admin"
                    autoComplete="username"
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  รหัสผ่าน
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassName}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  อีเมล
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="shop@email.com"
                    autoComplete="email"
                  />
                </label>
                <button
                  type="button"
                  disabled={!slugOk || username.length < 2 || password.length < 6 || !email.includes('@')}
                  onClick={() => setStep(2)}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-green-600 text-base font-semibold text-white shadow-lg shadow-green-600/25 transition hover:bg-green-700 disabled:opacity-50"
                >
                  ถัดไป: ตัวอย่างสลิป
                </button>
                <p className="pt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  มีบัญชีแล้ว?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400">เข้าสู่ระบบ</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && !verifying && (
            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10">
              <div className="w-full space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ชื่อร้านบนสลิป
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputClassName}
                    placeholder="เช่น ร้านยางสวนไทย"
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ที่อยู่ร้าน
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className={`${inputClassName} h-auto py-3`}
                    rows={4}
                    placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                  />
                </label>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl border border-gray-200 text-base font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200">
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={loading || !companyName.trim()}
                    onClick={handleSubmit}
                    className="h-14 flex-1 rounded-2xl bg-green-600 text-base font-semibold text-white shadow-lg shadow-green-600/25 disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่งอีเมล...' : 'ส่งอีเมลยืนยัน'}
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950 md:p-6">
                <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ตัวอย่างสลิป</p>
                <SlipPreview html={previewHtml} />
              </div>
            </div>
          )}

          {verifying && (
            <div className="mx-auto w-full max-w-xl space-y-4 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">ตรวจสอบอีเมลของคุณ</h2>
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
                className={`${inputClassName} text-center text-2xl tracking-[0.4em]`}
                placeholder="0000"
              />
              {resendMessage && (
                <p className="text-sm text-green-600">{resendMessage}</p>
              )}
              <button
                type="button"
                disabled={loading || code.length !== 4}
                onClick={handleConfirm}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-green-600 text-base font-semibold text-white shadow-lg shadow-green-600/25 disabled:opacity-50"
              >
                {loading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส'}
              </button>
              <button
                type="button"
                disabled={loading || cooldown > 0}
                onClick={handleResend}
                className="h-14 w-full rounded-2xl border border-gray-200 text-base font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                {cooldown > 0 ? `ส่งอีกครั้งใน ${cooldown} วินาที` : 'ส่งรหัสอีกครั้ง'}
              </button>
            </div>
          )}

          {step === 3 && plan === 'premium' && (
            <div className="mx-auto w-full max-w-xl space-y-4">
              {paid ? (
                <div className="space-y-4 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">ส่งสลิปแล้ว</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">รอเจ้าของแพลตฟอร์มตรวจสอบ เมื่ออนุมัติแล้วจะใช้งานระบบได้ทันที</p>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-green-600 text-base font-semibold text-white"
                  >
                    ไปหน้าสถานะ
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white">ชำระเงินแพ็คเกจ Premium</h2>
                  <div className="space-y-1 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-950 dark:text-gray-200">
                    <p>ธนาคาร: {billing?.bankName || '-'}</p>
                    <p>ชื่อบัญชี: {billing?.accountName || '-'}</p>
                    <p className="flex items-center gap-2">
                      เลขบัญชี: {billing?.accountNumber || '-'}
                      <button type="button" onClick={copyAccount} className="text-xs font-semibold text-green-600">คัดลอก</button>
                    </p>
                    <p>ยอดชำระ: {billing?.premiumPriceThb?.toLocaleString('th-TH') || '-'} บาท</p>
                  </div>
                  {billing?.qrDataUrl && (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={billing.qrDataUrl} alt="PromptPay QR" className="h-56 w-56 rounded-xl bg-white p-2" />
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    สลิปการโอนเงิน
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      className="mt-1.5 block w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-semibold file:text-white dark:text-gray-300"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={submitPayment}
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-green-600 text-base font-semibold text-white shadow-lg shadow-green-600/25 disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่งสลิป...' : 'อัปโหลดสลิป'}
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

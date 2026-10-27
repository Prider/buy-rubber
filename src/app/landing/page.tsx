'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import DarkModeToggle from '@/components/DarkModeToggle';
import Logo from '@/components/Logo';

const LINE_URL = 'https://line.me/ti/p/~pawatify';

const NAV = [
  { id: 'problem', label: 'ปัญหา' },
  { id: 'how', label: 'วิธีทำงาน' },
  { id: 'features', label: 'คุณสมบัติ' },
  { id: 'proof', label: 'หลักฐาน' },
  { id: 'pricing', label: 'ราคา' },
  { id: 'faq', label: 'คำถามที่พบบ่อย', navLabel: 'คำถาม' },
  { id: 'contact', label: 'ติดต่อ' },
] as const;

const DEVICES = [
  { id: 'computer', label: 'คอมพิวเตอร์' },
  { id: 'tablet', label: 'แท็บเล็ต' },
  { id: 'phone', label: 'มือถือ' },
] as const;

type DeviceId = (typeof DEVICES)[number]['id'];

const DEVICE_CAPTION: Record<DeviceId, string> = {
  computer: 'แถบซ้ายมีชื่อเมนู ใช้บนคอมพิวเตอร์ที่จุดรับซื้อ',
  tablet: 'หน้าจอรับซื้อเดียวกัน ในกรอบแท็บเล็ต',
  phone: 'ฟอร์มรับซื้อที่พนักงานเห็นตอนชั่ง',
};

const PROBLEMS = [
  {
    title: 'แถวที่ตาชั่ง',
    body: 'ทุกคันต้องชั่งรวมภาชนะ หักถัง คิดบาทต่อกิโล แล้วพิมพ์สลิปก่อนคันถัดไปเข้า',
  },
  {
    title: 'สมุดไม่ตรงสลิป',
    body: 'พอเย็น สลิปที่จ่ายไปกับสมุดที่จดไว้ไม่ตรงกัน และไม่รู้ว่าใครเป็นคนคีย์ผิด',
  },
  {
    title: 'ตัวเลขสิ้นเดือน',
    body: 'น้ำมัน ค่าซ่อม และค่าขนส่งไปโรงงานอยู่นอกเล่มที่จดยอดรับซื้อ กำไรที่คิดได้จึงสูงกว่าของจริง',
  },
];

const DAY = [
  {
    when: 'ก่อนเปิด',
    body: 'เปิดแดชบอร์ด ยอดวันนี้เริ่มจากศูนย์ ถ้ามีสมาชิกหรือประเภทสินค้าใหม่ เพิ่มให้ครบก่อนชั่ง',
  },
  {
    when: 'ระหว่างวัน',
    body: 'รับซื้อลงตะกร้า กดบันทึกข้อมูล แล้วพิมพ์สลิปให้ชาวสวน เมื่อมีรถออก บันทึกการขายพร้อมค่าขนส่งของเที่ยวนั้น มีใบน้ำมันหรือค่าซ่อมเมื่อไร บันทึกที่ค่าใช้จ่ายทันที',
  },
  {
    when: 'ก่อนปิด',
    body: 'เปิดประวัติการรับซื้อของวันนี้ เทียบกับสลิปที่พิมพ์ออกไป ดูยอดที่แดชบอร์ด แล้วกดสำรองข้อมูลตอนนี้',
  },
  {
    when: 'ปิดสัปดาห์หรือเดือน',
    body: 'ดาวน์โหลด PDF สรุปการรับซื้อ การขาย ค่าใช้จ่าย และกำไรขาดทุน ตามช่วงวันที่ แล้วคัดลอกไฟล์สำรองออกนอกเครื่อง',
  },
];

const FEATURES = [
  {
    title: 'รับซื้อและสลิป',
    body: 'น้ำหนักสุทธิคือน้ำหนักรวมภาชนะลบน้ำหนักภาชนะ แก้เองไม่ได้ กดราคาล่าสุดของสินค้านี้ได้ Enter เลื่อนช่องถัดไป หลายรายการอยู่ในตะกร้าจนกว่าจะกดบันทึก แล้วสต็อกเพิ่ม สลิปรับชื่อจุด ที่อยู่ เลขผู้เสียภาษี ขนาดตัวอักษร และกระดาษความร้อน 58, 80 หรือ 104 มม. รวมใบ A4',
  },
  {
    title: 'สต็อก',
    body: 'แต่ละแถวบอกกิโลกรัมคงเหลือ ต้นทุนเฉลี่ยต่อกิโล ราคาขายเฉลี่ย และกำไรของที่ขายไปแล้ว เพิ่มได้สูงสุด 50 ประเภท ขายเกินของในสต็อกไม่ได้ ของที่มีประวัติจะปิดการใช้งานแทนการลบ',
  },
  {
    title: 'ขายให้โรงงาน',
    body: 'เลือกบริษัทปลายทาง ใส่ %ยางเมื่อล็อตนั้นต้องระบุ แล้วเลือกจ่ายสด ขายล่วง หรือฝาก ใส่ค่าใช้จ่ายของเที่ยวนั้นได้สี่รายการ เช่น ค่าขนส่ง ค่าแรง ค่าบริการ หรือภาษี ต้นทุนเฉลี่ยโชว์ก่อนตั้งราคาขาย',
  },
  {
    title: 'ค่าใช้จ่ายและกำไรขาดทุน',
    body: 'น้ำมัน ค่าซ่อมรถ ค่าคนงาน หรือหมวดที่พิมพ์เอง เข้ากำไรขาดทุน ค่าขนส่งของเที่ยวนั้นอยู่ที่บิลขาย ไม่ปนกับค่าใช้จ่ายทั้งจุด รายงานห้าแท็บดาวน์โหลดเป็น PDF กำไรเป็นสีเขียว ขาดทุนเป็นสีแดง ดูรายวันหรือรายเดือนได้',
  },
  {
    title: 'สิทธิ์และประวัติการใช้งาน',
    body: 'เจ้าของ ผู้จัดการ พนักงาน และบัญชี บัญชีเห็นแต่รายงาน และเปิดมาที่หน้ารายงานทันที ลบรายการรับซื้อได้เฉพาะเจ้าของ ประวัติการใช้งานบอกว่าใครเข้าโปรแกรมและใครแก้รายการสำคัญ',
  },
  {
    title: 'เครื่องเดียวและวงแลน',
    body: 'หลังใส่ใบอนุญาต งานรับซื้อ ขาย สต็อก และรายงานใช้ได้โดยไม่ต่ออินเทอร์เน็ต ข้อมูลอยู่ในเครื่องหลัก เครื่องอื่นในร้านเปิดผ่าน Server URL ขณะเครื่องหลักเปิดค้างไว้ สำรองข้อมูลกดเอง แล้วนำไฟล์ไปเก็บนอกเครื่อง',
  },
];

const SHOTS = [
  {
    src: '/guide/dashboard.jpg',
    alt: 'แดชบอร์ด Yang Dee สลับวันนี้กับเดือนนี้',
    caption: 'แดชบอร์ด',
    detail: 'วันนี้หรือเดือนนี้',
  },
  {
    src: '/guide/purchases.jpg',
    alt: 'หน้ารับซื้อยาง มีฟอร์มชั่งและตะกร้า',
    caption: 'รับซื้อยาง',
    detail: 'ตะกร้า แล้วพิมพ์สลิป',
  },
  {
    src: '/guide/reports.jpg',
    alt: 'หน้ารายงานห้าแท็บของ Yang Dee',
    caption: 'รายงาน',
    detail: 'ดาวน์โหลด PDF',
  },
];

const INCLUDED = [
  'สมาชิก รับซื้อ และพิมพ์สลิป',
  'สต็อก การขาย ค่าใช้จ่าย และรายงาน',
  'สำรองข้อมูล และกำหนดสิทธิ์ผู้ใช้',
];

const PLANS = [
  {
    title: 'เครื่องเดียว',
    detail: 'ออฟไลน์',
    body: 'ข้อมูลอยู่ในเครื่องนั้น เหมาะกับจุดที่ชั่งและขายบนคอมพิวเตอร์เครื่องเดียว',
  },
  {
    title: 'หลายเครื่องในวงแลน',
    detail: 'ร้านเดียวกัน',
    body: 'เครื่องหลักเป็นที่เก็บข้อมูล เครื่องอื่นในวงแลนเห็นรายการชุดเดียวกันทันทีที่บันทึก',
  },
];

const FAQ = [
  {
    q: 'ต้องติดตั้งโปรแกรมอะไรเพิ่มไหม?',
    a: 'ไม่ต้อง ติดตั้ง Yang Dee บนคอมพิวเตอร์ หรือเปิดผ่านเบราว์เซอร์ของเครื่องอื่นในวงแลน',
  },
  {
    q: 'ต้องต่ออินเทอร์เน็ตไหม?',
    a: 'รับซื้อ ขาย สต็อก และรายงานใช้ได้โดยไม่ต่ออินเทอร์เน็ต หลังจากเปิดใบอนุญาตแล้ว ผู้ช่วยอัจฉริยะต้องต่ออินเทอร์เน็ต เครื่องอื่นในร้านต้องให้เครื่องหลักเปิดค้าง และอยู่ในวงแลนเดียวกัน',
  },
  {
    q: 'สำรองข้อมูลอัตโนมัติหรือไม่?',
    a: 'ไม่ กดสำรองข้อมูลตอนนี้ แล้วคัดลอกไฟล์ไปไว้นอกเครื่อง การกู้คืนจะแทนที่ข้อมูลปัจจุบันทั้งชุด',
  },
  {
    q: 'ใครลบรายการรับซื้อได้?',
    a: 'เฉพาะเจ้าของ พนักงานกดลบแล้วระบบจะบอกว่าไม่มีสิทธิ์',
  },
  {
    q: 'บัญชีเข้ามาแล้วเห็นแต่รายงาน เพราะอะไร?',
    a: 'บทบาทนั้นตั้งให้ดูรายงานอย่างเดียว ถ้าต้องรับซื้อ ให้เจ้าของเปลี่ยนเป็นพนักงานหรือผู้จัดการ',
  },
  {
    q: 'ลืมรหัสผ่านทำอย่างไร?',
    a: 'เจ้าของตั้งรหัสใหม่ให้ที่ผู้ใช้งาน รหัสเริ่มต้นของโปรแกรมต้องเลิกใช้หลังเข้าได้ครั้งแรก',
  },
  {
    q: 'พิมพ์สลิปแล้วตัวเล็กหรือกว้างไม่พอดี?',
    a: 'ไปที่ตั้งค่าใบรับซื้อ เปลี่ยนขนาดตัวอักษรและความกว้างกระดาษเป็น 58, 80 หรือ 104 มม. ให้ตรงกับม้วน แล้วพิมพ์ทดสอบ',
  },
  {
    q: 'ใบอนุญาตหมดอายุแล้วเปิดไม่ได้?',
    a: 'ใส่คีย์ที่ยังไม่หมดอายุ โปรแกรมจะเข้าไม่ได้จนกว่าจะใส่คีย์ใหม่ ดูวันหมดอายุได้ที่ตั้งค่าระบบ ใบอนุญาตซอฟต์แวร์',
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Wordmark() {
  return (
    <p className="truncate text-base font-semibold tracking-tight">
      <span className="text-fuchsia-500">Y</span>
      <span className="text-violet-500">a</span>
      <span className="text-sky-500 dark:text-sky-400">n</span>
      <span className="text-emerald-500">g</span>
      <span className="text-[#1c1b16] dark:text-white"> Dee</span>
    </p>
  );
}

function InstallLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={LINE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-green-600 px-5 text-base font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${className}`}
    >
      ขอติดตั้งที่จุดรับซื้อ
    </a>
  );
}

function ProductFrame({ device }: { device: DeviceId }) {
  const crop =
    device === 'computer'
      ? 'object-contain object-left-top'
      : device === 'tablet'
        ? 'object-cover object-[26%_0%]'
        : 'object-cover object-[24%_0%]';
  const frame =
    device === 'computer'
      ? 'w-full'
      : device === 'tablet'
        ? 'mx-auto w-full max-w-[420px]'
        : 'mx-auto w-full max-w-[280px]';
  const aspect = device === 'computer' ? 'aspect-[1280/745]' : device === 'tablet' ? 'aspect-[3/4]' : 'aspect-[9/16]';

  return (
    <figure className={frame}>
      <div
        className={`rounded-[20px] border border-[#e3dfd4] bg-white p-2 shadow-[0_1px_0_rgba(28,27,22,0.04),0_16px_40px_rgba(28,27,22,0.06)] dark:border-[#2c3128] dark:bg-[#1a1d18] dark:shadow-none ${
          device === 'phone' ? 'rounded-[28px] p-3' : ''
        }`}
      >
        {device === 'computer' && (
          <div className="mb-2 flex h-8 items-center gap-1.5 px-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e3dfd4] dark:bg-[#3a4034]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e3dfd4] dark:bg-[#3a4034]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e3dfd4] dark:bg-[#3a4034]" />
            <span className="ml-2 text-xs text-[#6f6b62] dark:text-[#a8a496]">รับซื้อยาง</span>
          </div>
        )}
        <div className={`relative overflow-hidden rounded-xl bg-[#eceae4] dark:bg-[#10120e] ${device === 'phone' ? 'rounded-2xl' : ''} ${aspect}`}>
          <Image
            src="/guide/purchases.jpg"
            alt="หน้าจอรับซื้อยางของ Yang Dee"
            fill
            priority
            sizes={device === 'phone' ? '280px' : device === 'tablet' ? '420px' : '(min-width: 1024px) 560px, 100vw'}
            className={crop}
          />
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm leading-6 text-[#5c584f] dark:text-[#b7b3a8] lg:text-left">
        {DEVICE_CAPTION[device]}
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [device, setDevice] = useState<DeviceId>('computer');
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => scrollToSection(id), 0);
  };

  return (
    <div
      id="top"
      className="landing-page min-h-screen bg-[#f3f0e8] font-[family-name:var(--font-sarabun)] text-base text-[#1c1b16] antialiased dark:bg-[#121410] dark:text-[#eceae4]"
    >
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-[#e3dfd4] bg-[#f3f0e8]/90 backdrop-blur-md dark:border-[#2c3128] dark:bg-[#121410]/90"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <a href="#top" className="flex min-h-11 min-w-0 items-center gap-2">
            <Logo className="h-9 w-9" />
            <Wordmark />
          </a>

          <nav className="ml-6 hidden min-w-0 items-center gap-1 lg:flex" aria-label="ส่วนของหน้า">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.id);
                }}
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2 text-[13px] text-[#3f3c36] hover:bg-[#e7e3d8] xl:px-2.5 xl:text-sm dark:text-[#d5d1c6] dark:hover:bg-[#232820]"
              >
                {'navLabel' in item ? item.navLabel : item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="inline-flex min-h-11 min-w-11 items-center justify-center">
              <DarkModeToggle />
            </div>
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              ขอติดตั้ง
            </a>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#1c1b16] hover:bg-[#e7e3d8] lg:hidden dark:text-white dark:hover:bg-[#232820]"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id={menuId} className="border-t border-[#e3dfd4] px-4 py-2 dark:border-[#2c3128] lg:hidden" aria-label="ส่วนของหน้า">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.id);
                }}
                className="flex min-h-11 items-center rounded-lg px-2 text-base text-[#1c1b16] hover:bg-[#e7e3d8] dark:text-[#eceae4] dark:hover:bg-[#232820]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="mx-auto max-w-[640px] lg:mx-0 lg:max-w-none">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              <span className="block">จากตาชั่งถึงกำไร</span>
              <span className="mt-1 block text-green-700 dark:text-green-400">ในสมุดเล่มเดียว</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#3f3c36] md:text-lg dark:text-[#c9c5ba]">
              บันทึกชาวสวนที่นำยางมาขาย พิมพ์สลิป ตัดสต็อกตอนขายออก แล้วสรุปกำไรจากตัวเลขที่คีย์จริง
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-1 md:items-start">
              <InstallLink className="w-full md:w-auto" />
              <Link
                href="/guide"
                className="inline-flex min-h-11 items-center justify-start px-1 text-base font-medium text-green-800 underline-offset-4 hover:underline dark:text-green-400"
              >
                อ่านคู่มือ
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-10 w-full max-w-[640px] lg:mt-0 lg:max-w-none">
            <div role="tablist" aria-label="ขนาดหน้าจอ" className="mb-4 flex flex-wrap gap-2">
              {DEVICES.map((item) => {
                const selected = device === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setDevice(item.id)}
                    className={`min-h-11 rounded-full px-4 text-sm font-medium ${
                      selected
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-[#1c1b16] ring-1 ring-[#e3dfd4] hover:bg-[#f7f5f0] dark:bg-[#1a1d18] dark:text-[#eceae4] dark:ring-[#2c3128]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <ProductFrame device={device} />
            <p className="mt-2 text-center text-sm leading-6 text-[#6f6b62] lg:text-left dark:text-[#a8a496]">
              โปรแกรมเดียวกัน เปิดในเบราว์เซอร์ของเครื่องนั้น
            </p>
          </div>
        </section>

        <section id="problem" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">งานที่หลุดระหว่างวัน</h2>
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
              {PROBLEMS.map((item, index) => (
                <article key={item.title}>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">หนึ่งวันของจุดรับซื้อ</h2>
            <ol className="mx-auto mt-10 max-w-3xl">
              {DAY.map((step, index) => (
                <li key={step.when} className="grid grid-cols-[2.5rem_1fr] gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    {index < DAY.length - 1 && <span className="mt-2 w-px flex-1 bg-[#e3dfd4] dark:bg-[#2c3128]" />}
                  </div>
                  <div className={index < DAY.length - 1 ? 'pb-8' : ''}>
                    <h3 className="text-xl font-semibold">{step.when}</h3>
                    <p className="mt-2 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">สิ่งที่โปรแกรมทำให้ระหว่างวัน</h2>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-[#e3dfd4] bg-white p-6 dark:border-[#2c3128] dark:bg-[#1a1d18]"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">{feature.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
              ผู้ช่วยอัจฉริยะใช้ได้เฉพาะเจ้าของ ถามตัวเลขร้านเป็นภาษาไทยผ่าน Claude, ChatGPT หรือ OpenRouter ต้องมีอินเทอร์เน็ตและ API Key ของร้าน ผู้ช่วยไม่เห็นเลขบัญชี บัตรประชาชน เบอร์โทร หรือรหัสผ่าน
            </p>
          </div>
        </section>

        <section id="proof" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">ของที่เห็นในโปรแกรม</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
              ในโปรแกรมสลับโหมดมืดได้ ปรับขนาดตัวอักษร และเลือกฟอนต์ไทยได้ที่เครื่องนั้น
            </p>

            <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div className="mx-auto w-full max-w-sm rounded-[20px] border border-[#e3dfd4] bg-white p-3 dark:border-[#2c3128] dark:bg-[#1a1d18]">
                <div className="overflow-hidden rounded-xl bg-[#f7f5f0] dark:bg-[#10120e]">
                  <Image
                    src="/slip.png"
                    alt="ตัวอย่างสลิปรับซื้อยาง มีน้ำหนักสุทธิ ราคาต่อกิโล และช่องผู้จัดทำกับผู้รับเงิน"
                    width={648}
                    height={892}
                    className="h-auto w-full"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">สลิปที่พิมพ์ให้ชาวสวน</h3>
                <p className="mt-4 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
                  ตั้งชื่อจุดรับซื้อ ที่อยู่ เลขประจำตัวผู้เสียภาษี และข้อความท้ายใบก่อนพิมพ์ของจริง เลือกสลิปธรรมดา สลิปมีลายเซ็น หรือใบ A4 แล้วดูตัวอย่างก่อนบันทึก
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SHOTS.map((shot) => (
                <figure key={shot.src}>
                  <div className="overflow-hidden rounded-2xl border border-[#e3dfd4] bg-[#eceae4] dark:border-[#2c3128] dark:bg-[#10120e]">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1280}
                      height={745}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                  <figcaption className="mt-3">
                    <span className="block text-base font-semibold">{shot.caption}</span>
                    <span className="text-sm text-[#5c584f] dark:text-[#b7b3a8]">{shot.detail}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-dashed border-[#c9c3b4] p-6 dark:border-[#3a4034]"
                >
                  <p className="text-sm font-semibold">ใส่รีวิวจริง</p>
                  <p className="mt-8 text-sm text-[#8a867c] dark:text-[#8d897f]">ชื่อ</p>
                  <p className="text-sm text-[#8a867c] dark:text-[#8d897f]">จุดรับซื้อ · จังหวัด</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">ใบอนุญาต</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
              เปิดโปรแกรมด้วยคีย์ที่มีวันหมดอายุ หมดแล้วใส่คีย์ใหม่ โปรแกรมถึงจะเข้าได้อีก ราคาสอบถามตามจำนวนเครื่อง
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
              {PLANS.map((plan) => (
                <article
                  key={plan.title}
                  className="flex flex-col rounded-2xl border border-[#e3dfd4] bg-white p-6 dark:border-[#2c3128] dark:bg-[#1a1d18]"
                >
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{plan.detail}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{plan.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">{plan.body}</p>
                  <ul className="mt-6 space-y-2 text-base leading-7">
                    {INCLUDED.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a
                    href={LINE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-green-600 px-5 text-base font-semibold text-white hover:bg-green-700"
                  >
                    ถามราคา
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-6 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
              ผู้ช่วยอัจฉริยะใช้ API Key ของร้านเอง และต้องต่ออินเทอร์เน็ต
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">คำถามที่พบบ่อย</h2>
            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              {FAQ.map((item) => (
                <article key={item.q}>
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <p className="mt-2 text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 border-t border-[#e3dfd4] dark:border-[#2c3128]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">นัดติดตั้งที่จุดรับซื้อ</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#3f3c36] dark:text-[#c9c5ba]">
              บอกรายชื่อจุด จำนวนเครื่อง และว่าจะใช้เครื่องเดียวหรือหลายเครื่องในวงแลน
            </p>
            <div className="mt-8">
              <InstallLink className="w-full sm:w-auto" />
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-4 text-base leading-7">
              <div>
                <dt className="text-sm text-[#6f6b62] dark:text-[#a8a496]">โทร</dt>
                <dd>
                  <a href="tel:0926241010" className="font-medium hover:underline">
                    0926241010
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#6f6b62] dark:text-[#a8a496]">Line</dt>
                <dd>
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                    pawatify
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#6f6b62] dark:text-[#a8a496]">อีเมล</dt>
                <dd>
                  <a href="mailto:support@punsookinnotech.co" className="break-all font-medium hover:underline">
                    support@punsookinnotech.co
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[#6f6b62] dark:text-[#a8a496]">ที่อยู่</dt>
                <dd>119/1 Punsook office หมู่ 1 ต.บางคูเวียง อ.บางกรวย จ.นนทบุรี 11130</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e3dfd4] dark:border-[#2c3128]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-9 w-9" />
              <Wordmark />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5c584f] dark:text-[#b7b3a8]">
              ระบบจุดรับซื้อน้ำยางของ Punsook Innotech
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">เมนู</h2>
            <ul className="mt-2">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      go(item.id);
                    }}
                    className="flex min-h-11 items-center text-sm text-[#3f3c36] hover:text-green-800 dark:text-[#c9c5ba] dark:hover:text-green-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">ติดต่อ</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#3f3c36] dark:text-[#c9c5ba]">
              <li>
                <a href="tel:0926241010">0926241010</a>
              </li>
              <li>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                  Line: pawatify
                </a>
              </li>
              <li>
                <a href="mailto:support@punsookinnotech.co" className="break-all">
                  support@punsookinnotech.co
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">ลิงก์ด่วน</h2>
            <ul className="mt-2">
              <li>
                <Link href="/guide" className="flex min-h-11 items-center text-sm hover:text-green-800 dark:hover:text-green-400">
                  อ่านคู่มือ
                </Link>
              </li>
              <li>
                <Link href="/login" className="flex min-h-11 items-center text-sm hover:text-green-800 dark:hover:text-green-400">
                  เข้าสู่ระบบ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#e3dfd4] px-4 py-6 text-center text-sm text-[#6f6b62] dark:border-[#2c3128] dark:text-[#a8a496]">
          © 2026 Yang Dee
        </div>
      </footer>
    </div>
  );
}

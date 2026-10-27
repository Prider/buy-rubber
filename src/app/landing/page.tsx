'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import DarkModeToggle from '@/components/DarkModeToggle';
import Logo from '@/components/Logo';
import { useDarkMode } from '@/contexts/DarkModeContext';

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

const DEVICE_ROTATE_MS = 6000;

const DEVICE_CAPTION: Record<DeviceId, string> = {
  computer: 'แถบไอคอนด้านซ้าย ฟอร์มรับซื้ออยู่ข้างตะกร้า',
  tablet: 'แท็บเล็ตมีแถบไอคอน ฟอร์มรับซื้อ และแถบตะกร้าด้านล่าง',
  phone: 'หน้าจอรับซื้อบนมือถือ มีแท็บรับซื้อกับค่าบริการ และแถบตะกร้าด้านล่าง',
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
    darkSrc: '/guide/dark/dashboard.jpg',
    alt: 'แดชบอร์ด Yang Dee สลับวันนี้กับเดือนนี้',
    caption: 'แดชบอร์ด',
    detail: 'วันนี้หรือเดือนนี้',
  },
  {
    src: '/guide/purchases.jpg',
    darkSrc: '/guide/dark/purchases.jpg',
    alt: 'หน้ารับซื้อยาง มีฟอร์มชั่งและตะกร้า',
    caption: 'รับซื้อยาง',
    detail: 'ตะกร้า แล้วพิมพ์สลิป',
  },
  {
    src: '/guide/reports.jpg',
    darkSrc: '/guide/dark/reports.jpg',
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

function PhoneField({
  label,
  required = false,
  value,
  placeholder,
  suffix,
  search = false,
  tone = 'bg-white dark:bg-gray-700',
}: {
  label: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  suffix?: string;
  search?: boolean;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-[1cqw] truncate text-[3.7cqw] font-semibold leading-none text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </p>
      <div className={`flex h-[12.8cqw] items-center rounded-[2.8cqw] border border-gray-200 px-[2.6cqw] shadow-sm dark:border-gray-600 ${tone}`}>
        {search && (
          <svg className="mr-[1.4cqw] h-[4.2cqw] w-[4.2cqw] shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        <span className={`min-w-0 flex-1 truncate text-[4.8cqw] ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        {suffix && <span className="shrink-0 pl-[1cqw] text-[3.4cqw] font-medium text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function MobilePurchaseScreen() {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-gray-900 [container-type:size] dark:bg-gray-900 dark:text-gray-100">
      <header className="flex h-[14cqw] shrink-0 items-center gap-[2cqw] border-b border-gray-200 bg-white px-[3cqw] dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-[5.6cqw] w-[5.6cqw] shrink-0 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <p className="min-w-0 flex-1 truncate text-center text-[4.5cqw] font-bold">
          <span className="text-fuchsia-500">Y</span>
          <span className="text-violet-500">a</span>
          <span className="text-sky-500 dark:text-sky-400">n</span>
          <span className="text-emerald-500">g</span>
        </p>
        <svg className="h-[5.2cqw] w-[5.2cqw] shrink-0 text-gray-500 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg className="hidden h-[5.2cqw] w-[5.2cqw] shrink-0 text-gray-300 dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-[1.2cqw] border-b border-gray-200 bg-white p-[2cqw] dark:border-gray-700 dark:bg-gray-900">
        <p className="flex h-[12.5cqw] items-center justify-center rounded-[2.8cqw] bg-blue-600 text-[4.3cqw] font-semibold text-white">รับซื้อ</p>
        <p className="flex h-[12.5cqw] items-center justify-center text-[4.3cqw] font-semibold text-gray-500 dark:text-gray-400">ค่าบริการ</p>
      </div>

      <div className="min-h-0 flex-1 space-y-[2cqw] overflow-hidden px-[3cqw] py-[2.4cqw]">
        <PhoneField label="วันที่รับซื้อ" required value="27/10/2026" />
        <PhoneField label="สมาชิก" required search placeholder="ค้นหาสมาชิกตามชื่อหรือรหัส" />
        <div className="grid grid-cols-2 gap-[2cqw]">
          <PhoneField label="ประเภทสินค้า" required search placeholder="ค้นหาตามชื่อหรือรหัส..." />
          <PhoneField label="น้ำหนักรวมภาชนะ" required value="0.00" suffix="กก." />
          <PhoneField label="น้ำหนักภาชนะ" value="0.00" suffix="กก." />
          <PhoneField label="น้ำหนักสุทธิ" required value="0.00" suffix="กก." tone="bg-gray-50 font-semibold dark:bg-gray-600" />
          <PhoneField label="ราคาต่อหน่วย" required placeholder="0.00" suffix="บาท/กก." />
          <PhoneField label="ยอดเงินรวม" required value="0.00" suffix="บาท" tone="bg-amber-50 font-bold dark:bg-amber-900/20" />
        </div>
      </div>

      <div className="flex shrink-0 gap-[2cqw] border-t border-gray-200 bg-gray-50 px-[3cqw] py-[2cqw] dark:border-gray-700 dark:bg-gray-900">
        <p className="flex h-[13.5cqw] flex-1 items-center justify-center rounded-[3cqw] bg-gray-100 text-[4cqw] font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300">รีเซ็ต</p>
        <p className="flex h-[13.5cqw] flex-1 items-center justify-center gap-[1.2cqw] rounded-[3cqw] bg-gradient-to-r from-blue-600 to-indigo-600 text-[4cqw] font-medium text-white dark:from-blue-500 dark:to-indigo-500">
          <svg className="h-[4cqw] w-[4cqw]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5m2.5-5l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
          </svg>
          เพิ่มลงตะกร้า
        </p>
      </div>
      <div className="flex h-[14.5cqw] shrink-0 items-center gap-[2cqw] bg-green-600 px-[3cqw] text-white">
        <span className="flex h-[8cqw] min-w-[8cqw] items-center justify-center rounded-full bg-white/20 text-[3.8cqw] font-bold">0</span>
        <span className="min-w-0 flex-1 text-[4.3cqw] font-semibold">ตะกร้าว่าง</span>
        <span className="text-[4.3cqw] font-bold">฿0.00</span>
      </div>
    </div>
  );
}

const PREVIEW_NAV = [
  ['📊', 'แดชบอร์ด'],
  ['📦', 'สต็อกสินค้า'],
  ['🛒', 'รับซื้อยาง'],
  ['🚚', 'ขายสินค้า'],
  ['📋', 'ประวัติ'],
  ['👥', 'สมาชิก'],
  ['🏢', 'บริษัท'],
  ['💰', 'ค่าใช้จ่าย'],
  ['📈', 'รายงาน'],
] as const;

function ThemeGlyph({ className }: { className: string }) {
  return (
    <>
      <svg className={`${className} dark:hidden`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg className={`hidden ${className} dark:block`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </>
  );
}

function AppWordmark({ className }: { className: string }) {
  return (
    <p className={`min-w-0 truncate text-center font-bold ${className}`}>
      <span className="text-fuchsia-500">Y</span>
      <span className="text-violet-500">a</span>
      <span className="text-sky-500 dark:text-sky-400">n</span>
      <span className="text-emerald-500">g</span>
      <span className="text-gray-900 dark:text-white"> Dee</span>
    </p>
  );
}

function PreviewField({
  label,
  required = false,
  value,
  placeholder,
  suffix,
  search = false,
  tone = 'bg-white dark:bg-gray-700',
  labelSize,
  boxSize,
  textSize,
}: {
  label: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  suffix?: string;
  search?: boolean;
  tone?: string;
  labelSize: string;
  boxSize: string;
  textSize: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`truncate font-semibold leading-none text-gray-700 dark:text-gray-300 ${labelSize}`}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </p>
      <div className={`flex items-center border border-gray-200 shadow-sm dark:border-gray-600 ${boxSize} ${textSize} ${tone}`}>
        {search && (
          <svg className="mr-[0.4em] h-[1em] w-[1em] shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        <span className={`min-w-0 flex-1 truncate ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        {suffix && <span className="shrink-0 pl-[0.4em] text-[0.85em] font-medium text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function TabletPurchaseScreen() {
  const field = {
    labelSize: 'mb-[0.5cqw] text-[2.7cqw]',
    boxSize: 'h-[8cqw] rounded-[1.6cqw] px-[1.6cqw]',
    textSize: 'text-[3.4cqw]',
  };
  return (
    <div className="flex h-full bg-gray-50 text-gray-900 [container-type:size] dark:bg-gray-900 dark:text-gray-100">
      <aside className="flex w-[11cqw] shrink-0 flex-col items-center gap-[1cqw] border-r border-gray-200 bg-white py-[2cqw] dark:border-gray-700 dark:bg-gray-800">
        <span className="mb-[0.6cqw] flex h-[6cqw] w-[6cqw] items-center justify-center rounded-[1.4cqw] bg-blue-600 text-[2.6cqw] font-bold text-white">Y</span>
        {PREVIEW_NAV.map(([icon], index) => (
          <span
            key={icon}
            className={`flex h-[6.4cqw] w-[6.4cqw] items-center justify-center rounded-[1.2cqw] text-[3.2cqw] ${
              index === 2 ? 'bg-blue-100 dark:bg-blue-900/40' : ''
            }`}
          >
            {icon}
          </span>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[8cqw] shrink-0 items-center gap-[1.5cqw] border-b border-gray-200 bg-white px-[2cqw] dark:border-gray-700 dark:bg-gray-800">
          <svg className="h-[3.6cqw] w-[3.6cqw] shrink-0 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <AppWordmark className="flex-1 text-[3.2cqw]" />
          <ThemeGlyph className="h-[3.4cqw] w-[3.4cqw] shrink-0 text-gray-500 dark:text-gray-300" />
        </header>
        <div className="grid shrink-0 grid-cols-2 gap-[1cqw] border-b border-gray-200 bg-white p-[1.4cqw] dark:border-gray-700 dark:bg-gray-900">
          <p className="flex h-[7.2cqw] items-center justify-center rounded-[1.6cqw] bg-blue-600 text-[3cqw] font-semibold text-white">รับซื้อ</p>
          <p className="flex h-[7.2cqw] items-center justify-center text-[3cqw] font-semibold text-gray-500 dark:text-gray-400">ค่าบริการ</p>
        </div>
        <div className="min-h-0 flex-1 space-y-[1.4cqw] overflow-hidden px-[2cqw] py-[1.6cqw]">
          <PreviewField label="วันที่รับซื้อ" required value="27/10/2026" {...field} />
          <PreviewField label="สมาชิก" required search placeholder="ค้นหาสมาชิกตามชื่อหรือรหัส" {...field} />
          <div className="grid grid-cols-2 gap-[1.4cqw]">
            <PreviewField label="ประเภทสินค้า" required search placeholder="ค้นหาตามชื่อหรือรหัส..." {...field} />
            <PreviewField label="น้ำหนักรวมภาชนะ" required value="0.00" suffix="กก." {...field} />
            <PreviewField label="น้ำหนักภาชนะ" value="0.00" suffix="กก." {...field} />
            <PreviewField label="น้ำหนักสุทธิ" required value="0.00" suffix="กก." tone="bg-gray-50 font-semibold dark:bg-gray-600" {...field} />
            <PreviewField label="ราคาต่อหน่วย" required placeholder="0.00" suffix="บาท/กก." {...field} />
            <PreviewField label="ยอดเงินรวม" required value="0.00" suffix="บาท" tone="bg-amber-50 font-bold dark:bg-amber-900/20" {...field} />
          </div>
        </div>
        <div className="flex shrink-0 gap-[1.4cqw] border-t border-gray-200 bg-gray-50 px-[2cqw] py-[1.2cqw] dark:border-gray-700 dark:bg-gray-900">
          <p className="flex h-[7.4cqw] flex-1 items-center justify-center rounded-[1.6cqw] bg-gray-100 text-[2.8cqw] font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300">รีเซ็ต</p>
          <p className="flex h-[7.4cqw] flex-1 items-center justify-center rounded-[1.6cqw] bg-gradient-to-r from-blue-600 to-indigo-600 text-[2.8cqw] font-medium text-white dark:from-blue-500 dark:to-indigo-500">เพิ่มลงตะกร้า</p>
        </div>
        <div className="flex h-[8cqw] shrink-0 items-center gap-[1.4cqw] bg-green-600 px-[2cqw] text-white">
          <span className="flex h-[4.6cqw] min-w-[4.6cqw] items-center justify-center rounded-full bg-white/20 text-[2.4cqw] font-bold">0</span>
          <span className="min-w-0 flex-1 text-[2.8cqw] font-semibold">ตะกร้าว่าง</span>
          <span className="text-[2.8cqw] font-bold">฿0.00</span>
        </div>
      </div>
    </div>
  );
}

function DesktopPurchaseScreen() {
  const field = {
    labelSize: 'mb-[0.3cqw] text-[1.7cqw]',
    boxSize: 'h-[4.4cqw] rounded-[0.7cqw] px-[0.8cqw]',
    textSize: 'text-[2cqw]',
  };
  const cartHeads = ['ประเภท', 'รายละเอียด', 'น้ำหนักรวมภาชนะ (กก.)', 'น้ำหนักภาชนะ (กก.)', 'น้ำหนักสุทธิ (กก.)', 'ราคา/กก.', 'จำนวนเงิน'];
  return (
    <div className="flex h-full bg-gray-50 text-gray-900 [container-type:size] dark:bg-gray-900 dark:text-gray-100">
      <aside className="flex w-[9cqw] shrink-0 flex-col items-center border-r border-gray-200 bg-white py-[1.4cqw] dark:border-gray-700 dark:bg-gray-800">
        <span className="mb-[1.2cqw] flex h-[4.6cqw] w-[4.6cqw] items-center justify-center rounded-[0.9cqw] bg-blue-600 text-[2cqw] font-bold text-white">Y</span>
        <div className="flex w-full flex-1 flex-col items-center gap-[0.7cqw]">
          {PREVIEW_NAV.map(([icon], index) => (
            <span
              key={icon}
              className={`relative flex h-[4.8cqw] w-[4.8cqw] items-center justify-center rounded-[0.8cqw] text-[2.5cqw] ${
                index === 2
                  ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/20 dark:text-blue-300'
                  : ''
              }`}
            >
              {icon}
              {index === 2 && <span className="absolute -right-[2cqw] h-[3.2cqw] w-[0.35cqw] rounded-l-full bg-blue-500" />}
            </span>
          ))}
        </div>
        <span className="mt-[1cqw] flex h-[4.2cqw] w-[4.2cqw] items-center justify-center rounded-[0.8cqw] bg-gradient-to-br from-blue-500 to-indigo-600 text-[1.8cqw] font-semibold text-white">a</span>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[6.2cqw] shrink-0 items-center gap-[1cqw] border-b border-gray-200/80 bg-white px-[1.4cqw] dark:border-gray-700 dark:bg-gray-800">
          <svg className="h-[2.4cqw] w-[2.4cqw] shrink-0 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <p className="min-w-0 flex-1 truncate text-center text-[2.3cqw] font-bold">
            <span className="text-fuchsia-500">Y</span>
            <span className="text-violet-500">a</span>
            <span className="text-violet-500 dark:text-sky-400">n</span>
            <span className="text-emerald-500">g</span>
            <span className="text-gray-900 dark:text-white"> Dee</span>
          </p>
          <ThemeGlyph className="h-[2.3cqw] w-[2.3cqw] shrink-0 text-gray-500 dark:text-gray-300" />
          <span className="shrink-0 rounded-full bg-gray-100 px-[1cqw] py-[0.3cqw] text-[1.45cqw] text-gray-600 dark:bg-gray-700 dark:text-gray-300">วันอังคาร 27 ต.ค. 2569</span>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-[1.2cqw] p-[1.2cqw]">
          <div className="col-span-2 flex min-h-0 flex-col overflow-hidden rounded-[1.4cqw] border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex shrink-0 items-center gap-[0.8cqw] border-b border-gray-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-[1.2cqw] py-[0.9cqw] dark:border-gray-600 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
              <span className="flex h-[2.8cqw] w-[2.8cqw] items-center justify-center rounded-[0.5cqw] bg-gradient-to-br from-blue-500 to-indigo-600 text-[1.4cqw] text-white">▤</span>
              <p className="bg-gradient-to-r from-sky-600 via-purple-600 to-blue-600 bg-clip-text text-[2cqw] font-bold text-transparent dark:from-sky-400 dark:via-purple-400 dark:to-blue-400">บันทึกการรับซื้อ</p>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-x-[1cqw] gap-y-[0.7cqw] overflow-hidden p-[1cqw]">
              <PreviewField label="วันที่รับซื้อ" required value="27/10/2026" {...field} />
              <PreviewField label="สมาชิก" required search placeholder="ค้นหาสมาชิกตามชื่อหรือรหัส" {...field} />
              <PreviewField label="ประเภทสินค้า" required search placeholder="ค้นหาตามชื่อหรือรหัส..." {...field} />
              <PreviewField label="น้ำหนักรวมภาชนะ" required value="0.00" suffix="กก." {...field} />
              <PreviewField label="น้ำหนักภาชนะ" value="0.00" suffix="กก." {...field} />
              <PreviewField label="น้ำหนักสุทธิ" required value="0.00" suffix="กก." tone="bg-gray-50 font-semibold dark:bg-gray-600" {...field} />
              <PreviewField label="ราคาต่อหน่วย" required placeholder="0.00" suffix="บาท/กก." {...field} />
              <PreviewField label="ยอดเงินรวม" required value="0.00" suffix="บาท" tone="bg-amber-50 font-bold dark:bg-amber-900/20" {...field} />
            </div>
            <div className="flex shrink-0 justify-end gap-[0.8cqw] px-[1cqw] pb-[0.8cqw]">
              <p className="flex h-[3.6cqw] items-center rounded-[0.6cqw] bg-gray-100 px-[1.2cqw] text-[1.5cqw] font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-200">รีเซ็ต</p>
              <p className="flex h-[3.6cqw] items-center gap-[0.4cqw] rounded-[0.6cqw] bg-gradient-to-r from-blue-600 to-indigo-600 px-[1.2cqw] text-[1.5cqw] font-medium text-white dark:from-blue-500 dark:to-indigo-500">
                <svg className="h-[1.5cqw] w-[1.5cqw]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5m2.5-5l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
                เพิ่มลงตะกร้า
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-[0.6cqw] border-t border-gray-200 px-[1cqw] py-[0.7cqw] dark:border-gray-600">
              <span className="flex h-[2.2cqw] w-[2.2cqw] items-center justify-center rounded-[0.4cqw] bg-orange-100 text-[1.2cqw] text-orange-600 dark:bg-orange-900 dark:text-orange-300">▤</span>
              <p className="text-[1.6cqw] font-semibold text-gray-800 dark:text-gray-100">บันทึกค่าบริการ</p>
            </div>
          </div>
          <div className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-[1.8cqw] border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex shrink-0 items-center gap-[0.8cqw] border-b border-gray-100 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-[1.2cqw] py-[0.8cqw] dark:border-gray-600 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
              <span className="flex h-[2.8cqw] w-[2.8cqw] items-center justify-center rounded-[0.5cqw] bg-gradient-to-br from-green-500 to-emerald-600 text-[1.5cqw] text-white">🛒</span>
              <div className="min-w-0">
                <p className="text-[2cqw] font-bold leading-tight text-gray-900 dark:text-white">ตะกร้า</p>
                <p className="truncate text-[1.35cqw] text-gray-600 dark:text-gray-300">ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น</p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-7 gap-[0.3cqw] border-b border-gray-200 bg-gray-50 px-[0.8cqw] py-[0.6cqw] text-center text-[1.15cqw] font-semibold leading-tight text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {cartHeads.map((head) => (
                <p key={head}>{head}</p>
              ))}
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[0.6cqw] text-center text-gray-500 dark:text-gray-400">
              <span className="flex h-[5cqw] w-[5cqw] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg className="h-[2.6cqw] w-[2.6cqw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5m2.5-5l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
              </span>
              <p className="text-[1.7cqw] font-medium">ตะกร้าว่าง</p>
              <p className="text-[1.3cqw]">เพิ่มรายการรับซื้อหรือค่าบริการเพื่อเริ่มต้น</p>
            </div>
            <div className="shrink-0 border-t-2 border-gray-200 opacity-50 dark:border-gray-500">
              <div className="flex items-center justify-end gap-[1.4cqw] bg-gradient-to-r from-gray-50 to-gray-100 px-[1.2cqw] py-[0.5cqw] text-[1.5cqw] font-bold dark:from-gray-700 dark:to-gray-600">
                <span className="text-gray-900 dark:text-white">รวมทั้งหมด</span>
                <span className="text-green-600 dark:text-green-400">฿0.00</span>
              </div>
              <div className="flex justify-end gap-[0.7cqw] bg-white px-[1.2cqw] py-[0.6cqw] dark:bg-gray-800">
                <p className="flex h-[3.2cqw] items-center rounded-[0.6cqw] bg-gray-100 px-[1cqw] text-[1.35cqw] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">รีเซ็ตตะกร้า</p>
                <p className="flex h-[3.2cqw] items-center rounded-[0.6cqw] bg-gradient-to-r from-green-600 to-emerald-600 px-[1.2cqw] text-[1.35cqw] font-medium text-white">บันทึกข้อมูล</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotFigure({ shot }: { shot: (typeof SHOTS)[number] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isDarkMode } = useDarkMode();
  const src = isDarkMode ? shot.darkSrc : shot.src;
  const alt = isDarkMode ? `${shot.alt} ในโหมดมืด` : shot.alt;

  return (
    <figure>
      <button
        type="button"
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[#e3dfd4] bg-[#eceae4] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 enabled:active:scale-[0.96] dark:border-[#2c3128] dark:bg-[#10120e]"
        aria-haspopup="dialog"
        aria-label={`ขยายภาพ: ${shot.caption}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={800}
          className="h-auto w-full object-contain"
        />
      </button>
      <figcaption className="mt-3">
        <span className="block text-base font-semibold">{shot.caption}</span>
        <span className="text-sm text-[#5c584f] dark:text-[#b7b3a8]">{shot.detail}</span>
      </figcaption>
      <dialog
        ref={dialogRef}
        aria-label={alt}
        className="m-auto w-[min(80rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-auto overscroll-contain rounded-[20px] border border-[#e3dfd4] bg-white p-3 text-[#1c1b16] shadow-xl backdrop:bg-black/60 dark:border-[#2c3128] dark:bg-[#1a1d18] dark:text-white"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          dialogRef.current?.close();
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold leading-6">{shot.caption}</p>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-[#3f3c36] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out hover:bg-[#eceae4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 enabled:active:scale-[0.96] dark:text-[#e7e3d8] dark:hover:bg-[#2c3128]"
            onClick={() => dialogRef.current?.close()}
          >
            ปิด
          </button>
        </div>
        <img
          src={src}
          alt=""
          className="mx-auto max-h-[calc(100dvh-6.5rem)] w-auto max-w-full rounded-lg object-contain shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.1)]"
        />
      </dialog>
    </figure>
  );
}

function ScreenStage({ device }: { device: DeviceId }) {
  const aspect = device === 'computer' ? 'aspect-[5/4]' : device === 'tablet' ? 'aspect-[3/4]' : 'aspect-[375/667]';
  return (
    <div className={`relative overflow-hidden bg-black ${aspect}`}>
      {device === 'phone' ? <MobilePurchaseScreen /> : device === 'tablet' ? <TabletPurchaseScreen /> : <DesktopPurchaseScreen />}
    </div>
  );
}

function DesktopMonitor({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <div className="rounded-[1.15rem] bg-[#111111] p-[0.55rem] pb-[1.15rem] shadow-[0_18px_40px_rgba(28,27,22,0.18)] ring-1 ring-black/30 dark:bg-[#ffffff] dark:shadow-none dark:ring-black/10">
        <div className="overflow-hidden rounded-[0.45rem] ring-1 ring-white/15 dark:ring-black/15">{children}</div>
        <div className="mt-[0.45rem] flex justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a4a4a] dark:bg-[#c8c8c8]" />
        </div>
      </div>
      <div className="mx-auto h-5 w-[4.5rem] bg-gradient-to-b from-[#2a2a2a] to-[#111111] dark:from-[#ffffff] dark:to-[#e6e6e6]" />
      <div className="mx-auto h-[0.45rem] w-36 rounded-b-xl bg-[#111111] shadow-[0_8px_16px_rgba(28,27,22,0.12)] dark:bg-[#ffffff] dark:shadow-none" />
    </div>
  );
}

function IpadFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] rounded-[1.7rem] bg-gradient-to-b from-[#2a2a2a] to-[#111111] p-[0.9rem] pt-[1.65rem] shadow-[0_16px_36px_rgba(28,27,22,0.2)] ring-1 ring-black/40 dark:from-[#ffffff] dark:to-[#e8e8e8] dark:shadow-none dark:ring-black/10">
      <span className="absolute left-1/2 top-[0.45rem] h-2 w-2 -translate-x-1/2 rounded-full bg-[#0a0a0a] ring-2 ring-[#5a5a5a] dark:bg-[#1c1c1e] dark:ring-[#bdbdbd]" />
      <div className="overflow-hidden rounded-[0.7rem] ring-1 ring-white/15 dark:ring-black/15">{children}</div>
    </div>
  );
}

function IphoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[25.5rem] rounded-[2.4rem] bg-gradient-to-b from-[#2c2c2e] to-[#111111] px-[0.7rem] pb-[3.35rem] pt-[2.35rem] shadow-[0_16px_36px_rgba(28,27,22,0.22)] ring-1 ring-black/40 dark:from-[#ffffff] dark:to-[#e6e6e6] dark:shadow-none dark:ring-black/10">
      <span className="absolute left-[0.35rem] top-[22%] h-7 w-[3px] rounded-full bg-[#4a4a4e] dark:bg-[#c8c8c8]" />
      <span className="absolute left-[0.35rem] top-[32%] h-11 w-[3px] rounded-full bg-[#4a4a4e] dark:bg-[#c8c8c8]" />
      <span className="absolute right-[0.35rem] top-[26%] h-14 w-[3px] rounded-full bg-[#4a4a4e] dark:bg-[#c8c8c8]" />
      <span className="absolute left-1/2 top-[0.85rem] h-[0.3rem] w-12 -translate-x-1/2 rounded-full bg-white/70 dark:bg-[#1c1c1e]/70" />
      <span className="absolute left-[22%] top-[0.7rem] h-2.5 w-2.5 rounded-full bg-[#0a0a0a] ring-2 ring-[#6a6a6e] dark:ring-[#b5b5b5]" />
      <div className="overflow-hidden rounded-[0.35rem] ring-1 ring-white/15 dark:ring-black/15">{children}</div>
      <span className="absolute bottom-[0.7rem] left-1/2 h-11 w-11 -translate-x-1/2 rounded-full border-[3px] border-[#5a5a5e] bg-[#1c1c1e] dark:border-[#d0d0d0] dark:bg-[#ffffff]" />
    </div>
  );
}

function ProductFrame({ device }: { device: DeviceId }) {
  const screen = <ScreenStage device={device} />;
  return (
    <figure className={device === 'computer' ? 'w-full' : 'mx-auto w-full'}>
      {device === 'computer' ? <DesktopMonitor>{screen}</DesktopMonitor> : device === 'tablet' ? <IpadFrame>{screen}</IpadFrame> : <IphoneFrame>{screen}</IphoneFrame>}
    </figure>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [device, setDevice] = useState<DeviceId>('computer');
  const [devicePaused, setDevicePaused] = useState(false);
  const [deviceInView, setDeviceInView] = useState(true);
  const headerRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setDeviceInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (devicePaused || !deviceInView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      setDevice((current) => {
        const index = DEVICES.findIndex((item) => item.id === current);
        return DEVICES[(index + 1) % DEVICES.length].id;
      });
    }, DEVICE_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [device, devicePaused, deviceInView]);

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
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] lg:items-center lg:gap-12 lg:pb-24 lg:pt-16">
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

          <div
            ref={previewRef}
            className="mx-auto mt-10 w-full max-w-[640px] lg:mt-0 lg:max-w-none"
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') setDevicePaused(true);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setDevicePaused(false);
            }}
            onFocusCapture={() => {
              if (window.matchMedia('(hover: hover)').matches) setDevicePaused(true);
            }}
            onBlurCapture={(event) => {
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.contains(next)) return;
              setDevicePaused(false);
            }}
          >
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
                    className={`relative min-h-11 overflow-hidden rounded-full px-4 text-sm font-medium ${
                      selected
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-[#1c1b16] ring-1 ring-[#e3dfd4] hover:bg-[#f7f5f0] dark:bg-[#1a1d18] dark:text-[#eceae4] dark:ring-[#2c3128]'
                    }`}
                  >
                    {item.label}
                    {selected && !devicePaused ? (
                      <span
                        key={item.id}
                        className="landing-device-progress absolute inset-x-3 bottom-1.5 h-0.5 origin-left rounded-full bg-white/80"
                        style={{ animation: `landing-device-progress ${DEVICE_ROTATE_MS}ms linear` }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="[container-type:inline-size]">
              <div style={{ minHeight: 'calc((min(100cqw, 25.5rem) - 1.4rem) * 667 / 375 + 7.7rem)' }}>
                <ProductFrame device={device} />
                <p className="mt-2 text-center text-sm leading-6 text-[#6f6b62] lg:text-left dark:text-[#a8a496]">
                  โปรแกรมเดียวกัน เปิดในเบราว์เซอร์ของเครื่องนั้น
                </p>
              </div>
            </div>
            <style>{'@keyframes landing-device-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}@media (prefers-reduced-motion:reduce){.landing-device-progress{display:none}}'}</style>
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
              <div className="mx-auto w-full max-w-sm rounded-[20px] border border-[#e3dfd4] bg-[#ffffff] p-3 dark:border-[#2c3128] dark:bg-[#1a1d18]">
                <article className="rounded-xl bg-[#ffffff] px-6 py-8 text-[#1c1b16] dark:bg-[#f7f5f0]">
                  <h3 className="text-center text-2xl font-semibold">ร้านฉัน</h3>
                  <dl className="mt-6 space-y-1 text-sm leading-6">
                    <div className="flex gap-2">
                      <dt>เลขที่:</dt>
                      <dd>PUR-202512-6865</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt>สมาชิก:</dt>
                      <dd>เจมส์</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt>รหัสสมาชิก:</dt>
                      <dd>M002</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt>วันที่พิมพ์:</dt>
                      <dd>30 ธ.ค. 2568 22:23</dd>
                    </div>
                  </dl>
                  <div className="my-4 border-t border-dashed border-[#c9c3b4]" />
                  <div className="flex items-start justify-between gap-4 text-sm leading-6">
                    <p>
                      ยางแผ่น
                      <span className="mt-1 block text-[#5c584f]">น้ำหนักสุทธิ: 59.62 กก.</span>
                    </p>
                    <p className="text-right font-semibold">
                      ฿1,992.23
                      <span className="mt-1 block text-sm font-normal text-[#5c584f]">@ 33.41 /กก.</span>
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span>ค่าธรรมเนียม</span>
                    <span>-฿53.41</span>
                  </div>
                  <div className="mt-4 flex justify-between border-t-2 border-[#1c1b16] pt-3 text-base font-semibold">
                    <span>ยอดสุทธิ</span>
                    <span>฿1,938.82</span>
                  </div>
                  <div className="mt-10 grid grid-cols-2 gap-6 text-center text-sm">
                    <p className="border-t border-dashed border-[#c9c3b4] pt-2">ผู้จัดทำ</p>
                    <p className="border-t border-dashed border-[#c9c3b4] pt-2">ผู้รับเงิน</p>
                  </div>
                  <p className="mt-8 text-center text-xs leading-5 text-[#6f6b62]">
                    กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ
                  </p>
                </article>
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
                <ShotFigure key={shot.src} shot={shot} />
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

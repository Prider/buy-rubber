'use client';

import Link from 'next/link';
import Image from 'next/image';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useState, useMemo, memo } from 'react';

// Move features array outside component to prevent recreation on every render
const features = [
    {
      title: 'การจัดการราคาและประเภทสินค้า',
      items: [
        'บันทึกราคาประกาศน้ำยางประจำวัน',
        'จัดการประเภทสินค้ายาง (น้ำยางสด, ยางแห้ง, เศษยาง) เพิ่มประเภทสินค้าได้ไม่จำกัด',
        'กำหนดเงื่อนไขการให้ราคาเพิ่ม/ลดตาม %ยาง',
        'ให้ราคาบวกเพิ่มพิเศษได้',
        'ดูประวัติราคาย้อนหลัง',
      ],
    },
    {
      title: 'การรับซื้อน้ำยาง',
      items: [
        'บันทึกการซื้อน้ำยางสด ยางแห้ง เศษยาง',
        'คำนวณน้ำหนักแห้งจาก %ยางอัตโนมัติ',
        'รองรับการซื้อแบบ Transaction (หลายรายการในครั้งเดียว)',
        'คำนวณน้ำหนักสุทธิ (หักภาชนะ)',
        'เพิ่มค่าบริการ (Service Fees) ในรายการรับซื้อ',
        'ดูรายการรับซื้อทั้งหมด',
        'พิมพ์สลิปการรับซื้อได้ทันที',
      ],
    },
    {
      title: 'การจัดการสมาชิก',
      items: [
        'เพิ่มข้อมูลเจ้าของสวนและคนตัด',
        'แบ่ง % เจ้าของสวนและคนตัดอัตโนมัติ',
        'ติดตามประวัติการรับซื้อของแต่ละสมาชิก',
        'จัดการค่าบริการสมาชิก (Service Fees)',
        'เบิกเงินล่วงหน้าและติดตามยอดค้างชำระ',
      ],
    },
    {
      title: 'ระบบการเงิน',
      items: [
        'เบิกเงินล่วงหน้าของสมาชิก',
        'จ่ายชำระหนี้พร้อมหักหนี้อัตโนมัติ',
        'บันทึกค่าใช้จ่ายประจำวัน (Expenses)',
        'จัดการค่าบริการ (Service Fees)',
        'ดูสรุปยอดการเงิน',
      ],
    },
    {
      title: 'รายงานและวิเคราะห์',
      items: [
        'รายงานรับซื้อประจำวัน',
        'รายงานการจ่ายชำระหนี้',
        'รายงานหนี้ค้างชำระ',
        'วิเคราะห์ยอดรับซื้อรายสมาชิก',
        'รายงานกำไร-ขาดทุน',
        'Dashboard แสดงสถิติแบบ Real-time',
      ],
    },
    {
      title: 'การจัดการระบบ',
      items: [
        'สำรองข้อมูล (Backup) - เฉพาะ Electron และ Admin',
        'ตั้งค่าระบบ - เฉพาะ Electron และ Admin',
        'จัดการผู้ใช้งาน (User Management)',
        'กำหนดสิทธิ์การใช้งานผู้ใช้ (Admin, User, Viewer)',
        'Dark Mode Support',
      ],
    },
];

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Read dark mode directly from DOM without subscribing to context
  // This state is only for the gallery toggle, not for page theme
  // Don't sync automatically - let user control via toggle buttons
  const [showDarkMode, setShowDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // Memoize Features Section JSX with empty deps - created once, never changes
  // This prevents rerenders even when parent component rerenders during scroll
  const featuresSectionJSX = useMemo(() => (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          คุณสมบัติหลัก
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-300 mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2"
          >
            <div className="relative">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <ul className="space-y-3">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start text-sm text-gray-600 dark:text-gray-300 group/item">
                    <span className="text-green-500 mr-3 mt-1 flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-xs font-bold group-hover/item:scale-110 transition-transform duration-300">✓</span>
                    <span className="group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-green-400/30 dark:border-green-500/30 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        ))}
      </div>
    </section>
  ), []); // Empty deps - only create once, never recreate

  // Memoize Swiper modules and configs to prevent recreation
  const swiperModules = useMemo(() => [Navigation, Pagination, Autoplay], []);
  const swiperPagination = useMemo(() => ({ clickable: true }), []);
  const swiperAutoplayFast = useMemo(() => ({
    delay: 3000,
    disableOnInteraction: false,
  }), []);
  const swiperAutoplaySlow = useMemo(() => ({
    delay: 4000,
    disableOnInteraction: false,
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-900 dark:via-gray-900 dark:to-green-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 overflow-hidden">
                <div className="flex items-end justify-center gap-1.5 h-10">
                  <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '40%' }} />
                  <span className="w-2.5 bg-green-600 dark:bg-green-700 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.15s] shadow-[0_0_14px_rgba(22,163,74,0.75)] dark:shadow-[0_0_14px_rgba(22,163,74,0.4)]" style={{ height: '70%' }} />
                  <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.8s_ease-in-out_infinite_0.3s] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '55%' }} />
                  <span className="w-2.5 bg-green-600 dark:bg-green-700 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.45s] shadow-[0_0_14px_rgba(22,163,74,0.75)] dark:shadow-[0_0_14px_rgba(22,163,74,0.4)]" style={{ height: '80%' }} />
                  <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite_0.6s] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '50%' }} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Punsook Innotech</h1>
              </div>
            </div>
            
            {/* Navigation Menu - Desktop */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                คุณสมบัติ
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                ประโยชน์
              </a>
              <a 
                href="#gallery" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                ภาพรวมระบบ
              </a>
              <a 
                href="#platforms" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                แพลตฟอร์ม
              </a>
              <a 
                href="#reviews" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                รีวิว
              </a>
              <a 
                href="#faq" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                FAQ
              </a>
              <a 
                href="#contact" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                ติดต่อเรา
              </a>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <DarkModeToggle />
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <Link
                href="/login"
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 text-white rounded-lg hover:from-green-700 hover:to-green-600 dark:hover:from-green-600 dark:hover:to-green-500 transition-all duration-200 font-medium text-xs md:text-sm shadow-md hover:shadow-lg"
              >
                ทดลองใช้ฟรี
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 py-4">
              <nav className="flex flex-col space-y-2">
                <a 
                  href="#features" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  คุณสมบัติ
                </a>
                <a 
                  href="#benefits" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  ประโยชน์
                </a>
                <a 
                  href="#gallery" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  ภาพรวมระบบ
                </a>
                <a 
                  href="#platforms" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  แพลตฟอร์ม
                </a>
                <a 
                  href="#reviews" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  รีวิว
                </a>
                <a 
                  href="#faq" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  FAQ
                </a>
                <a 
                  href="#contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
                >
                  ติดต่อเรา
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <div className="block">ระบบบริหารจัดการ</div>
              <div className="pt-4 bg-gradient-to-r from-green-600 via-green-500 to-green-600 dark:from-green-400 dark:via-green-300 dark:to-green-400 bg-clip-text text-transparent">
                รับซื้อยางพารา
              </div>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Rubber Purchasing Management System ที่ทันสมัยและมีประสิทธิภาพ
            </p>
            
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 text-white rounded-xl hover:from-green-700 hover:to-green-600 dark:hover:from-green-600 dark:hover:to-green-500 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                เริ่มใช้งาน
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                เวอร์ชัน 1.4.5
              </p>
            </div>
          </div>

          {/* Right Side - Images Swiper */}
          <div className="w-full">
            <Swiper
              modules={swiperModules}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={swiperPagination}
              autoplay={swiperAutoplayFast}
              loop
              className="h-[300px] md:h-[350px] rounded-2xl"
            >
              <SwiperSlide>
                <div className="group relative h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="/นำยาง.png"
                    alt="น้ำยาง"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                    <p className="text-white font-semibold text-lg md:text-xl drop-shadow-lg">น้ำยาง</p>
                  </div>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="group relative h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="/ยางก้อนถ้วยที่เตรียมขาย.png"
                    alt="ยางก้อนถ้วยที่เตรียมขาย"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                    <p className="text-white font-semibold text-lg md:text-xl drop-shadow-lg">ยางก้อนถ้วย</p>
                  </div>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="group relative h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="/ยางแผ่น.jpg"
                    alt="ยางแผ่น"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                    <p className="text-white font-semibold text-lg md:text-xl drop-shadow-lg">ยางแผ่น</p>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section id="stats" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              500+
            </div>
            <div className="text-lg text-gray-700 dark:text-gray-300 font-medium">
              ผู้ใช้งาน
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              10K+
            </div>
            <div className="text-lg text-gray-700 dark:text-gray-300 font-medium">
              รายการรับซื้อ
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              98%
            </div>
            <div className="text-lg text-gray-700 dark:text-gray-300 font-medium">
              ความพึงพอใจ
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Memoized to prevent rerenders on scroll */}
      {featuresSectionJSX}
      
      {/* Gallery Section with Toggle */}
      <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ภาพรวมระบบ
          </h2>
          {/* Toggle Button */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setShowDarkMode(false)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                !showDarkMode
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              White Mode
            </button>
            <button
              onClick={() => setShowDarkMode(true)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                showDarkMode
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Dark Mode
            </button>
          </div>
        </div>

        {/* White Mode Swiper */}
        {!showDarkMode && (
          <Swiper
            key="white-mode"
            modules={swiperModules}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={swiperPagination}
            autoplay={swiperAutoplaySlow}
            loop
            className="pb-12"
          >
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing_white/white_purchase.png"
                  alt="Dashboard"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">Dashboard</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing_white/white_purchase_list.png"
                  alt="รายการรับซื้อ"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">รายการรับซื้อ</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing_white/white_expense.png"
                  alt="ระบบการเงิน"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">ระบบการเงิน</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing_white/member_history.png"
                  alt="ประวัติสมาชิก"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">ประวัติสมาชิก</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing_white/white_edit.png"
                  alt="แก้ไขข้อมูล"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">แก้ไขข้อมูล</p>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        )}

        {/* Dark Mode Swiper */}
        {showDarkMode && (
          <Swiper
            key="dark-mode"
            modules={swiperModules}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={swiperPagination}
            autoplay={swiperAutoplaySlow}
            loop
            className="pb-12"
          >
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/dashboard.png"
                  alt="Dashboard"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">Dashboard</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/purchase.png"
                  alt="การรับซื้อน้ำยาง"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">การรับซื้อน้ำยาง</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/member.png"
                  alt="การจัดการสมาชิก"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">การจัดการสมาชิก</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/expense.png"
                  alt="ระบบการเงิน"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">ระบบการเงิน</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/report.png"
                  alt="รายงานและวิเคราะห์"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">รายงานและวิเคราะห์</p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image
                  src="/landing/backup.png"
                  alt="การจัดการระบบ"
                  width={1920}
                  height={1080}
                  className="object-contain w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-semibold text-xl">การจัดการระบบ</p>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        )}
      </section>

      {/* Slip Example Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="w-full flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 flex items-center justify-center p-4 md:p-6">
              <Image
                src="/slip.png"
                alt="ตัวอย่างสลิปการรับซื้อ"
                width={400}
                height={533}
                className="object-contain w-full h-auto rounded-lg"
                unoptimized
              />
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              ตัวอย่างสลิปการรับซื้อ
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
              ระบบสามารถพิมพ์สลิปการรับซื้อได้ทันที พร้อมข้อมูลครบถ้วนและเป็นระเบียบ
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✓</span>
                <span>พิมพ์สลิปได้ทันทีหลังการรับซื้อ</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✓</span>
                <span>ข้อมูลครบถ้วน ระบุรายละเอียดการรับซื้อ</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✓</span>
                <span>รูปแบบสลิปสวยงาม เป็นระเบียบ</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Expense Image Section */}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          ระบบการเงิน
        </h2>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Image
            src="/landing/expense.png"
            alt="ระบบการเงิน"
            width={1920}
            height={1080}
            className="object-contain w-full h-auto"
            priority
          />
        </div>
      </section> */}


      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ประโยชน์
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-green-600 via-green-500 to-green-600 dark:from-green-400 dark:via-green-300 dark:to-green-400 bg-clip-text text-transparent mb-2">
            ทำไมต้องเลือก Punsook Innotech?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            ระบบที่ออกแบบมาเพื่อธุรกิจรับซื้อยางพาราโดยเฉพาะ
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              ประหยัดเวลาในการทำงาน
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              ลดเวลาในการบันทึกข้อมูลและคำนวณลงได้มากกว่า 70% ด้วยระบบอัตโนมัติ
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              ลดข้อผิดพลาดในการคำนวณ
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              ระบบคำนวณอัตโนมัติช่วยลดความผิดพลาดจากการคำนวณด้วยมือ
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              ติดตามข้อมูลแบบเรียลไทม์
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              รู้สถานะธุรกิจทันที ไม่ว่าจะเป็นยอดรับซื้อ การเงิน หรือหนี้ค้างชำระ
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              รายงานที่ครบถ้วนและแม่นยำ
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              สร้างรายงานต่างๆ ได้อย่างรวดเร็ว ช่วยในการวิเคราะห์และวางแผนธุรกิจ
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              จัดการทีมได้อย่างมีประสิทธิภาพ
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              กำหนดสิทธิ์ผู้ใช้งานได้ ควบคุมการเข้าถึงข้อมูลสำคัญ
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              ปลอดภัยและเชื่อถือได้
            </h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              ข้อมูลของคุณปลอดภัยด้วยระบบสำรองข้อมูลอัตโนมัติ
            </p>
          </div>
        </div>
      </section>


      {/* Platforms Section */}
      <section id="platforms" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-green-50 to-white dark:from-green-900/30 dark:to-gray-800/30 rounded-2xl p-8 md:p-12 border border-green-200/50 dark:border-green-800/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              รองรับหลายแพลตฟอร์ม
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 max-w-2xl mx-auto">
              โปรเจกต์นี้รองรับการทำงานเป็น
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Desktop Application */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Desktop Application
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Windows และ macOS
              </p>
            </div>

            {/* Web Browser */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Web Browser
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ใช้งานผ่านเบราว์เซอร์
              </p>
            </div>

            {/* POS Terminal Android */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center overflow-hidden relative">
                <Image 
                  src="/POS.png" 
                  alt="POS Terminal" 
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                POS Terminal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Android
              </p>
            </div>

            {/* Mobile App - Coming Soon */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200 text-center relative opacity-75">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming Soon
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Mobile App
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                iOS & Android
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Modes Section */}
      <section id="deployment" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            โหมดการใช้งาน
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            เลือกโหมดการใช้งานที่เหมาะสมกับธุรกิจของคุณ
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standalone Mode */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                ใช้งานแบบเครื่องเดียว
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong className="text-gray-900 dark:text-white">Standalone Mode</strong>
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>ฐานข้อมูลเก็บอยู่ในเครื่องของท่าน โดยไม่จำเป็นต้องเชื่อมต่ออินเทอร์เน็ต</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>เหมาะกับกิจการรับซื้อน้ำยางพาราส่วนตัวขนาดเล็ก</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>สามารถเพิ่มการใช้งานร่วมกันหลายเครื่องแบบเครือข่าย LAN ได้ตามต้องการ</span>
              </li>
            </ul>
          </div>

          {/* LAN Network Mode */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-green-200/50 dark:border-green-800/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                ใช้ร่วมกันหลายเครื่องในเครือข่าย
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong className="text-gray-900 dark:text-white">LAN Network Mode</strong>
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>ฐานข้อมูลเก็บอยู่ในเครื่องที่กำหนดเป็นเครื่อง Server (ควรเป็นเครื่องที่มีประสิทธิภาพสูงสุด)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>ไม่จำเป็นต้องเชื่อมต่ออินเทอร์เน็ตก็สามารถใช้งานได้</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>เหมาะกับกิจการรับซื้อน้ำยางที่ต้องการใช้งานมากกว่า 1 เครื่อง</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>เมื่อบันทึกข้อมูลที่เครื่องใดก็ตาม ข้อมูลจะอัปเดตอัตโนมัติทุกเครื่องที่อยู่ในวง LAN ทันที</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            รีวิวจากลูกค้า
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            ความคิดเห็นจากผู้ใช้งานจริง
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400">
            เสียงจากเจ้าของธุรกิจรับซื้อน้ำยางที่เชื่อใจและใช้งาน Punsook Innotech
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;ใช้งานง่ายมาก ประหยัดเวลาในการบันทึกข้อมูลได้เยอะ ตอนนี้ไม่ต้องนั่งคำนวณด้วยมือเหมือนเมื่อก่อนแล้ว&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณสมชาย วงษ์ใหญ่</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">สงขลา</p>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;ระบบดีมาก รายงานครบถ้วน ดูยอดรับซื้อและหนี้ค้างชำระได้ง่าย ช่วยให้ธุรกิจเราเป็นระบบขึ้นเยอะ&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณวิไล พรหมศิลป์</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">ตรัง</p>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;คุ้มค่ามากครับ ราคาไม่แพง ฟีเจอร์ครบ ทีมงานดูแลดี ตอบคำถามเร็ว แนะนำเลยครับ&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณประเสริฐ แก้วมณี</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">สุราษฎร์ธานี</p>
            </div>
          </div>

          {/* Review 4 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;ตอนแรกกังวลว่าจะใช้งานไม่เป็น แต่พอได้ลองแล้วใช้ง่ายมาก อินเทอร์เฟซเข้าใจง่าย ลูกจ้างใช้ได้หมด&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณนิภา สุขสวัสดิ์</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">ชุมพร</p>
            </div>
          </div>

          {/* Review 5 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;ระบบเสถียร ไม่เคยมีปัญหา ข้อมูลปลอดภัย มีการสำรองข้อมูลอัตโนมัติ ใช้งานสบายใจครับ&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณอานนท์ ศรีสุข</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">กระบี่</p>
            </div>
          </div>

          {/* Review 6 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="flex text-green-500 text-xl">
                ★★★★★
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              &quot;ดีมากค่ะ จัดการค่าบริการและเบิกเงินล่วงหน้าได้ง่าย ติดตามหนี้สะดวก ธุรกิจเราเติบโตขึ้นเยอะเลย&quot;
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-semibold text-gray-900 dark:text-white">คุณสุดา ทองดี</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">นราธิวาส</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            คำถามที่พบบ่อย
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            มีคำถามอะไรไหม?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            คำตอบสำหรับคำถามที่พบบ่อยจากผู้ใช้งาน
          </p>
        </div>
        <div className="space-y-4">
          {/* FAQ 1 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ต้องติดตั้งโปรแกรมอะไรเพิ่มไหม?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              ไม่ต้องติดตั้งโปรแกรมเพิ่มเติม ระบบทำงานผ่านเว็บเบราว์เซอร์ หรือสามารถดาวน์โหลด Desktop Application สำหรับใช้งานแบบ Offline ได้
            </p>
          </div>

          {/* FAQ 2 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ข้อมูลจะปลอดภัยไหม?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              ปลอดภัยครับ เรามีระบบสำรองข้อมูลอัตโนมัติทุกวัน ข้อมูลเข้ารหัส SSL และมีการควบคุมการเข้าถึงด้วยระบบ User Permission
            </p>
          </div>

          {/* FAQ 3 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              สามารถทดลองใช้งานก่อนได้ไหม?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              ได้ครับ คุณสามารถทดลองใช้งานฟรีได้ทันทีด้วยแพ็คเกจเริ่มต้น ไม่ต้องใส่บัตรเครดิต ไม่มีข้อผูกมัด
            </p>
          </div>

          {/* FAQ 4 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              รองรับหลายสาขาหรือไม่?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              รองรับครับ แพ็คเกจมาตรฐานรองรับหลายสาขา และแพ็คเกจองค์กรรองรับหลายสาขาไม่จำกัด พร้อมระบบจัดการข้อมูลแยกตามสาขา
            </p>
          </div>

          {/* FAQ 5 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              มีการอบรมการใช้งานไหม?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              แพ็คเกจมาตรฐานและแพ็คเกจองค์กรมีคู่มือการใช้งานและวิดีโอสอนใช้งานออนไลน์ ส่วนแพ็คเกจองค์กรมีบริการฝึกอบรมการใช้งานแบบตัวต่อตัวเพิ่มเติม
            </p>
          </div>

          {/* FAQ 6 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              สามารถยกเลิกการใช้งานได้ไหม?
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              ได้ครับ คุณสามารถยกเลิกการใช้งานได้ตลอดเวลา ไม่มีค่าธรรมเนียมการยกเลิก ข้อมูลของคุณจะถูกเก็บไว้เป็นเวลา 30 วันหลังจากยกเลิก
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/30 dark:to-gray-800/80 rounded-3xl p-8 md:p-12 border border-green-200/50 dark:border-green-800/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <div className="inline-block bg-green-100 dark:bg-green-900/50 rounded-full px-6 py-2 mb-4">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">ลองใช้งานฟรี</span>
              <span className="text-xl font-semibold text-gray-700 dark:text-gray-300 ml-2 line-through">30 วัน</span>
              <span className="text-xl font-semibold text-gray-700 dark:text-gray-300 ml-2">90 วัน</span>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              ไม่ต้องใช้บัตรเครดิต ติดตั้งง่าย ใช้งานได้ทันที
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 text-white rounded-xl hover:from-green-700 hover:to-green-600 dark:hover:from-green-600 dark:hover:to-green-500 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ทดลองใช้ฟรี
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ไม่ต้องใช้บัตรเครดิต
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ยกเลิกได้ทุกเมื่อ
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-green-200/50 dark:border-green-800/50 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ติดต่อเรา</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>0926241010</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>support@punsookinnotech.co</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.057-1.266-.07-1.646-.07-4.85s.015-3.585.074-4.85c.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.057 1.65-.07 4.859-.07zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.44 1.44-1.44.793-.001 1.44.646 1.44 1.44z"/>
                    </svg>
                    <span>Line: pawatify</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ที่อยู่</h3>
                <div className="flex items-start text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>119/1, Punsook office, Moo 1 Bang Khu Wiang Subdistrict,<br />Bang Kruai District, Nonthaburi Province 11130</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 overflow-hidden">
                  <div className="flex items-end justify-center gap-1.5 h-10">
                    <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '40%' }} />
                    <span className="w-2.5 bg-green-600 dark:bg-green-700 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.15s] shadow-[0_0_14px_rgba(22,163,74,0.75)] dark:shadow-[0_0_14px_rgba(22,163,74,0.4)]" style={{ height: '70%' }} />
                    <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.8s_ease-in-out_infinite_0.3s] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '55%' }} />
                    <span className="w-2.5 bg-green-600 dark:bg-green-700 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.45s] shadow-[0_0_14px_rgba(22,163,74,0.75)] dark:shadow-[0_0_14px_rgba(22,163,74,0.4)]" style={{ height: '80%' }} />
                    <span className="w-2.5 bg-green-500 dark:bg-green-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite_0.6s] shadow-[0_0_14px_rgba(34,197,94,0.75)] dark:shadow-[0_0_14px_rgba(34,197,94,0.4)]" style={{ height: '50%' }} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Punsook Innotech</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                ระบบบริหารจัดการรับซื้อน้ำยางที่ทันสมัยและมีประสิทธิภาพ
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ออกแบบมาเพื่อธุรกิจของคุณโดยเฉพาะ
              </p>
            </div>

            {/* Menu */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">เมนู</h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    คุณสมบัติ
                  </a>
                </li>
                <li>
                  <a 
                    href="#benefits" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    ประโยชน์
                  </a>
                </li>
                <li>
                  <a 
                    href="#gallery" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    ภาพรวมระบบ
                  </a>
                </li>
                <li>
                  <a 
                    href="#platforms" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    แพลตฟอร์ม
                  </a>
                </li>
                <li>
                  <a 
                    href="#reviews" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    รีวิว
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    คำถามที่พบบ่อย
                  </a>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                  >
                    ติดต่อเรา
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ติดต่อ</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>0926241010</span>
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@punsookinnotech.co</span>
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.057-1.266-.07-1.646-.07-4.85s.015-3.585.074-4.85c.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.057 1.65-.07 4.859-.07zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.44 1.44-1.44.793-.001 1.44.646 1.44 1.44z"/>
                  </svg>
                  <span>Line: pawatify</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ลิงก์ด่วน</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    ทดลองใช้งาน
                  </Link>
                </li>
                <li>
                  <Link href="/landing#reviews" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    อ่านรีวิว
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-8">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© 2025 Punsook Innotech. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export memoized component to prevent unnecessary rerenders from parent component
export default memo(LandingPage);


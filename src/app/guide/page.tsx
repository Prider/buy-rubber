import type { Metadata } from 'next';
import UserGuide from '@/components/guide/UserGuide';

export const metadata: Metadata = {
  title: 'คู่มือผู้ใช้งาน - Yang Dee',
  description: 'วิธีใช้ Yang Dee สำหรับเจ้าของจุดรับซื้อและพนักงาน ทีละงาน',
};

export default function GuidePage() {
  return <UserGuide />;
}

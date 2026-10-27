import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yang Dee — จากตาชั่งถึงกำไรในสมุดเล่มเดียว',
  description:
    'โปรแกรมจุดรับซื้อน้ำยาง บันทึกรับซื้อ พิมพ์สลิป ขายออก ตัดสต็อก และสรุปกำไรขาดทุนบนเครื่องของร้าน ใช้ได้โดยไม่ต้องต่ออินเทอร์เน็ต',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

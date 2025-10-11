import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Punsook Innotech - ระบบบริหารจัดการรับซื้อน้ำยาง',
  description: 'โปรแกรมบริหารกิจการรับซื้อน้ำยาง พัฒนาด้วย Next.js และ AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}


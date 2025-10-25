import type { Metadata } from 'next';
import './globals.css';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { AppModeProvider } from '@/contexts/AppModeContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Punsook Innotech - ระบบบริหารจัดการรับซื้อยาง',
  description: 'โปรแกรมบริหารกิจการรับซื้อยาง พัฒนาด้วย Next.js และ AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <AppModeProvider>
            <DarkModeProvider>
              {children}
            </DarkModeProvider>
          </AppModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


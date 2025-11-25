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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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


import type { Metadata } from 'next';
import './globals.css';
import { APP_FONT_SIZE_PX, APP_FONT_SIZE_STORAGE_KEY } from '@/lib/appFontSize';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { AppModeProvider } from '@/contexts/AppModeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import LicenseGate from '@/components/LicenseGate';

export const metadata: Metadata = {
  title: 'Punsook Innotech - ระบบบริหารจัดการรับซื้อยาง',
  description: 'โปรแกรมบริหารกิจการรับซื้อยาง พัฒนาด้วย Next.js และ AI',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
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

                  const fontSizes = ${JSON.stringify(APP_FONT_SIZE_PX)};
                  const storedFont = localStorage.getItem(${JSON.stringify(APP_FONT_SIZE_STORAGE_KEY)});
                  document.documentElement.style.fontSize = fontSizes[storedFont] || ${JSON.stringify(APP_FONT_SIZE_PX.md)};
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LicenseProvider>
          <AuthProvider>
            <AppModeProvider>
              <DarkModeProvider>
                <AlertProvider>
                  <LicenseGate>{children}</LicenseGate>
                </AlertProvider>
              </DarkModeProvider>
            </AppModeProvider>
          </AuthProvider>
        </LicenseProvider>
      </body>
    </html>
  );
}


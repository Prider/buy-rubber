import type { Metadata } from 'next';
import { Kanit, Noto_Sans_Thai, Prompt, Sarabun } from 'next/font/google';
import './globals.css';
import {
  APP_FONT_FAMILY_STACKS,
  APP_FONT_FAMILY_STORAGE_KEY,
  DEFAULT_CONTROL_FONT_STACK,
  SYSTEM_APP_FONT_STACK,
} from '@/lib/appFontFamily';
import { APP_FONT_SIZE_PX, APP_FONT_SIZE_STORAGE_KEY } from '@/lib/appFontSize';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { AppModeProvider } from '@/contexts/AppModeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import LicenseGate from '@/components/LicenseGate';

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sarabun',
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-thai',
});

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-prompt',
});

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-kanit',
});

const appFontClassName = `${sarabun.variable} ${notoSansThai.variable} ${prompt.variable} ${kanit.variable}`;

export const metadata: Metadata = {
  title: 'Yang Dee - ระบบบริหารจัดการรับซื้อยาง',
  description: 'โปรแกรมบริหารกิจการรับซื้อยาง พัฒนาด้วย Next.js และ AI',
  icons: {
    icon: '/icon.png?v=3',
    shortcut: '/icon.png?v=3',
    apple: '/icon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={appFontClassName} suppressHydrationWarning>
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

                  const fontFamilies = ${JSON.stringify(APP_FONT_FAMILY_STACKS)};
                  const storedFamily = localStorage.getItem(${JSON.stringify(APP_FONT_FAMILY_STORAGE_KEY)});
                  const family = fontFamilies[storedFamily] || ${JSON.stringify(SYSTEM_APP_FONT_STACK)};
                  const controlFamily = storedFamily && storedFamily !== 'system' && fontFamilies[storedFamily]
                    ? fontFamilies[storedFamily]
                    : ${JSON.stringify(DEFAULT_CONTROL_FONT_STACK)};
                  const rootStyle = document.documentElement.style;
                  rootStyle.setProperty('--app-font-family', family);
                  rootStyle.setProperty('--animal-font-family', controlFamily);
                  rootStyle.setProperty('--app-control-font-family', controlFamily);
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


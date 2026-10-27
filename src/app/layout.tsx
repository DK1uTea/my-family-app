import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { routing } from '@/i18n/routing';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { Toaster } from '@/shared/components/ui/sonner';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { FingerprintInit } from '@/shared/components/common/fingerprint-init';

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const themeInitScript = `
(() => {
  try {
    const match = document.cookie.match(/(?:^|;\\s*)appearance=([^;]*)/);
    const cookieTheme = match ? decodeURIComponent(match[1]) : "";
    const storedTheme = localStorage.getItem("theme") || "";
    const theme = cookieTheme === "dark" || cookieTheme === "light"
      ? cookieTheme
      : storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: 'Ft My Family App',
  description: 'Ft My Family App application built with Next.js 16 and Tailwind CSS v4.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // WCAG 3.1.1 (Language of Page) — without `lang` a screen reader reads German content
  // with English pronunciation rules. This layout sits above the [locale] segment, so the
  // locale comes from the cookie `src/proxy.ts` maintains.
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const lang = routing.locales.includes(cookieLocale as never)
    ? cookieLocale!
    : routing.defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <FingerprintInit />
        <Suspense>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

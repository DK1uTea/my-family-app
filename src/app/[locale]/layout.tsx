import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactQueryProvider } from '@/shared/providers/react-query-provider';
import { FieldErrorsInit } from '@/lib/field-errors-init';
import { Locale, routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'vi')) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      <FieldErrorsInit />
      <ReactQueryProvider>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}

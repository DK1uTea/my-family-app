import en from '@/messages/en.json';
import de from '@/messages/de.json';

type ErrorMessages = typeof en.errors;

const ERROR_MESSAGES: Record<string, ErrorMessages> = { en: en.errors, de: de.errors };

function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  const segment = window.location.pathname.split('/')[1];
  return segment === 'de' ? 'de' : 'en';
}

export function getErrorMessage(errorCode: string | undefined): string {
  const locale = getCurrentLocale();
  const messages = ERROR_MESSAGES[locale] ?? ERROR_MESSAGES.en;
  const key = (errorCode ?? '').replace(/\./g, '_')
  return (messages as Record<string, string>)[key] ?? messages.default;
}

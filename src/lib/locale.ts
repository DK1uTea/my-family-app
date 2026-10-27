const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'de';
const SUPPORTED_LOCALES = ['en', 'de'] as const;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10; // seconds

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(locale: string | null | undefined): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

/** Parse NEXT_LOCALE from document.cookie */
function readCookieLocale(): AppLocale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return isValidLocale(match?.[1]) ? (match![1] as AppLocale) : DEFAULT_LOCALE;
}

/** Set locale — writes a 10-year NEXT_LOCALE cookie (works for both SSR and CSR) */
export function setLocale(locale: string): void {
  const valid: AppLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  document.cookie = `${LOCALE_COOKIE_NAME}=${valid}; path=/; max-age=${TEN_YEARS}; SameSite=Lax`;
}

/** Get current locale from cookie, fallback to DE */
export function getLocale(): AppLocale {
  return readCookieLocale();
}

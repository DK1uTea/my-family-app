import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { CORE_API_URL } from './lib/constant';
import { isDomainAllowed } from './lib/domain-guard';

const intlMiddleware = createMiddleware(routing);

/**
 * Routes under (auth) — accessible only when NOT authenticated.
 * Authenticated users are redirected away from these.
 */
const AUTH_ROUTES = ['/login', '/forgot-password', '/registration', '/reset-password'];

/**
 * Routes under (public) — accessible regardless of auth state.
 * Everything not in AUTH_ROUTES and not in PUBLIC_ROUTES is treated as (private).
 */
const PUBLIC_ROUTES = ['/components', '/privacy-policy', '/support', '/impressum', '/datenschutz', '/agb'];

type AppLocale = (typeof routing.locales)[number];
type Appearance = 'light' | 'dark';
type UserPreferences = {
  locale?: AppLocale;
  appearance?: Appearance;
};

function isSupportedLocale(locale: string | undefined): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

function getPreferredLocale(req: NextRequest): AppLocale {
  const preferredLanguage = req.cookies.get('preferredLanguage')?.value;
  const nextLocale = req.cookies.get('NEXT_LOCALE')?.value;

  if (isSupportedLocale(preferredLanguage)) return preferredLanguage;
  if (isSupportedLocale(nextLocale)) return nextLocale;
  return routing.defaultLocale;
}

function getAppearanceCookie(req: NextRequest): Appearance | undefined {
  const appearance = req.cookies.get('appearance')?.value;
  return appearance === 'dark' || appearance === 'light' ? appearance : undefined;
}

function getPathLocale(pathname: string): AppLocale | undefined {
  const locale = pathname.match(/^\/(en|de)(?:\/|$)/)?.[1];
  return isSupportedLocale(locale) ? locale : undefined;
}

function redirectToLocale(req: NextRequest, locale: AppLocale, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;

  const response = NextResponse.redirect(url);
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: 'lax',
  });

  return response;
}

function setPreferenceCookies(response: NextResponse, preferences: UserPreferences) {
  if (preferences.locale) {
    response.cookies.set('preferredLanguage', preferences.locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'strict',
    });
    response.cookies.set('NEXT_LOCALE', preferences.locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10,
      sameSite: 'lax',
    });
  }

  if (preferences.appearance) {
    response.cookies.set('appearance', preferences.appearance, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
}

async function fetchUserPreferences(req: NextRequest, accessToken?: string): Promise<UserPreferences> {
  if (!accessToken) return {};

  try {
    const response = await fetch(`${CORE_API_URL}/user/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-lang': getPathLocale(req.nextUrl.pathname) ?? getPreferredLocale(req),
      },
      cache: 'no-store',
    });

    if (!response.ok) return {};

    const data = await response.json();
    const settings = data?.data?.settings;
    const locale = settings?.preferredLanguage;
    const appearance = settings?.appearance ?? settings?.theme;

    return {
      locale: isSupportedLocale(locale) ? locale : undefined,
      appearance: appearance === 'dark' || appearance === 'light' ? appearance : undefined,
    };
  } catch {
    return {};
  }
}

/** Strip the locale prefix to get the canonical path (e.g. /de/dashboards → /dashboards) */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|de)/, '') || '/';
}

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Intercept and guard all API routes against unauthorized domains
  if (pathname.startsWith('/api')) {
    if (!isDomainAllowed(req)) {
      return NextResponse.json(
        { message: 'Forbidden: Unauthorized client domain' },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  const localePath = stripLocale(pathname);
  let locale = getPreferredLocale(req);
  let appearance = getAppearanceCookie(req);
  const pathLocale = getPathLocale(pathname);

  // User is authenticated if either token is present:
  // - accessToken may have expired (short-lived) but refreshToken still valid →
  //   client interceptor will refresh it automatically
  const accessToken = req.cookies.get('accessToken')?.value;
  const refreshToken = req.cookies.get('refreshToken')?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  const needsServerPreferences = isAuthenticated && (!req.cookies.get('preferredLanguage')?.value || !appearance);
  const serverPreferences = needsServerPreferences ? await fetchUserPreferences(req, accessToken) : {};
  locale = serverPreferences.locale ?? locale;
  appearance = serverPreferences.appearance ?? appearance;

  if (pathLocale && pathLocale !== locale) {
    const response = redirectToLocale(req, locale, `/${locale}${localePath === '/' ? '' : localePath}`);
    setPreferenceCookies(response, { locale, appearance });
    return response;
  }

  // Redirect bare "/" based on auth state
  if (localePath === '/') {
    const target = isAuthenticated ? `/${locale}/dashboards` : `/${locale}/login`;
    const response = redirectToLocale(req, locale, target);
    setPreferenceCookies(response, { locale, appearance });
    return response;
  }

  // (auth) routes — redirect authenticated users to dashboard
  if (isAuthRoute(localePath) && isAuthenticated) {
    const response = redirectToLocale(req, locale, `/${locale}/dashboards`);
    setPreferenceCookies(response, { locale, appearance });
    return response;
  }

  // (public) routes — always accessible, no auth check needed
  if (isPublicRoute(localePath)) {
    const response = intlMiddleware(req);
    setPreferenceCookies(response, serverPreferences);
    return response;
  }

  // (private) routes — everything else requires authentication
  if (!isAuthRoute(localePath) && !isAuthenticated) {
    const response = redirectToLocale(req, locale, `/${locale}/login`);
    setPreferenceCookies(response, { locale, appearance });
    return response;
  }

  const response = intlMiddleware(req);
  setPreferenceCookies(response, serverPreferences);
  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};

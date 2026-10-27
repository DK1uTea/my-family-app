import { expect, test } from '@playwright/test';

import { authenticateViaApi, setLocaleCookie } from '../../shared/session';
import { LoginPage } from './login.page';

/**
 * Middleware guards from `src/proxy.ts`. The unauthenticated branches exercise real
 * routing with no session at all; the authenticated branches sign in for real via
 * `authenticateViaApi` first — see `e2e/shared/session.ts`.
 */

test.describe('unauthenticated visitor', () => {
  test('is redirected from a private route to the login page', async ({ page }) => {
    await page.goto('/de/dashboards');

    await expect(page).toHaveURL(/\/de\/login/);
    await expect(new LoginPage(page).submit).toBeVisible();
  });

  test('is redirected from the bare root to the login page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/(de|en)\/login/);
  });

  test('is rewritten to the default German locale when no locale cookie is set', async ({
    page,
  }) => {
    await page.goto('/en/login');

    // The URL prefix does not choose the locale — `src/proxy.ts` resolves it from the
    // preferredLanguage / NEXT_LOCALE cookies and rewrites any path that disagrees.
    await expect(page).toHaveURL(/\/de\/login/);
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });
});

test.describe('locale is cookie-driven', () => {
  test('renders the login page in English once the locale cookie says en', async ({ page }) => {
    await setLocaleCookie(page, 'en');

    await page.goto('/de/login');

    await expect(page).toHaveURL(/\/en\/login/);
    // `login.submit` in en.json
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});

test.describe('authenticated visitor', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaApi(page);
  });

  test('is redirected away from the login page to the dashboard', async ({ page }) => {
    await page.goto('/de/login');

    await expect(page).toHaveURL(/\/de\/dashboards/);
  });

  test('is redirected from the bare root to the dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/(de|en)\/dashboards/);
  });

  test('keeps the session across a reload', async ({ page }) => {
    await page.goto('/de/dashboards');
    await page.reload();

    await expect(page).toHaveURL(/\/de\/dashboards/);
  });
});

test.describe('forgot password', () => {
  test('is reachable from the login page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/de\/forgot-password/);
    // `forgotPassword.sendResetLink` in de.json
    await expect(page.getByRole('button', { name: 'Reset-Link senden' })).toBeVisible();
  });
});

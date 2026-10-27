import { expect, test } from '@playwright/test';

import de from '@/messages/de.json';

import { inactiveCredentials, lockedCredentials } from '../../shared/session';
import { PRIMARY_EMAIL, WRONG_PASSWORD } from './login.data';
import { DE_ERRORS, LoginPage } from './login.page';

/**
 * Login — server error branches, against the real backend.
 *
 * A wrong password, a locked account and an inactive account cannot be produced on
 * demand from a fresh sign-in. The wrong-password case spends one of PRIMARY_EMAIL's
 * five real attempts (accepted risk — see login.data.ts). The locked/inactive cases need
 * dedicated accounts already in that state, supplied via `.env.local`; those tests skip
 * themselves when the accounts are not configured rather than fail.
 */

/** Mirrors `getErrorMessage()` in src/lib/get-error-message.ts: dots become underscores. */
function errorMessage(code: string) {
  const key = code.replace(/\./g, '_');
  return (de.errors as Record<string, string>)[key] ?? de.errors.default;
}

test.describe('login errors', () => {
  test('shows the exact remaining-attempts count the backend reports', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login'),
    );
    await login.submitWith(PRIMARY_EMAIL, WRONG_PASSWORD);
    const body = await (await loginResponse).json();

    expect(body.status).toBe(401);
    expect(body.attemptsRemaining, 'backend must report a remaining-attempts count').toEqual(
      expect.any(Number),
    );

    await expect(
      login.passwordError(DE_ERRORS.attemptsRemaining(body.attemptsRemaining)),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/de\/login/);
  });

  test('reports the lockout duration in minutes when the account is locked', async ({ page }) => {
    const locked = lockedCredentials();
    test.skip(
      !locked,
      'Set E2E_LOCKED_USER_EMAIL / E2E_LOCKED_USER_PASSWORD in .env.local to run this.',
    );

    const login = new LoginPage(page);
    await login.goto();

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login'),
    );
    await login.submitWith(locked!.email, locked!.password);
    const body = await (await loginResponse).json();

    expect(body.loginBlockDuration, 'backend must report a lockout duration').toEqual(
      expect.any(Number),
    );
    const minutes = Math.ceil(body.loginBlockDuration / 60);

    await expect(login.passwordError(DE_ERRORS.accountLocked(minutes))).toBeVisible();
  });

  test('toasts a translated message for an inactive account', async ({ page }) => {
    const inactive = inactiveCredentials();
    test.skip(
      !inactive,
      'Set E2E_INACTIVE_USER_EMAIL / E2E_INACTIVE_USER_PASSWORD in .env.local to run this.',
    );

    const login = new LoginPage(page);
    await login.goto();

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login'),
    );
    await login.submitWith(inactive!.email, inactive!.password);
    const body = await (await loginResponse).json();

    expect(body.error_code, 'backend must return an error_code for this account').toBeTruthy();
    await expect(login.toast(errorMessage(body.error_code))).toBeVisible();
  });

  test('refuses to submit while reCAPTCHA has not loaded', async ({ page }) => {
    await page.route('**/recaptcha/**', (route) => route.abort());

    const login = new LoginPage(page);
    let loginRequestSeen = false;
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/login')) loginRequestSeen = true;
    });

    await login.goto();
    await login.submitWith(PRIMARY_EMAIL, WRONG_PASSWORD);

    // The form polls for reCAPTCHA for ~5s before giving up — it never reaches the
    // backend, so the wrong password above never gets submitted.
    await expect(login.toast(DE_ERRORS.captchaNotReady)).toBeVisible({ timeout: 15_000 });
    expect(loginRequestSeen).toBe(false);
  });
});

import { expect, test } from '@playwright/test';

import { scanA11y } from '../../shared/a11y';

import { watchConsole } from '../../shared/console';
import { PRIMARY_EMAIL, PRIMARY_PASSWORD, WRONG_PASSWORD } from './login.data';
import { LOGIN_COPY, LOGIN_ERRORS, LoginPage } from './login.page';

/**
 * Accessibility contract for the login page.
 *
 * The axe scan catches the broad regressions; the explicit assertions below pin the
 * specific things that were once broken here and must not silently come back:
 * unlabelled inputs, an unnamed password toggle, and error text with no programmatic
 * link to its field.
 */

test.describe('login page accessibility', () => {
  test('has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.submit).toBeVisible();

    const results = await scanA11y(page);

    expect(results.violations).toEqual([]);
  });

  test('stays clean once validation errors are on screen', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.submit.click();
    await expect(login.passwordError(LOGIN_ERRORS.passwordRequired)).toBeVisible();

    const results = await scanA11y(page);

    expect(results.violations).toEqual([]);
  });

  test('gives both inputs a real label, not just a placeholder', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // The accessible name must come from a <label for>, not the placeholder: resolving
    // by role + name proves the name exists, and the label[for] -> id pair proves where
    // it comes from. The placeholder stays as a hint, which is all it may ever be.
    for (const [field, name] of [
      [login.email, LOGIN_COPY.emailLabel],
      [login.password, LOGIN_COPY.passwordLabel],
    ] as const) {
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute('required', '');

      const id = await field.getAttribute('id');
      expect(id).toBeTruthy();
      await expect(page.locator(`label[for="${id}"]`)).toContainText(name);
    }

    await expect(login.email).toHaveAttribute('placeholder', LOGIN_COPY.emailPlaceholder);
  });

  test('names the password toggle and flips that name with its state', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const toggle = page.getByRole('button', { name: LOGIN_COPY.showPassword });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();

    const pressed = page.getByRole('button', { name: LOGIN_COPY.hidePassword });
    await expect(pressed).toHaveAttribute('aria-pressed', 'true');
  });

  test('reaches the password toggle by keyboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.password.focus();
    await page.keyboard.press('Tab');

    await expect(login.passwordToggle).toBeFocused();
  });

  test('links each error message to the field it belongs to', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.submit.click();
    await expect(login.passwordError(LOGIN_ERRORS.emailInvalid)).toBeVisible();

    for (const [field, message] of [
      [login.email, LOGIN_ERRORS.emailInvalid],
      [login.password, LOGIN_ERRORS.passwordRequired],
    ] as const) {
      const describedBy = await field.getAttribute('aria-describedby');
      expect(describedBy, 'field must point at its error').toBeTruthy();
      await expect(page.locator(`#${describedBy}`)).toHaveText(message);
    }
  });

  test('announces a server-side error through a live region', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login'),
    );
    await login.submitWith(PRIMARY_EMAIL, WRONG_PASSWORD);
    const body = await (await loginResponse).json();

    // Scoped by text: sonner also mounts a role="alert" region, so a bare
    // getByRole('alert') is a strict-mode violation rather than a useful assertion.
    const liveRegion = page.getByRole('alert').filter({
      hasText: LOGIN_ERRORS.attemptsRemaining(body.attemptsRemaining),
    });

    await expect(liveRegion).toBeVisible();

    // The same node must be the one the password field points at, otherwise the
    // message is announced but orphaned from the control it describes.
    const describedBy = await login.password.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toHaveRole('alert');
  });

  test('keeps the browser console clean', async ({ page }) => {
    const consoleWatch = watchConsole(page);

    const login = new LoginPage(page);
    await login.goto();
    await expect(login.submit).toBeVisible();

    await consoleWatch.assertClean();
  });

  test('lets a keyboard-only user complete the whole form', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.email.focus();
    await page.keyboard.type(PRIMARY_EMAIL);
    await page.keyboard.press('Tab');
    await page.keyboard.type(PRIMARY_PASSWORD);

    await expect(login.email).toHaveValue(PRIMARY_EMAIL);
    await expect(login.password).toHaveValue(PRIMARY_PASSWORD);
  });
});

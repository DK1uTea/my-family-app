import type { Locator, Page } from '@playwright/test';

/**
 * Page object for `/[locale]/login`.
 *
 * Every locator here was read off the live accessibility tree, not guessed. They are all
 * role + accessible name, which is only possible because `login-form.tsx` labels its
 * controls properly — see `e2e/modules/login/a11y.spec.ts` for the tests that keep it that way.
 */

/** Visible copy, from `login.*` in `src/messages/de.json`. */
export const DE = {
  emailLabel: 'E-Mail',
  passwordLabel: 'Passwort',
  emailPlaceholder: 'user@example.com',
  passwordPlaceholder: 'Min. 6 Zeichen',
  rememberMe: 'Angemeldet bleiben',
  forgotPassword: 'Passwort vergessen?',
  showPassword: 'Passwort anzeigen',
  hidePassword: 'Passwort verbergen',
  submit: 'Anmelden',
} as const;

/** Error copy the form can render, from `de.json`. */
export const DE_ERRORS = {
  /** `fieldErrors.email` — note this fires for an empty email too, not `login.validation.emailRequired`. */
  emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
  /** `login.validation.passwordRequired` */
  passwordRequired: 'Passwort ist erforderlich',
  /** `login.validation.passwordMin` */
  passwordMin: 'Das Passwort muss mindestens 6 Zeichen lang sein',
  /** `login.attemptsRemaining`, ICU plural */
  attemptsRemaining: (count: number) =>
    count === 1
      ? 'Falsche E-Mail-Adresse oder falsches Passwort. Sie haben noch 1 Versuch.'
      : `Falsche E-Mail-Adresse oder falsches Passwort. Sie haben noch ${count} Versuche.`,
  /** `login.accountLockedWithDuration`, ICU plural */
  accountLocked: (minutes: number) =>
    minutes === 1
      ? 'Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es in 1 Minute erneut.'
      : `Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${minutes} Minuten erneut.`,
  /** `login.captchaNotReady` */
  captchaNotReady:
    'Bitte warten Sie einen Moment, die Sicherheitsüberprüfung wird noch geladen, und versuchen Sie es dann erneut.',
} as const;

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMe: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;

    // Both fields carry a real <label htmlFor>; the required asterisk inside it is
    // aria-hidden, so the accessible names are exactly "E-Mail" and "Passwort".
    //
    // getByRole, not getByLabel: getByLabel matches the label's raw textContent
    // ("E-Mail*", asterisk included) and ignores aria-hidden, so an exact match there
    // finds nothing. getByRole runs the real accessible-name computation. `exact` also
    // keeps "Passwort" from resolving the toggle button ("Passwort anzeigen").
    this.email = page.getByRole('textbox', { name: DE.emailLabel, exact: true });
    this.password = page.getByRole('textbox', { name: DE.passwordLabel, exact: true });

    // The toggle's accessible name flips with its state, so match either.
    this.passwordToggle = page.getByRole('button', {
      name: new RegExp(`${DE.showPassword}|${DE.hidePassword}`),
    });

    this.rememberMe = page.getByRole('checkbox', { name: DE.rememberMe });
    this.forgotPasswordLink = page.getByRole('link', { name: DE.forgotPassword });
    this.submit = page.getByRole('button', { name: DE.submit });
  }

  async goto(search = '') {
    await this.page.goto(`/de/login${search}`);
  }

  async fillCredentials(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async submitWith(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit.click();
  }

  /** The inline server/validation error rendered directly under the password field. */
  passwordError(text: string) {
    return this.page.getByText(text, { exact: true });
  }

  /** Sonner renders toasts into a live region; text match is enough to assert one. */
  toast(text: string) {
    return this.page.getByText(text, { exact: true });
  }
}

/**
 * Tracks whether the real login endpoint was ever called during this test — the
 * assertion client-side validation makes: a bad form never reaches the backend at all.
 * Attach before navigating, or an early request can be missed.
 */
export function watchLoginRequests(page: Page) {
  let called = false;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/login')) called = true;
  });
  return () => called;
}

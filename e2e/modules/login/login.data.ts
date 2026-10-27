/**
 * Test data for the login module. Every spec here signs in against the real backend —
 * see `e2e/shared/session.ts` and `src/lib/verify-captcha.ts` for the
 * `SKIP_CAPTCHA_VERIFICATION` bypass that makes that reliable instead of flaky.
 */
import { primaryCredentials } from '../../shared/session';

export const { email: PRIMARY_EMAIL, password: PRIMARY_PASSWORD } = primaryCredentials();

/**
 * Deliberately wrong. Submitting this against `PRIMARY_EMAIL` spends one of the five real
 * attempts the backend tracks for that account — an accepted risk, since there is no way
 * to exercise the "wrong password" branch of a real backend without it. See
 * `.claude/skills/e2e-module-testing/SKILL.md`.
 */
export const WRONG_PASSWORD = 'Definitely-Wrong-Password-1';

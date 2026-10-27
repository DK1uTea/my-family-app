/**
 * Double-gated dev/E2E bypass. Both conditions must hold, and neither can be true in a
 * real deployment:
 *   - NODE_ENV !== 'production'  — Next.js sets this at build time, not from a runtime
 *     env var an operator could accidentally leave set in prod
 *   - SKIP_CAPTCHA_VERIFICATION === 'true' — an explicit opt-in, absent by default
 *
 * Exists because reCAPTCHA v3 scores automated/headless traffic low, which made every
 * E2E test that submits the login form flaky against the real backend — not a rate
 * limit, but Google's own bot-likelihood score dropping the real siteverify call below
 * the 0.5 threshold. The frontend still executes reCAPTCHA and sends a token; only the
 * backend's score check is skipped.
 */
export const CAPTCHA_BYPASS_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.SKIP_CAPTCHA_VERIFICATION === "true";

export async function verifyCaptcha(token: string): Promise<boolean> {
  if (CAPTCHA_BYPASS_ENABLED) return true;
  if (!token) return false;

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      },
    );

    const data = await response.json();

    return data.success === true && data.score >= 0.5;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

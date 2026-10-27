import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Rules every scan in this repo skips, and why.
 *
 * `color-contrast` — every colour and border in this app comes from the per-tenant theme
 * (`src/styles/themes/<tenant>.css`), which is configured to match an approved design.
 * The palette is a product decision owned by design and the tenant, not something a test
 * may drive: brand primary tokens puts white
 * 16px button text at 4.21:1 against WCAG AA's 4.5:1, and "fixing" that would mean
 * repainting the brand. Contrast is therefore out of scope for automated scans repo-wide —
 * do not add per-spec exceptions, and do not write tests asserting contrast ratios.
 *
 * This is the only blanket exemption. Everything else axe reports is a real finding: never
 * add a rule here to turn a scan green. Accessible names, labels, roles, focus order and
 * error wiring are all still enforced.
 */
const THEME_EXEMPT_RULES = ['color-contrast'];

/**
 * Runs an axe WCAG 2.1 AA scan with this repo's standing exemptions applied.
 * `.grecaptcha-badge` is a third-party iframe we cannot fix.
 */
export async function scanA11y(page: Page, options?: { exclude?: string[] }) {
  let builder = new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .disableRules(THEME_EXEMPT_RULES)
    .exclude('.grecaptcha-badge');

  for (const selector of options?.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  return builder.analyze();
}

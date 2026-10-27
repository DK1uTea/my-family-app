import { expect, test } from '@playwright/test';

import { resumeSessionAt, sidebarLink } from '../../shared/session';

/**
 * dashboards — routing.
 *
 * The breadcrumb renders the current page as its own `role="link"` span (see
 * e2e/shared/session.ts `sidebarLink` docs), so this only checks the sidebar entry itself,
 * scoped to the sidebar, to avoid a strict-mode violation against the breadcrumb.
 */

test.describe('dashboards routing', () => {
  test('keeps the sidebar Dashboards entry marked as the current page', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');

    const link = sidebarLink(page, 'dashboards');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('data-active', 'true');
  });

  test('blocks direct URL access to Create Event for an account without Event.Create', async () => {
    // Confirmed live: `restrictedCredentials()` only limits which sidebar modules render
    // (`E2E_RESTRICTED_USER_MODULES`) — that account still holds Event.Create /
    // Event.Management, so `/events/new-event` renders the real form instead of
    // `RouteGuard`'s `ForbiddenView`. Testing the sheet's "block Create Event via URL" case
    // needs a dedicated account whose role genuinely lacks both permission keys; no such
    // fixture exists yet in e2e/shared/session.ts. Flagged back instead of asserting
    // against the wrong account.
    test.skip(true, 'Needs a dedicated account without Event.Create/Event.Management — not yet provisioned.');
  });
});

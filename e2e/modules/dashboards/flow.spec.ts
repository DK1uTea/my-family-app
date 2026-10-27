import { expect, test } from '@playwright/test';

import { MODULES, openModule, resumeSessionAt, sidebarLink, signIn } from '../../shared/session';
import { DashboardsPage } from './dashboards.page';

/**
 * dashboards — reaching the module.
 *
 * `/de/dashboards` is also where `signIn` itself redirects to, so this doubles as the
 * assertion that login lands here. Walking through the sidebar click still exercises the
 * "already there, click it again" path and the guard chain for an unauthenticated visit.
 */

test.describe('dashboards journey', () => {
  test('signs in, lands on the dashboard, then opens the module from the sidebar', async ({
    page,
  }) => {
    await signIn(page);

    await expect(page).toHaveURL(/\/de\/dashboards/);
    await expect(sidebarLink(page, 'dashboards')).toBeVisible();

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.heading).toBeVisible();

    await openModule(page, 'dashboards');

    await expect(page).toHaveURL(new RegExp(MODULES.dashboards.href.replace(/\//g, '\\/')));
  });

  test('sends an unauthenticated visitor to login instead', async ({ page }) => {
    await page.goto(MODULES.dashboards.href);

    await expect(page).toHaveURL(/\/de\/login/);
  });

  test('clicking Create Event navigates to the new-event page', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await dashboard.createEventButton.click();

    await expect(page).toHaveURL(/\/de\/events\/new-event/);
  });

  test('clicking Go to Calendar navigates to the calendar tab of the event navigator', async ({
    page,
  }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await dashboard.goToCalendarButton.click();

    await expect(page).toHaveURL(/\/de\/events\?tab=calendar/);
  });
});

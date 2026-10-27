import { expect, test } from '@playwright/test';

import { scanA11y } from '../../shared/a11y';
import { resumeSessionAt } from '../../shared/session';
import { DashboardsPage } from './dashboards.page';

test.describe('dashboards accessibility', () => {
  test('has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');
    const dashboard = new DashboardsPage(page);
    await expect(dashboard.heading).toBeVisible();

    const results = await scanA11y(page);

    expect(results.violations).toEqual([]);
  });

  test('the Include Future Events checkbox is keyboard reachable and has an accessible name', async ({
    page,
  }) => {
    await resumeSessionAt(page, 'dashboards');
    const dashboard = new DashboardsPage(page);

    await dashboard.includeFutureEventsCheckbox.focus();
    await expect(dashboard.includeFutureEventsCheckbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(dashboard.includeFutureEventsCheckbox).toBeChecked();
  });
});

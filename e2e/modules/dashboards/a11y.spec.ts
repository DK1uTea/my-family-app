import { expect, test } from '@playwright/test';
import { scanA11y } from '../../shared/a11y';
import { resumeSessionAt } from '../../shared/session';
import { DashboardsPage } from './dashboards.page';

test('dashboard accessibility', async ({ page }) => {
  await resumeSessionAt(page, 'dashboards');
  const dashboard = new DashboardsPage(page);
  await expect(dashboard.heading).toBeVisible();
  const results = await scanA11y(page);
  expect(results.violations).toEqual([]);
});

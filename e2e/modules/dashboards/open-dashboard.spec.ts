import { expect, test } from '@playwright/test';
import { resumeSessionAt } from '../../shared/session';
import { DashboardsPage } from './dashboards.page';

test('open dashboard', async ({ page }) => {
  await resumeSessionAt(page, 'dashboards');
  const dashboard = new DashboardsPage(page);

  await expect(dashboard.heading).toBeVisible();
  await expect(dashboard.dashboardSidebarLink).toBeVisible();
  await expect(dashboard.settingsSidebarLink).toBeVisible();
});

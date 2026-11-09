import { expect, test } from '@playwright/test';

import { resumeSessionAt } from '../../shared/session';
import { EventTimelinePage } from './event-timeline.page';

test('open event timeline', async ({ page }) => {
  await resumeSessionAt(page, 'eventTimeline');
  const eventTimeline = new EventTimelinePage(page);

  const meResponse = await page.request.get('/api/users/me');
  expect(meResponse.ok()).toBe(true);
  const me = await meResponse.json();
  const navbar = me?.data?.role?.navbar;
  expect(Array.isArray(navbar)).toBe(true);
  expect(navbar).toContain('*');

  await expect(eventTimeline.dashboardSidebarLink).toBeVisible();
  await expect(eventTimeline.eventTimelineSidebarLink).toBeVisible();
  await expect(eventTimeline.settingsSidebarLink).toBeVisible();
  await expect(eventTimeline.heading).toBeVisible();

  await eventTimeline.dashboardSidebarLink.click();
  await page.waitForURL(/\/vi\/dashboards$/);
  await eventTimeline.eventTimelineSidebarLink.click();
  await page.waitForURL(/\/vi\/event-timeline$/);
  await expect(eventTimeline.heading).toBeVisible();

  await eventTimeline.openDirectly();
  await expect(eventTimeline.heading).toBeVisible();
});

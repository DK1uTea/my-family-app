import { expect, test } from '@playwright/test';

import { EventTimelinePage } from './event-timeline.page';

test('redirect unauthenticated visitor from event timeline', async ({ page }) => {
  const eventTimeline = new EventTimelinePage(page);

  await eventTimeline.openDirectly();

  await expect(page).toHaveURL(/\/vi\/login$/);
});

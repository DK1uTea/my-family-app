import { expect, test } from '@playwright/test';

import { dayjs, nowUtc } from '@/lib/date-utils';

import { watchConsole } from '../../shared/console';
import { resumeSessionAt, restrictedCredentials } from '../../shared/session';
import { COPY, expectedNamedGreeting } from './dashboards.data';
import { DashboardsPage } from './dashboards.page';

/**
 * dashboards — page content.
 *
 * The event lists come from the real `GET /api/etr/events/dashboard` response, which this
 * account's real data controls — tests read that response instead of assuming it is
 * empty or populated, per .claude/skills/e2e-module-testing/SKILL.md ("read server-driven
 * values from the response").
 *
 * The primary E2E account (see e2e/shared/session.ts) is documented as the Internal Admin
 * equivalent, so the permission-gated create-event / go-to-calendar buttons are expected
 * visible here. The hidden branch for an account without those permissions needs
 * restrictedCredentials() — see the "hidden for a restricted account" test below.
 */

function daysUntil(startDateIso: string): number {
  return dayjs
    .utc(startDateIso)
    .startOf('day')
    .diff(dayjs.utc(nowUtc()).startOf('day'), 'day');
}

test.describe('dashboards content', () => {
  test('shows a name-based greeting when the account has a name', async ({ page }) => {
    const name = process.env.E2E_USER_NAME;
    test.skip(!name, 'Set E2E_USER_NAME in .env.local to run this.');

    const [firstName, ...rest] = name!.split(' ');
    const lastName = rest.join(' ');

    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.heading).toHaveText(expectedNamedGreeting(firstName, lastName));
  });

  test('renders the create-event button for the primary account', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.createEventButton).toBeVisible();
  });

  test('renders the go-to-calendar button for the primary account', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.goToCalendarButton).toBeVisible();
  });

  test('hides permission-gated actions for a restricted account', async ({ page }) => {
    const restricted = restrictedCredentials();
    test.skip(!restricted, 'Set E2E_RESTRICTED_USER_* in .env.local to run this.');

    await resumeSessionAt(page, 'dashboards', restricted!);

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.createEventButton).toBeHidden();
  });

  test('shows upcoming events or the empty state, matching the real response', async ({
    page,
  }) => {
    const responsePromise = page.waitForResponse((r) =>
      r.url().includes('/api/etr/events/dashboard'),
    );
    await resumeSessionAt(page, 'dashboards');
    const body = await (await responsePromise).json();

    const mine = Array.isArray(body?.data?.mine) ? body.data.mine : [];
    const dashboard = new DashboardsPage(page);

    if (mine.length === 0) {
      await expect(page.getByText(COPY.noUpcomingEvents)).toBeVisible();
      await expect(page.getByText(COPY.noUpcomingEventsDescription)).toBeVisible();
      return;
    }

    const first = mine[0];
    await expect(dashboard.eventCard(first.name)).toBeVisible();

    const days = daysUntil(first.startDate);
    const banner = dashboard
      .eventCard(first.name)
      .getByText(COPY.eventStartsIn(Math.max(days, 0)));

    if (days >= 0 && days <= 10) {
      await expect(banner).toBeVisible();
    } else {
      await expect(banner).toHaveCount(0);
    }
  });

  test('shows team events or the empty state, matching the real response, with no starting-soon banner', async ({
    page,
  }) => {
    const responsePromise = page.waitForResponse((r) =>
      r.url().includes('/api/etr/events/dashboard'),
    );
    await resumeSessionAt(page, 'dashboards');
    const body = await (await responsePromise).json();

    const everyone = Array.isArray(body?.data?.everyone) ? body.data.everyone : [];

    if (everyone.length === 0) {
      await expect(page.getByText(COPY.noTeamEvents)).toBeVisible();
      await expect(page.getByText(COPY.noTeamEventsDescription)).toBeVisible();
      return;
    }

    const first = everyone[0];
    const dashboard = new DashboardsPage(page);
    const card = dashboard.eventCard(first.name);
    await expect(card).toBeVisible();
    await expect(card.getByText(/Fällig in/)).toHaveCount(0);
  });

  test('clicking an event card navigates to its event detail page', async ({ page }) => {
    const responsePromise = page.waitForResponse((r) =>
      r.url().includes('/api/etr/events/dashboard'),
    );
    await resumeSessionAt(page, 'dashboards');
    const body = await (await responsePromise).json();

    const mine = Array.isArray(body?.data?.mine) ? body.data.mine : [];
    test.skip(mine.length === 0, 'No event on this account to click through — needs seed data.');

    const first = mine[0];
    const dashboard = new DashboardsPage(page);
    await dashboard.eventCard(first.name).click();

    await expect(page).toHaveURL(new RegExp(`/event-detail/${first.id}`));
  });

  test('the turnover charts render from the real analytics endpoint', async ({ page }) => {
    // Confirmed live: unlike src/features/dashboard/CONTEXT.md's "static placeholder"
    // description, `useEventAnalyticsTurnover` calls the real `GET /etr/analytics/turnover`
    // — flagged back to dev as stale documentation, not something this test should assert
    // around. This just confirms both chart cards render against that real response.
    const turnoverResponse = page.waitForResponse((r) =>
      r.url().includes('/api/etr/analytics/turnover'),
    );
    await resumeSessionAt(page, 'dashboards');
    await turnoverResponse;

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.metricsCardTitles.first()).toBeVisible();
    await expect(dashboard.metricsCardTitles.last()).toBeVisible();
    await expect(dashboard.includeFutureEventsCheckbox).toBeVisible();
  });

  test('toggling Include Future Events stays interactive and refetches analytics', async ({
    page,
  }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.includeFutureEventsCheckbox).toBeEnabled();

    // `includeFuture` is a real query param on the analytics call (not a no-op as
    // src/features/dashboard/CONTEXT.md claims — see the note above), so toggling it
    // triggers a second, differently-parameterized request.
    const refetch = page.waitForResponse(
      (r) =>
        r.url().includes('/api/etr/analytics/turnover') && r.url().includes('includeFuture=true'),
    );
    await dashboard.includeFutureEventsCheckbox.click();

    await expect(dashboard.includeFutureEventsCheckbox).toBeChecked();
    await expect(page).toHaveURL(/include-future=true/);
    await refetch;
  });

  test('shows the notification bell and user avatar in the header', async ({ page }) => {
    await resumeSessionAt(page, 'dashboards');

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.notificationBell).toBeVisible();
    await expect(dashboard.userAvatar).toBeVisible();
  });

  test('the Sales Figure pie shows the EUR-formatted turnover value and its legend', async ({
    page,
  }) => {
    const turnoverResponse = page.waitForResponse((r) =>
      r.url().includes('/api/etr/analytics/turnover'),
    );
    await resumeSessionAt(page, 'dashboards');
    const body = await (await turnoverResponse).json();
    const total = body?.data?.totalTurnover ?? 0;

    const dashboard = new DashboardsPage(page);
    await expect(dashboard.salesFigureLegend).toBeVisible();

    // Scoped to the pie's own center-value tspan (`.font-medium`) — a bare text match
    // against, say, "0 €" also matches the bar chart's Y-axis tick labels.
    await expect(
      page.locator('tspan.font-medium', { hasText: `${Number(total).toLocaleString('de-DE')} €` }),
    ).toBeVisible();
  });

  test('keeps the browser console clean', async ({ page }) => {
    const consoleWatch = watchConsole(page);

    await resumeSessionAt(page, 'dashboards');
    const dashboard = new DashboardsPage(page);
    await expect(dashboard.heading).toBeVisible();

    await consoleWatch.assertClean();
  });
});

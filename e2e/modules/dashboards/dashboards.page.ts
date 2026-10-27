import type { Page } from '@playwright/test';

/**
 * dashboards — locators.
 *
 * The h1 greeting text is either "<time-of-day greeting>, <first> <last>" (when the
 * account has a name) or the generic `dashboard.welcome` copy — see
 * `src/features/dashboard/(components)/dashboard-main.tsx`. Tests build the expected
 * string the same way the component does (see `dashboards.data.ts`) instead of hardcoding
 * one greeting, since the real greeting depends on the current UTC hour.
 *
 * Confirmed live: `CardTitle` (`shared/components/ui/card.tsx`) renders a plain `div`, not
 * a heading — every "card title" here (including both chart cards' shared "Kennzahlen"
 * label) is matched by text, not by `getByRole('heading', ...)`.
 */
export class DashboardsPage {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get createEventButton() {
    return this.page.getByRole('link', { name: /Event erstellen/i });
  }

  get goToCalendarButton() {
    return this.page.getByRole('link', { name: /Zum Kalender/i });
  }

  get yourUpcomingEventsCard() {
    return this.page.getByText('Ihre bevorstehenden Events', { exact: true });
  }

  get teamUpcomingEventsCard() {
    return this.page.getByText('Bevorstehende Team-Events', { exact: true });
  }

  eventCard(eventName: string) {
    return this.page.getByRole('link', { name: new RegExp(eventName) });
  }

  get includeFutureEventsCheckbox() {
    return this.page.getByRole('checkbox', { name: /zukünftige Events einbeziehen/i });
  }

  get metricsCardTitles() {
    return this.page.getByText('Kennzahlen', { exact: true });
  }

  get notificationBell() {
    return this.page.getByRole('button', { name: 'notifications' });
  }

  /** Header avatar trigger — `.first()` because a second copy renders inside the opened dropdown. */
  get userAvatar() {
    return this.page.locator('[data-slot="avatar"]').first();
  }

  /** `.first()` — the same label also renders as an SVG `<tspan>` inside the pie itself. */
  get salesFigureLegend() {
    return this.page.getByText('Umsatz', { exact: true }).first();
  }
}

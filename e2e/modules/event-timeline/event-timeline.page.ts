import type { Page } from '@playwright/test';

export class EventTimelinePage {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByTestId('event-timeline-heading');
  }

  get dashboardSidebarLink() {
    return this.page.getByTestId('sidebar-dashboards');
  }

  get eventTimelineSidebarLink() {
    return this.page.getByTestId('sidebar-event-timeline');
  }

  get settingsSidebarLink() {
    return this.page.getByTestId('sidebar-settings');
  }

  async openDirectly() {
    await this.page.goto('/vi/event-timeline');
  }
}

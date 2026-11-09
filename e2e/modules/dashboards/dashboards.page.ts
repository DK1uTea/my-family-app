import type { Page } from '@playwright/test';

export class DashboardsPage {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByTestId('dashboard-heading');
  }

  get dashboardSidebarLink() {
    return this.page.getByTestId('sidebar-dashboards');
  }

  get settingsSidebarLink() {
    return this.page.getByTestId('sidebar-settings');
  }
}

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  MODULE_PERMISSIONS,
  ServerModuleKey,
  getNavbarPermissions,
} from '@/server/modules/roles/permissions';

describe('tenant management permissions', () => {
  it('registers the tenant management module under its stable key', () => {
    expect(ServerModuleKey.TenantManagement).toBe('tenant-management');
    expect(MODULE_PERMISSIONS.some((module) => module.key === 'tenant-management')).toBe(true);
  });

  it('exposes the tenant management navbar key to a role with read permission', () => {
    expect(getNavbarPermissions(['tenant-management.read'])).toContain('tenant-management');
  });

  it('keeps the tenant management navbar key explicit for a platform wildcard role', () => {
    expect(getNavbarPermissions(['*'])).toContain('tenant-management');
  });

  it('does not expose tenant management to a tenant role without its permission', () => {
    expect(getNavbarPermissions(['event-timeline.read'])).not.toContain('tenant-management');
  });
});

export enum ModuleKey {
  EventTimeline = 'event-timeline',
  TenantManagement = 'tenant-management',
}

export const PERMISSION_ALL_WILDCARD = '*';

export const PermissionKey = {
  EventTimeline: {
    Read: 'event-timeline.read',
    Create: 'event-timeline.create',
    Edit: 'event-timeline.edit',
    Delete: 'event-timeline.delete',
    Upload: 'event-timeline.upload',
  },
  TenantManagement: {
    Read: 'tenant-management.read',
    Create: 'tenant-management.create',
    Edit: 'tenant-management.edit',
    Status: 'tenant-management.status',
  },
} as const;

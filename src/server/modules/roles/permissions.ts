import 'server-only';

export const UserRole = {
  ADMIN: 'admin',
  ADULT: 'adult',
  CHILD: 'child',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ServerModuleKey = {
  EventTimeline: 'event-timeline',
  TenantManagement: 'tenant-management',
} as const;

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

export const PERMISSION_ALL_WILDCARD = '*';

export const MODULE_PERMISSIONS = [
  {
    name: 'Event Timeline',
    key: ServerModuleKey.EventTimeline,
    type: 'CHECKBOX',
    children: [
      { name: 'Read', key: PermissionKey.EventTimeline.Read },
      { name: 'Create', key: PermissionKey.EventTimeline.Create },
      { name: 'Edit', key: PermissionKey.EventTimeline.Edit },
      { name: 'Delete', key: PermissionKey.EventTimeline.Delete },
      { name: 'Upload', key: PermissionKey.EventTimeline.Upload },
    ],
  },
  {
    name: 'Tenant Management',
    key: ServerModuleKey.TenantManagement,
    type: 'CHECKBOX',
    children: [
      { name: 'Read', key: PermissionKey.TenantManagement.Read },
      { name: 'Create', key: PermissionKey.TenantManagement.Create },
      { name: 'Edit', key: PermissionKey.TenantManagement.Edit },
      { name: 'Change Status', key: PermissionKey.TenantManagement.Status },
    ],
  },
] as const;

export const PERMISSION_KEYS = MODULE_PERMISSIONS.flatMap((module) =>
  module.children.map((permission) => permission.key),
);

export function hasPermission(granted: string[], required: string): boolean {
  return granted.includes(PERMISSION_ALL_WILDCARD) || granted.includes(required);
}

export function hasModuleAccess(granted: string[], moduleKey: string): boolean {
  if (granted.includes(PERMISSION_ALL_WILDCARD)) return true;
  const module = MODULE_PERMISSIONS.find((item) => item.key === moduleKey);
  return module ? hasPermission(granted, module.children[0].key) : false;
}

export function getNavbarPermissions(granted: string[]): string[] {
  if (granted.includes(PERMISSION_ALL_WILDCARD)) {
    return [PERMISSION_ALL_WILDCARD, ...MODULE_PERMISSIONS.map((module) => module.key)];
  }
  return MODULE_PERMISSIONS
    .filter((module) => hasModuleAccess(granted, module.key))
    .map((module) => module.key);
}

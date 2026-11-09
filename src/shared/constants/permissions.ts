export enum ModuleKey {
  EventTimeline = 'event-timeline',
}

export const PERMISSION_ALL_WILDCARD = '*';

export const PermissionKey = {
  EventTimeline: {
    Read: 'event-timeline.read',
    Create: 'event-timeline.create',
    Edit: 'event-timeline.edit',
    Delete: 'event-timeline.delete',
  },
} as const;

import { describe, expect, it } from 'vitest';
import {
  ModuleKey,
  PermissionKey,
  PERMISSION_ALL_WILDCARD,
} from '@/shared/constants/permissions';

describe('frontend permission keys', () => {
  it('uses stable Event Timeline module and action keys', () => {
    expect(ModuleKey.EventTimeline).toBe('event-timeline');
    expect(PermissionKey.EventTimeline).toEqual({
      Read: 'event-timeline.read',
      Create: 'event-timeline.create',
      Edit: 'event-timeline.edit',
      Delete: 'event-timeline.delete',
      Upload: 'event-timeline.upload',
    });
  });

  it('keeps the admin wildcard separate from module and action keys', () => {
    expect(PERMISSION_ALL_WILDCARD).toBe('*');
    expect(Object.values(PermissionKey.EventTimeline)).not.toContain(PERMISSION_ALL_WILDCARD);
  });
});

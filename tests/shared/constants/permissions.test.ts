import { describe, expect, it } from 'vitest'

import {
  EVENT_ACCESS_KEYS,
  PERMISSIONS,
  PERMISSIONS_TREE,
} from '@/shared/constants/permissions'

describe('event list permissions', () => {
  it('defines a permission for each event list status', () => {
    expect(PERMISSIONS.Event.List).toEqual({
      Draft: 'event.list.draft',
      Active: 'event.list.active',
      Deleted: 'event.list.deleted',
    })
  })

  it('exposes each event list status as a module access key', () => {
    expect(EVENT_ACCESS_KEYS).toEqual(expect.arrayContaining([
      PERMISSIONS.Event.List.Draft,
      PERMISSIONS.Event.List.Active,
      PERMISSIONS.Event.List.Deleted,
    ]))
  })

  it('shows the three status permissions in the role permission tree', () => {
    const eventManagement = PERMISSIONS_TREE.find((group) => group.name === 'Event Management')

    expect(eventManagement?.children.map((child) => child.key)).toEqual(expect.arrayContaining([
      'event.list.draft',
      'event.list.active',
      'event.list.deleted',
    ]))
  })
})

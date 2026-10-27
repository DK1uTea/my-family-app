import { describe, expect, it } from 'vitest'

import { getPaginationRange } from '@/shared/components/ui/pagination-range'

describe('getPaginationRange', () => {
  it('returns every page when the total fits without an ellipsis', () => {
    expect(getPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('keeps five adjacent pages visible at the beginning', () => {
    expect(getPaginationRange(1, 68)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 68])
  })

  it('keeps the current page and its neighbours visible in the middle', () => {
    expect(getPaginationRange(34, 68)).toEqual([
      1,
      'ellipsis-start',
      33,
      34,
      35,
      'ellipsis-end',
      68,
    ])
  })

  it('keeps five adjacent pages visible at the end', () => {
    expect(getPaginationRange(68, 68)).toEqual([1, 'ellipsis-start', 64, 65, 66, 67, 68])
  })
})

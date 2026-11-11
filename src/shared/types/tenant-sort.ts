export const TENANT_SORT_OPTIONS = [
  'createdAt:desc',
  'createdAt:asc',
] as const

export type TenantSort = (typeof TENANT_SORT_OPTIONS)[number]

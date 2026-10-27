import { isAxiosError } from 'axios'

/** Extracts the real HTTP status from an error thrown by the api client (see `unwrapEnvelope` in `@/lib/api`). */
export function getErrorStatus(error: unknown): number | undefined {
  if (!isAxiosError(error)) return undefined
  return error.response?.status
}

/**
 * Statuses that should show the maintenance screen instead of a generic error.
 * 401 is excluded — it drives the token-refresh/logout flow in `@/lib/api`.
 * 403 is excluded — it means "no permission", not a system outage.
 */
export function isMaintenanceStatus(status: number | undefined): boolean {
  return status !== undefined && status >= 400 && status !== 401 && status !== 403
}

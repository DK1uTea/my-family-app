import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import 'dayjs/locale/en'

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)

export { dayjs }

export type DateFormat = 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'MM/DD/YYYY' | 'MM-DD-YYYY'

// export const DEFAULT_DATE_FORMAT: DateFormat = 'MM-DD-YYYY'
export const DEFAULT_DATE_FORMAT: DateFormat = 'DD/MM/YYYY'

/**
 * Returns the current moment as a UTC Date.
 * Use instead of `new Date()` everywhere in the codebase.
 */
export function nowUtc(): Date {
  return dayjs.utc().toDate()
}

/**
 * Formats a timestamp using the browser's local timezone and the user's
 * preferred date format. Pass includeTime=true to append the local HH:mm.
 * Always use this instead of formatting timestamps with dayjs.utc(...).
 */
export function formatDate(
  date: Date | string | null | undefined,
  dateFormat: DateFormat,
  includeTime = false,
): string {
  if (!date) return ''
  const activeFormat = dateFormat || DEFAULT_DATE_FORMAT
  const fmt = includeTime ? `${activeFormat} HH:mm` : activeFormat
  return dayjs(date).format(fmt)
}

/** Formats a date-only calendar value without applying a timezone offset. */
export function formatCalendarDate(
  date: Date | string | null | undefined,
  dateFormat: DateFormat,
): string {
  if (!date) return ''
  return dayjs.utc(date).format(dateFormat || DEFAULT_DATE_FORMAT)
}

/**
 * Serializes a picked local date/time as its UTC instant for the API.
 */
export function toApiDate(date: Date): string {
  return dayjs(date).toISOString()
}

import { dayjs, type DateFormat } from '@/lib/date-utils'

export type DateRange = { from?: Date; to?: Date }

export function startOfDay(date: Date): Date {
  return dayjs.utc(date).startOf('day').toDate()
}

export function endOfDay(date: Date): Date {
  return dayjs.utc(date).hour(23).minute(59).second(0).toDate()
}

export function formatRangeDate(date: Date | undefined, dateFormat: DateFormat): string {
  return date ? dayjs.utc(date).format(dateFormat) : ''
}

export function parseRangeDate(value: string, dateFormat: DateFormat): Date | undefined {
  const date = dayjs.utc(value, dateFormat, true)
  return date.isValid() ? date.toDate() : undefined
}

export function autoFormatRangeDate(value: string, dateFormat: DateFormat): string {
  const separator = dateFormat.includes('/') ? '/' : '-'
  const firstIsDay = dateFormat.startsWith('DD')
  const digits = value.replace(/\D/g, '').slice(0, 8)
  let first = digits.slice(0, 2)
  let second = digits.slice(2, 4)
  const year = digits.slice(4, 8)

  if (firstIsDay) {
    if (first.length === 2 && +first > 31) first = '31'
    if (second.length === 2 && +second > 12) second = '12'
  } else {
    if (first.length === 2 && +first > 12) first = '12'
    if (second.length === 2 && +second > 31) second = '31'
  }

  if (!second) return first
  if (!year) return `${first}${separator}${second}`
  return `${first}${separator}${second}${separator}${year}`
}

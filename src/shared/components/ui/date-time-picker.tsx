'use client'

import { useId, useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { dayjs, nowUtc, formatDate } from '@/lib/date-utils'
import { useDateFormat } from '@/shared/stores/use-user-store'
import { cn } from '@/lib/utils'
import { MiniCalendar } from '@/shared/components/ui/mini-calendar'
import { Button } from '@/shared/components/ui/button'
import {
  DatePickerOverlay,
  type DatePickerOverlayMode,
} from '@/shared/components/ui/date-picker-overlay'

type Props = {
  value: Date
  onChangeAction: (date: Date) => void
  defaultValue?: Date
  allowPastDates?: boolean
  minDate?: Date
  className?: string
  overlay?: DatePickerOverlayMode
  trigger?: ReactElement
}

function autoFormatTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  const h = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  return digits.length >= 3 ? `${h}:${m}` : h
}

export function DateTimePicker({
  value, onChangeAction, defaultValue,
  allowPastDates = false, minDate, className, overlay, trigger,
}: Props) {
  const t = useTranslations('datePicker')
  const dateFormat = useDateFormat()
  const timeInputId = useId()
  const [open, setOpen] = useState(false)
  const [draftDate, setDraftDate] = useState<Date>(value)
  const [timeInput, setTimeInput] = useState(dayjs.utc(value).format('HH:mm'))

  const getInitialDate = (currentValue: Date): Date => {
    if (minDate && dayjs.utc(currentValue).isBefore(dayjs.utc(minDate), 'day')) {
      const h = dayjs.utc(currentValue).hour()
      const m = dayjs.utc(currentValue).minute()
      return dayjs.utc(minDate).hour(h).minute(m).second(0).toDate()
    }
    return currentValue
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const initialDate = getInitialDate(value)
      setDraftDate(initialDate)
      setTimeInput(dayjs.utc(initialDate).format('HH:mm'))
    }
    setOpen(nextOpen)
  }

  const applyTime = (draft: Date, timeStr: string): Date => {
    const digits = timeStr.replace(/\D/g, '').padEnd(4, '0')
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10))
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10))
    return dayjs.utc(draft).hour(h).minute(m).second(0).toDate()
  }

  const handleDayClick = (date: Date) => setDraftDate(applyTime(date, timeInput))

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = autoFormatTime(event.target.value)
    setTimeInput(formatted)
    if (formatted.replace(/\D/g, '').length === 4) {
      setDraftDate((date) => applyTime(date, formatted))
    }
  }

  const handleTimeBlur = () => {
    const digits = timeInput.replace(/\D/g, '').padEnd(4, '0')
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10))
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10))
    setTimeInput(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    setDraftDate((date) => dayjs.utc(date).hour(h).minute(m).second(0).toDate())
  }

  const handleApply = () => {
    if (minDate && dayjs.utc(draftDate).isBefore(dayjs.utc(minDate), 'day')) return
    onChangeAction(draftDate)
    setOpen(false)
  }

  const handleReset = () => {
    const fallback = defaultValue ?? nowUtc()
    const date = minDate && dayjs.utc(fallback).isBefore(dayjs.utc(minDate), 'day')
      ? minDate
      : fallback
    setDraftDate(date)
    setTimeInput(dayjs.utc(date).format('HH:mm'))
  }

  return (
    <div className={cn('relative', className)}>
      <DatePickerOverlay
        open={open}
        onOpenChange={handleOpenChange}
        overlay={overlay}
        title={t('time')}
        contentClassName="w-65 max-w-none rounded-[18px] p-3"
        trigger={trigger ?? (
          <button type="button" className="flex w-full cursor-pointer gap-3 text-left">
            <span className="flex h-10 flex-1 items-center rounded-lg border border-input bg-transparent px-3 text-sm hover:border-primary">
              {formatDate(value, dateFormat)}
            </span>
            <span className="flex h-10 w-28 items-center rounded-lg border border-input bg-transparent px-3 text-sm hover:border-primary">
              {dayjs.utc(value).format('HH:mm')}
            </span>
          </button>
        )}
      >
        <MiniCalendar selected={draftDate} onDayClickAction={handleDayClick}
          disablePast={!allowPastDates} minDate={minDate} />
        <div className="mb-3.5 mt-3">
          <label htmlFor={timeInputId} className="mb-1.5 block text-xs text-muted-foreground">
            {t('time')}
            <input id={timeInputId} type="text" value={timeInput} aria-label={t('time')}
              onChange={handleTimeChange} onBlur={handleTimeBlur} placeholder="HH:MM"
              className="mt-1.5 w-full rounded-input-float bg-light-gray px-2.5 py-2 text-center text-base font-medium tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        </div>
        <div className="flex gap-3">
          <Button variant="outline-primary" className="flex-1" onClick={handleReset}>{t('reset')}</Button>
          <Button data-testid="date-picker-apply-button" className="flex-1" onClick={handleApply}>{t('apply')}</Button>
        </div>
      </DatePickerOverlay>
    </div>
  )
}

'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar1 } from 'lucide-react'
import { dayjs } from '@/lib/date-utils'
import { useDateFormat } from '@/shared/stores/use-user-store'
import { cn } from '@/lib/utils'
import { MiniCalendar } from '@/shared/components/ui/mini-calendar'
import { Button } from '@/shared/components/ui/button'
import { DatePickerOverlay, type DatePickerOverlayMode } from '@/shared/components/ui/date-picker-overlay'
import {
  autoFormatRangeDate,
  endOfDay,
  formatRangeDate,
  parseRangeDate,
  startOfDay,
  type DateRange,
} from '@/shared/components/ui/date-range-picker-utils'

type Props = {
  defaultValue?: DateRange
  onApplyAction?: (range: DateRange) => void
  onResetAction?: () => void
  disablePast?: boolean
  className?: string
  label?: { startLabel?: string; endLabel?: string }
  overlay?: DatePickerOverlayMode
  trigger?: ReactElement
}

export function DateRangePicker({ defaultValue, onApplyAction, onResetAction, disablePast, className, label, overlay, trigger }: Props) {
  const t = useTranslations('datePicker')
  const dateFormat = useDateFormat()
  const initRange: DateRange = defaultValue ?? {}

  const [open, setOpen] = useState(false)
  const [appliedRange, setAppliedRange] = useState<DateRange>(initRange)
  const [range, setRange] = useState<DateRange>(initRange)
  const [fromStr, setFromStr] = useState(formatRangeDate(initRange.from, dateFormat))
  const [toStr, setToStr] = useState(formatRangeDate(initRange.to, dateFormat))
  const [fromError, setFromError] = useState<string>()
  const [toError, setToError] = useState<string>()
  const [isSelectingStart, setIsSelectingStart] = useState(true)

  const syncInputs = (r: DateRange) => {
    setFromStr(formatRangeDate(r.from, dateFormat))
    setToStr(formatRangeDate(r.to, dateFormat))
    setFromError(undefined)
    setToError(undefined)
  }

  useEffect(() => {
    const nextRange = defaultValue ?? {}
    setAppliedRange(nextRange)
    setRange(nextRange)
    syncInputs(nextRange)
    setIsSelectingStart(true)
  }, [defaultValue?.from?.getTime(), defaultValue?.to?.getTime()])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setRange(appliedRange)
      syncInputs(appliedRange)
      setIsSelectingStart(true)
    }
    setOpen(nextOpen)
  }

  const handleDayClick = (date: Date) => {
    if (isSelectingStart) {
      const r: DateRange = { from: startOfDay(date), to: undefined }
      setRange(r); syncInputs(r); setIsSelectingStart(false)
    } else {
      if (range.from && dayjs.utc(date).isBefore(dayjs.utc(range.from), 'day')) {
        const r: DateRange = { from: startOfDay(date), to: undefined }
        setRange(r); syncInputs(r)
      } else {
        const r: DateRange = { from: range.from, to: endOfDay(date) }
        setRange(r); syncInputs(r); setIsSelectingStart(true)
      }
    }
  }

  const isPastDate = (date: Date) =>
    !!disablePast && dayjs.utc(date).isBefore(dayjs.utc().startOf('day'), 'day')

  const handleFromBlur = () => {
    if (!fromStr) { setRange((r) => ({ ...r, from: undefined })); setFromError(undefined); return }
    const date = parseRangeDate(fromStr, dateFormat)
    if (!date) { setFromError(`Invalid (${dateFormat})`); return }
    if (isPastDate(date)) { setFromError(t('dateInPast')); return }
    setFromError(undefined)
    const from = startOfDay(date)
    const newTo = range.to && from <= range.to ? range.to : undefined
    setRange({ from, to: newTo })
    setToStr(formatRangeDate(newTo, dateFormat))
  }

  const handleToBlur = () => {
    if (!toStr) { setRange((r) => ({ ...r, to: undefined })); setToError(undefined); return }
    const date = parseRangeDate(toStr, dateFormat)
    if (!date) { setToError(`Invalid (${dateFormat})`); return }
    if (isPastDate(date)) { setToError(t('dateInPast')); return }
    setToError(undefined)
    const to = endOfDay(date)
    const newFrom = range.from && to >= range.from ? range.from : undefined
    setRange({ from: newFrom, to })
    setFromStr(formatRangeDate(newFrom, dateFormat))
  }

  const handleReset = () => {
    setRange({}); syncInputs({}); setIsSelectingStart(true)
    setAppliedRange({}); onApplyAction?.({}); onResetAction?.(); setOpen(false)
  }

  const handleApply = () => {
    if (range.from && isPastDate(range.from)) { setFromError(t('dateInPast')); return }
    if (range.to && isPastDate(range.to)) { setToError(t('dateInPast')); return }
    setAppliedRange(range); onApplyAction?.(range); setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <DatePickerOverlay
        open={open}
        onOpenChange={handleOpenChange}
        overlay={overlay}
        title={t('startDate')}
        contentClassName="w-72 max-w-none rounded-[18px] p-3"
        trigger={trigger ?? (
          <button type="button" className="flex w-full cursor-pointer flex-col gap-3 text-left sm:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {label?.startLabel && <p className="text-xs text-gray-500">{label.startLabel}</p>}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground hover:border-primary font-bold">
              <Calendar1 className="size-4" />
              {appliedRange.from
                ? formatRangeDate(appliedRange.from, dateFormat)
                : <span className="text-muted-foreground">{t('startDate')}</span>}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {label?.endLabel && <p className="text-xs text-gray-500">{label.endLabel}</p>}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground hover:border-primary font-bold">
              <Calendar1 className="size-4" />
              {appliedRange.to
                ? formatRangeDate(appliedRange.to, dateFormat)
                : <span className="text-muted-foreground">{t('endDate')}</span>}
            </div>
          </div>
          </button>
        )}
      >

          <div className="mb-3.5 flex flex-col gap-2.5">
            <input
              translate="no"
              value={fromStr}
              placeholder={t('startDate')}
              aria-label={t('startDate')}
              aria-invalid={fromError ? true : undefined}
              aria-describedby={fromError ? 'date-range-from-error' : undefined}
              onChange={(e) => setFromStr(autoFormatRangeDate(e.target.value, dateFormat))}
              onBlur={handleFromBlur}
              onClick={() => setIsSelectingStart(true)}
              className={cn(
                'h-10 w-full rounded-input-float border border-input bg-gray-100 px-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground',
                isSelectingStart && 'border-primary',
              )}
            />
            {fromError && <p id="date-range-from-error" role="alert" className="text-xs text-destructive">{fromError}</p>}
            <input
              translate="no"
              value={toStr}
              placeholder={t('endDate')}
              aria-label={t('endDate')}
              aria-invalid={toError ? true : undefined}
              aria-describedby={toError ? 'date-range-to-error' : undefined}
              onChange={(e) => setToStr(autoFormatRangeDate(e.target.value, dateFormat))}
              onBlur={handleToBlur}
              onClick={() => setIsSelectingStart(false)}
              className={cn(
                'h-10 w-full rounded-input-float border border-input bg-gray-100 px-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground',
                !isSelectingStart && 'border-primary',
              )}
            />
            {toError && <p id="date-range-to-error" role="alert" className="text-xs text-destructive">{toError}</p>}
          </div>

          <MiniCalendar range={range} onDayClickAction={handleDayClick} disablePast={disablePast} />

          <div className="mt-3.5 flex justify-end gap-3">
            <Button variant="outline-primary" className="flex-1" onClick={handleReset}>{t('reset')}</Button>
            <Button className="flex-1" disabled={!range.from || !range.to} onClick={handleApply}>{t('apply')}</Button>
          </div>
      </DatePickerOverlay>
    </div>
  )
}

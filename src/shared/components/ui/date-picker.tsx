'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
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
  value?: Date
  onChangeAction: (date: Date) => void
  defaultValue?: Date
  disablePast?: boolean
  className?: string
  overlay?: DatePickerOverlayMode
}

export function DatePicker({ value, onChangeAction, defaultValue, disablePast, className, overlay }: Props) {
  const t = useTranslations('datePicker')
  const dateFormat = useDateFormat()
  const [open, setOpen] = useState(false)
  const [draftDate, setDraftDate] = useState<Date>(value ?? defaultValue ?? nowUtc())

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraftDate(value ?? defaultValue ?? nowUtc())
    setOpen(nextOpen)
  }

  const handleApply = () => {
    onChangeAction(draftDate)
    setOpen(false)
  }

  const handleReset = () => {
    setDraftDate(defaultValue ?? nowUtc())
  }

  const hasChanged = !value || !dayjs.utc(draftDate).isSame(dayjs.utc(value), 'day')

  return (
    <div className={cn('relative')}>
      <DatePickerOverlay
        open={open}
        onOpenChange={handleOpenChange}
        overlay={overlay}
        title={t('startDate')}
        contentClassName="w-65 max-w-none rounded-[18px] p-3"
        trigger={<button
          type="button"
        className={cn("flex h-10 cursor-pointer items-center rounded-date-picker! border border-input bg-background px-3 text-sm hover:border-primary gap-2", className)}
        >
          <Calendar className="size-4 text-primary shrink-0" />
          {value
            ? formatDate(value, dateFormat)
            : <span className="text-muted-foreground">{t('startDate')}</span>}
        </button>}
      >
          <MiniCalendar
            selected={draftDate}
            onDayClickAction={setDraftDate}
            disablePast={disablePast}
          />
          <div className="mt-3 flex gap-3">
            <Button variant="outline-primary" className="flex-1" onClick={handleReset}>
              {t('reset')}
            </Button>
            <Button className="flex-1" disabled={!hasChanged} onClick={handleApply}>
              {t('apply')}
            </Button>
          </div>
      </DatePickerOverlay>
    </div>
  )
}

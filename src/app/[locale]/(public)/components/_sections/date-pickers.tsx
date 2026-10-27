'use client'

import { useState, useEffect } from 'react'
import { nowUtc, formatDate } from '@/lib/date-utils'
import { useDateFormat } from '@/shared/stores/use-user-store'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { DateTimePicker } from '@/shared/components/ui/date-time-picker'
import { DateRangePicker } from '@/shared/components/ui/date-range-picker'

export function DatePickersSection() {
  const dateFormat = useDateFormat()
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined)
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined)
  const [appliedRange, setAppliedRange] = useState<{ from?: Date; to?: Date }>({})

  useEffect(() => {
    const now = nowUtc()
    setSingleDate(now)
    setDateTime(now)
  }, [])

  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Date Pickers
      </h2>

      <div className="flex flex-wrap gap-8">
        <div className="w-64 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">DatePicker · Popover</p>
          <DatePicker value={singleDate} onChangeAction={setSingleDate} />
          {singleDate && (
            <p className="text-xs text-muted-foreground">
              Selected: {formatDate(singleDate, dateFormat)}
            </p>
          )}
        </div>

        <div className="w-64 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">DateTimePicker · Popover</p>
          {dateTime && (
            <DateTimePicker value={dateTime} onChangeAction={setDateTime} />
          )}
          {dateTime && (
            <p className="text-xs text-muted-foreground">
              Selected: {formatDate(dateTime, dateFormat, true)}
            </p>
          )}
        </div>

        <div className="w-64 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">DateRangePicker · Popover</p>
          <DateRangePicker onApplyAction={setAppliedRange} />
          {appliedRange.from && (
            <p className="text-xs text-muted-foreground">
              Applied: {formatDate(appliedRange.from, dateFormat)} → {appliedRange.to ? formatDate(appliedRange.to, dateFormat) : '—'}
            </p>
          )}
        </div>

        <div className="w-64 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">DatePicker · Dialog</p>
          <DatePicker overlay="dialog" value={singleDate} onChangeAction={setSingleDate} />
        </div>
      </div>
    </section>
  )
}

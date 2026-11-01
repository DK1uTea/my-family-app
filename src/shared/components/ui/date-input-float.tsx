'use client';

import { useId, type ReactNode } from 'react';
import { Calendar1, ClockIcon } from 'lucide-react';
import { dayjs, formatDate, nowUtc } from '@/lib/date-utils';
import { useDateFormat } from '@/shared/stores/use-user-store';
import { cn } from '@/lib/utils';
import { DateTimePicker } from '@/shared/components/ui/date-time-picker';
import type { DatePickerOverlayMode } from '@/shared/components/ui/date-picker-overlay';

type FieldProps = {
  label: string;
  displayValue: string;
  placeholder?: string;
  icon: ReactNode;
  error?: boolean;
  className?: string;
};

function DateFloatField({ label, displayValue, placeholder, icon, error, className }: FieldProps) {
  return (
    <span className={cn(
      'relative h-13.5 w-full rounded-input-float border bg-background transition-colors group-hover:border-primary',
      error ? 'border-destructive' : 'border-input', className,
    )}>
      <span className="flex h-full items-center gap-2 px-3 pb-1 pt-5">
        {icon}
        <span className={cn('text-sm font-medium', !displayValue && 'text-muted-foreground')} translate="no">
          {displayValue || placeholder}
        </span>
      </span>
      <span className="pointer-events-none absolute left-3 top-0 z-10 select-none translate-y-2 text-[11px] text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

type Props = {
  value: Date | null;
  onChangeAction: (date: Date) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  allowPastDates?: boolean;
  minDate?: Date;
  error?: string;
  warning?: string;
  className?: string;
  disabled?: boolean;
  overlay?: DatePickerOverlayMode;
  testId?: string;
};

export function DateInputFloat({
  value, onChangeAction, dateLabel = 'Date', timeLabel = 'Time', datePlaceholder,
  timePlaceholder, allowPastDates = false, minDate, error, className, disabled, overlay, testId,
  warning,
}: Props) {
  const dateFormat = useDateFormat();
  const pickerValue = value ?? nowUtc();
  const errorId = useId();
  const warningId = useId();
  const describedBy = [error ? errorId : null, warning ? warningId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1', className)}>
      <DateTimePicker
        value={pickerValue} onChangeAction={onChangeAction}
        allowPastDates={allowPastDates} minDate={minDate} overlay={overlay}
        trigger={(
          <button type="button" disabled={disabled} data-testid={testId}
            aria-label={`${dateLabel}: ${value ? formatDate(value, dateFormat) : datePlaceholder ?? ''}; ${timeLabel}: ${value ? dayjs(value).format('HH:mm') : timePlaceholder ?? ''}`}
            aria-describedby={describedBy}
            className="group flex w-full gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50">
            <DateFloatField label={dateLabel}
              displayValue={value ? formatDate(value, dateFormat) : ''}
              placeholder={datePlaceholder}
              icon={<Calendar1 className="size-4.5 shrink-0" />}
              error={Boolean(error)} className="flex-1" />
            <DateFloatField label={timeLabel}
              displayValue={value ? dayjs(value).format('HH:mm') : ''}
              placeholder={timePlaceholder}
              icon={<ClockIcon className="size-4.5 shrink-0" />}
              error={Boolean(error)} className="w-50 max-w-1/2" />
          </button>
        )}
      />
      {error && <p id={errorId} role="alert" className="text-[13px] text-destructive">{error}</p>}
      {warning && <output id={warningId} className="text-[13px] text-warning">{warning}</output>}
    </div>
  );
}

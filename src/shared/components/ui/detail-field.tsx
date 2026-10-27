'use client';

import type * as React from 'react';
import { dayjs } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function DetailTextField({ value }: { value: string }) {
  return (
    <div className="rounded-detail-field bg-gray-100 px-4 py-3 text-sm" translate="no">
      {value || '—'}
    </div>
  );
}

export function DetailDateField({
  label,
  value,
  valueClassName,
  labelExtra,
}: {
  label: string;
  value?: string | null;
  valueClassName?: string;
  labelExtra?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {labelExtra}
      </div>
      <div
        className={cn('rounded-detail-field bg-gray-100 px-4 py-3 text-sm', valueClassName)}
        translate="no"
      >
        {value ? dayjs.utc(value).format('MMMM D, YYYY - HH:mm') : '—'}
      </div>
    </div>
  );
}

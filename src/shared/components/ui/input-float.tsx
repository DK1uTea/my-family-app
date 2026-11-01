'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

type InputFloatProps = Omit<React.ComponentProps<'input'>, 'placeholder'> & {
  label: string
  error?: string
  hint?: string
}

function InputFloat({
  label,
  error,
  hint,
  className,
  id,
  value,
  onFocus,
  onBlur,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputFloatProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const [focused, setFocused] = useState(false)
  const isFloating = focused || Boolean(value?.toString()) || !!error

  // WCAG 3.3.1 — the error must be reachable from the field, not just painted next to it.
  // Any aria-describedby the caller passed is kept; the error id is appended to it.
  const describedBy = [ariaDescribedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn(
          'relative block h-13.5 w-full rounded-input-float border bg-background transition-colors overflow-hidden',
          focused
            ? error ? 'border-destructive' : 'border-primary'
            : error ? 'border-destructive' : 'border-input hover:border-primary',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          {...props}
          translate="no"
          id={inputId}
          placeholder=""
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); onBlur?.(e) }}
          className={cn(
            'h-full w-full bg-transparent px-3 text-sm font-medium outline-none transition-[padding] duration-150',
            isFloating ? 'pt-5 pb-1' : 'py-0',
            'disabled:cursor-not-allowed',
            className,
          )}
        />
        <span
          className={cn(
            'pointer-events-none absolute top-0 left-3 select-none transition-all duration-200',
            isFloating ? 'translate-y-2 text-[11px]' : 'translate-y-4.25 text-[13px]',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export { InputFloat }

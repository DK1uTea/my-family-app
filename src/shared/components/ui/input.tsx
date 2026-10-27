import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  error,
  errorClassName,
  wrapperClassName,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: React.ComponentProps<"input"> & { wrapperClassName?: string, error?: string, errorClassName?: string }) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  // WCAG 3.3.1 — the error must be reachable from the field, not just painted next to it.
  // Any aria-describedby the caller passed is kept; the error id is appended to it.
  const describedBy = [ariaDescribedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <div className={wrapperClassName}>
      <input
        translate="no"
        type={type}
        id={inputId}
        data-slot="input"
        aria-describedby={describedBy}
        className={cn(
          "h-10 w-full min-w-0 rounded-input border border-input bg-transparent px-4.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/30 focus-visible:border-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
          className
        )}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn("mt-1 text-xs text-destructive", errorClassName)}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export { Input }

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CustomSwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  ariaLabel?: string
  decorative?: boolean
}

export function CustomSwitch({
  checked,
  onCheckedChange,
  className,
  ariaLabel,
  decorative = false,
}: CustomSwitchProps) {
  return (
    <div
      role={decorative ? undefined : "switch"}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? true : undefined}
      aria-checked={decorative ? undefined : checked}
      tabIndex={decorative ? undefined : 0}
      onClick={decorative ? undefined : (e) => {
        e.stopPropagation()
        onCheckedChange(!checked)
      }}
      onKeyDown={decorative ? undefined : (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.stopPropagation()
          onCheckedChange(!checked)
        }
      }}
      className={cn(
        "peer relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none cursor-pointer",
        "h-[18.4px] w-[32px] focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-input",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform size-4 shadow-sm",
          checked ? "translate-x-[14px]" : "translate-x-[2px]"
        )}
      />
    </div>
  )
}

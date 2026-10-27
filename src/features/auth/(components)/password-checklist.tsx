'use client'

import { useTranslations } from 'next-intl'
import { passwordRequirements } from '@/shared/schemas'
import { cn } from '@/lib/utils'

type PasswordChecklistProps = {
  password: string
  className?: string
}

export function PasswordChecklist({ password, className }: PasswordChecklistProps) {
  const t = useTranslations('passwordChecklist')

  if (!password) {
    return null
  }

  const results = passwordRequirements.map((requirement) => ({
    labelKey: requirement.labelKey,
    passed: requirement.test(password),
  }))

  const allPassed = results.every((r) => r.passed)

  return (
    <div className={className}>
      {!allPassed && (
        <p className="text-xs text-destructive mb-1">{t('mustMeetRequirements')}</p>
      )}
      <ul className="flex flex-col gap-2" aria-live="polite">
        {results.map(({ labelKey, passed }) => (
          <li
            key={labelKey}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors duration-150',
              passed ? 'text-green-600' : 'text-destructive',
            )}
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full transition-colors duration-150',
                passed ? 'bg-green-500' : 'bg-destructive',
              )}
              aria-hidden="true"
            />
            <span>{t(labelKey as Parameters<typeof t>[0])}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PasswordChecklist
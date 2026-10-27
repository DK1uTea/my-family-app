'use client'

import { useState } from 'react'
import { Controller, useWatch, useFormContext, useFormState } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { PasswordChecklist } from '@/features/auth/(components)/password-checklist'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group'

export function ResetPasswordFields() {
  const t = useTranslations('resetPassword')
  const { control } = useFormContext()
  const { errors } = useFormState({ control })

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isRepeatPasswordShown, setIsRepeatPasswordShown] = useState(false)

  const password = useWatch({ control, name: 'password' }) ?? ''

  return (
    <>
      <div className="flex flex-col gap-1.25">
        <p className="pl-4.25 text-sm font-medium text-foreground">
          {t('password')}<span className="text-red-500"> *</span>
        </p>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <InputGroup className="h-11 rounded-input-group! border-transparent bg-input" translate="no">
              <InputGroupInput
                {...field}
                type={isPasswordShown ? 'text' : 'password'}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                className="px-4.5 text-base"
                translate="no"
              />
              <InputGroupAddon align="inline-end" className="cursor-default pr-4" translate="no">
                <button
                  type="button"
                  onClick={() => setIsPasswordShown((v) => !v)}
                  className="text-foreground opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  {isPasswordShown ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </InputGroupAddon>
            </InputGroup>
          )}
        />
        {password && <PasswordChecklist password={password} className="pl-4.25 pt-1" />}
      </div>

      <div className="flex flex-col gap-1.25">
        <p className="pl-4.25 text-sm font-medium text-foreground">
          {t('repeatPassword')}<span className="text-red-500"> *</span>
        </p>
        <Controller
          name="repeatPassword"
          control={control}
          render={({ field }) => (
            <InputGroup className="h-11 rounded-input-group! border-transparent bg-input" error={errors.repeatPassword?.message as string | undefined} translate="no">
              <InputGroupInput
                {...field}
                type={isRepeatPasswordShown ? 'text' : 'password'}
                placeholder={t('repeatPasswordPlaceholder')}
                autoComplete="new-password"
                aria-invalid={errors.repeatPassword ? true : undefined}
                className="px-4.5 text-base"
                translate="no"
              />
              <InputGroupAddon align="inline-end" className="cursor-default pr-4" translate="no">
                <button
                  type="button"
                  onClick={() => setIsRepeatPasswordShown((v) => !v)}
                  className="text-foreground opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  {isRepeatPasswordShown ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </InputGroupAddon>
            </InputGroup>
          )}
        />
      </div>
    </>
  )
}

export default ResetPasswordFields

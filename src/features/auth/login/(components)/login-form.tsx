'use client'

import Image from 'next/image'
import { Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { useLoginForm } from '../(hooks)/use-login-form'

const EMAIL_FIELD_ID = 'login-email'
const PASSWORD_FIELD_ID = 'login-password'
const PASSWORD_ERROR_ID = 'login-password-error'

export function LoginForm() {
  const t = useTranslations('login')
  const { form, isPasswordShown, togglePassword, onSubmit } = useLoginForm()
  const { control, formState: { errors, isSubmitting } } = form

  const err = (key: string | undefined) => {
    if (!key) return undefined
    // Server-side errors (e.g. invalid credentials) arrive pre-translated; only
    // react-hook-form validation errors are translation keys (e.g. "validation.emailRequired").
    return key.startsWith('validation.') ? t(key as Parameters<typeof t>[0]) : key
  }

  return (
    <div className="w-full rounded-[24px] bg-card p-6 shadow-xl md:w-177.5 md:py-12 md:px-35 md:mt-30">
      <div className="flex flex-col gap-8">
        <div className="flex justify-center">
          <Image
            src="/images/logo_red.png"
            alt="Logo"
            width={800}
            height={143}
            className="h-auto w-50 lg:w-67.25"
            priority
          />
        </div>

        <form noValidate autoComplete="off" onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.25">
            <Label htmlFor={EMAIL_FIELD_ID} className="text-sm font-medium text-foreground">
              {t('email')}
              {/* Decoration only. `required` on the input is what tells assistive tech the
                  field is mandatory; an unhidden asterisk just gets announced as "star". */}
              <span aria-hidden="true" className="text-primary">*</span>
            </Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={EMAIL_FIELD_ID}
                  type="email"
                  required
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  error={err(errors.email?.message)}
                  className="h-10 rounded-input! border border-border bg-card px-4.5 text-base [--autofill-background:var(--card)]"
                  errorClassName="pl-4.25"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.25">
            <Label htmlFor={PASSWORD_FIELD_ID} className="text-sm font-medium text-foreground">
              {t('password')}
              <span aria-hidden="true" className="text-primary">*</span>
            </Label>
            <div>
              <Controller
                name="password"
                control={control}
                render={({ field }) => {
                  const passwordError = err(errors.password?.message)

                  return (
                    <InputGroup
                      className="h-10 rounded-full border-border bg-card [--autofill-background:var(--card)]"
                      error={passwordError}
                      errorId={PASSWORD_ERROR_ID}
                    >
                      <InputGroupInput
                        {...field}
                        id={PASSWORD_FIELD_ID}
                        type={isPasswordShown ? 'text' : 'password'}
                        required
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="current-password"
                        aria-invalid={errors.password ? true : undefined}
                        aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
                        className="px-4.5 text-base"
                      />
                      <InputGroupAddon align="inline-end" className="cursor-default pr-4">
                        {/* Keyboard-reachable and named: this is the only way a
                            screen-reader user can reveal what they typed. */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-lg"
                          onClick={togglePassword}
                          aria-label={isPasswordShown ? t('hidePassword') : t('showPassword')}
                          aria-pressed={isPasswordShown}
                          aria-controls={PASSWORD_FIELD_ID}
                        >
                          {isPasswordShown
                            ? <EyeIcon data-icon="inline-start" />
                            : <EyeOffIcon data-icon="inline-start" />
                          }
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  )
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    className="border-muted-foreground/60"
                  />
                  {/* Full-strength token, not /60: at 60% opacity this read 2.92:1 on
                      the card, below the 4.5:1 WCAG 1.4.3 AA minimum. */}
                  <span className="text-sm text-muted-foreground/60 md:text-base">
                    {t('rememberMe')}
                  </span>
                </label>
              )}
            />
            <Link
              href="/forgot-password"
              className="text-sm text-primary underline-offset-2 hover:underline md:text-base underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {t('submit')}
          </Button>
        </form>

        {/* `text-gray-500` measured 4.23:1 — under the AA minimum, and a raw palette
            colour rather than a semantic token. */}
        <p className="text-sm font-extralight text-muted-foreground font-brand-wide mb-2">
          {t('footerText')}
        </p>
      </div>
    </div>
  )
}

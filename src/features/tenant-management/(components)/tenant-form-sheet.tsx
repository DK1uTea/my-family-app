'use client'

import { FormProvider } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { useTenantForm } from '../(hooks)/use-tenant-form'
import type { TenantFormValues } from '../(helpers)/tenant-form-schema'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Pick<TenantFormValues, 'name'> & { description?: string | null }
  busy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TenantFormValues) => void
}

const TENANT_NAME_FIELD = 'tenant-name'
const TENANT_DESCRIPTION_FIELD = 'tenant-description'
const TENANT_FORM_ID = 'tenant-form'

export function TenantFormSheet({
  open,
  mode,
  initial,
  busy,
  onOpenChange,
  onSubmit,
}: Props) {
  const t = useTranslations('tenantManagement')
  const { form, onSubmit: submitForm } = useTenantForm({
    open,
    initial,
    onSubmit,
  })
  const {
    register,
    formState: { errors },
  } = form

  function translateError(message?: string) {
    if (!message) return undefined
    return t(message as Parameters<typeof t>[0])
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const title = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(
            '#tenant-form-title',
          )
          title?.focus()
        }}
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle id="tenant-form-title" tabIndex={-1}>
            {t(mode === 'create' ? 'addTitle' : 'editTitle')}
          </SheetTitle>
          <SheetDescription>{t('formDescription')}</SheetDescription>
        </SheetHeader>

        <FormProvider {...form}>
          <form
            id={TENANT_FORM_ID}
            onSubmit={submitForm}
            noValidate
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={TENANT_NAME_FIELD}>
                {t('name')}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                {...register('name')}
                id={TENANT_NAME_FIELD}
                data-testid="tenant-name-input"
                required
                maxLength={150}
                placeholder={t('namePlaceholder')}
                aria-invalid={errors.name ? true : undefined}
                error={translateError(errors.name?.message)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={TENANT_DESCRIPTION_FIELD}>
                {t('descriptionField')}
              </Label>
              <Textarea
                {...register('description')}
                id={TENANT_DESCRIPTION_FIELD}
                data-testid="tenant-description-input"
                maxLength={500}
                placeholder={t('descriptionPlaceholder')}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  errors.description
                    ? `${TENANT_DESCRIPTION_FIELD}-error`
                    : undefined
                }
              />
              {errors.description?.message ? (
                <p
                  id={`${TENANT_DESCRIPTION_FIELD}-error`}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {translateError(errors.description.message)}
                </p>
              ) : null}
            </div>

          </form>
        </FormProvider>
        <SheetFooter className="flex-row justify-end border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={TENANT_FORM_ID}
            data-testid="tenant-submit-button"
            disabled={busy}
          >
            {t(mode === 'create' ? 'add' : 'save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

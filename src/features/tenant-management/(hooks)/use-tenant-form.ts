'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  tenantFormSchema,
  type TenantFormValues,
} from '../(helpers)/tenant-form-schema'

type Props = {
  open: boolean
  initial?: Pick<TenantFormValues, 'name'> & { description?: string | null }
  onSubmit: (values: TenantFormValues) => void
}

export function useTenantForm({ open, initial, onSubmit }: Props) {
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })
  const { reset } = form

  useEffect(() => {
    if (!open) return

    reset({
      name: initial?.name ?? '',
      description: initial?.description ?? '',
    })
  }, [initial, open, reset])

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
  }
}

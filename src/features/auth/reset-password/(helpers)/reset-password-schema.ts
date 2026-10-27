import { z } from 'zod'
import { getValidationMessage } from '@/lib/field-error'
import { zPassword, zString } from '@/shared/schemas'

export const resetPasswordSchema = z
  .object({
    password: zString(['required']).pipe(zPassword()),
    repeatPassword: zString(['required']).pipe(zPassword()),
  })
  .refine((data) => data.password === data.repeatPassword, {
    path: ['repeatPassword'],
    message: getValidationMessage('fieldErrors.passwordMatch'),
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

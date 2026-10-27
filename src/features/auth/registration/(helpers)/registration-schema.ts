import { z } from 'zod'
import { getValidationMessage } from '@/lib/field-error'
import { zPassword, zString } from '@/shared/schemas'

export const registrationSchema = z
  .object({
    avatar: zString().optional(),
    firstName: zString(['required']),
    lastName: zString(['required']),
    password: zString(['required']).pipe(zPassword()),
    repeatPassword: zString(['required']).pipe(zPassword()),
  })
  .refine((data) => data.password === data.repeatPassword, {
    path: ['repeatPassword'],
    message: getValidationMessage('fieldErrors.passwordMatch'),
  })

export type RegistrationFormData = z.infer<typeof registrationSchema>

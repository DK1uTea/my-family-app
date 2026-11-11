import { z } from 'zod'

export const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'tenantNameRequired')
    .max(150, 'tenantNameInvalid'),
  description: z
    .string()
    .trim()
    .max(500, 'tenantDescriptionInvalid'),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>

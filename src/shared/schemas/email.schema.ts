import { z } from 'zod';
import { getValidationMessage } from '@/lib/field-error';

export const zEmail = () =>
  z
    .string()
    .catch('')
    .superRefine((val, ctx) => {
      if (!z.email().safeParse(val).success) {
        ctx.addIssue({ code: 'custom', message: getValidationMessage('fieldErrors.email') });
      }
    });
